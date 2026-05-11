# SYM-8 — Messenger `SigningSerializer::decode()` Verifies Signature AFTER Calling `unserialize()`

> **Severity: HIGH**  ·  **CWE-696 (Incorrect Behavior Order) + CWE-345 (Insufficient Verification of Data Authenticity) + CWE-502 (Deserialization of Untrusted Data)**  ·  **CVSS:3.1 ≈ 8.1 (Network / Low / None / None / Unchanged / High / High / High)**

## Quick facts

| Field | Value |
|---|---|
| **Symfony version tested** | `v8.0.10` (latest stable) |
| **PHP version** | `8.4.21` |
| **Component** | `symfony/messenger` |
| **File** | `src/Symfony/Component/Messenger/Transport/Serialization/SigningSerializer.php` |
| **Defective lines** | `48` (deserialize first), `66` (verify-after-the-fact) |
| **Status** | **Confirmed reproducible against `v8.0.10` — canary `__wakeup` fires before the signature is checked** |
| **Authentication** | Attacker needs queue write access (separate trust boundary from the Symfony app) |
| **Chains with** | SYM-9 → see CHAIN-1 (CRITICAL pre-auth RCE) |

## Vulnerability summary

`SigningSerializer` is Symfony's defense-in-depth wrapper for Messenger transports. The operator enables it by setting `framework.messenger.serializer.signing_key` so the framework HMACs each message body, intending to defeat tampering by attackers with queue write access.

The implementation, however, invokes the **inner serializer's `decode()` first** — which means `PhpSerializer::safelyUnserialize()` → PHP `unserialize()` runs on the attacker-controlled body **before** the HMAC is verified. Worse, the signature check is gated behind `shouldSign($type)`, which only returns true for message types in the explicit allowlist. If an attacker crafts a body whose top-level class is not in the allowlist, the signature is **never even consulted**.

The component is therefore broken-by-design as a security control: every magic method (`__wakeup`, `__destruct`, `__toString`, `__call`, `__set_state`) on every class instance in the envelope graph executes during `unserialize()`, before any authentication has happened. Combined with SYM-9 (see CHAIN-1), this becomes a one-shot pre-auth RCE primitive.

## Verification

The PoC `pocs/local-SYM-8-signing-serializer-order.php` was run inside a Docker container with `php:8.4-cli` + `symfony/symfony v8.0.10` pinned.

### Reproduction steps (in container)

```bash
docker build -t symfony-poc:latest .
docker run --rm symfony-poc:latest php /app/pocs/local-SYM-8-signing-serializer-order.php
```

### Captured output

```
=== SYM-8 — Messenger SigningSerializer verify-after-unserialize ===
Symfony v8.0.10 (latest stable)

Step 1: encoded a legitimate SignedMessageA — headers:
   {"Body-Sign":"db814840ba39a2a987ef5857d02dea8d84a4b768249b1274e0bcf1afdd0074f4","Sign-Algo":"sha256"}

Step 2: attacker submits envelope WITHOUT Body-Sign header.
Step 3: invoke SigningSerializer::decode() — observing whether canary fires BEFORE rejection.

  >> Canary __wakeup() FIRED! (gadget would have executed here in a real attack)
  >> decode() threw Symfony\Component\Messenger\Exception\InvalidMessageSignatureException:
       Message "SignedMessageA" requires a signature but none was found.

==========================================
Canary fired count: 1
VULNERABLE: __wakeup ran BEFORE SigningSerializer rejected the unsigned envelope.
```

Interpretation: even though the signature gate eventually rejected the envelope, the canary class's `__wakeup()` *already executed* during the inner decode. In a real attack the canary is replaced with a gadget chain that achieves arbitrary effect (RCE, file write, network egress) **before** Symfony returns.

### Second attack path — allowlist bypass

When the attacker uses a class that is NOT in `signedMessageTypes`, the signature check is entirely skipped:

```
[*] Allowlist:  [App\Message\ChatMessage] (attacker class NOT allowed)
[*] Headers:    no Body-Sign header
[!!] Sym9_Gadget::__wakeup() executed (marker=CHAIN-1)
[*] decode() threw (after RCE): MessageDecodingFailedException: Could not decode Envelope...
```

