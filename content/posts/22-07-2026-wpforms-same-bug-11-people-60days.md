---
title: "10 people found my bug before me: the wpforms paypal webhook (cve-2026-4986)"
date: 2026-22-07
tags: ["security", "wordpress", "webhooks", "paypal", "disclosure", "vulnerability-management", "blog"]
author: "Himanshu Anand"
draft: true
---

## TLDR

WPForms Lite is a WordPress form plugin with 5 million plus active installs. Versions 1.10.0.1 through 1.10.0.4 shipped a PayPal Commerce webhook handler that accepted events from anyone on the internet. No PayPal signature verification. No callback to PayPal before processing. Send a forged JSON body to `/wp-json/wpforms/ppc/webhooks/` and the plugin would treat it like a real PayPal event.

The impact was payment state manipulation. A forged `PAYMENT.CAPTURE.COMPLETED` event could mark a matching pending PayPal transaction as completed and fire downstream payment completed actions. A forged `PAYMENT.CAPTURE.DENIED` event could mark a matching transaction as denied. That is the kind of bug where the database starts telling a story that PayPal never actually told.

The same plugin already verified Stripe and Square webhooks correctly. PayPal was the odd one out. Public tracking now lists this as **CVE-2026-4986**, `WPForms Lite < 1.10.0.5 - Unauthenticated PayPal Webhook Forgery`, fixed in **1.10.0.5**. I was very late to the party. I was reporter number 11.

## where this post fits

