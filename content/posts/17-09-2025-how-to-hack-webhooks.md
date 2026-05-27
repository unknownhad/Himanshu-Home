---
title: "A step by step guide how to hack webhooks"
date: 2025-09-17
draft: false
tags: ["security","webhooks","threathunting","bugbounty"]
author: "Himanshu Anand"
description: "Practical guide for hunters and defenders: hunting webhooks, detection, PoC examples and mitigations."
---

A step by step guide how to hack webhooks  
kinda

this is a crossover post between threat hunters and bug hunters. at the end of the day it is all about hunting.

this post will talk about hunting and threat hunting using webhooks

for those who don't know what webhooks are: webhooks are an easy way to send messages from one service to another. they are simple HTTP callbacks that notify endpoints when events happen

## How bad guys can abuse webhooks
Webhooks are convenient for automation. bad actors love convenience too. here are common ways webhooks become an attack surface

1) Attackers can use webhooks to exfiltrate data to their servers  
If a webhook URL leaks publicly other people can spam the receiving servers. what's the worst that can happen from spamming servers right? overload data leakage or workflow abuse

2) Webhooks mistakenly trusted by backend systems can be a gateway into business logic  
If a backend trusts incoming webhook calls without proper verification attackers could trigger actions that should be protected. this is not always a flashy RCE exploit many times the damage is business logic abuse

3) Pipeline webhooks can reveal internal build or deployment workflows  
A webhook used to trigger a CI pipeline can hint at how a company deploys code. with that context you can look for weak spots like unsafe handling of inputs naive template rendering or backend endpoints that echo back unvalidated data

Combine this with an email analogy  
A leaked webhook can act like a gateway into a company. attackers can spam webhooks and cause phishing style flows without even sending email. the attack might be blind at first because you do not know how the backend is implemented however if you find the webhook in context on a website the surrounding code or assets may reveal enough to make a focused higher impact test possible

## Real world examples
I have seen ecommerce sites use webhooks for order notifications. when implementations assume the webhook is authoritative there can be business logic abuse. conceptually you could cause an order to appear to be paid if the system trusts the webhook to confirm payment. if the backend cross checks payment status then there is no issue. if the site relies solely on the webhook then fulfillment might happen without payment
(most modern systems cross-validate payment status)

the devil lies in the details of how webhooks are implemented. small differences in timing verification or workflow ordering change the impact dramatically

## Hunting webhooks in the wild
This part is the fun bit for threat hunters. you can use internet search engines that index web assets to find webhook endpoints living publicly. as an informal check i ran a quick search on FOFA and found thousands of results for discord and slack webhook patterns. that shows how many webhooks leak into public indexes

![Fofa Search for Slack webhook](/images/slack-webhook.png)

![Fofa Search for Discord webhook](/images/discord-webhook.png)

Keep in mind public counts are a signal not a final verdict. many results will be benign or intentionally public. use additional context to prioritise targets such as where the webhook appears what page triggers it and whether the surrounding code reveals internal workflows

## From a pentester and bug hunter perspective
When you find a webhook used to trigger a pipeline that alone is a useful hint. that hint can lead to blind code injection reflected XSS or other issues depending on how the pipeline uses data. sometimes it is low noise and high payoff. kinda fun right

for bug bounty submissions you often need to show impact not just possibility. many webhook issues are out of scope for a program so be clever in demonstrating a realistic impact. show how the webhook maps to a meaningful business function. provide a proof of concept that respects program rules and follows responsible disclosure

### Threat model and scope
Explicitly state what you are testing: public webhook URLs found in code repos pages or search indexes versus internal webhooks discovered by credential leakage. this clarifies whether an action is discovery only or active testing

### Timing and ordering issues
Note race conditions where webhook fires before payment confirmation or where webhook ordering can be abused to replay or reorder events. recommend idempotency tokens and status checks

### Telemetry and detection
List concrete signals defenders can add to logs: source IPs user agents request body hashes timestamp headers signature headers response status codes unusually high delivery rates. add SIEM alert examples

### How to find webhooks reliably
Search patterns credentials scanning repository history look for hostnames like `hooks.slack.com` `discord.com/api/webhooks` `discordapp.com/api/webhooks` `*.webhook` check JS embedded in pages network calls visible in browser devtools and use git secrets scanning

### Mitigations summary (quick)
Rotate webhook URLs and secrets enforce HMAC signatures and timestamp checks add IP allowlists when possible require secondary confirmation for financial actions add rate limits log deliveries with request ids

## Detection rules and examples
Simple regex to detect typical webhook URLs in code or logs

- Slack pattern: `https?://hooks\.slack\.com/services/[A-Z0-9]+/[A-Z0-9]+/[a-zA-Z0-9_-]+`  
- Discord pattern: `https?://(canary\.)?discord(app)?\.com/api/webhooks/\d+/[A-Za-z0-9_-]+`

SIEM rule idea  
Trigger when outbound POSTs to known webhook hosts exceed baseline by X within 5 minutes or when same webhook receives more than N deliveries from diverse source IPs within T minutes

## Safe curl examples
The examples below show how to send benign messages to incoming webhook endpoints. replace `WEBHOOK_URL` with the webhook you control or a test webhook belonging to you. Do not send tests to other people systems

### Slack incoming webhook simple message
```bash
# replace WEBHOOK_URL with your slack incoming webhook URL
curl -X POST "WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text":"test from security research safe PoC only. do not run on other people systems."}'
```

### Slack advanced block payload
```bash
curl -X POST "WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "blocks": [
      { "type":"section", "text": { "type":"mrkdwn", "text":"*PoC* webhook delivered by security test" } },
      { "type":"context", "elements":[ { "type":"mrkdwn", "text":"id: poc-2025-09-17" } ] }
    ]
  }'
```

### Discord incoming webhook simple message
```bash
# replace WEBHOOK_URL with your discord webhook URL
curl -X POST "WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{{"content":"safe PoC message from security researcher. only run on your own webhooks."}}'
```

### Discord embed example
```bash
curl -X POST "WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "username":"PoCBot",
    "embeds":[
      {
        "title":"PoC Delivery",
        "description":"This is a safe test embed. id: poc-2025-09-17",
        "footer":{"text":"do not test on production without consent"}
      }
    ]
  }'
```

## Quick defensive checklist
- Treat webhook URLs as secrets do not embed them in client side code  
- Verify signatures when supported and enforce timestamp checks  
- Rotate secrets and revoke leaked URLs immediately  
- Use idempotency tokens and require secondary checks for financial flows  
- Rate limit and monitor webhook traffic and add alerts for spikes


document the context where you found the webhook the surrounding assets and the likely workflow. that context often turns a blind guess into a reproducible finding
