---
title: "Typosquat Detective : a tiny game to train your eye"
date: 2025-09-10
draft: false
tags: ["security", "phishing", "typosquatting", "punycode", "nodejs", "supply-chain"]
categories: ["Security"]
description: "A 2-minute browser game to practice spotting typosquatted domains numbers for letters, Unicode homoglyphs and Punycode."
---

In light of recent **npm/Node.js supply-chain news**, I am resurfacing a small game I built: **Typosquat Detective**.  
It’s a quick way to practice spotting look alike domains that phishers love.

**Play it here → <https://typo.himanshuanand.com/>**

## What you will practice (in ~2 minutes)

- **Numbers-for-letters** like `1 ↔ l`, `0 ↔ o`, `5 ↔ s`
- **Unicode homoglyphs** (Cyrillic/Greek letters that look Latin)
- **Punycode** tricks (`xn--...` style domains)

## How it works
- You will see a domain. Decide **Typosquatted** or **Real**
- 10 quick rounds, bonus for streaks

## Try it inline
> If your browser/theme blocks iframes, just use the link above

<div style="border:1px solid rgba(255,255,255,.15); border-radius:12px; overflow:hidden; background:#000; aspect-ratio:16/9; max-height:720px;">
  <iframe
    src="https://typo.himanshuanand.com/"
    style="width:100%; height:100%; border:0; background:#000;"
    loading="lazy"
    referrerpolicy="no-referrer"
    sandbox="allow-scripts allow-same-origin allow-forms"
    title="Typosquat Detective">
  </iframe>
</div>

## Why now?
Supply chain incidents and domain look-alikes often go hand in hand. Training your eye to catch subtle domain tricks is a simple layer of defense for users, developers and maintainers are alike.

If you want to add levels/brands or peek at the code, ping me I am happy to extend it.

**Play & share your score:** <https://typo.himanshuanand.com/>
