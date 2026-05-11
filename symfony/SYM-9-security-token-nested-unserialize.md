# SYM-9 — Security Tokens & Account Exceptions Perform a Nested `unserialize()` Inside `__unserialize()` (Gadget-Chain Amplifier)

> **Severity (standalone): LOW**  · **Severity (chained, see CHAIN-1): CRITICAL**  · **CWE-502 (Deserialization of Untrusted Data)** · **CVSS:3.1 ≈ 3.7 standalone / 9.0+ chained**

## Quick facts

| Field | Value |
|---|---|
| **Symfony version tested** | `v8.0.10` (latest stable) |
| **PHP version** | `8.4.21` |
| **Component** | `symfony/security-core` |
| **Files affected (8 classes — same pattern)** | See "Affected files" below |
| **Defective line** | `RememberMeToken.php:53` (and equivalents) |
| **Status** | **Confirmed primitive in `v8.0.10` — nested gadget `__wakeup` fires** |
| **Standalone reach** | None directly — requires a primary `unserialize()` ingress |
| **Chains with** | SYM-8 → CHAIN-1 pre-auth RCE; or any other gadget chain that lands one of these classes |

## Vulnerability summary

Eight classes in Symfony's Security component implement a backward-compat fallback inside `__unserialize()`:

```php
$parentData = \is_array($parentData) ? $parentData : unserialize($parentData);
```

This pattern dates to the Symfony 4→5 migration from `Serializable` to `__serialize`/`__unserialize`. If an attacker can land one of these classes via an outer `unserialize()` and supply the `$parentData` field as a **string** (rather than the expected array), Symfony will run a **second, nested** `unserialize()` on the attacker-controlled string.

This is a gadget-chain amplifier: it does not introduce a new ingress, but it lets an attacker who has any single trusted-shape entry point promote it into arbitrary class instantiation.

When paired with **SYM-8** (`SigningSerializer` verify-after-deserialize), the chain becomes a **CRITICAL pre-auth RCE** on Messenger workers. See **CHAIN-1**.

## Verification

PoC `pocs/local-SYM-9-nested-unserialize.php` run in container:

```bash
docker run --rm symfony-poc:latest php /app/pocs/local-SYM-9-nested-unserialize.php
```

### Captured output

```
=== SYM-9 — Security token nested unserialize primitive ===
Symfony v8.0.10 (latest stable)

[*] Outer envelope: array(3) where [2] is a serialized blob, NOT an array.
[*] Crafting a synthetic call to RememberMeToken::__unserialize() with that input.

  [!!] Sym9Probe::__wakeup() FIRED inside nested unserialize
  [+] __unserialize() threw (after gadget fired):
        TypeError: Symfony\Component\Security\Core\Authentication\Token\AbstractToken::__unserialize():
        Argument #1 ($data) must be of type array, Sym9Probe given,
        called in /app/symfony-src/src/Symfony/Component/Security/Core/Authentication/Token/RememberMeToken.php on line 54

==========================================
Nested gadget __wakeup fires: 1
```

The probe class's `__wakeup` ran inside the nested `unserialize()`. The subsequent `TypeError` (because `$parentData` ended up being an object, not an array, after the nested decode) is thrown **after** the gadget fired — the worker still ran attacker code.

## Affected files (all confirmed in v8.0.10)

| File | Line |
|---|---|
| `Component/Security/Core/Authentication/Token/RememberMeToken.php` | 53 |
| `Component/Security/Core/Authentication/Token/UsernamePasswordToken.php` | 50 |
| `Component/Security/Core/Authentication/Token/PreAuthenticatedToken.php` | 53 |
| `Component/Security/Core/Authentication/Token/SwitchUserToken.php` | 66 |
| `Component/Security/Core/Exception/AccountStatusException.php` | 48 |
| `Component/Security/Core/Exception/UserNotFoundException.php` | 58 |
| `Component/Security/Core/Exception/TooManyLoginAttemptsAuthenticationException.php` | 48 |
| `Component/Security/Core/Exception/CustomUserMessageAuthenticationException.php` | 65 |

All eight share the same `__unserialize` pattern.

## Root cause

`src/Symfony/Component/Security/Core/Authentication/Token/RememberMeToken.php` (v8.0.10 source):

```php
public function __unserialize(array $data): void
{
    [, $this->firewallName, $parentData] = $data;
    $parentData = \is_array($parentData) ? $parentData : unserialize($parentData);   // ← line 53
    parent::__unserialize($parentData);
}
```

The intent: legacy code may have serialized the parent state as a **string** (the pre-PHP-7.4 `Serializable::serialize()` return type). The BC branch tries to be friendly. The cost: a free nested `unserialize()` primitive inside the Security component's autoload set.

PHP's `unserialize()` materializes objects whose class is already loaded (the safest-of-unsafe behavior). Inside a Symfony worker request, the autoloader has already touched hundreds of vendor classes — Doctrine, Twig, Monolog, Guzzle, AWS SDK, etc. — each with `__wakeup` / `__destruct` / `__toString` methods that are now reachable for gadget chains.

