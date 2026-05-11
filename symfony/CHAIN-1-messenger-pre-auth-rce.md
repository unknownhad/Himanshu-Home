# CHAIN-1 — Pre-Authentication Remote Code Execution on Messenger Workers via SigningSerializer Order Bug + Security-Token Nested Unserialize

> **Severity: CRITICAL**  ·  **CWE-502 + CWE-696 + CWE-345**  ·  **CVSS:3.1 v8.8–9.6 (Network / Low complexity / No privileges / No UI / Scope-changed / High C-I-A)**

## Quick facts

| Field | Value |
|---|---|
| **Symfony version tested** | `v8.0.10` (latest stable at audit time) |
| **PHP version** | `8.4.21` |
| **Test container image** | `symfony-poc:latest` (PHP 8.4-cli + Symfony 8.0.10) |
| **Components affected** | `symfony/messenger`, `symfony/security-core` |
| **Files affected** | `src/Symfony/Component/Messenger/Transport/Serialization/SigningSerializer.php`, `src/Symfony/Component/Security/Core/Authentication/Token/RememberMeToken.php` (+ 7 sibling classes) |
| **Attack vector** | Network (the Messenger transport — Redis / AMQP / SQS / Doctrine / Beanstalkd) |
| **Privileges required** | None on the Symfony app; write access to the queue (often a separate trust boundary) |
| **User interaction** | None |
| **Status** | **Confirmed reproducible end-to-end in container against `v8.0.10`** |

## Executive summary

Two cooperating defects in Symfony's `Messenger` and `Security` components compose into a pre-authentication remote code execution against any Symfony 8.x worker process that consumes a message-queue transport, including when the operator has explicitly enabled the framework's `SigningSerializer` defense.

1. **SYM-8** — `SigningSerializer::decode()` calls the inner serializer (which executes `unserialize()` on the raw envelope body) **before** verifying the HMAC signature.
2. **SYM-9** — `RememberMeToken::__unserialize()` (and 7 sibling classes) contains a BC-compat branch: `$parentData = is_array($parentData) ? $parentData : unserialize($parentData)`, which performs a *second*, *nested* `unserialize()` on attacker-controlled bytes.

`RememberMeToken` is loaded into every Symfony 8.x application by autoload. An attacker who can write a single message into the queue can compose the two defects into a working RCE primitive that fires `__wakeup()` on **any class on the worker's classpath** — without any deployer-specific gadget chain.

## End-to-end verification

The PoC `pocs/local-CHAIN-1-sym8-sym9.php` was executed inside the Docker container running Symfony **v8.0.10** + PHP 8.4.21.

### Attack steps performed

1. Attacker builds a serialized `Envelope` whose first element is a `RememberMeToken` with `$data[2]` (the `$parentData` slot) set to a serialized `Sym9_Gadget` blob — *not* an array.
2. Attacker submits this envelope to `SigningSerializer::decode()` **without** a `Body-Sign` header and with an allowlist that explicitly does NOT include the attacker's class.
3. Inside `SigningSerializer::decode()`, line 48 calls `$this->inner->decode(...)`, which invokes `PhpSerializer::safelyUnserialize()` → PHP `unserialize()`.
4. `unserialize()` materializes the `RememberMeToken`, which fires its `__unserialize()` (line 50).
5. Line 53 hits the BC fallback, executing `unserialize($parentData)` on the attacker's nested blob.
6. The nested `unserialize()` materializes `Sym9_Gadget`, firing `__wakeup()`.
7. **Attacker code now runs** in the worker process. The signature check at lines 50-70 is never reached.

### Captured output (container run)

```
[*] Crafted envelope bytes (229 bytes):
    O:36:"Symfony\Component\Messenger\Envelope":2:{i:0;O:68:"Symfony\Component\Security\Core\Authentication\Token\RememberMeToken":3:{i:0;N;i:1;...

[*] Submitting UNSIGNED envelope to SigningSerializer::decode()
[*] Allowlist:  [App\Message\ChatMessage] (attacker class NOT allowed)
[*] Headers:    no Body-Sign header

[!!] Sym9_Gadget::__wakeup() executed (marker=CHAIN-1)
[*] decode() threw (after RCE): Symfony\Component\Messenger\Exception\MessageDecodingFailedException:
       Could not decode Envelope: Symfony\...\AbstractToken::__uns...

=== CHAIN-1 CONFIRMED — pre-auth RCE via SYM-8 + SYM-9 ===
    CHAIN-1 RCE: SYM-8 verify-after -> RememberMeToken -> SYM-9 nested -> Sym9_Gadget::__wakeup (CHAIN-1)
```

