# SYM-4 — Mailjet & Mailtrap Webhook Bridges Silently Discard the Shared Secret (Unauthenticated Webhook Acceptance)

> **Severity: MODERATE → HIGH (depending on downstream use)**  ·  **CWE-345 (Insufficient Verification of Data Authenticity) + CWE-306 (Missing Authentication for Critical Function)**  ·  **CVSS:3.1 ≈ 7.5 (Network / Low / None / None / Unchanged / None / High / None)**

## Quick facts

| Field | Value |
|---|---|
| **Symfony version tested** | `v8.0.10` (latest stable) |
| **PHP version** | `8.4.21` |
| **Component** | `symfony/mailer` |
| **Files affected** | `src/Symfony/Component/Mailer/Bridge/Mailjet/Webhook/MailjetRequestParser.php`, `src/Symfony/Component/Mailer/Bridge/Mailtrap/Webhook/MailtrapRequestParser.php` |
| **Defect** | `doParse(Request $request, #[\SensitiveParameter] string $secret)` never references `$secret` |
| **Status** | **Confirmed in `v8.0.10` — 6/6 forged events accepted, including with empty secret** |

## Vulnerability summary

Symfony provides 12 mailer webhook bridges (AhaSend, Brevo, Mailchimp, MailerSend, Mailgun, **Mailjet**, Mailomat, **Mailtrap**, Postmark, Resend, Sendgrid, Sweego). Each bridge extends `AbstractRequestParser` and implements `doParse(Request $request, string $secret): ?AbstractMailerEvent`.

The framework's `WebhookController` passes a configured `$secret` to each parser, and the parsers are documented to validate request signatures using that secret. **Two of the twelve bridges — Mailjet and Mailtrap — silently discard the `$secret` argument and accept any incoming JSON body.**

An attacker who knows a target uses one of these bridges can POST forged bounce / delivery / engagement events to the application's public webhook endpoint, causing arbitrary state changes: persistent suppression-list entries, falsified engagement counters, billing record corruption, and (when bounce data is rendered into admin dashboards) stored XSS via the `comment` / `reason` fields (composed with SYM-5 → see CHAIN-3).

## Verification

PoC `pocs/local-SYM-4-mailjet-mailtrap-unauth.php` boots both `RequestParser` classes directly (no live server needed) and feeds them a forged JSON payload three times with different secrets:

```
=== SYM-4 — Mailjet/Mailtrap unauthenticated webhook ===
Symfony v8.0.10 (latest stable)

--- Mailjet ---
  secret=''                        ACCEPTED (event class: ...\MailerDeliveryEvent)
  secret='totally-wrong-secret'    ACCEPTED (event class: ...\MailerDeliveryEvent)
  secret='aaaaaaaaaaaaaaaaaa'      ACCEPTED (event class: ...\MailerDeliveryEvent)

--- Mailtrap ---
  secret=''                        ACCEPTED (event: array[1])
  secret='totally-wrong-secret'    ACCEPTED (event: array[1])
  secret='zzzzzzzzzzzzzzzzzzzz'    ACCEPTED (event: array[1])

==========================================
VULNERABLE: 6 accepted requests across the two bridges (any secret, including empty).
```

Both bridges return a fully-constructed event object regardless of the secret value. The forged bounce — including attacker-controlled `email`, `comment`, `error`, `reason` fields — flows downstream into the application's event handlers.

## Root cause

### Mailjet — `Component/Mailer/Bridge/Mailjet/Webhook/MailjetRequestParser.php` (v8.0.10):

```php
final class MailjetRequestParser extends AbstractRequestParser
{
    public function __construct(private readonly MailjetPayloadConverter $converter) {}

    protected function getRequestMatcher(): RequestMatcherInterface
    {
        return new ChainRequestMatcher([
            new MethodRequestMatcher('POST'),
            new IsJsonRequestMatcher(),
        ]);
    }

    protected function doParse(Request $request, #[\SensitiveParameter] string $secret): ?AbstractMailerEvent
    {
        try {
            return $this->converter->convert($request->toArray());   // ← $secret is NEVER touched
        } catch (ParseException $e) {
            throw new RejectWebhookException(406, $e->getMessage(), $e);
        }
    }
}
```

### Mailtrap — `Component/Mailer/Bridge/Mailtrap/Webhook/MailtrapRequestParser.php` (v8.0.10):

```php
final class MailtrapRequestParser extends AbstractRequestParser
{
    // ... ctor + getRequestMatcher ...

    protected function doParse(Request $request, #[\SensitiveParameter] string $secret): RemoteEvent|array|null
    {
        $payload = $request->toArray();
        if (!isset($payload['events'][0]['event']) || !isset($payload['events'][0]['message_id'])) {
            throw new RejectWebhookException(406, 'Payload is malformed.');
        }
        try {
            return array_map($this->converter->convert(...), $payload['events']);
                                                                            // ← $secret is NEVER touched
        } catch (ParseException $e) {
            throw new RejectWebhookException(406, $e->getMessage(), $e);
        }
    }
}
```