## Recommended fix

For each of the 8 affected files, remove the BC branch.

### Example: `RememberMeToken.php`

```diff
 public function __unserialize(array $data): void
 {
     [, $this->firewallName, $parentData] = $data;
-    $parentData = \is_array($parentData) ? $parentData : unserialize($parentData);
+    if (!\is_array($parentData)) {
+        throw new \InvalidArgumentException(\sprintf(
+            '%s: legacy non-array $parentData (type %s) is no longer supported. Re-serialize the token using PHP 7.4+.',
+            __METHOD__,
+            get_debug_type($parentData),
+        ));
+    }
     parent::__unserialize($parentData);
 }
```

Apply the **same change** to all 8 files (the variable named `$parentData` and the pattern is identical in each).

### Justification for removing the BC branch

- Symfony 8.x **requires PHP ≥ 8.4** (per `composer.json`). The string-payload form was produced by `Serializable::serialize()` from PHP ≤ 7.3, removed from Symfony many major releases ago.
- Legitimate consumers of these tokens — `Symfony\Component\Security\Http\RememberMe\AbstractRememberMeHandler` and `ContextListener` — always pass an array (verified by reading their callers in v8.0.10).
- No documented BC promise covers cross-PHP-7-to-PHP-8 serialized session data.
- Even if a single user does have ancient serialized session data, the failure mode (an `InvalidArgumentException` from `__unserialize`) is benign and recoverable: they just re-login.

### Alternative (more conservative)

If the maintainers want to preserve the BC path, scope the inner `unserialize()` to only allow benign classes:

```diff
-    $parentData = \is_array($parentData) ? $parentData : unserialize($parentData);
+    if (!\is_array($parentData)) {
+        $parentData = unserialize($parentData, ['allowed_classes' => false]);
+        if (!\is_array($parentData)) {
+            throw new \InvalidArgumentException('Cannot reconstruct token: invalid parent data.');
+        }
+    }
```

This still uses `unserialize()` but with `allowed_classes => false`, which prevents *any* class instantiation — primitive types only. That eliminates the gadget chain primitive entirely.

## Regression test

`Component/Security/Core/Tests/Authentication/Token/RememberMeTokenTest.php`:

```php
public function testUnserializeRejectsStringParentData(): void
{
    $ref = new \ReflectionClass(RememberMeToken::class);
    $token = $ref->newInstanceWithoutConstructor();

    $this->expectException(\InvalidArgumentException::class);
    $token->__unserialize([null, 'firewall-name', 'O:8:"stdClass":0:{}']);
}

public function testUnserializeDoesNotInvokeNestedUnserialize(): void
{
    // Tripwire class — its __wakeup MUST NOT fire during token deserialization
    eval('class Sym9TestProbe { public static int $fired = 0;
        public function __wakeup(): void { self::$fired++; } }');
    \Sym9TestProbe::$fired = 0;

    $ref = new \ReflectionClass(RememberMeToken::class);
    $token = $ref->newInstanceWithoutConstructor();

    try {
        $token->__unserialize([null, 'firewall', serialize(new \Sym9TestProbe())]);
    } catch (\Throwable) {
        // Either type is fine — we just don't want __wakeup to fire.
    }

    $this->assertSame(0, \Sym9TestProbe::$fired,
        '__wakeup() of a nested-serialized object ran — the BC branch is still calling unserialize() on attacker bytes.');
}
```

Repeat for `UsernamePasswordToken`, `PreAuthenticatedToken`, `SwitchUserToken`, `AccountStatusException`, `UserNotFoundException`, `TooManyLoginAttemptsAuthenticationException`, `CustomUserMessageAuthenticationException`.

## Related context

- `Component/Security/Http/Firewall/ContextListener::safelyUnserialize` is **another** Security-component `unserialize()` site. The token classes affected by this SYM-9 are commonly stored *inside* a session blob that `ContextListener` will eventually unserialize. If the session storage is compromised (shared Redis without auth, predictable file paths, etc.), SYM-9 is a primary ingress amplifier into Symfony's gadget surface.
- The `RememberMe` cookie format used by `Symfony\Component\Security\Http\RememberMe\SignatureRememberMeHandler` is **not** the affected surface — it uses `ClassName:base64(uid):expires:hash` format, no `unserialize()`. Good.

## Disclosure

Report privately to `security@symfony.com`. Standalone severity is LOW, but the chain with SYM-8 (CHAIN-1) is CRITICAL — the maintainers should be aware of both findings together.

## References

- CWE-502: Deserialization of Untrusted Data
- Symfony PR #36064 (Symfony 5.0 — migration from Serializable to `__serialize`): the BC branch was added in this PR
- PHP 7.4 release notes — `__serialize`/`__unserialize` introduction
- Related: PHP `unserialize($str, ['allowed_classes' => false])`