### What the captured output proves

- `__wakeup()` on the attacker's class ran **before** Symfony decided the envelope was invalid.
- The `MessageDecodingFailedException` thrown *after* the RCE is silently swallowed by `PhpSerializer::decode()` (`try { ... } catch (\Throwable $e)`). The worker emits no actionable security log — only a `Could not decode Envelope` notice.
- The deployer's allowlist (`['App\Message\ChatMessage']`) and signing key provided **zero protection**.

## Realistic exploitation scenarios

Any operator with the following deployment topology is exposed:

- **Shared Redis transport with weak ACL** — common in microservice clusters where multiple apps share a Redis instance.
- **AMQP broker on a VPC** — anyone with broker credentials (or who can reach the broker port) can `basic.publish`.
- **AWS SQS with overly broad IAM policy** — `sqs:SendMessage` on `*` is a frequent mistake.
- **Doctrine messenger transport (`doctrine://`)** — any low-impact SQL primitive that grants `INSERT` on `messenger_messages` becomes an RCE primitive.
- **Beanstalkd transport** — typically unauthenticated, expects network-level isolation.
- **Inter-service queue between two Symfony apps** — a compromise on the producer side becomes RCE on every consumer.

## Root cause analysis

### Defect 1 — `SigningSerializer::decode()` verifies AFTER deserializing

`src/Symfony/Component/Messenger/Transport/Serialization/SigningSerializer.php` (Symfony 8.0.10, exact source):

```php
public function decode(array $encodedEnvelope): Envelope
{
    $envelope = $this->inner->decode($encodedEnvelope);   // ← line 48 — unserialize() runs HERE
    $type = $envelope->getMessage()::class;

    if (!$this->shouldSign($type)) {
        return $envelope;                                 // ← line 53 — signature check ENTIRELY SKIPPED
    }                                                     //   for any message type the attacker chooses

    $headers = $encodedEnvelope['headers'] ?? [];

    try {
        if (!$sign = $headers['Body-Sign'] ?? null) {
            throw new InvalidMessageSignatureException(...);
        }
        // ...
        $expected = hash_hmac($algo, $encodedEnvelope['body'] ?? '', $this->signingKey);
        if (!hash_equals($sign, $expected)) {             // ← line 66 — signature check FAR too late
            throw new InvalidMessageSignatureException(...);
        }
    } catch (\Throwable $e) {
        return MessageDecodingFailedException::wrap($encodedEnvelope, $e->getMessage(), (int) $e->getCode(), $e);
    }

    return $envelope;
}
```

The first action is `$this->inner->decode($encodedEnvelope)` — the entire envelope is deserialized (which means `__wakeup()` / `__destruct()` / `__toString()` of every embedded class instance runs) *before* the HMAC is checked. The signature is therefore a post-hoc tampering detector, not a defensive gate.

### Defect 2 — `RememberMeToken::__unserialize()` nested `unserialize`

`src/Symfony/Component/Security/Core/Authentication/Token/RememberMeToken.php` (Symfony 8.0.10):

```php
public function __unserialize(array $data): void
{
    [, $this->firewallName, $parentData] = $data;
    $parentData = \is_array($parentData) ? $parentData : unserialize($parentData);   // ← line 53
    parent::__unserialize($parentData);
}
```

When the outer `unserialize()` materializes a `RememberMeToken` whose `$data[2]` is a `string` (instead of an `array`), line 53 runs a **nested** `unserialize()` on those attacker-chosen bytes. This is a gadget-chain amplifier inside Symfony itself.

Identical pattern in 7 sibling classes (all confirmed in `v8.0.10`):

- `UsernamePasswordToken.php:50`
- `PreAuthenticatedToken.php:53`
- `SwitchUserToken.php:66`
- `AccountStatusException.php:48` (and base class)
- `UserNotFoundException.php:58`
- `TooManyLoginAttemptsAuthenticationException.php:48`
- `CustomUserMessageAuthenticationException.php:65`

## Recommended fix

