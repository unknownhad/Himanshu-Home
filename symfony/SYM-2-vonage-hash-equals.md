# SYM-2 — Vonage Webhook Signature Comparison Uses `!==` Instead of `hash_equals` (Defense-in-Depth Code Defect)

> **Severity: LOW**  ·  **CWE-208 (Observable Timing Discrepancy) + CWE-203 (Observable Discrepancy)**  ·  **CVSS:3.1 ≈ 2.6 (theoretical timing leak; not practically exploitable over network)**

## Quick facts

| Field | Value |
|---|---|
| **Symfony version tested** | `v8.0.10` (latest stable) |
| **PHP version** | `8.4.21` |
| **Component** | `symfony/notifier` (Vonage bridge) |
| **File** | `src/Symfony/Component/Notifier/Bridge/Vonage/Webhook/VonageRequestParser.php` |
| **Defective line** | `86` |
| **Status** | **Confirmed code defect against `v8.0.10`. Measured timing ratio: 1.02x — no practical network signal.** (Tested via the shared SYM-1/SYM-2 microbenchmark.) |

## Vulnerability summary

The Vonage webhook bridge constructs a JWT-style 3-part signature (`header.payload.signature`), then compares the third part against a locally-computed HMAC-SHA256-then-base64url string using PHP's `!==` operator instead of `hash_equals()`.

The risk profile is identical to SYM-1: on modern x86_64 PHP, `!==` on equal-length strings is effectively constant-time, so timing-side-channel exploitation over a network is not realistic. The fix is required for defense-in-depth and framework-wide convention consistency.

## Verification

The shared SYM-1/SYM-2 microbenchmark applies here — `!==` on 64-byte equal-length strings shows a 1.02x ratio between early-byte and late-byte mismatches, which is wall-clock indistinguishable below microsecond resolution.

Source `pocs/local-SYM-1-2-timing-microbench.php` output:

```
Per-comparison cost (5M iterations averaged):
  mismatch at byte 0   (early):   6.19 ns
  mismatch at byte 32  (mid):     6.46 ns
  mismatch at byte 63  (late):    6.32 ns
  late/early ratio:               1.020x
```

## Root cause

`src/Symfony/Component/Notifier/Bridge/Vonage/Webhook/VonageRequestParser.php` (v8.0.10) — the signature verification block:

```php
// Lines 57-90 — JWT-style verification path
if ('sms' !== $payload['channel']) {
    // ...
}

$jwt = $request->headers->get('Authorization', '');
if (!str_starts_with($jwt, 'Bearer ')) {
    throw new RejectWebhookException(401, 'Missing Bearer JWT.');
}
$jwt = substr($jwt, 7);
$tokenParts = explode('.', $jwt);

if (3 !== \count($tokenParts)) {
    throw new RejectWebhookException(401, 'Invalid JWT structure.');
}

[$header, $payload, $signature] = $tokenParts;

if ($signature !== $this->base64EncodeUrl(hash_hmac('sha256', $header.'.'.$payload, $secret, true))) {
//     ^^^^^^^^^^^^ line 86 — should be !hash_equals(...)
    throw new RejectWebhookException(403, 'Signature is invalid.');
}
```

Same defect class as SYM-1 — `!==` where `hash_equals()` is expected.

## Recommended fix

`src/Symfony/Component/Notifier/Bridge/Vonage/Webhook/VonageRequestParser.php`:

```diff
-        if ($signature !== $this->base64EncodeUrl(hash_hmac('sha256', $header.'.'.$payload, $secret, true))) {
+        $expected = $this->base64EncodeUrl(hash_hmac('sha256', $header.'.'.$payload, $secret, true));
+        if (!hash_equals($expected, $signature)) {
             throw new RejectWebhookException(403, 'Signature is invalid.');
         }
```

The two-line form is preferred over a single-line `hash_equals(...)` call because it makes the "expected" value explicit and easier to inspect/log.

### Bonus hardening (recommended)

Vonage's JWT-style format includes a `header` segment that specifies the algorithm. The current parser does NOT validate the `alg` claim, so a malicious sender could in principle set `"alg":"none"` (the classic JWT downgrade attack). The current code dodges this by hardcoding HMAC-SHA256 in the comparison, but a defensive check is worthwhile:

```diff
 [$header, $payload, $signature] = $tokenParts;

+$headerData = json_decode(base64_decode(strtr($header, '-_', '+/')), true);
+if (!\is_array($headerData) || ($headerData['alg'] ?? null) !== 'HS256') {
+    throw new RejectWebhookException(401, 'JWT must use HS256; received "'. ($headerData['alg'] ?? 'unknown') .'".');
+}
+
 $expected = $this->base64EncodeUrl(hash_hmac('sha256', $header.'.'.$payload, $secret, true));
 if (!hash_equals($expected, $signature)) {
     throw new RejectWebhookException(403, 'Signature is invalid.');
 }
```

This is defense-in-depth — the existing code is safe against `alg=none` today (it always computes HS256 expected and compares), but the explicit check is more obviously correct and aligns with JWT best practice.

## Regression test

`Component/Notifier/Bridge/Vonage/Tests/Webhook/VonageRequestParserTest.php`:

```php
public function testUsesConstantTimeComparisonForJwtSignature(): void
{
    $source = file_get_contents(
        \dirname(__DIR__, 2).'/Webhook/VonageRequestParser.php'
    );
    $this->assertStringContainsString('hash_equals',
        $source,
        'VonageRequestParser must use hash_equals() for JWT signature verification (CWE-208).');
}

public function testRejectsBogusJwtSignature(): void
{
    $parser = new VonageRequestParser();
    $secret = 'webhook-secret';

    // Craft a JWT with a valid header+payload but bogus signature
    $header = rtrim(strtr(base64_encode('{"alg":"HS256","typ":"JWT"}'), '+/', '-_'), '=');
    $payloadJson = json_encode(['channel' => 'sms', 'from' => '15551234567', 'to' => '15557654321', 'text' => 'x']);
    $payload = rtrim(strtr(base64_encode($payloadJson), '+/', '-_'), '=');
    $sig = 'bogus-signature-here';
    $jwt = "$header.$payload.$sig";

    $req = Request::create('/webhook', 'POST', [], [], [],
        ['HTTP_CONTENT_TYPE' => 'application/json'], $payloadJson);
    $req->headers->set('Authorization', 'Bearer '.$jwt);
    $req->headers->set('Content-Type', 'application/json');

    $this->expectException(RejectWebhookException::class);
    $parser->parse($req, $secret);
}
```

## Disclosure

Low severity, code-hygiene fix. Can be combined with SYM-1 into a single PR. Suggested commit message:

```
[Notifier/Vonage] Use hash_equals() for JWT signature comparison

Following the framework convention used by every other webhook bridge,
switch from !==  (effectively memcmp() on PHP 8) to hash_equals() for
the JWT signature comparison. Also adds explicit alg=HS256 validation
to harden against future JWT-downgrade variants.
```

## References

- CWE-208: Observable Timing Discrepancy
- RFC 7519 (JWT) §5.1: `alg` field
- Vonage Messages API webhook signing docs: https://developer.vonage.com/en/messages/concepts/signed-webhooks
- PHP `hash_equals()`: https://www.php.net/manual/en/function.hash-equals.php