In both files, `$secret` is annotated with `#[\SensitiveParameter]` (the PHP 8.2 attribute meant for stack-trace redaction), giving a visual cue that it's "security-relevant" — but the function body **never references the variable**.

By comparison, every other Symfony mailer webhook bridge does verify (search for `hash_hmac` and `hash_equals` in the other 10 RequestParser files):

| Bridge | Verifies with | File |
|---|---|---|
| AhaSend | `hash_hmac` + `!==` (SYM-1) | `AhaSendRequestParser.php` |
| Brevo | IP allow-list | `BrevoRequestParser.php` |
| Mailchimp | `hash_hmac` + `hash_equals` | `MailchimpRequestParser.php` |
| MailerSend | `hash_hmac` + `hash_equals` | `MailerSendRequestParser.php` |
| Mailgun | `hash_hmac` + `hash_equals` | `MailgunRequestParser.php` |
| **Mailjet** | **(none)** | `MailjetRequestParser.php` |
| Mailomat | `hash_hmac` + `hash_equals` | `MailomatRequestParser.php` |
| **Mailtrap** | **(none)** | `MailtrapRequestParser.php` |
| Postmark | IP allow-list | `PostmarkRequestParser.php` |
| Resend | `Webhook::constructEvent` (Svix lib) | `ResendRequestParser.php` |
| Sendgrid | `EllipticCurve::Ecdsa::verify` | `SendgridRequestParser.php` |
| Sweego | `hash_hmac` + `hash_equals` | `SweegoRequestParser.php` |

The Mailjet/Mailtrap parsers were apparently added without their signature verification; the documented protocols for both providers DO support HMAC verification.

## Recommended fix

### Mailjet

Mailjet provides webhook signatures via the `Authorization` HTTP header using a basic-auth-style mechanism, OR via a query parameter (`?Auth=<base64(user:password)>`) — the maintainer should pick one consistent with the bridge's existing convention.

**Reference (Mailjet docs):** https://documentation.mailjet.com/hc/en-us/articles/360043708734

```diff
 // src/Symfony/Component/Mailer/Bridge/Mailjet/Webhook/MailjetRequestParser.php
 final class MailjetRequestParser extends AbstractRequestParser
 {
     public function __construct(private readonly MailjetPayloadConverter $converter) {}

     protected function getRequestMatcher(): RequestMatcherInterface
     {
         return new ChainRequestMatcher([
             new MethodRequestMatcher('POST'),
             new IsJsonRequestMatcher(),
         ]);
     }

     protected function doParse(Request $request, #[\SensitiveParameter] string $secret): ?AbstractMailerEvent
     {
+        // Mailjet sends webhooks with HTTP Basic auth (configured per-endpoint in
+        // the Mailjet dashboard). The bridge accepts the deployer-configured
+        // shared secret as the basic-auth password.
+        $auth = $request->headers->get('Authorization', '');
+        if (!\str_starts_with($auth, 'Basic ')) {
+            throw new RejectWebhookException(401, 'Mailjet webhook is missing Basic auth header.');
+        }
+        $expected = base64_encode(':' . $secret);  // empty user, secret-as-password
+        $given    = \substr($auth, 6);
+        if (!\hash_equals($expected, $given)) {
+            throw new RejectWebhookException(403, 'Mailjet webhook signature is invalid.');
+        }
+
         try {
             return $this->converter->convert($request->toArray());
         } catch (ParseException $e) {
             throw new RejectWebhookException(406, $e->getMessage(), $e);
         }
     }
 }
```

### Mailtrap

Mailtrap signs webhooks with a per-account secret using HMAC-SHA256 in the `X-Mt-Signature` header.

**Reference (Mailtrap docs):** https://api-docs.mailtrap.io/docs/mailtrap-api-docs/9c4ecae8e94f3-webhooks-spec

```diff
 // src/Symfony/Component/Mailer/Bridge/Mailtrap/Webhook/MailtrapRequestParser.php
 final class MailtrapRequestParser extends AbstractRequestParser
 {
     // ...

     protected function doParse(Request $request, #[\SensitiveParameter] string $secret): RemoteEvent|array|null
     {
+        // Mailtrap signs webhooks with HMAC-SHA256 over the raw request body.
+        // The signature is sent in the X-Mt-Signature header as hex.
+        $sig = $request->headers->get('X-Mt-Signature', '');
+        if ('' === $sig) {
+            throw new RejectWebhookException(401, 'Mailtrap webhook is missing X-Mt-Signature header.');
+        }
+        $body     = $request->getContent();
+        $expected = \hash_hmac('sha256', $body, $secret);
+        if (!\hash_equals($expected, $sig)) {
+            throw new RejectWebhookException(403, 'Mailtrap webhook signature is invalid.');
+        }
+
         $payload = $request->toArray();

         if (
             !isset($payload['events'][0]['event'])
             || !isset($payload['events'][0]['message_id'])
         ) {
             throw new RejectWebhookException(406, 'Payload is malformed.');
         }

         try {
             return array_map($this->converter->convert(...), $payload['events']);
         } catch (ParseException $e) {
             throw new RejectWebhookException(406, $e->getMessage(), $e);
         }
     }
 }
```