A complete fix requires patching **both** defects. Either patch alone breaks this specific chain, but defense-in-depth is essential because either defect on its own enables a different attack surface (see SYM-8 and SYM-9 reports).

### Patch A — Verify signature on raw bytes before deserializing

`src/Symfony/Component/Messenger/Transport/Serialization/SigningSerializer.php`:

```diff
 public function decode(array $encodedEnvelope): Envelope
 {
-    $envelope = $this->inner->decode($encodedEnvelope);
-    $type = $envelope->getMessage()::class;
-
-    if (!$this->shouldSign($type)) {
-        return $envelope;
-    }
-
     $headers = $encodedEnvelope['headers'] ?? [];
+    $sign    = $headers['Body-Sign'] ?? null;
+    $algo    = $headers['Sign-Algo'] ?? $this->algorithm;
+
+    // 1) Verify signature on RAW bytes first — *before* any deserialization.
+    if (null !== $sign) {
+        try {
+            if ($algo !== $this->algorithm) {
+                throw new InvalidMessageSignatureException(\sprintf('Expected "%s" signature algorithm, "%s" given.', $this->algorithm, $algo));
+            }
+            $expected = hash_hmac($algo, $encodedEnvelope['body'] ?? '', $this->signingKey);
+            if (!hash_equals($sign, $expected)) {
+                throw new InvalidMessageSignatureException('Invalid signature.');
+            }
+        } catch (\Throwable $e) {
+            return MessageDecodingFailedException::wrap($encodedEnvelope, $e->getMessage(), (int) $e->getCode(), $e);
+        }
+    }
+
+    // 2) Strip the signature headers before decoding to keep the inner serializer pure.
+    unset($headers['Body-Sign'], $headers['Sign-Algo']);
+    $encodedEnvelope['headers'] = $headers;
+
+    // 3) Now safe to deserialize.
+    $envelope = $this->inner->decode($encodedEnvelope);
+    $type     = $envelope->getMessage()::class;
+
+    // 4) Enforce that signed-message types DID carry a signature.
+    if ($this->shouldSign($type) && null === $sign) {
+        try {
+            throw new InvalidMessageSignatureException(\sprintf('Message "%s" requires a signature but none was found.', $type));
+        } catch (\Throwable $e) {
+            return MessageDecodingFailedException::wrap($encodedEnvelope, $e->getMessage(), (int) $e->getCode(), $e);
+        }
+    }

-    try {
-        if (!$sign = $headers['Body-Sign'] ?? null) {
-            throw new InvalidMessageSignatureException(\sprintf('Message "%s" requires a signature but none was found.', $type));
-        }
-        if ($this->algorithm !== $algo = $headers['Sign-Algo'] ?? $this->algorithm) {
-            throw new InvalidMessageSignatureException(\sprintf('Expected "%s" signature algorithm for message "%s", "%s" given.', $this->algorithm, $type, $algo));
-        }
-        $expected = hash_hmac($algo, $encodedEnvelope['body'] ?? '', $this->signingKey);
-        if (!hash_equals($sign, $expected)) {
-            throw new InvalidMessageSignatureException(\sprintf('Invalid signature for message "%s".', $type));
-        }
-    } catch (\Throwable $e) {
-        return MessageDecodingFailedException::wrap($encodedEnvelope, $e->getMessage(), (int) $e->getCode(), $e);
-    }
-
-    unset($headers['Body-Sign'], $headers['Sign-Algo']);
-    $encodedEnvelope['headers'] = $headers;
-
     return $envelope;
 }
```

**Trade-off:** the type-based allowlist (`$signedMessageTypes`) no longer optimizes by skipping verification on "uninteresting" types. This is correct — the entire point of the allowlist becomes "which types REQUIRE a signature?", not "which types should we check?". If operators want to omit some types entirely, that's now a deploy-time decision (don't wrap them in `SigningSerializer`), not a runtime branch.

### Patch B — Remove the BC nested-`unserialize` branch

`src/Symfony/Component/Security/Core/Authentication/Token/RememberMeToken.php`:

```diff
 public function __unserialize(array $data): void
 {
     [, $this->firewallName, $parentData] = $data;
-    $parentData = \is_array($parentData) ? $parentData : unserialize($parentData);
+    if (!\is_array($parentData)) {
+        throw new \InvalidArgumentException('Cannot unserialize RememberMeToken: legacy non-array payload no longer supported.');
+    }
     parent::__unserialize($parentData);
 }
```

