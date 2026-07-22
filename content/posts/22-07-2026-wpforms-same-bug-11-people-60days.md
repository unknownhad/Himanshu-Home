---
title: "Reporter 11: 10 people found the WPForms PayPal bug before me (CVE-2026-4986)"
date: 2026-07-22
tags: ["security", "wordpress", "webhooks", "paypal", "disclosure", "vulnerability-management", "blog"]
author: "Himanshu Anand"
draft: false
---

## TLDR

WPForms Lite is a WordPress form plugin with **5 million plus active installations**. Public advisory data identifies versions **1.10.0.1 through 1.10.0.4** as affected by **CVE-2026-4986**: the PayPal Commerce webhook processed incoming events without first verifying that PayPal actually sent them.

In my local lab, a forged event could change the state of a matching payment record. A forged `PAYMENT.CAPTURE.COMPLETED` event could mark a matching pending transaction as completed and trigger downstream payment-completed actions. A forged `PAYMENT.CAPTURE.DENIED` event could mark a matching transaction as denied.

That is the kind of bug where the database starts telling a story that PayPal never actually told.

WPForms fixed the issue in **1.10.0.5**. The 5 million plus number is the plugin's reach, not a claim that 5 million sites were exploitable. Exposure depended on running an affected version and using the PayPal Commerce path. Please do not turn an install count into a casualty count. Cybersecurity already has enough dramatic arithmetic.

I independently found and reported the issue, but I was not the first researcher. The public advisory credits **Sudhanshu Chauhan of RedHunt Labs**, and the response to my submission told me I was **reporter number 11**.

I was very late to the party. The snacks were gone. The CVE was already being prepared. Ten researchers were inside asking whether anyone had validated the webhook signature.

## where this post fits