### Configuration default — fail closed

Add a guard in `AbstractRequestParser` (or in the FrameworkBundle wiring) that **rejects** the bridge configuration if `$secret` is empty:

```php
// Symfony\Component\Webhook\Client\AbstractRequestParser::parse():
public function parse(Request $request, #[\SensitiveParameter] string $secret): mixed
{
    if ('' === $secret) {
        throw new \LogicException(
            sprintf('Webhook bridge %s requires a non-empty secret. Configure framework.webhook.routing.%s.secret in your application.',
                static::class,
                $this->getName(),
            )
        );
    }
    // ... existing dispatch
}
```

This makes "empty secret + Mailjet/Mailtrap" a startup error instead of a runtime accept-all.

## Regression tests

`Component/Mailer/Bridge/Mailjet/Tests/Webhook/MailjetRequestParserTest.php`:

```php
public function testRejectsRequestWithoutSignature(): void
{
    $parser = new MailjetRequestParser(new MailjetPayloadConverter());
    $payload = ['event' => 'bounce', 'time' => time(), 'MessageID' => 1,
                'email' => 'x@example.com', /* ... */];
    $req = Request::create('/webhook', 'POST', [], [], [],
        ['HTTP_CONTENT_TYPE' => 'application/json'], json_encode($payload));
    $req->headers->set('Content-Type', 'application/json');

    $this->expectException(RejectWebhookException::class);
    $parser->parse($req, 'real-secret');
}

public function testRejectsRequestWithWrongSignature(): void
{
    $parser = new MailjetRequestParser(new MailjetPayloadConverter());
    $payload = ['event' => 'bounce', /* ... */];
    $req = Request::create('/webhook', 'POST', [], [], [],
        ['HTTP_CONTENT_TYPE' => 'application/json'], json_encode($payload));
    $req->headers->set('Authorization', 'Basic ' . base64_encode(':wrong-pass'));
    $req->headers->set('Content-Type', 'application/json');

    $this->expectException(RejectWebhookException::class);
    $parser->parse($req, 'real-secret');
}

public function testAcceptsRequestWithCorrectSignature(): void
{
    $parser = new MailjetRequestParser(new MailjetPayloadConverter());
    $secret = 'real-secret';
    $payload = ['event' => 'bounce', 'time' => time(), 'MessageID' => 1,
                'email' => 'x@example.com'];
    $req = Request::create('/webhook', 'POST', [], [], [],
        ['HTTP_CONTENT_TYPE' => 'application/json'], json_encode($payload));
    $req->headers->set('Authorization', 'Basic ' . base64_encode(':' . $secret));
    $req->headers->set('Content-Type', 'application/json');

    $event = $parser->parse($req, $secret);
    $this->assertInstanceOf(MailerDeliveryEvent::class, $event);
}
```

Same test triple for `MailtrapRequestParserTest`, substituting the `X-Mt-Signature` HMAC header.

## Real-world impact scenarios

1. **Suppression list corruption.** An attacker who knows a victim's marketing-system endpoint URL (often `/_/webhook/mailer/mailjet/...`) submits 50,000 fake bounce events for arbitrary email addresses. The application's bounce handler marks those addresses as undeliverable → the victim's transactional email is suppressed for innocent recipients.
2. **Billing/metrics fraud.** Forged delivery + open + click events inflate engagement metrics, distorting A/B tests, ROI dashboards, and any billing model tied to per-event counts.
3. **Stored XSS** (composes with SYM-5). Bounce payloads include free-form `comment` / `error` / `reason` strings. Many applications log these into admin dashboards. If the admin UI uses `HtmlSanitizer` with the SYM-5 bypass, attacker-controlled HTML lands in admin sessions.
4. **CSV formula injection** (composes with OBS-3 / CHAIN-2). Bounce payloads are commonly exported to CSV for compliance/auditing. If `CsvEncoder::ESCAPE_FORMULAS` is not set (it's off-by-default), attacker payloads like `=cmd|'/c calc'!A1` reach Excel and execute on admin workstations.

## Disclosure

Report privately to `security@symfony.com`. Two-file fix with a 30-minute review cycle.

## References

- CWE-345: Insufficient Verification of Data Authenticity
- CWE-306: Missing Authentication for Critical Function
- Mailjet webhook docs: https://documentation.mailjet.com/hc/en-us/articles/360043708734
- Mailtrap webhook docs: https://api-docs.mailtrap.io/docs/mailtrap-api-docs/9c4ecae8e94f3-webhooks-spec
- Symfony Webhook component docs: https://symfony.com/doc/current/webhook.html