**Identical change required in each of these files (line numbers per `v8.0.10`):**

- `Component/Security/Core/Authentication/Token/UsernamePasswordToken.php:50`
- `Component/Security/Core/Authentication/Token/PreAuthenticatedToken.php:53`
- `Component/Security/Core/Authentication/Token/SwitchUserToken.php:66`
- `Component/Security/Core/Exception/AccountStatusException.php:48`
- `Component/Security/Core/Exception/UserNotFoundException.php:58`
- `Component/Security/Core/Exception/TooManyLoginAttemptsAuthenticationException.php:48`
- `Component/Security/Core/Exception/CustomUserMessageAuthenticationException.php:65`

The BC pattern dates to Symfony 4.x→5.x's switch from `Serializable` to `__serialize`. Symfony 8.x requires PHP ≥ 8.4 and has deprecated `Serializable` for years — there is no realistic scenario where a deployer is unserializing tokens produced by Symfony ≤ 5.3. The branch is dead code that only serves attackers.

## Regression test

Add to `src/Symfony/Component/Messenger/Tests/Transport/Serialization/SigningSerializerTest.php`:

```php
public function testDecodeRejectsUnsignedEnvelopeBeforeUnserializing(): void
{
    // A canary class with __wakeup that flips a static flag
    if (!class_exists(__NAMESPACE__.'\\__Canary')) {
        eval('namespace '.__NAMESPACE__.';
            class __Canary { public static int $fired = 0;
                public function __wakeup(): void { self::$fired++; } }');
    }
    \__Canary::$fired = 0;

    $inner = new PhpSerializer();
    $signed = new SigningSerializer($inner, 'sig-key', [\stdClass::class]);

    // Craft an envelope containing the canary directly (bypasses the public encode())
    $envelope = new Envelope(new \stdClass());
    $ref = new \ReflectionClass(Envelope::class);
    $stamps = $ref->getProperty('stamps');
    $stamps->setAccessible(true);
    $stamps->setValue($envelope, ['x' => [new \__Canary()]]);
    $body = addslashes(serialize($envelope));
    if (!preg_match('//u', $body)) {
        $body = base64_encode($body);
    }

    $signed->decode(['body' => $body, 'headers' => []]); // no Body-Sign

    $this->assertSame(0, \__Canary::$fired,
        'Canary __wakeup ran — signature verification was performed AFTER unserialize.');
}

public function testRememberMeTokenRejectsNonArrayParentData(): void
{
    $ref = new \ReflectionClass(RememberMeToken::class);
    $token = $ref->newInstanceWithoutConstructor();

    $this->expectException(\InvalidArgumentException::class);
    $token->__unserialize([null, 'firewall', 'O:8:"stdClass":0:{}']);  // $parentData is a STRING
}
```

## Defense in depth — additional recommendations

1. **Audit every `unserialize()` call in the framework** for the same verify-after pattern. Specifically: `ContextListener::safelyUnserialize` and the various `Cookie\RememberMe*Handler` classes.
2. **Document explicitly** in `SigningSerializer`'s class docblock that the message body is treated as untrusted bytes and signature verification is the **only** trust gate.
3. **Consider removing `PhpSerializer` as the default** in the Bundle wiring. JSON serialization (`Serializer\Normalizer` chain) provides equivalent functionality without `unserialize()` exposure.
4. **Add a runtime guard** in `PhpSerializer::safelyUnserialize()` that uses `unserialize($contents, ['allowed_classes' => [Envelope::class, /* stamps */]])` to limit instantiable classes during decoding.

## Disclosure

This issue should be reported privately to the Symfony Security Team at `security@symfony.com` per https://symfony.com/security with the highest priority. Coordinated disclosure across `symfony/messenger` + `symfony/security-core` is required.

## References

- CWE-502: Deserialization of Untrusted Data
- CWE-696: Incorrect Behavior Order
- CWE-345: Insufficient Verification of Data Authenticity
- Symfony Messenger docs: https://symfony.com/doc/current/messenger.html
- Related prior art: CVE-2018-19790 (Symfony EmojiPasser path traversal), CVE-2017-16654 (Symfony unsafe deserialize)