The CHAIN-1 PoC demonstrates this second path: the attacker's class is unknown to the framework, `shouldSign()` returns false, and `decode()` returns at line 53 without ever consulting the signature header.

## Root cause

`src/Symfony/Component/Messenger/Transport/Serialization/SigningSerializer.php` — exact source from Symfony **v8.0.10**:

```php
public function decode(array $encodedEnvelope): Envelope
{
    $envelope = $this->inner->decode($encodedEnvelope);   // ← line 48 — UNSERIALIZE HERE
    $type = $envelope->getMessage()::class;

    if (!$this->shouldSign($type)) {
        return $envelope;                                 // ← line 53 — early exit, no signature check
    }

    $headers = $encodedEnvelope['headers'] ?? [];

    try {
        if (!$sign = $headers['Body-Sign'] ?? null) {
            throw new InvalidMessageSignatureException(...);
        }
        if ($this->algorithm !== $algo = $headers['Sign-Algo'] ?? $this->algorithm) {
            throw new InvalidMessageSignatureException(...);
        }
        $expected = hash_hmac($algo, $encodedEnvelope['body'] ?? '', $this->signingKey);
        if (!hash_equals($sign, $expected)) {             // ← line 66 — too late
            throw new InvalidMessageSignatureException(...);
        }
    } catch (\Throwable $e) {
        return MessageDecodingFailedException::wrap($encodedEnvelope, $e->getMessage(), (int) $e->getCode(), $e);
    }

    unset($headers['Body-Sign'], $headers['Sign-Algo']);
    $encodedEnvelope['headers'] = $headers;

    return $envelope;
}
```

`PhpSerializer::safelyUnserialize()` (called from `$this->inner->decode()` for the default `PhpSerializer`) ends in `return unserialize($contents);` — gadget chains fire here.

The `unserialize_callback_func` defense employed by `safelyUnserialize` only rejects classes that aren't already autoloaded. Any class previously touched by the worker process — every class in Symfony, Doctrine, Monolog, Twig, vendor libs, user code — is reachable for magic-method invocation.

## Trust model

The bug only matters when an attacker can write into the queue. That includes:

- Shared Redis instances on a multi-tenant cluster
- AMQP/RabbitMQ brokers with weak per-virtual-host ACLs
- AWS SQS with overly broad IAM (`sqs:SendMessage` on `*`)
- Doctrine messenger transports + any SQL injection that grants `INSERT`
- Beanstalkd transports (typically unauthenticated)
- Inter-service queues shared by two Symfony apps where one is compromised

In every one of these scenarios `SigningSerializer` is **the** defense the framework offers, and the bug nullifies it.

