---
title: "Defender playbook for the LLM era"
date: 2026-06-09
tags: ["security", "llm", "defense", "blue-team", "secops", "ci-cd", "appsec", "blog"]
author: "Himanshu Anand"
draft: false
---

TLDR; Three posts ago I wrote baout house was on fire the most import question arises was what we should do next? The attackers already point LLMs at your code. This post is just: point the same LLMs at your own code first read the headers if you are busy.

---

So far this series has been caffeinated me, telling everyone that the sky is falling. [The 90 day window is dead](https://blog.himanshuanand.com/2026/05/the-90-day-disclosure-policy-is-dead/). [Score bugs by collisions](https://blog.himanshuanand.com/2026/05/score-by-collisions-patch-by-panic/). [I turned five patches into exploits in 30 minutes](https://blog.himanshuanand.com/2026/05/30-minutes-from-patch-to-exploit/) while an LLM did the actual work and I mostly drank coffee.

One question that remains was : *“what do I actually do?”*

This is the post No new architecture (post 2 covered the walls). The first half is the pipeline, the boring CI/CD plumbing that lets you run the attacker’s exact workflow against yourself before they get a turn. And in the second half is who actually does what because the SOC the people signing the budget  and the developer pushing code at 5pm all have a different job here.

Here is the deal with this post: every section is a big heading and two or three lines that is the whole story if you are skimming. If a bit makes you go “wait, how though,” click the box. The details lives in the boxes so the rest of you can keep moving.

## the asymmetry nobody is pricing in[⌗](#the-asymmetry)

![attacker vs defender speed](https://blog.himanshuanand.com/images/buffdoge_attacker_cheems_defender.jpg)

Attackers are automating their side and most defenders have not caught up, which is basically what this whole post is about.

They read your patch diff and have a working exploit before lunch, while you read a mailing list, sigh and open a Jira ticket. Only one of those two workflows is moving at machine speed.

<details>
<summary>show me the actual gap ▾</summary>

Stack the last three posts on top of each other and the picture is grim:

- A public patch becomes a working exploit in minutes ([post 3](https://blog.himanshuanand.com/2026/05/30-minutes-from-patch-to-exploit/)).
- Ten unrelated people find the same bug in six weeks and the unfriendly ones are not on a 90 day clock ([post 1](https://blog.himanshuanand.com/2026/05/the-90-day-disclosure-policy-is-dead/)).
- The advisory tells you the *category* while the diff tells the attacker the exact *payload*.

Now your pipeline: linters on every push, tests on every push, SAST maybe weekly (ignored becasue too noisy??), dependency updates whenever something breaks and patch monitoring done by a tired human reading email.

So the offense is running on automation while the defense is running on that tired human and everything below is about automating the defensive side too, mostly with tools you already pay for.
</details>

## one trick: run the attacker's loop, but inward[⌗](#the-principle)

![same loop, opposite intent](/images/spiderman_same_loop.jpg)

My whole “30 minutes” loop was: grab the diff, ask the model what broke, find the door, write the PoC. Point that exact same loop at *your own* code and voila you got defense.

The five things below are really just that one loop plugged into five different spots in your pipeline, cheapest spot first.

<details>
<summary>the one rule before you build any of this ▾</summary>

An LLM on its own is a noise cannon. Secon post's “400 false positives for every real bug” complaint is real and I am not going to pretend otherwise.

So every single step below pairs the model with something dumb and deterministic SAST, a test suite, a parser, a diff. The boring tool narrows it down and the model explains the few things that survive. You are not replaceing human reviewer here just trying to hand them a short list of the ten things actually worth looking at each morning.
</details>

## 1. review at push time, not “audit season”[⌗](#1-review-at-push-time)

The cheapest bug is the one that never merges. A finding caught in a PR just costs a comment, while the same bug after a CVE drops costs an incident bridge and maybe apology emails to customers.

Run LLM like a linter, on every diff, automatically, leaving comments, instead of saving it all up for some quarterly audit that everyone dreads.

<details>
<summary>how to wire it without going insane ▾</summary>

- **Feed it the diff, not the whole repo.** Reading your entire tree on every push is slow, expensive and noisy. Give it the diff plus nearby context, which is exactly how an attacker reads your patch: they look at what *changed*.
- **Put a deterministic tool in front.** Run Semgrep / CodeQL first to flag candidate lines, then hand only those bits to the model and ask “is this exploitable and how.” SAST drops the noise floor; the LLM murders the false positives SAST is famous for.
- **Output a PR comment, not a dashboard.** An inline comment gets fixed today. A dashboard finding gets a meeting next quarter and then dies.

Mental model: every PR now has a second reviewer who has read every CVE ever filed and never gets sleepy. At times It will get it wrong, but so is your reviewers and we keep both of them around anyway.
</details>

## 2. Read every upstream patch the second it drops[⌗](#2-upstream-patch-analysis)

This is just post 3 held up to a mirror I pulled a public diff and asked “how do I exploit this,” so your pipeline should pull the same diff and ask “am I exploitable and where.”

Same input, model, opposite intent and you get to run it before the attacker finishes theirs. This is the most useful thing on the whole list, so if you only build one of the five, build this.

<details>
<summary>the full flow, step by step ▾</summary>

1. **Watch what attackers watch.** Follow the actual commit log of your critical deps, not only the advisory feed. The Next.js SSRF advisory said “SSRF via crafted WebSocket upgrade requests,” while the *diff* spelled out `GET http://169.254.169.254/...` with upgrade headers. Attackers read `git log` and your pipeline should too.
2. **On every security ish commit, run the analysis.** Pull the diff, ask: what broke, what triggers it, do we touch that path.
3. **Grep your own tree for the same pattern.** This is the step humans skip and the one that pays. The model already gets the root cause, so ask it whether the same shape exists in code *you* wrote. Post 3’s Drupal bug was “user-controlled keys glued into a query.” That pattern lives in a hundred codebases that never heard of Drupal.
4. **Open the ticket pre filled.** Diff, affected file, trigger condition, suggested fix, suggested virtual patch. A human clicks approve nobody starts from a blank page at 2am.

If I can derive a PoC from a public patch in few minutes on a my not so high end laptop, your team can derive the *defensive* version in the same time, automatically, every time a dependency ships a fix.
</details>

## 3. scan dependencies continuously, not on vibes[⌗](#3-dependency-scanning)

Post 2 said “stop `npm update` on autopilot.” This is the robot version of that discipline.

Your code is yours, but your dependencies are not and their transtive dependencies are basically strangers you invited straight into production. So watch them like you would watch any stranger you let into the building.

<details>
<summary>what continuous actually means here ▾</summary>

- **Continuous, not weekly.** A weekly scan means up to seven days between a poisoned package landing and you noticing. In a 24 hour exploitation world, weekly is basically never.
- **Triage the diff, not the version number.** “4.1.2 → 4.1.3” tells you nothing. Feed the model the actual changelog and diff and ask: feature, fix or does this smell like a backdoor. The next compromised package will look exactly like a normal patch release.
- **Trace whether you even call it.** Old scanners scream because a vulnerable version *exists* in your lockfile. The useful question is whether you actually hit the vulnerable path. The model answers that and turns a 200 line scanner tantrum into the three findings that can actually hurt you.
</details>

## 4. attack your own patch before you ship it[⌗](#4-patch-validation)

This is the genuinely scary one from post 3, flipped. An LLM turned my reading of a patch into an exploit in minutes. So before you publish a fix, send that same devil after yourself.

If it still gets through, your patch is incomplete. Better to hear that from your pipeline than from a “lol bypassed” reply the morning after.

<details>
<summary>the three questions to ask your own fix ▾</summary>

- **Does the fix actually fix it?** Tell the model to attack the patched code the way it would attack the unpatched code. If it still finds the door, you are not done.
- **Write the regression test from the bug.** The model just understood the root cause, so make it write the test that would have caught it. Vercel literally shipped the PoC *inside the test file* for the SSRF. Right instinct, make it standard, let the machine write it.
- **Find the same bug elsewhere before you announce.** The most valuable question after any fix: “where else does this pattern live.” Attackers will ask it about you the second your patch is public. Ask first, fix all of them in one go, not one embarrassing CVE at a time.
</details>

## 5. let the diff write your WAF rule[⌗](#5-virtual-patching)

![Virtual patching is a tourniquet, not a cure](https://blog.himanshuanand.com/images/bandaid_bullet_wound_waf.jpg)

Post 2 said pre build virtual patching and post 3 teased deriving a WAF rule in the same five minutes as the PoC and this is where those two ideas meet.

When you can’t ship a code fix in four hours, you need a rule at the edge that buys time and the same diff that hands an attacker the payload also hands you the signature to block it, which is about the cheapest tourniquet you will ever get.

<details>
<summary>from diff to edge rule ▾</summary>

- **Diff → trigger → rule.** The Next.js `Next-Resume` DoS fix was literally “strip a header.” You can do that at the edge in seconds, no deploy, no maintenance window. The model reads the diff and drafts the exact WAF rule or header strip.
- **Plug it into the post-2 zero-day playbook.** You already decided who writes the rule during an incident. This just means they start from a generated draft instead of a blank wirefilter box at 3am.
- **It is a tourniquet, not a cure.** It buys the hours you need to ship and test the real fix from step 4 Do not move in.
</details>

## the whole thing, one loop[⌗](#the-pipeline)

Stack the five and you get a defense that finally moves at offense speed:

1. Code gets written → LLM reviews the diff at push time.
2. A dependency ships a patch → pipeline reads it, greps your tree, files a pre filled ticket.
3. You write the fix → AI attacks your own patch and writes the regression test.
4. You can’t deploy in four hours → pipeline drafts the WAF rule from the diff.

Every one of those is the 3rd post workflow pointed inward and set to run on a timer. None of this is hard technically, the hard part is just committing to run the attacker’s playbook against yourself, on a schedule before they do.

So far this has all been pipeline talk, which is great if you own the pipeline. Most of us do not. So here is the same fight, broken down by who you actually are when you read this.

## if you run the SOC[⌗](#if-you-run-the-soc)

You are already drowning in alerts and I am not about to tell you to stare at more dashboards. The LLM goes on the *triage* side, doing the first pass so a human only sees the handful that matter.

The same diff your dev team turns into a WAF rule, you turn into a detection. When a patch drops do not just block it, write the alert for the exploit too.

<details>
<summary>where the LLM actually helps a tired analyst ▾</summary>

- **First-pass triage.** Point the model at the alert queue to enrich, dedupe and group, then surface the ten things worth a human eyeball this shift. Same “ten things before coffee” idea from the dev side, just aimed at alerts instead of pull requests.
- **Detection from diffs, not just blocks.** Step 5 above turned a patch diff into a WAF rule and you take that same diff and generate the Sigma / Suricata / EDR detection for the exploit attempt. The advisory says “SSRF via WebSocket upgrade,” while the diff gives you the exact bytes to alert on.
- **Threat intel that maps to your environment.** Paste a report or an IOC dump, ask the model for pivots and whether anything matches assets you actually run. Turns a 40-page report into “these three things touch us.”
- **Same warning as everywhere else.** It drafts the detection and triages the queue, but a human still approves the auto-isolate before it quarantines a prod box or pages the on call at 2am.
</details>

## if you sign the budget[⌗](#if-you-sign-the-budget)

You cannot buy your way out of this with one tool and nobody on your team can build any of the above if the org still treats “critical” as a next-sprint problem. Your job is the SLA and the rails, not the YAML.

The clock starts ticking the moment a report lands, not when triage finishes. If that sentence makes your stomach drop, that is the work.

<details>
<summary>the four things only leadership can change ▾</summary>

- **Redefine the critical SLA in hours, not sprints.** Post 1 made this case: treat every critical issue as P0 and start the clock when the report arrives. CISA gave federal agencies days for the Drupal SQLi your internal cycle has to beat the people who already weaponised the diff.
- **Fund the boring rails.** Fast patching is a fantasy without canary deploys, auto-rollback and feature flags. Engineers cannot ship a fix in four hours on a pipeline that takes six. Pay for the rails before the incident, not during it.
- **Measure 'mean time to patch' against attacker speed.** Microsoft saw Dirty Frag in the wild within 24 hours. If your MTTP is measured in weeks, you are tracking the wrong number against the wrong opponent. Put it on a dashboard you actually look at.
- **Don't treat researchers as a nuisance.** Shorten your disclosure window, reward reports that ship a patch and do not punish the person who told you the building is on fire. The friendly finder is the cheapest security team you will ever have.
</details>

## if you push the code[⌗](#if-you-push-the-code)

Good news: you do not need a platform team or a budget meeting to start. You can run this entire loop on your own laptop this afternoon.

Run the review on your own diff before you open the PR and stop running `npm update` like it is a slot machine.

<details>
<summary>what you can do today, alone, for free ▾</summary>

- **Review your own diff before you push.** Same loop as step 1, just run by you, before the PR exists. Catch it before a reviewer, or an attacker, ever sees it.
- **Read the diff of a dependency bump, not just the version.** Post 2’s “stop `npm update` on autopilot” is your rule too. A model can read the changelog and the actual code change and tell you if a patch release smells like a backdoor.
- **After you fix a bug, grep for it everywhere.** The most useful question you can ask after any fix: where else does this exact pattern live in my code. Ask it before you announce, because the attacker asks it the second your patch is public.
- **If it is open source, send a patch with the report.** Post 2 and Linus both made this point. A report with a patch attached gets fixed faster every single time, and a blank page helps nobody.
- **Patch your own stuff fast and assume the worst.** The moment an upstream patch ships, assume the exploit already exists. Your monthly update habit is now a 30 day open door.
</details>

## what this does NOT fix (because I am not selling anything)[⌗](#what-this-does-not-fix)

A robot reviewer will not save you on its own, so here are three limits before you @ me about it.

<details>
<summary>the limits ▾</summary>

- **A little Noisy** Without a deterministic tool in front, you can drown. Every step above assumes SAST / tests / parsers do the first pass.
- **Still needs the humans.** Third post's middleware bypass needed me to understand deployment modes the model could not guess. Secon post's Orange Tsai point stands, the top of the pyramid is human. This eats the *bottom* of the pyramid, which is exactly the part attackers automated first.
- **Fast analysis dies without fast rails.** If your deploy takes six hours and has no kill switch, all this speed evaporates at the deploy step. Build canary, auto rollback, feature flags, blue-green *before* the incident.
</details>

## final thoughts[⌗](#final-thoughts)

![Virtual patcing is a tourniquet, not a cure](https://blog.himanshuanand.com/images/predator_handshake_same_llms.jpg)

The whole series really comes down to the fact that the offense automated and the defense mostly did not and the 90 day window broke because finders got cheap and exploits got fast. Wishing the LLMs away is not going to work because they are not leaving, so the move is to drag them onto your side of the line and put them in your pipeline, pointed at your own code, running on every push and every upstream patch.

The same wave that broke the old model is also the only thing fast enough to keep up with it on defense. Whether you are triaging alerts, signing the budget, or pushing code at 5pm, the attackers are already running this loop against you, so the only real question left is whether you run it against yourself first.

If any of this resonated, [hit me up](https://x.com/anand_himanshu). If you think I am wrong, *especially* hit me up. The whole point of writing this stuff is to get holes punched in it before an attacker does.

Thanks for reading, If you made it through all four posts you are genuinely awesome.

---

*This is the fourth and final post in the series. Previous:*

- [the 90 day disclosure policy is dead](https://blog.himanshuanand.com/2026/05/the-90-day-disclosure-policy-is-dead/)
- [score by collisions, patch by panic](https://blog.himanshuanand.com/2026/05/score-by-collisions-patch-by-panic/)
- [30 minutes from patch to exploit](https://blog.himanshuanand.com/2026/05/30-minutes-from-patch-to-exploit/)