If you read [my last post on the death of the 90 day disclosure policy](https://blog.himanshuanand.com/2026/05/the-90-day-disclosure-policy-is-dead/), you saw story 1: I found a bug, sent it in and the triage team said "you are reporter eleven". I left the technical details vague because I did not want to accidentally turn my blog into a free exploit feed,Rude to users, generous to attackers Bad trade.

The issue has since been patched properly and the public databases now have the right shape of the bug. Now I can tell the full story, This is the "10 people found my bug before me" follow up I promised.

## the story (the one I hinted at)

Late April 2026. I was poking at WordPress plugins, looking at payment integrations specifically. Payment code is interesting because the security cost of a bug is real money, the attack surface is usually public and the developers often glue together third party SDKs in ways that miss one tiny very important thing. WPForms is one of the biggest form plugins on WordPress so I figured the code would be well audited, Mostly.

Mostly is doing a lot of work in that sentence.

I opened the PayPal Commerce integration folder and grep for `permission_callback`. That is the WordPress way of saying "who is allowed to hit this endpoint" was looking for the usual mistakes. Within about 90 seconds I had this:

```php
register_rest_route(
    Helpers::get_webhook_endpoint_data()['namespace'],
    '/' . Helpers::get_webhook_endpoint_data()['route'],
    [
        'methods'             => $methods,
        'callback'            => [ $this, 'dispatch_paypal_webhooks_payload' ],
        'show_in_index'       => false,
        'permission_callback' => '__return_true',
    ]
);
```

`__return_true` The endpoint is open to the world, this by itself is not a bug as Webhook endpoints have to be open. PayPal cannot log in to your WordPress site, type the captcha and whisper "please process my payment" into wp-admin. The bug is what happens after the request lands.

When I followed the callback handler reads the raw body, parses JSON, checks the event type against a public allowlist and then hands the payload to the appropriate handler. In the vulnerable versions, nowhere in that chain did it verify that the request actually came from PayPal.

No `Paypal-Transmission-Sig` validation, No PayPal verify-webhook-signature call and No useful rejection path for a totally unsigned request. The endpoint was basically saying "if you can spell `PAYMENT.CAPTURE.COMPLETED`, please come in the money room is to your left".

I built a one liner curl command, tested it on a local install and It worked first try. The order in my test database flipped state and payment-completed side effects fired, COOL!! right? I completed the writeup and share it for the fix.

Then the triage email came back. Yeah, they knew about this issue It was first reported weeks earlier and I was reporter eleven.

![reporter 11 of 11](https://blog.himanshuanand.com/images/11_submittions.png)

*the moment you realize 10 other people beat you to the same bug. yes I screenshotted it and yes it stings the previous post talked about this exact pattern, this is the bug behind that story.*

Here is where my original mental model was wrong and why I am writing this corrected version carefully. At first I tied this to the earlier public CSRF advisory, **CVE-2026-40764**, fixed in 1.10.0.3. That was related in the broad "payment integration security went sideways" sense, but it was not the final public record for this PayPal webhook forgery issue. The actual missing PayPal webhook authentication issue is now tracked publicly as **CVE-2026-4986** and fixed in **1.10.0.5**.

So the timeline looks like this:

- PayPal Commerce support landed in WPForms Lite 1.10.0.1.
- Versions 1.10.0.1 through 1.10.0.4 had the missing PayPal webhook authenticity check.
- A separate CSRF issue was fixed in 1.10.0.3.
- The PayPal webhook forgery issue was fixed in 1.10.0.5.
- Public databases now list the webhook bug as `WPForms Lite < 1.10.0.5 - Unauthenticated PayPal Webhook Forgery`, CVE-2026-4986.

This is the part where I tap the sign: always re check the final advisory before publishing. The CVE spreadsheet goblin is not your QA team.

## quick refresher: what a webhook is and why it needs a signature

If you already write webhooks for a living, skip this section. If not, stay with me, because once you understand the model the bug becomes obvious.

A webhook is a callback over HTTP Service A wants to tell Service B that something happened. Maybe PayPal wants to tell WordPress that a customer just paid. The naive way to do this would be for WordPress to keep asking PayPal "did anything new happen?" every few seconds. That is called polling and it is wasteful. The smarter way is for PayPal to call WordPress when something happens is a webhook call.

The mechanics are simple WordPress exposes a URL, PayPal makes an HTTP POST to that URL with a JSON body describing the event. WordPress reads the body, does something, returns 200 OK.

The problem: the URL has to be public which means anyone on the internet can reach it. So if WordPress just trusts whatever shows up at that URL, then anyone can pretend to be PayPal.

Every webhook provider knows this, that's why every webhook provider gives you a way to verify the source. 
The two common patterns are

**HMAC signatures.** The provider has a secret shared with the receiver. When they send a webhook, they compute an HMAC of the body using that secret and put it in a header. The receiver recomputes the HMAC, compares the two, accepts the request only if they match. Stripe does this with the `Stripe-Signature` header. Square does this with `X-Square-HmacSha256-Signature`. This pattern is fast, stateless and well understood.

**Provider signature verification.** PayPal's webhook model includes headers like `Paypal-Transmission-Sig`, `Paypal-Cert-Url`, `Paypal-Transmission-Id`, `Paypal-Transmission-Time` and `Paypal-Auth-Algo`. The receiver can verify the signature itself or call PayPal's `/v1/notifications/verify-webhook-signature` endpoint and let PayPal validate it server side.

In both the patterns, the rule is the same: if you do not verify, you do not trust. A webhook handler that does not verify is just a public API endpoint that mutates payment state.

Here is the asymmetry in one picture.

```text
================================================================
  HOW IT SHOULD WORK (stripe, square, properly built webhooks)
================================================================

  [Anyone]    --POST body, no signature-->   [Server]
                                                 |
                                                 v
                                            verify signature?  FAIL
                                                 |
                                                 v
                                            reject, no DB change


  [PayPal]    --POST body + signature-->     [Server]
                                                 |
                                                 v
                                            verify signature?  PASS
                                                 |
                                                 v
                                            update DB, fire hooks


================================================================
  HOW WPFORMS PAYPAL DID IT BEFORE 1.10.0.5
================================================================

  [Anyone]    --POST forged JSON-->          [Server]
                                                 |
                                                 v
                                            json_decode( body )
                                            check event_type (public allowlist)
                                            check status   (attacker controlled)
                                            check amount   (knowable from the form)
                                                 |
                                                 v
                                            update DB, fire hooks
                                            "congratulations, fake money"
```

The top block is how every webhook in the world is supposed to work. The bottom block is what the WPForms PayPal handler did before 1.10.0.5. The server could not tell `[Anyone]` apart from `[PayPal]` because it never validated the PayPal signature before processing the event.

## the wpforms paypal webhook in one paragraph

The WPForms PayPal Commerce integration registers a REST route under `/wp-json/wpforms/ppc/webhooks/` with `permission_callback => '__return_true'`. The same handler can also be reached through a fallback URL parameter, depending on the webhook communication setting, so this was not only a "REST API is public" story. The handler reads the request body, JSON decodes it, checks the event type against a public allowlist and dispatches to a per-event-type handler. In vulnerable versions, the `PAYMENT.CAPTURE.COMPLETED` handler could update the matching payment record and fire downstream payment-completed actions without the request being authenticated as PayPal.

## the missing check (the whole bug in 6 lines, spiritually)

The exact patch WPForms shipped in 1.10.0.5 is slightly more complex because it handles different connection modes.

```php
$payload = file_get_contents( 'php://input' );

if ( ! $this->verify_webhook_signature( $payload ) ) {
    throw new RuntimeException( 'Webhook signature verification failed.' );
}

$event = json_decode( $payload, false );
```

That is the whole bug, absence of the verification step is what made the endpoint exploitable. Every check after that is only checking the shape of the story. The signature check asks who is telling the story.

## the four placebo checks that do not save you

When I sent the report, I expected the response to argue back. They usually point at some check in the code path and say "see, we do validate, the attacker cannot just forge anything". WPForms had several check and None of them replaced webhook authentication.

| Check | Why it does not stop an attacker |
|-------|----------------------------------|
| `event_type` allowlist | The allowlist values are hardcoded. Anyone can read them. The attacker picks a supported PayPal event and moves on. |
| Existing payment lookup | This limits the attacker to payment IDs or transaction IDs that exist. It does not prove the event came from PayPal. |
| Status checks | If the status comes from the JSON body, the attacker controls it. Putting `COMPLETED` in the payload is not a security achievement. It is typing. |
| Amount checks | Amount checks reduce sloppy forgeries. They do not authenticate the sender. A public form can leak or imply the amount. A real pending payment already has it in the DB. |

These checks restrict what the attacker can target. They do not check whether the request actually came from PayPal that is the whole point of webhook signature verification.

![security theater meme: airport screening but they only check your ticket spelling](https://blog.himanshuanand.com/images/airport.png)

*if you have to spell PAYMENT.CAPTURE.COMPLETED correctly to forge a payment, that is not security that is a spelling bee with financial consequences.*

There is also a subtle one I want to call out separately because it makes the impact feel worse. Inside webhook processing, code often has to run without a logged in user, meaning capability checks in downstream payment code can get weird If a webhook path temporarily treats itself as trusted, that is fine only when the webhook path is actually authenticated. If the entry point is unauthenticated, then the code path welcomes all including bad people.

## proof of concept

I am keeping this PoC at the level needed to explain the bug, not at the level needed to make random WordPress shops have a bad afternoon. The public advisory already has a minimal example for the denied path and the fixed version rejects unsigned payloads now.

Step 1: the route existed publicly.

```bash
curl -i 'https://TARGET/wp-json/wpforms/ppc/webhooks/?verify=1'
```

If the route was registered, this verification helper could return success. Important note: an open webhook route is normal. The bug was not "route is public". The bug was "route is public and then trusts unsigned payment events".

Step 2: before 1.10.0.5, a forged PayPal event could be posted without PayPal signature headers.

```bash
curl -i -X POST 'https://TARGET/wp-json/wpforms/ppc/webhooks/' \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "event_type": "PAYMENT.CAPTURE.DENIED",
    "resource": {
      "id": "TXNFORGE1",
      "status": "DENIED"
    }
  }'
```

That request has no `Paypal-Transmission-Id`, no `Paypal-Transmission-Sig`, no `Paypal-Transmission-Time`, no `Paypal-Cert-Url` and no `Paypal-Auth-Algo`. A genuine PayPal webhook would include the verification material. Vulnerable WPForms versions did not validate it before processing.

In my local testing I used the completed payment path too, with a matching transaction and amount, to show the integrity impact. The key point is the same for both paths: the server accepted the event because the JSON looked right, not because PayPal said it was real.

![terminal screenshot of the curl request and the 200 OK response](https://blog.himanshuanand.com/images/response.png)

*the exploit shape, in one screen. forged request in, payment state changes out, no PayPal in the room, just vibes and JSON.*

## the fallback url that does not need the rest api

Some WordPress hardening guides recommend disabling the REST API for unauthenticated users. WPForms also had a fallback listener path for webhook delivery when REST was not the selected communication method. In vulnerable versions, that fallback reached the same handler and therefore had the same missing PayPal verification problem.

That matters because "we disabled REST" is a very common WordPress security blanket. Sometimes it is useful and sometimes not.

The lesson is simple when you build a fallback path, the fallback path needs the same security as the primary path.A fallback that skips the primary path's checks is not a fallback.

## the same plugin gets stripe and square right

Here is the part that makes the bug feel weirdest WPForms knew how to verify webhooks, they did it for Stripe (After 1 similar CVE), they did it for Square. PayPal was the one that missed the check.

The clearest way to see it is to put the handlers side by side. Both register public webhook routes with `permission_callback => '__return_true'`. Both read the raw body. What happens after that line is the whole bug.

```diff
# both files start with the same idea:
  $this->payload = file_get_contents( 'php://input' );

# Stripe handler
+ $event = Webhook::constructEvent(
+     $this->payload,
+     $this->get_webhook_signature(),
+     $this->get_webhook_signing_secret()
+ );
+ // bad signature throws and the event is rejected

# PayPal handler before 1.10.0.5
- // no PayPal webhook signature verification before processing
  $event = json_decode( $this->payload, false );
```

Square also had the right shape It validates the Square HMAC signature with Square's webhook helper before trusting the event. Same pattern, different provider. That asymmetry is the hint that this was an oversight rather than a grand philosophical statement about trusting strangers on the internet.

## what the actual patch did

WPForms 1.10.0.5 added signature verification before JSON decoding and event dispatch.

The important bit looks like this:

```php
// Verify the webhook signature before processing.
if ( ! $this->verify_webhook_signature( $this->payload ) ) {
    throw new RuntimeException( 'Webhook signature verification failed.' );
}
```

Then `verify_webhook_signature()` routes based on connection type:

- Legacy PayPal Commerce addon connections call the addon's PayPal webhook verification method.
- Product API forwarded webhooks validate `X-WPForms-Signature` and `X-WPForms-Timestamp` using HMAC-SHA256 and reject old timestamps to reduce replay risk.

The final patch is not exactly the six line "call PayPal directly" sketch I originally had in my report. WPForms has its own Product API forwarding model for some connections, so the patch verifies the signature appropriate to that path. The security property is the same: unsigned random JSON from the internet no longer gets to mutate payment state.

## what 10 duplicate reports actually means

This bug got reported by 11 of us according to my triage thread. Let me stop and think about what that number actually tells us.

The vendor sees 11 unrelated researchers, all reporting the same root cause, in totally different words, through different intake channels, some using AI assistance and some not. The probability that everyone who finds a bug like this reports it is zero. The actual base rate for "researchers who find a bug and report it" versus "people who find a bug and do something else" is unknown but it is definitely not 100%.

If you take an optimistic 50% report rate, 11 reports means roughly 22 finders. If you take a more pessimistic 20% rate, it is more like 55 finders. These are not scientific numbers Please do not put them in a Gartner quadrant. The point is directionally obvious: the visible reporters are not the whole population.

Now read that again with attacker incentives in mind, A bug like this touches payment state. It does not need admin access it runs against a public endpoint. There is no exotic browser chain. It is a webhook handler trusting a stranger with a clipboard.

This is the part of the 90 day disclosure model that I keep coming back to. The model assumes the people finding a bug are mostly the same set as the people reporting it. The model assumes the gap between "first find" and "second find" is large enough that the vendor's patch can ship before the second person knows.

If 11 of us found the same bug, the right question is not "why so many duplicates". The right question is "where are the other ones".

![iceberg meme: 11 reporters above water, unknown attackers and unreported finders below](https://blog.himanshuanand.com/images/iceberg.jpg)

*the 11 of us who reported are the part above the waterline. the part below the waterline is the people who found the same bug and chose to do something else with it nobody knows how big that part is that is the problem.*

## lessons for bug finders

For people who do this kind of work, a few things I want to put in writing.

**Grep for `permission_callback` first.** In WordPress plugin audits, this is the single most productive grep you can run. `__return_true` is the WordPress equivalent of "no WordPress auth". Every match deserves a look at what the callback does. If the callback mutates state, you might be five minutes away from a finding.

**Do not stop at `__return_true`.** Webhook endpoints are supposed to be public. The question is not "can anyone reach this". The question is "after they reach it, how does the plugin prove they are the provider". Public route plus signature verification is normal. Public route plus vibes is a bug.

**Look for asymmetries inside one project.** If a plugin verifies Stripe webhooks but not PayPal webhooks, that asymmetry is a bug shape. Same logic applies to any pair of "the same kind of thing done two different ways". File downloads handled one way in one route and a different way in another. User input validated in one form and not the other. Authentication checks present in one endpoint and missing in the next. Project internal asymmetries are gold.

**Fallback paths deserve their own audit.** Every time you find a security check in the main path, look for a fallback that skips it. Plugins love fallbacks. URL parameters, query strings, alternate endpoints, legacy compatibility shims. The fallback is often where the careful path's checks got forgotten.

**The CVE classification might not match the actual bug.** Reporters do not always control how the bug gets classified in public databases. In this case, there was an earlier CSRF entry and a later webhook forgery entry. Those are not the same thing. Test the patch yourself. Do not assume "patched in 1.10.0.3" means "the webhook auth gap is closed". Re-run the proof of concept and Verify CVE database is not your QA team.

**Submit anyway, even when it is a dupe.** I am reporter 11 and I will probably get zero credit on the CVE and zero bounty money. The signal to the vendor of "10 of us think this is real, plus reporter 11 is also here waving a tiny flag" is more useful than 10 alone. Vendors do prioritize by report count Show up.

## lessons for vendors

A few things for the receiving side.

**Webhook handlers are payment infrastructure, Treat them like it.** Anything that mutates payment state is at the same security tier as your card processing logic. The fact that the endpoint is "just a webhook" does not lower the bar. Webhook endpoints are public, they mutate database state, they fire side effects. They are payment infrastructure. They get the same review.

**Build a verification helper once, use it everywhere.** Every payment integration in a plugin should call into a provider-specific verification helper before processing. If a new integration ships without a call to that helper, the security review should reject the patch.

**Document your fallback URLs in the threat model.** If you have a fallback path for sites that disable the REST API, write down what it does and what it skips. Run the same security checks against the fallback that you run against the primary route. Add a test that proves the fallback rejects invalid signatures.

**Beware of trusted webhook scopes.** If your webhook path bypasses normal user capability checks because webhooks do not have users, then the entry point must be authenticated before the bypass starts. Otherwise the bypass becomes an admin costume for unsigned JSON.

**Test the patch by re-running the original PoC.** I know this sounds obvious but It is not obvious enough. Patches that fix a CSRF interpretation of a webhook bug do not fix the underlying webhook auth gap. Re run the original PoC against the patched build. If it still works, the patch is incomplete.

## final thoughts

This bug is small, The fix is small but install base is not small. (Horror triangle of WordPress plugin security)

The important correction to my earlier notes is this: the PayPal webhook forgery was not finally fixed in 1.10.0.3. It was fixed in 1.10.0.5. The public CVE I should point to for this post is **CVE-2026-4986**, not the earlier CSRF CVE. I am writing that plainly because future me will absolutely forget and try to be clever again.

What this bug is not small in is what it tells us about the industry, The plugin is in 5 million plus installs. The asymmetry with Stripe and Square is visible to anyone who reads the source for ten minutes. The bug class is one of the oldest in the webhook world. The number of duplicate reports is the kind of number that should make triage teams sit up straight and spill coffee on the keyboard.

Same theme as my last post, old assumptions are not holding. If 11 of us can find the same bug in a short window using totally unrelated workflows, then the public disclosure system is leaving real risk on the table. Not in some abstract panel-discussion sense. In the very practical sense that a public payment webhook endpoint trusted unsigned JSON until 1.10.0.5.

If you run a site using WPForms PayPal Commerce, update to 1.10.0.5 or later. Honestly, update to the latest version. Then look at your payment logs, Look for weird PayPal status transitions. Look for completed or denied events that do not line up with PayPal's side. If you do not log webhook headers, start now. And if you are a security researcher who already found this and never reported it because you assumed someone else would, well. You were right as Ten other people did still Report the next one.

If you are still reading this, you are awesome. Thanks for sticking with me.

---

related posts:

- [the 90 day disclosure policy is dead](https://blog.himanshuanand.com/2026/05/the-90-day-disclosure-policy-is-dead/) (the framing post for this one)

references:

- [CVE-2026-4986](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2026-4986)
- [WPScan advisory: WPForms Lite < 1.10.0.5 - Unauthenticated PayPal Webhook Forgery](https://wpscan.com/vulnerability/1d99eed6-9a16-4d5a-90f9-ab604dfd5b92/)
- [WPForms changelog](https://wordpress.org/plugins/wpforms-lite/#developers)
- [PayPal webhook signature verification docs](https://developer.paypal.com/api/rest/webhooks/rest/#link-verifywebhooksignature)

If any of this resonated, hit me up on Twitter/X ([https://x.com/anand_himanshu](https://x.com/anand_himanshu)). If you disagree, especially hit me up.

Thanks for reading.
