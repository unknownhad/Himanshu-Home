# SYM-1 — AhaSend Webhook Signature Comparison Uses `!==` Instead of `hash_equals` (Defense-in-Depth Code Defect)

> **Severity: LOW**  ·  **CWE-208 (Observable Timing Discrepancy) + CWE-203 (Observable Discrepancy)**  ·  **CVSS:3.1 ≈ 2.6 (theoretical timing leak; not practically exploitable over network)**

## Quick facts

| Field | Value |
|---|---|
| **Symfony version tested** | `v8.0.10` (latest stable) |
| **PHP version** | `8.4.21` |
| **Component** | `symfony/mailer` (AhaSend bridge) |
| **File** | `src/Symfony/Component/Mailer/Bridge/AhaSend/Webhook/AhaSendRequestParser.php` |
| **Defective line** | `53` |
| **Status** | **Confirmed code defect against `v8.0.10`. Measured timing ratio: 1.02x — no practical network signal.** |

## Vulnerability summary

The AhaSend webhook bridge verifies the inbound `webhook-signature` header against a locally-computed HMAC-SHA256. The comparison uses PHP's `!==` operator instead of `hash_equals()`.

PHP's `!==` on equal-length strings delegates to `memcmp()`. On modern x86_64, `memcmp()` is effectively constant-time due to SIMD acceleration — a timing attack would need to distinguish ~5 ns differences, which is impossible over any realistic network. The measured early-vs-late mismatch ratio for 64-byte hex strings is **1.02x**, far inside thermal noise.

That said, the framework's consistency expectation is that **every** webhook bridge uses `hash_equals()`. Mailchimp, MailerSend, Mailgun, Mailomat, Sweego all do. Drifting from this convention is a code defect that should be fixed for defense in depth (CDN/proxy side-channels, future LAN-attacker scenarios, code-hygiene).

## Verification

Timing microbenchmark `pocs/local-SYM-1-2-timing-microbench.php` run in container:

```
=== SYM-1 / SYM-2 — HMAC `!==` timing-side-channel microbenchmark ===
Symfony v8.0.10 (latest stable)
PHP 8.4.21

Per-comparison cost (5M iterations averaged):
  mismatch at byte 0   (early):   6.19 ns
  mismatch at byte 32  (mid):     6.46 ns
  mismatch at byte 63  (late):    6.32 ns
  late/early ratio:               1.020x

Conclusion: SYM-1 and SYM-2 are confirmed CODE DEFECTS but not exploitable
over the network.
```

The 1.02x ratio confirms `memcmp()` is constant-time at the resolution that matters. The defect is real (wrong operator), but the security impact in practice is negligible.

## Root cause

`src/Symfony/Component/Mailer/Bridge/AhaSend/Webhook/AhaSendRequestParser.php` (v8.0.10):

```php
// ... lines 25–48 build $signaturePayload and look up $expectedSignature ...

if ($signature !== $expectedSignature) {   // ← line 53 — should be !hash_equals(...)
    throw new RejectWebhookException(403, 'Signature is invalid.');
}
```

For context, line 70 of the same file already uses `hash_hmac('sha256', ...)` to compute the expected signature — the imports and pattern are clearly present. The defect is purely the comparison operator on line 53.

## Recommended fix

`src/Symfony/Component/Mailer/Bridge/AhaSend/Webhook/AhaSendRequestParser.php`:

```diff
-        if ($signature !== $expectedSignature) {
+        if (!hash_equals($expectedSignature, $signature)) {
             throw new RejectWebhookException(403, 'Signature is invalid.');
         }
```

One-line change. The `hash_equals(string $known, string $user)` signature is:
- First argument: the framework's locally-computed expected signature (trusted).
- Second argument: the attacker-controlled value from the request header.

This argument ordering matters in some implementations of constant-time-compare libraries (it doesn't actually matter for PHP's `hash_equals`, but is conventionally the safer pattern).

## Regression test

`Component/Mailer/Bridge/AhaSend/Tests/Webhook/AhaSendRequestParserTest.php`:

```php
public function testUsesConstantTimeComparisonForSignature(): void
{
    // White-box: check that hash_equals is referenced in the parser.
    $source = file_get_contents(
        \dirname(__DIR__, 2).'/Webhook/AhaSendRequestParser.php'
    );
    $this->assertStringContainsString('hash_equals',
        $source,
        'AhaSendRequestParser must use hash_equals() for signature verification (CWE-208).');
    $this->assertStringNotContainsString('$signature !== $expectedSignature',
        $source,
        'AhaSendRequestParser uses !==  for signature comparison — must use hash_equals().');
}
```

Optional behavioral test:

```php
public function testRejectsBadSignature(): void
{
    $parser = new AhaSendRequestParser();
    $secret = 'webhook-secret';

    $body = json_encode(['type' => 'email.sent', 'data' => []]);
    $req = Request::create('/webhook', 'POST', [], [], [],
        ['HTTP_CONTENT_TYPE' => 'application/json'], $body);
    $req->headers->set('Content-Type', 'application/json');
    $req->headers->set('webhook-signature', 'totally-bogus-signature');
    $req->headers->set('webhook-timestamp', (string) time());

    $this->expectException(RejectWebhookException::class);
    $parser->parse($req, $secret);
}
```

## Disclosure

Low severity, code-hygiene fix. Can be reported via a regular GitHub Pull Request rather than the private security channel. Suggested commit message:

```
[Mailer/AhaSend] Use hash_equals() for webhook signature comparison

The AhaSend webhook bridge was the last one comparing signatures with !==
instead of hash_equals(). While the comparison is on equal-length hex strings
where PHP's !== delegates to memcmp() (effectively constant-time), the
framework convention is hash_equals() for cryptographic comparisons.
```

## References

- CWE-208: Observable Timing Discrepancy
- PHP `hash_equals()`: https://www.php.net/manual/en/function.hash-equals.php
- Symfony Mailer webhook bridges (see Mailchimp / Mailgun for reference impl)