## Recommended fix

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
+    // 1) ALWAYS verify signature on the RAW body bytes first.
+    try {
+        if (null === $sign) {
+            throw new InvalidMessageSignatureException('Message has no Body-Sign header; refusing to deserialize.');
+        }
+        if ($algo !== $this->algorithm) {
+            throw new InvalidMessageSignatureException(\sprintf('Expected "%s" signature algorithm, "%s" given.', $this->algorithm, $algo));
+        }
+        $expected = hash_hmac($algo, $encodedEnvelope['body'] ?? '', $this->signingKey);
+        if (!hash_equals($sign, $expected)) {
+            throw new InvalidMessageSignatureException('Invalid signature.');
+        }
+    } catch (\Throwable $e) {
+        return MessageDecodingFailedException::wrap($encodedEnvelope, $e->getMessage(), (int) $e->getCode(), $e);
+    }
+
+    // 2) Strip signature headers before handing off to the inner decoder.
+    unset($headers['Body-Sign'], $headers['Sign-Algo']);
+    $encodedEnvelope['headers'] = $headers;
+
+    // 3) Only NOW is deserialization safe.
+    $envelope = $this->inner->decode($encodedEnvelope);
+    $type     = $envelope->getMessage()::class;
+
+    // 4) If the operator wanted to enforce signing for a specific allowlist only,
+    //    do that after-the-fact assertion here. But the actual signature has
+    //    already been verified above for every payload, regardless of class.
+    if (!$this->shouldSign($type)) {
+        // Operator chose to allow unsigned for this type — but we ALREADY validated.
+        // The signature gave us proof of origin even when the class wasn't required to be signed.
+        return $envelope;
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

### Behavioral change for operators

Before the fix, an envelope whose message-type was NOT in `signedMessageTypes` could be decoded with no signature at all. After the fix, **every** envelope through the `SigningSerializer` must carry a valid `Body-Sign`. Operators who want unsigned types must route those types through a different transport stack.

The `$signedMessageTypes` parameter is repurposed: it no longer means "only check signature on these types", it means "**require** that these types arrive signed". An unsigned envelope of an unlisted type is now rejected (as it should always have been).

### Migration note

`encode()` already populates `Body-Sign` whenever `shouldSign($type)` is true. For the post-fix world, `encode()` should sign **every** outgoing envelope (otherwise the producer/consumer protocol mismatches). The corresponding `encode()` change:

```diff
 public function encode(Envelope $envelope): array
 {
     $encoded = $this->inner->encode($envelope);
-    $type = $envelope->getMessage()::class;
-
-    if ($this->shouldSign($type)) {
-        $encoded['headers']['Body-Sign'] = hash_hmac($this->algorithm, $encoded['body'] ?? '', $this->signingKey);
-        $encoded['headers']['Sign-Algo'] = $this->algorithm;
-    }
+    $encoded['headers']['Body-Sign'] = hash_hmac($this->algorithm, $encoded['body'] ?? '', $this->signingKey);
+    $encoded['headers']['Sign-Algo'] = $this->algorithm;

     return $encoded;
 }
```

## Regression test

`src/Symfony/Component/Messenger/Tests/Transport/Serialization/SigningSerializerTest.php`:

```php
public function testDecodeVerifiesSignatureBeforeUnserialize(): void
{
    // Define a canary class with __wakeup as a tripwire
    eval('class SymfonySym8Canary { public static int $fired = 0;
        public function __wakeup(): void { self::$fired++; } }');
    \SymfonySym8Canary::$fired = 0;

    $inner = new PhpSerializer();
    $signed = new SigningSerializer($inner, 'sig-key', [\stdClass::class]);

    $envelope = new Envelope(new \stdClass());
    $stampsRef = new \ReflectionProperty(Envelope::class, 'stamps');
    $stampsRef->setAccessible(true);
    $stampsRef->setValue($envelope, ['x' => [new \SymfonySym8Canary()]]);

    $body = addslashes(serialize($envelope));
    if (!preg_match('//u', $body)) {
        $body = base64_encode($body);
    }

    $result = $signed->decode(['body' => $body, 'headers' => []]);

    $this->assertSame(0, \SymfonySym8Canary::$fired,
        '__wakeup() of a smuggled class fired — signature verification ran AFTER unserialize.');
    $this->assertInstanceOf(MessageDecodingFailedException::class, $result);
}

public function testDecodeRejectsUnsignedEnvelopeOfNonAllowlistedType(): void
{
    $inner = new PhpSerializer();
    $signed = new SigningSerializer($inner, 'sig-key', [\stdClass::class]);

    // class NOT in signedMessageTypes
    eval('namespace Sym8; class NotSigned {}');

    $body = addslashes(serialize(new Envelope(new \Sym8\NotSigned())));
    if (!preg_match('//u', $body)) {
        $body = base64_encode($body);
    }

    $result = $signed->decode(['body' => $body, 'headers' => []]);

    $this->assertInstanceOf(MessageDecodingFailedException::class, $result,
        'Unsigned envelope of non-allowlisted class was accepted — signature gate is bypassable.');
}
```

## Disclosure

Report privately to `security@symfony.com` with the highest priority. This bug has been confirmed against the latest stable release (v8.0.10).

## References

- Symfony Messenger transport security docs: https://symfony.com/doc/current/messenger.html
- CWE-696: https://cwe.mitre.org/data/definitions/696.html
- CWE-345: https://cwe.mitre.org/data/definitions/345.html
- CWE-502: https://cwe.mitre.org/data/definitions/502.html
- Rails MessageVerifier (reference implementation that gets the order right): https://api.rubyonrails.org/classes/ActiveSupport/MessageVerifier.html