If you read [my earlier post on the death of the 90 day disclosure policy](https://blog.himanshuanand.com/2026/05/the-90-day-disclosure-policy-is-dead/), you saw story one: I found a bug, sent it in and the triage team replied, "you are reporter eleven".

I left the technical details vague because I did not want to accidentally turn my blog into a free exploit feed. Rude to users, generous to attackers. Bad trade.

The issue has now been patched, the public records exist and users have had time to update. So this is the technical epilogue I promised: the bug, the patch, the duplicate reports and the uncomfortable question hiding behind reporter number 11.

I am calling it an epilogue because another article in this series already called itself the "final" post. Apparently my blog series has the same relationship with the word final that software projects have with `final_v2_really_final.zip`.

## the story (the one I hinted at)

Late April 2026. I was poking at WordPress plugins and looking specifically at payment integrations.

Payment code is interesting audit territory because the security cost of a bug can be real money, the attack surface is often public and developers have to glue several third-party systems together without dropping one tiny, extremely important check on the floor.

WPForms is one of the biggest form plugins on WordPress, so I assumed the code would be well audited.

Mostly.

Mostly is doing a lot of work in that sentence.

I opened the PayPal Commerce integration folder and searched for `permission_callback`. In a WordPress REST route, that is the part that answers a useful question: “Who is allowed to hit this endpoint?”

Within about 90 seconds, I found this:

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

`permission_callback => '__return_true'` means the endpoint is publicly reachable. That is not automatically a vulnerability. Webhook endpoints have to be public. PayPal cannot log in to your WordPress site, complete a CAPTCHA and whisper "please process my payment" into `wp-admin`.

The security question is what happens **after** the request arrives.

I followed the callback. The handler read the raw request body, decoded the JSON, checked the event type against an allowlist and sent the payload to the relevant event handler.

In the affected versions, I could not find the step that established that the request had actually come from PayPal before the event was processed.

No validation of PayPal's transmission signature. No verification callback to PayPal before processing. No meaningful rejection path for a completely unsigned request.

The endpoint was basically saying:

> If you can spell `PAYMENT.CAPTURE.COMPLETED`, please come in. The money room is to your left.

I built a curl request and tested it against a local installation I controlled. It worked on the first attempt. The matching payment record changed state and the payment-completed side effects ran.

Well, cool in the very specific security-research sense where "cool" means "I now have paperwork and somebody else has a patch to write."


The triage reply on my report.

They already knew. The first report had arrived weeks earlier and mine was report number eleven.

![reporter 11 of 11](https://blog.himanshuanand.com/images/11_submittions.png)

*the moment you realise 10 other people beat you to the same bug. yes, I screenshotted it. yes, it stings. and yes, this is the exact bug behind the story in my previous post.*

There was one more correction I had to make. My first mental mapping connected this behavior to **CVE-2026-40764**, a separate CSRF issue fixed in 1.10.0.3. That was related only in the broad "payment integration security went sideways" sense. It was not the public record for the webhook-forgery behavior I reproduced.

The payment-state issue discussed in this post is publicly tracked as **CVE-2026-4986** and fixed in **1.10.0.5**.

The corrected timeline is:

- WPForms introduced PayPal Commerce in **version 1.10.0 on March 17, 2026**.
- Public CVE data identifies **1.10.0.1 through 1.10.0.4** as affected by CVE-2026-4986.
- CVE-2026-40764 was a separate CSRF issue affecting earlier releases and fixed in 1.10.0.3.
- WPForms **1.10.0.5**, released on May 12, 2026, fixed the webhook-authentication issue.
- **CVE-2026-7792** separately describes forged PayPal subscription-state events through the same broad unauthenticated webhook trust boundary.

The feature-introduction version and the published affected-version range are two different facts. I am keeping both explicit instead of asking the CVE spreadsheet goblin to infer one from the other.

> **Public-record note:** This article focuses on the payment-state behavior tracked as CVE-2026-4986. CVE-2026-7792 separately describes subscription state manipulation through the PayPal Commerce webhook path. CVE-2026-48835 is a broader broken-access-control record fixed in 1.10.0.5 but its public description is too sparse for me to map confidently to the exact behavior in this post. Three CVEs walked into one webhook path and made everyone do extra paperwork.

This is the part where I tap the sign:

> Always re-check the final advisory before publishing. The CVE spreadsheet goblin is not your QA team.

## quick refresher: what a webhook is and why it needs a signature

If you write webhook handlers for a living, you can skip this section and spend the saved time checking one of yours.

For everyone else: a webhook is an HTTP callback. Service A wants to tell Service B that something happened. PayPal wants to tell WordPress that a customer paid, a payment failed or a subscription changed.

The slow way would be for WordPress to keep asking PayPal, "did anything happen yet?" every few seconds. That is polling. It works, but it has the energy of a child asking "are we there yet?" for the entire drive.

The smarter pattern is for PayPal to call WordPress when something happens.

The mechanics are simple:

	1. WordPress exposes a URL.
	2. PayPal sends an HTTP POST request to that URL.
	3. The request body describes the event.
	4. WordPress verifies it, processes it and returns a response.

The problem is that the URL has to be reachable from the internet. If WordPress trusts whatever appears at that URL, anyone can pretend to be PayPal.

That is why providers document ways to verify webhook authenticity. PayPal documents two broad approaches: verify the transmission cryptographically using the delivery headers or send the event details back to PayPal's `verify-webhook-signature` endpoint for verification.

Other providers use the same security idea with different packaging. Stripe uses a `Stripe-Signature` header and Square uses its own HMAC signature. Different logos, same rule:

> If you do not verify, you do not trust.

A webhook handler without authenticity verification is just a public API endpoint that changes state while wearing a payment-provider name badge.

Here is the whole asymmetry in one picture:

```text
================================================================
  HOW IT SHOULD WORK
================================================================

  [Anyone]    --POST body, no valid proof-->  [Server]
                                                  |
                                                  v
                                             verify sender?  FAIL
                                                  |
                                                  v
                                             reject, no DB change


  [PayPal]    --POST body + valid proof-->    [Server]
                                                  |
                                                  v
                                             verify sender?  PASS
                                                  |
                                                  v
                                             validate fields
                                             update DB
                                             fire hooks


================================================================
  AFFECTED WPFORMS PAYPAL FLOW
================================================================

  [Anyone]    --POST forged JSON-->           [Server]
                                                  |
                                                  v
                                             json_decode( body )
                                             check event_type
                                             check status
                                             check amount
                                                  |
                                                  v
                                             update DB
                                             fire hooks
                                             "congratulations, fake money"
```

The top block authenticates the sender before trusting the story.

The bottom block checked whether the story looked plausible, but not who was telling it.

That distinction is the whole article:

> Payload validation checks whether the story is internally consistent. Signature verification checks who is telling the story.

## the WPForms PayPal webhook in one paragraph

The WPForms PayPal Commerce integration registered a REST route under `/wp-json/wpforms/ppc/webhooks/` with `permission_callback => '__return_true'`. Depending on the configured communication mode, a fallback listener could also reach the webhook-processing path, so this was not just a story about the REST API being public. The handler read the request body, decoded the JSON, checked the event type and dispatched it to a per-event handler. In the affected path I tested, a matching payment record could be updated without the request first being authenticated as a genuine PayPal event.

Public route: normal.

Public route that trusts unsigned payment events: considerably less normal.

## the missing check (the whole bug in six lines, spiritually)

The exact production patch has to handle more than one connection mode, but the missing security boundary can be expressed like this:

```php
$payload = file_get_contents( 'php://input' );

if ( ! $this->verify_webhook_signature( $payload ) ) {
    throw new RuntimeException( 'Webhook signature verification failed.' );
}

$event = json_decode( $payload, false );
```

Authenticate first. Decode and process second.

That is the whole bug, spiritually.

Every check after JSON decoding can test the **shape** of the story. The authenticity check asks **who is telling it**.

## the four checks that looked like security from across the room

When reviewing a path like this, it is easy to find several checks and feel reassured. The handler did validate parts of the event. Those checks were useful, but none of them established that PayPal sent the request.

| Check | What it helped with | What it did not prove |
|-------|---------------------|-----------------------|
| `event_type` allowlist | Limited processing to supported event names. | That PayPal sent the event. The allowed names were readable from the code. |
| Existing payment lookup | Limited changes to a matching transaction or payment record. | That PayPal authorised the change. |
| Status checks | Rejected statuses the handler did not expect. | That the supplied status came from PayPal. Putting `COMPLETED` in JSON is not a security achievement. It is typing. |
| Amount checks | Reduced sloppy or inconsistent forgeries. | That the sender was authentic. A real pending record already contains the amount, and some form prices may be public or inferable. |

These checks constrained the payload. They did not authenticate its source.

![security theater meme: airport screening but they only check your ticket spelling](https://blog.himanshuanand.com/images/airport.png)

*if you have to spell `PAYMENT.CAPTURE.COMPLETED` correctly to forge a payment event, that is not source authentication. that is a spelling bee with financial consequences.*

There is a second trust issue worth calling out. Webhook processing normally happens without a logged-in WordPress user. Downstream payment code may therefore run in a trusted system context or bypass capability checks that would make no sense for a webhook.

That can be perfectly reasonable **after the webhook has been authenticated**.

Without authentication, the path is effectively saying: "No user account? No problem. The JSON has a lanyard."

## proof of concept

I tested only against a local installation that I controlled. The public advisory already contains a minimal request for the denied-payment path, and fixed versions reject unauthenticated events.

I am keeping this at the level needed to explain and reproduce the fixed bug in a lab, not at the level needed to make random WordPress shops have a bad afternoon.

### step 1: confirm that the route exists

```bash
curl -i 'https://TARGET/wp-json/wpforms/ppc/webhooks/?verify=1'
```

That check establishes reachability. It does not prove a vulnerability. A publicly reachable webhook route is expected.

The bug was not:

> the route is public.

The bug was:

> the route is public and then processes unsigned payment events.

### step 2: send an unsigned event to an affected local build

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

That request has no `Paypal-Transmission-Id`, no `Paypal-Transmission-Sig`, no `Paypal-Transmission-Time`, no `Paypal-Cert-Url` and no `Paypal-Auth-Algo`.

A genuine PayPal delivery includes verification material. The affected handler processed the event without first validating that material.

In a separate local test, I exercised the completed-payment path using a matching transaction and amount. The payment record changed state and the downstream completion actions ran.

The important point is the same for both paths: the server accepted the event because the JSON looked internally consistent, not because PayPal had proved it was genuine.

![terminal screenshot of the curl request and the 200 OK response](https://blog.himanshuanand.com/images/response.png)

*the exploit shape in one screen: unsigned request in, accepted response out, no PayPal in the room just vibes and JSON.*

One embarrassing housekeeping note: the HTTP `Date` header visible in this old screenshot does not match the 2026 release timeline. M keeping the original image because it was part of the original write up, but I am not asking anyone to treat that timestamp as evidence. Apparently the lab server also wanted to demonstrate time travel. The request shape is public nd the security claim rests on the code path, the local state change and the advisory not on that header.

## the fallback URL that did not need the REST API

Some WordPress hardening guides recommend disabling unauthenticated REST API access. That can reduce some attack surface, but it is not magic dust.

WPForms also supported a fallback webhook listener for installations using a non-REST communication mode. In the affected code path I reviewed, the fallback reached the same webhook-processing logic and therefore inherited the same missing authenticity check.

That matters because "we disabled REST" is a very common WordPress security blanket. Sometimes the blanket is warm. Sometimes the window is still open.

The lesson is simple: a fallback path needs the same security property as the primary path.

A fallback that skips the primary path's trust boundary is not a fallback. It is a side door with excellent documentation.

## the same plugin got Stripe and Square right

Here is the part that made the PayPal path stand out: in the code I reviewed, WPForms already knew the correct webhook pattern.

Stripe authenticated the incoming event before trusting it. Square used provider-specific signature verification before processing. PayPal was the odd one out.

A simplified comparison looks like this:

```diff
# both paths begin by reading the raw request body
  $this->payload = file_get_contents( 'php://input' );

# Stripe-shaped flow
+ $event = Webhook::constructEvent(
+     $this->payload,
+     $this->get_webhook_signature(),
+     $this->get_webhook_signing_secret()
+ );
+ // invalid signature throws; event processing stops

# affected PayPal-shaped flow
- // no equivalent sender-authentication step here
  $event = json_decode( $this->payload, false );
```

Square followed the same general rule with Square's verification helper: authenticate the provider before trusting the event.

Same project. Same broad problem. Different security boundary.

That kind of internal asymmetry is gold during a code review. It is often the difference between "this project has a deliberate design" and "someone forgot the important line on a Tuesday."

I am assuming oversight here, not a grand philosophical statement about trusting strangers on the internet.

## the patch analysis

WPForms 1.10.0.5 added a verification guard before event decoding and dispatch.

The important shape is:

```php
if ( ! $this->verify_webhook_signature( $this->payload ) ) {
    throw new RuntimeException( 'Webhook signature verification failed.' );
}
```

The real implementation has to account for different connection and forwarding modes, so the production code is more complicated than my six line spiritual patch.


The security property is what matters:

> Unsigned random JSON from the internet no longer gets to change payment state.

The patch did not need a wizard a machine learning model or a blockchain. It needed the webhook equivalent of checking the person's ID before giving them the keys.

## what 10 duplicate reports actually means

According to the triage response, eleven researchers submitted this issue.

That number tells us something precise: independent discovery converged on the same trust failure at least eleven times.

It does **not** tell us how many people found it in total. We do not know the reporting rate. We do not know how many people saw it and moved on, assumed it was already reported, kept it private or chose a less friendly use for it.

I could invent a 50% reporting rate and announce 22 finders. I could invent a 20% rate and announce 55. I am not doing that. Those numbers would be vibes wearing a spreadsheet, and nobody should put them in a Gartner quadrant.

The defensible conclusion is simpler:

> Eleven reports are a lower bound, not the whole finder population.

Now read that with attacker incentives in mind. This was a public payment endpoint. No administrator account was required to reach it. No exotic browser chain. No twelve-step race condition that works only during a solar eclipse.

It was a webhook handler trusting a stranger with a clipboard.

This is the part of the 90-day disclosure model that I keep returning to. The model tends to focus on the time between the first report and the public disclosure. But the risk clock also includes every independent rediscovery after report number one.

By the time I arrived, the same trust boundary had already attracted ten other reports.

If eleven of us reported it, the useful question is not only:

> Why were there so many duplicates?

It is also:

> How many people found it and never joined the queue?

![iceberg meme: 11 reporters above water, unknown attackers and unreported finders below](https://blog.himanshuanand.com/images/iceberg.jpg)

*the 11 visible reporters are above the waterline. below it is an unknown population: people who found the same bug and did something else, or nothing at all. the meme is not a measurement. it is a reminder that the queue only shows the people who entered the queue.*

A duplicate wave is not proof that a vulnerability was exploited. It is evidence that the vulnerability was rediscoverable.

Those are different claims, and both matter.

## lessons for bug finders

For people who do this kind of work, here are the lessons I want to keep in writing.

**Search for `permission_callback` early.** In a WordPress plugin review, it is a productive starting point. `__return_true` means the route does not require ordinary WordPress authentication. Every match deserves a look at what the callback actually does.

**Do not stop at `__return_true`.** Webhook routes are supposed to be public. The question is not merely "can anyone reach this?" The question is "after they reach it, how does the plugin prove they are the provider?" Public route plus signature verification is normal. Public route plus vibes is a bug.

**Look for asymmetries inside one project.** If Stripe authenticates before processing and PayPal does not, that difference deserves attention. The same trick works elsewhere: one download route checks permissions and another does not; one form validates input and its sibling trusts it; one integration rejects replayed events and another accepts them forever. Project-internal asymmetries are gold.

**Audit fallback paths separately.** Plugins love alternate routes, URL parameters, forwarding modes, legacy compatibility layers and emergency side doors labelled "temporary" since 2019. Every fallback needs the same trust boundary as the primary path.

**Do not let the CVE label replace your own verification.** Public records can overlap, change or describe different parts of the same code path. Re-run the original proof of concept against the patched version. The CVE database is useful. It is not your QA team.

**Submit a solid report even when you suspect a duplicate.** I was reporter 11. I will probably receive no public CVE credit and no bounty for being eleventh through the door. That is fine. Another well-supported report is still evidence that independent rediscovery is happening.

Ten researchers were already waving flags. Reporter eleven can still bring a tiny flag and stand next to them.

## lessons for vendors

A few notes for the receiving side.

**Webhook handlers are payment infrastructure. Treat them like it.** A public endpoint that can change payment state or trigger fulfilment actions belongs in the same security conversation as the rest of the payment flow. "It is just a webhook" is how the webhook ends up running the business.

**Build verification once and make it unavoidable.** Every provider integration should pass through a provider-appropriate authenticity check before event dispatch. If a new integration can reach a payment handler without crossing that guard, the design has made the dangerous path too easy.

**Put fallback URLs in the threat model.** REST endpoints, query-parameter listeners, forwarded webhooks and legacy modes should all enforce the same security property. Add negative tests showing that missing, invalid and stale verification material is rejected wherever appropriate.

**Be careful with trusted webhook contexts.** A webhook may need to run without a logged-in user and may legitimately bypass user capability checks. That makes authenticating the entry point more important, not less. Otherwise the trusted context becomes an admin costume for unsigned JSON.

**Re-run the original proof of concept against the patch.** I know this sounds obvious. It remains not obvious enough. A patch that fixes a nearby CSRF condition does not necessarily fix an unauthenticated webhook trust boundary. Test the exact thing the reporter demonstrated.

**Treat duplicate volume as a rediscovery signal.** Eleven reports do not prove exploitation. They do show that multiple researchers could independently find the same flaw. That should increase urgency, not merely increase the size of the duplicate folder.

## final thoughts

Small bug and small patch but the product reach was not small.

That is the horror triangle of WordPress plugin security: tiny mistake, tiny patch, enormous distribution. (Mentally insert Horror meme here)

The important correction to my earlier notes is straightforward. The PayPal webhook forgery issue discussed here was fixed in **1.10.0.5**, and the public record I should point to is **CVE-2026-4986**, not the earlier CSRF CVE.

I am writing that plainly because future me will absolutely forget, open six tabs, become overconfident and try to be clever again.

The larger lesson is reporter number 11.

WPForms had more than 5 million active installations, although that does not mean 5 million exploitable PayPal configurations. The trust failure was in a public payment path. Similar integrations in the same project showed the correct authentication pattern. At least eleven researchers independently submitted the issue.

That is the kind of duplicate count that should make a triage team sit upright and spill coffee on the keyboard.

The old disclosure assumptions are under pressure. When many people can independently find the same bug in a short period, the vendor is not racing only the publication deadline. It is racing rediscovery.

For site owners, the action is simple: update WPForms to the latest available version. Do not stop at 1.10.0.5 just because it is the first fixed release; use the current supported release. Then reconcile suspicious PayPal status changes against PayPal's own records. Look for completed, denied, cancelled or reactivated states that do not line up. If you log webhook headers, preserve them. If you do not, this is a good time to start thinking about it.

For researchers: submit the next one even when you suspect somebody already did.

For vendors: a duplicate is not merely administrative noise. Sometimes it is the sound of the same door being found over and over again.

And if you are still reading this, you are awesome. Thanks for sticking with me through the webhooks, the duplicate queue, the spreadsheet goblin and the time travelling lab server.

What is the highest duplicate count you have seen on a vulnerability report and did it change how the vendor responded?

---

related posts:

- [the 90 day disclosure policy is dead](https://blog.himanshuanand.com/2026/05/the-90-day-disclosure-policy-is-dead/) (the framing post)
- [defender playbook for the LLM era](https://blog.himanshuanand.com/2026/06/defender-playbook-for-the-llm-era/) (the fourth and final numbered post; this article is the technical epilogue because apparently "final" needed a patch release)

references:

- [CVE-2026-4986 : NVD](https://nvd.nist.gov/vuln/detail/CVE-2026-4986)
- [CVE-2026-7792 : NVD](https://nvd.nist.gov/vuln/detail/CVE-2026-7792)
- [CVE-2026-40764 : NVD](https://nvd.nist.gov/vuln/detail/CVE-2026-40764)
- [CVE-2026-48835 : NVD](https://nvd.nist.gov/vuln/detail/CVE-2026-48835)
- [WPScan advisory: WPForms Lite < 1.10.0.5 Unauthenticated PayPal Webhook Forgery](https://wpscan.com/vulnerability/1d99eed6-9a16-4d5a-90f9-ab604dfd5b92/)
- [WPForms changelog](https://wpforms.com/docs/how-to-view-recent-changes-to-the-wpforms-plugin-changelog/)
- [WPForms Lite on WordPress.org](https://wordpress.org/plugins/wpforms-lite/)
- [PayPal webhook verification documentation](https://developer.paypal.com/api/rest/webhooks/rest/)
- [WordPress Trac changeset referenced by CVE-2026-7792](https://plugins.trac.wordpress.org/changeset/3532389/wpforms-lite/trunk/src/Integrations/PayPalCommerce/Api/WebhookRoute.php?old=3486451&old_path=wpforms-lite%2Ftrunk%2Fsrc%2FIntegrations%2FPayPalCommerce%2FApi%2FWebhookRoute.php)

If any of this resonated, hit me up on Twitter/X at [@anand_himanshu](https://x.com/anand_himanshu). If you disagree, especially hit me up. Disagreement with evidence is just peer review wearing casual clothes.

Thanks for reading.
