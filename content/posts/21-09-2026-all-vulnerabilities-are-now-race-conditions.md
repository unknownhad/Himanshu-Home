---
title: "all vulnerabilities are now race conditions"
date: 2026-09-21
draft: false
tags: ["security", "bug-bounty", "llm", "disclosure", "vulnerability-management"]
author: "Himanshu Anand"
---

## TLDR

AI made finding bugs cheap. It did nothing to make getting paid for them any easier. The same bug now gets found by ten different people inside a fortnight. One of them collects the money. The other nine collect a polite duplicate notice and a dent in their platform reputation. The programmes are drowning too. That is why curl shut down its entire bounty operation in January 2026, after fewer than one submission in twenty turned out to be real. The ceiling is also lower than most people assume. In September 2026 a team proved they could reach OpenAI's internal monorepo and were paid $6,500 for it. And the underlying bug often sits unpatched the whole time, because telling someone you already know about a problem is an inbox status, not a fix.

If you run a security programme, the thing to worry about is not the annoyed researcher. It is what happens to a working exploit once the legitimate buyer stops being the best buyer.

---

## first, a story about a delete button

I once reported a bug that let one person delete another person's data. The security term is **arbitrary delete**. In plain English, press the right buttons, send the right request, and something that is not yours disappears.

I wrote it up the way you are supposed to: steps to reproduce, the exact request, the evidence, a clear explanation of who gets hurt. The person triaging it asked for a video. So I recorded myself deleting a thing, to prove that the delete button deleted the thing.

> At that point I was no longer sure whether I was reporting a vulnerability or auditioning for a Netflix documentary.

![Netflix continue watching screen captioned: bug bounty triage, after the written report, the screenshots, the raw HTTP request and the reproduction steps](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/continue-watching.jpg)
*Bug bounty triage, after the written report, the screenshots, the raw HTTP request and the reproduction steps.*

I am not telling that story because it was unusual. I am telling it because it was ordinary. The hours it ate are the thing really being traded here, not the bug.

## my scoreboard, since we are being honest

Over the years I have sent more than 50 vulnerability reports through HackerOne. Twenty-three came back marked duplicate. Five were accepted as valid. Most of the rest were closed as Not Applicable.

| stage | count |
| --- | --- |
| submitted | 50+ |
| duplicate | 23 |
| not applicable | most of the rest |
| valid | 5 |

![HackerOne reports dashboard filtered to Closed and Duplicate, showing the saved view holding twenty-three duplicate reports out of sixty-three total. The report list itself is redacted](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/h1-duplicates.png)
*The same thing on HackerOne: a saved view filtered to Closed → Duplicate. Report list redacted; the count is the point.*

Then there was 5 August. I sent six reports to Google in one day and every one came back a duplicate, three of which I had rated critical.

> **being fair about this**
>
> A duplicate verdict does not mean Google agreed with my severity rating. It means someone else had already told them, and the critical rating was mine, not theirs. I am not claiming I was robbed. I am claiming something more boring and more important: six pieces of real work produced nothing, purely because of timing.

![Google Bug Hunters dashboard showing six reports submitted to Google VRP on 5 August 2026, every one of them closed with the status Duplicate. Report titles and reporter identities are redacted](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/google-duplicates.png)
*Six reports to Google VRP, submitted on 5 August 2026 and closed as Duplicate. Titles and other reporters' identities redacted.*

People outside security find this strange when I explain it at a party. The bugs were real, the work was real, the hours came out of real evenings. The payment was the only theoretical part of the whole arrangement.

## how bug bounty actually works, in normal words

If you have never done this, the model fits in one paragraph.

A company puts up a poster. Find a security hole in our product, tell us privately instead of abusing it, and we will pay you. So you go looking on your own time, with your own gear, at your own risk. Find something that qualifies, prove it, and get there before anyone else, and you get paid. Otherwise you get nothing.

This is a bounty in the old Wild West sense, not a job and not a contract. Obvious enough, until you follow it through to the money.

> "Earn up to $50,000" is the advertisement. The chance of getting paid at all is the business model.

That distinction carries the whole article, so sit with it for a second. A company that hires a penetration tester pays for the *search*. The tester gets paid whether or not that week turns up anything alarming, because the company is buying time and expertise. A company that runs a bug bounty gets the researchers to fund the search themselves and only pays for the winning result. Everyone else works for free and finds out afterwards.

That worked fine while finding a good bug stayed hard and rare. Both of those have changed.

## I was never a big fan of bug bounty

My bias, up front: I have never been a bounty hunter in any serious sense, and the reason was money, not ethics.

I did not wake up, pick a public programme and spend a week fighting for its reward pool. Almost every report I have filed came from tripping over something during other research and thinking someone ought to know. Finding a bug first and then checking whether a bounty exists is a different activity from building your income around being first.

I am not alone in the discomfort. LiveOverflow, one of the most watched security educators on the internet, put it like this back in 2021:

![LiveOverflow tweet saying he is not a huge fan of bug bounties and criticises the exploitation of labor at scale, while still standing with HackerOne and the triagers](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/tweet-liveoverflow.png)
*[LiveOverflow, 26 September 2021](https://x.com/LiveOverflow/status/1441939484535361537)*

Read that second sentence. He criticises the labour model and defends the triagers in the same breath. Both are true. Programmes can push the cost of searching onto unpaid strangers, and those same programmes can be buried under garbage reports. Neither fact cancels the other.

### but if you are starting out, go hunt anyway

None of this means bug bounty is bad for everybody. If you are learning offensive security, it is one of the best classrooms there is. Legal targets, real production software instead of a lab with the answers in the back, practice writing for an audience that pushes back, and something concrete to show an employer. One valid report teaches you more than a month of tutorials.

Plenty of people have made serious money and built careers, companies and reputations out of it. That is real. It is also the most visible part of the market, which makes it a terrible guide. Leaderboards show you the winners and their payouts. They never show the unpaid evenings, the duplicates, the rejected reports, the abandoned leads, the tooling bills, or the third video recorded for a triager who never watched the second one.

So my position has never been that bug bounty is a scam. It is that **it makes a very good apprenticeship and a very poor salary**, and AI has made the salary part worse.

## the maths nobody prints on the poster

AI has made parts of this work cheaper. It reads unfamiliar code, generates test cases, compares responses, explains a protocol you have never touched, and drafts the first version of a report. Work that used to take days can take hours.

That leads to a reasonable assumption: if researchers can find bugs faster, researchers should earn more. But a bounty pays whoever arrives first, not by the hour.

Say a target gives you a one in five chance at a $1,000 bounty.

> **20% × $1,000 = $200 expected return**

Now add the crowd. Same bug, same reward, but AI tooling has brought four times as many people to the same surface, so your chance of being first drops to one in twenty.

> **5% × $1,000 = $50 expected return**

The poster still says $1,000. Your actual business just lost three quarters of its revenue and nobody sent a memo. Those percentages are illustrative, not measured, but the direction is not in dispute, and the rest of this article is the evidence.

There is a second squeeze under the first. AI shortens the *finding*. It does not shorten the proving, the writing, the screenshotting, the video, the back and forth with triage, or the appeal you file when someone closes your report as Not Applicable. Saving an hour on discovery does not help much when you then spend three more explaining why deleting another user's data is a security problem.

![Three Spider-Men pointing at each other, labelled three researchers, three AI subscriptions, one vulnerability and one bounty](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/spiderman-duplicate.jpg)
*Three researchers, three AI subscriptions, one vulnerability, one bounty.*

## "sounds like a you problem"

The easy way to dismiss all of that is to assume I am just slow. So let us leave my anecdotes and look at what other people have said on the record, with dates.

### the triagers see the wave

In April 2026 a triage engineer who goes by @d0rsky described the pattern from the other side of the desk:

![Tweet from triage engineer d0rsky describing a wave of duplicate reports arriving within days of any new vulnerability being discovered](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/tweet-d0rsky.png)
*[@d0rsky, 5 April 2026](https://x.com/d0rsky/status/2040848736713126365)*

X truncates that one, so here is the rest:

> "It almost feels like: 1/ One person actually finds the issue 2/ Others re-run scans/prompts and 'rediscover' it … What concerns me more, is, if researchers can replicate these findings so quickly, what's stopping blackhats from doing the same before the issue is fixed? Feels like the window between 'first discovery' and 'mass awareness' is getting dangerously short."

That last question is the one I want CISOs to sit with. I will come back to it.

A month later @pyn3rd said the quiet part out loud: AI keeps producing duplicate vulnerability reports over and over, and it has raised the odds of several people reporting the same thing. I replied with the joke that has lived rent free in my head ever since.

![pyn3rd tweets that AI keeps producing duplicate vulnerability reports, attaching a HackerOne message closing a report as a duplicate. Himanshu Anand replies that all vulnerabilities are now race conditions](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/tweet-race-condition.png)
*The whole argument in one screenshot. [@pyn3rd](https://x.com/pyn3rd/status/2057095914138087693) attached a real HackerOne closure notice, the same message I have now collected twenty-three times. [My reply](https://x.com/anand_himanshu/status/2057097135347106047), 20 May 2026.*

That is where the title comes from. The longer I look at my scoreboard the less it reads like a joke. A race condition is what you get when the outcome depends on who arrives first rather than on what anyone did. That is now a fair description of how a bug report gets paid.

### one AI agent, 1,060 reports, 208 duplicates

If you prefer a number to a vibe: XBOW is an autonomous AI pentester that reached the top of HackerOne's United States leaderboard in June 2025. Their own write-up is candid about the volume:

> "XBOW submitted nearly 1,060 vulnerabilities."
>
> "Across all submissions, 208 were marked as duplicates, 209 as informative and 36 as not applicable."

That is roughly a one in five duplicate rate from a *single* automated participant, on top of everything the humans are already sending. XBOW later published a follow-up on the engineering they did just to stop their own system reporting the same weakness twice. It cut their volume by about 30% and removed around 90% of duplicate findings. When a machine has to be taught not to spam the queue, the queue was being spammed.

Now imagine a hundred smaller versions of that, run by people who never built a de-duplication pipeline.

### curl switched the lights off

The bluntest evidence comes from curl, which runs on billions of devices. On 26 January 2026 the maintainer Daniel Stenberg announced the end of its bug bounty:

![Daniel Stenberg's blog post titled The end of the curl bug-bounty, dated 26 January 2026, with a photograph of a pile of money next to a sign reading NO MORE](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/curl-bounty-ends.png)
*"There is no longer a curl bug-bounty program. It officially stops on January 31, 2026." [daniel.haxx.se](https://daniel.haxx.se/blog/2026/01/26/the-end-of-the-curl-bug-bounty/), 26 January 2026.*

This was not a failed programme. Over its lifetime it paid more than $100,000 for 87 confirmed vulnerabilities. Then the signal to noise ratio collapsed under it:

> "Previous years we have had a rate of somewhere north of 15% of the submissions ending up confirmed vulnerabilities. Starting 2025, the confirmed-rate plummeted to below 5%. Not even one in twenty was real."

The cost was not only financial:

> "The never-ending slop submissions take a serious mental toll to manage and sometimes also a long time to debunk. Time and energy that is completely wasted while also hampering our will to live."

Stenberg added a detail that undercuts the comfortable "curl is just popular" explanation: comparable open source programmes such as Ruby, Node and Rails did *not* see the same surge. His theory is uncomfortable and probably right. Money brings in real reports, and it also makes it very cheap to be annoying.

curl was not alone. In a public comment on that announcement, a member of the Apache Logging Services project said they had reviewed 67 submissions since July 2024, half of them in the final two months, and that the committee's consensus was to close the programme by the end of February if adjustments did not work.

| number | what it measures |
| --- | --- |
| **<5%** | of curl's 2025 submissions were confirmed vulnerabilities, down from over 15% |
| **1,060** | vulnerability reports from one AI agent, 208 of them duplicates |
| **15-20%** | of vulnerabilities are independently rediscovered within a year, per Belfer Center research |

### bug collision was always real, long before AI

Researchers at Harvard's Belfer Center studied more than 4,300 vulnerabilities and found rediscovery happens "more than twice as often as the 1-9% range previously reported", with 15% to 20% of vulnerabilities found independently at least twice within a year. For Android, around 20% were rediscovered within 90 days.

That research was published in 2017, before any of this tooling existed. If one bug in five was already being found twice a year when discovery was slow and manual, ask what that number looks like now that anyone with a credit card can point a competent LLM at a codebase.

My scoreboard is not bad luck. It is a collision rate I happened to be standing in front of.

## duplicate is a filing decision, not a security outcome

Here is where this stops being about researcher income and starts being about your organisation.

A duplicate label answers an administrative question: has someone already told us about this? It does not answer the security question: can someone still exploit it?

HackerOne's own documentation defines Duplicate as an issue "already been reported or is otherwise previously known by the customer team". Notice what that leaves out. Nothing about whether the bug has been fixed, or whether it is still live in production this afternoon.

I have written about the extreme version before. In [the 90 day disclosure policy is dead](https://blog.himanshuanand.com/2026/05/the-90-day-disclosure-policy-is-dead/) I reported a serious payment bug and was told I was reporter number **eleven**. Those eleven reports arrived over roughly six weeks, and it was still unpatched when I wrote that post. I published the full technical story later in [reporter 11](https://blog.himanshuanand.com/2026/07/reporter-11-10-people-found-the-wpforms-paypal-bug-before-me-cve-2026-4986/), once it was fixed and the CVE was public.

![HackerOne screenshot showing the report marked as a duplicate of an earlier submission, with eleven reporters on the same issue](https://blog.himanshuanand.com/images/11_submittions.png)
*Reporter eleven of eleven. The bug was still live when I wrote that post.*

It happened again at the other end of the difficulty scale. I independently found a heap corruption bug in KVM that let a guest corrupt host kernel memory, and the reply was the same shape, just with a shorter queue ahead of me.

![Email from the kernel security team saying the issue had already been reported a couple of weeks earlier](https://blog.himanshuanand.com/images/Duplicate_email.png)
*Reporter number two on a VM escape. The full story is in [I found a KVM guest-to-host heap corruption bug and someone else got there first](https://blog.himanshuanand.com/2026/08/i-found-a-kvm-guest-to-host-heap-corruption-bug-and-someone-else-got-there-first/).*

Their answer was that they already knew. The security question was why it still worked. Those are two different conversations, and only one of them protects anybody.

> **11×**: a smoke alarm goes off eleven times. The right response is probably not to mark the last ten as duplicates because you heard the first one.

This is my actual ask of defenders, and it is cheap: **a duplicate count is free threat intelligence that almost nobody uses**. If eleven independent people found the same flaw in six weeks, the eleventh report carries almost no new technical information and a lot of new operational information. The bug is no longer hard to find. That belongs in your prioritisation, not in a closed-tickets metric.

I made the same argument at length in [score by collisions, patch by panic](https://blog.himanshuanand.com/2026/05/score-by-collisions-patch-by-panic/). Short version: if several unrelated people trip over the same thing within days, that collision count is a better severity signal than most CVSS vectors.

## the other side of the desk is suffering too

I want to be fair, because the "greedy companies exploiting hackers" version of this story is too easy and mostly wrong.

A modern report can be cheap to generate and expensive to disprove. AI writes confident, well formatted, entirely fictional vulnerabilities, and someone on a salary then has to read the code, replay the requests, check the logs and prove a negative. curl called it slop and put a number on it. They were right.

![The This Is Fine cartoon dog sitting in a burning room](https://blog.himanshuanand.com/images/thisisfine_kvm.jpg)
*The bug bounty triage queue, 2026.*

**what AI did to researchers**

- discovery got much faster
- far more competition on the same targets
- more duplicates, so lower expected pay
- longer arguments about impact

**what AI did to programmes**

- far more submissions
- more convincing false positives
- much higher triage cost per real bug
- pressure to close the queue fast

Both columns are real and both are getting worse. They feed each other. Overloaded triagers close faster, fast closes produce wrong decisions, wrong decisions produce appeals, and appeals eat whatever time the triager had left.

GitHub's own guidance lands where I do. Automated and AI assisted analysis is a fine starting point, but you are responsible for confirming the finding is real and reproducible before you submit, and unverified automated output is the most common source of invalid reports. That is the correct rule. Researchers who ignore it are the reason curl's programme no longer exists.

An overloaded queue does not make every decision correct, and this is where a real process failure hides. A video helps when timing, motion or a complicated workflow matters. It helps a lot less when it just re-enacts steps already written in the report. One question is worth asking before you demand more evidence:

> What specific uncertainty will this extra evidence resolve?

If nobody can answer that, the request has stopped being investigation and turned into ritual, paid for by someone who is not on the payroll.

### the time I had to film myself attacking a bug bounty platform

My favourite example involves a bug bounty platform itself.

I found a way to delete data arbitrarily on the site. Not a theoretical path, a working one, against the infrastructure of the very company whose whole business is receiving reports like mine. I wrote it up as always: the request, the steps, the mechanism, who it affects.

The triager did not understand the impact. I explained it again, then a third time. Every time the answer was the same. They needed a video.

In the end I asked for explicit permission to demonstrate it, got it, recorded the video, and it was accepted. So, to be fair, I did get through.

But look at what that process was. A written explanation of a destructive bug, from someone who had already proven it, counted for less with the queue than a screen recording. Not because the writing was unclear. Because video is how an overloaded queue turns "I do not follow this" into "fine, approved". The evidence format stood in for understanding the bug.

![A triage requirement reading: a video POC showing the full environment setup and flow and execution of your finding, and clearly showing the initial state versus what the actor was able to achieve](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/video-request-thread.png)
*The standing requirement: a video showing "the initial state vs what the actor was able to achieve", even for a written, already-proven destructive bug.*

## what a wrong N/A actually costs a researcher

Most people outside bug bounty do not know this part, and it is the part that turns a triage mistake into a career problem.

- **duplicate**: already reported or otherwise known by the customer team, which says nothing about whether it has been fixed.
- **informative**: valid information that does not require action.
- **not applicable**: no valid reproducible issue and no demonstrated security impact. The one label that records your work as simply wrong.

Which brings me to the report I did *not* record a video for.

On an earlier finding, I had something that could take infrastructure down. When the triager asked for a video of it happening, I refused.

I refused because filming it would have meant degrading a live service. "I can take this down" is a claim you prove with a mechanism, not with wreckage. Anyone can break something. The report explained why it broke.

The report was closed as Not Applicable: the platform's way of recording that there was nothing there at all.

> **sit with the incentive that creates**
>
> I was penalised for refusing to run a destructive attack against a production system. The behaviour the platform paid for was the more dangerous of my two options. If you have ever wondered why some researchers push further than they should before filing, this is a big part of the answer. Restraint gets scored as a failed report.

Put the two experiences together and the result is not hurt feelings. It is something structural. You did real work, you proved a real bug, and the system recorded it as nothing. In many programmes there is no meaningful appeal against that.

These categories also carry very different meanings that all collapse into the same empty wallet. A real vulnerability can be out of scope. A company can know about a bug and accept the risk on purpose. A finding can be valid but ineligible under the policy. *None* of those is the same as "there is no vulnerability", yet they often arrive wearing the same label.

## who gets asked for a video and who gets believed

Now hold my two stories next to a third one that played out in public.

In September 2026 a team from Hacktron AI published [how they got into OpenAI](https://hacktron.ai/blog/hacking-openai). The short version: a heap overflow in libheif, reachable because Discourse hands image uploads to ImageMagick, gave them code execution on `community.openai.com`. An OpenAI single sign-on misconfiguration then turned that forum compromise into control of employee ChatGPT and Codex accounts. To prove impact, they used a compromised employee's Codex to open a pull request inside OpenAI's internal monorepo.

That is about as serious as a report gets. It produced a real CVE for Discourse, and OpenAI confirmed a fix roughly fourteen hours after submission. Fast. By 18 September the Wall Street Journal had written the whole thing up.

Nobody asked them for a video. I am not being snide. Their write-up is excellent and they had long since earned the benefit of the doubt. But name the asymmetry. A recognised team with a track record publishes a chain and the industry reads it carefully. An individual reports that data can be deleted and gets asked to film the deletion twice. A crowded queue cannot easily tell a serious claim from a merely confident one.

And here is the part your own economics should notice. For that entire chain, OpenAI paid **$6,500**.

Hacker News did not take it well. The thread hit 486 points, with comments like "a $6500 bounty is insulting." This one was the most shared:

![Hacker News comment calling the 6,500 dollar bounty beyond pathetic for a company valued near 1.2 trillion dollars that had just been breached with a complete potential source code leak](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/hn-6500-reaction.png)
*[Hacker News](https://news.ycombinator.com/item?id=49749976), 18 September 2026.*

There is also a scope twist that will feel familiar from the researcher's side of the desk. OpenAI clarified where the money had come from:

![Disclosure timeline entry dated 1 September 2026 reading OpenAI Rewarded 6,500 dollar Bounty and Marked Resolved, followed by an OpenAI comment clarifying that testing against the Discourse-hosted community.openai.com was explicitly excluded from the bug bounty program](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/openai-6500-scope.png)
*From the disclosure timeline in [Hacktron's write-up](https://hacktron.ai/blog/hacking-openai), 1 September 2026.*

Read that carefully. It is not villainy. It is a programme owner correctly declining to pay for testing against someone else's hosted service, which they had no authority to authorise in the first place. The rule is defensible.

It is also the exact shape of the problem. The half of the work that *demonstrated the impact* was the half outside scope. Hacktron pushed back on that framing in their post, pointing out the escalation was never really a Discourse problem:

> "We want to emphasize that the vulnerability to escalate is not Discourse-specific. It is an OpenAI SSO issue that turned the forum compromise into access to ChatGPT and Codex. If any first-party or third-party OpenAI service using the OpenAI SSO was compromised, it would lead to same access."

And the $6,500 was not a one-off. A fortnight later another researcher, Oliver Fish, posted the reward for a bug that handed out free access to OpenAI's paid models with no API key and no account at all:

![Oliver Fish tweets that OpenAI paid 300 dollars for a bug giving free access to OpenAI's paid models with no API key or account, attaching the award notice titled Unauthenticated Sandbox Escape Enables Access to Internal OpenAI Responses API, and says there is zero reason to report anything else he finds to them](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/tweet-oliver-fish.png)
*"$300 for a bug that gives free access to OpenAI's paid models with no API key or account. Zero reason to report anything else I find to them." [@_Oliver_Fish](https://x.com/_Oliver_Fish/status/2107676642491629569), 7 October 2026.*

That last sentence is the whole thing in one line, from someone who had just lived it. So stack the outcomes up and look at what the market actually paid for effort.

| reward | for what |
| --- | --- |
| **$6,500** | for code execution, employee account takeover and a pull request inside OpenAI's internal monorepo |
| **$300** | for an unauthenticated bug handing out free access to OpenAI's paid models |
| **$0** | for my arbitrary delete, until I filmed a video proving that a delete button deletes |

None of those decisions is corrupt. Every one follows a written policy. That is the point. This is an economics problem, not a morality tale. The rules are applied correctly and the numbers still do not add up.

If compromising one of the most valuable companies on earth tops out at $6,500, and an unauthenticated path to its paid models is worth $300, every calculation further down the ladder is worse than the people making it realise. When the reward is that low, the researcher does not conclude they were unlucky. They conclude that reporting is a bad trade and quietly recalibrate what they do with the next bug. That recalibration is the thing a programme owner should be frightened of.

## now the part that should worry CISOs

Everything so far has been about fairness. This section is about risk, and I want to make the argument carefully, because it is easy to overstate.

A bug bounty is better understood as a marketplace for behaviour than a marketplace for information. The money exists to make private disclosure the most attractive option for someone who has just found something powerful. It is a subsidy on good conduct, not a purchase of data.

Now look at what a duplicate decision does to that subsidy. The vendor behaves rationally. It already holds the information and a second copy is worth nothing to its inbox. But the researcher is now sitting on a working, reproducible attack that officially has zero value, and that quite often still works in production weeks later.

The bounty market asks whether you were first. Every other market asks whether it still works. Those two questions have very different answers, and that gap is where the risk lives. RAND's landmark study of vulnerability markets found that zero days have an average life expectancy of around 6.9 years, and that only about 5.7% of a stockpile gets independently discovered and disclosed by someone else in a given year. Knowledge of a vulnerability does not expire just because it stopped being novel to one vendor's ticketing system.

Here is the uncomfortable arithmetic. Ten people find the same bug. One gets paid. The other nine are told their working, reproducible attack is worth nothing. What happens to those nine? Most shrug and move on. Some publish where the policy allows. But the bug still works, and the legitimate buyer has just told nine capable people it will not give them a cent for it.

I am not claiming a thriving black market for rejected duplicates already exists. It is entirely possible that AI abundance *lowers* the resale price of common findings rather than raising it, since scarcity was what made them valuable. My claim is narrower and harder to argue with. When you tell the second, fifth and eleventh finder that a live attack is worth zero, you are running an experiment on human incentives at a scale nobody has tried before. Not everyone in that experiment will decide that quietly moving on is the best use of a working exploit.

The most common failure is undramatic. The researcher closes the tab and goes somewhere else. Your report quality drops while your report volume grows. None of it shows on a dashboard until it shows up years later in an incident.

Then remember the triager's question from earlier. If ten researchers can independently rediscover a bug within days of the first one, what is stopping anyone else from doing the same before you have patched it? That is the real chaos scenario. It looks less like a black market and more like a patch window that quietly shrank to nothing while everyone argued about who deserved the $1,000.

## what programme owners can actually do

Paying a full bounty for every duplicate is not the answer. It would invite copy-paste abuse and bankrupt most programmes. But "not first" does not have to mean "worth nothing", and several of the alternatives cost very little.

### pay for material additional value

If a later report proves greater impact, finds a different root cause, shows your patch was incomplete, extends the bug to another product, or shows it is still exploitable in production, that is new information. It deserves a partial bounty, a flat bonus or a severity re-rating.

### treat duplicate volume as a risk signal, not an inbox statistic

Count independent rediscoveries per bug and feed that number into your remediation priority. Eleven reports in six weeks means the bug is trivially findable. That is the cheapest threat intelligence you will ever be handed, and most programmes are deleting it.

### say why, in enough detail to be credible

Explain whether the root cause is the same, what evidence was missing, or why the claimed impact does not hold. None of that requires exposing another researcher's confidential report. Then give people a real appeal path, with a human being at the end of it.

### stop letting reports turn into free consulting

Clarifying questions are part of reporting. Testing across five more accounts, three environments and two rounds of fix verification is an engagement. If you need that, pay for it, as a fixed follow-up fee, an hourly arrangement or a remediation verification bonus.

### measure security outcomes, not ticket closure

Track time from confirmation to remediation, time from validation to payment, how many independent reports arrived before the fix, how often appeals overturn decisions, and how many duplicate-closed bugs were still exploitable 30 days later. A fast first response is not a correct assessment, and a closed ticket is not a patched system.

### publish a dedupe policy that reflects reality

Two findings can share a category and still need two different fixes. HackerOne's own definition lets Duplicate cover cases where one deployment resolves several submissions, so say plainly when you are collapsing by root cause and when you are collapsing by label. Those are not the same thing, and researchers can tell the difference.

### and researchers do not get a free pass either

All of this is void if our side of the desk keeps making things worse. Verify that the thing reproduces. Describe impact you have demonstrated, not impact you can imagine. Respect scope. Strip sensitive data. Separate what you proved from what you suspect. Above all, do not forward confident AI output you have not checked, because someone on a salary will lose an afternoon proving it was fiction, and enough of those afternoons is how curl's programme died.

AI should remove our repetitive work, not transfer our verification costs onto someone else's security team.

## the bargain needs rewriting, not defending

Bug bounty is not dead. AI may make it more valuable to defenders by surfacing bugs that would otherwise have sat undisturbed for years. It is also making bounty hunting a worse deal for the humans doing it, through more competition, more collisions and more arguments about real findings. Both are true at once. Pretending otherwise is how we end up with more programmes switching the lights off.

The question was never whether researchers deserve payment for every hour they hunt. That was never the deal, and nobody sensible is asking for it. The question is whether skilled people still have a good reason to bring what they find to you first.

> A duplicate policy decides who gets paid. It cannot patch the vulnerability.

For a CISO, none of the numbers on your bug bounty dashboard describe your security posture. Reports received, reports closed, median first response time: all of it measures clerical throughput, not risk. The only question worth asking is whether exploitable risk is being found and removed faster than strangers are independently rediscovering it. Right now, for a lot of organisations, it is not.

If the legitimate market keeps telling capable people their working attack is worth nothing, nobody should be surprised when it stops being the first place they take it. When reporting a security problem becomes harder than finding one, you no longer have an inbox problem. You have an incentive problem, and incentive problems do not stay contained.

## related posts

This argument has been building across several posts. If you want the evidence behind it:

- [the 90 day disclosure policy is dead](https://blog.himanshuanand.com/2026/05/the-90-day-disclosure-policy-is-dead/). Eleven people found the same critical bug in six weeks, and why AI has compressed both discovery and exploitation to near zero.
- [score by collisions, patch by panic](https://blog.himanshuanand.com/2026/05/score-by-collisions-patch-by-panic/). The follow-up with an actual proposal: collision count as a severity signal, and researchers shipping patches rather than just reports.
- [30 minutes from patch to exploit](https://blog.himanshuanand.com/2026/05/30-minutes-from-patch-to-exploit/). Five security patches and five working exploits, the slowest of which took half an hour.
- [reporter 11: 10 people found the WPForms PayPal bug before me](https://blog.himanshuanand.com/2026/07/reporter-11-10-people-found-the-wpforms-paypal-bug-before-me-cve-2026-4986/). The full technical story of the duplicate from the 90 day post, published once CVE-2026-4986 was fixed.
- [I found a KVM guest-to-host heap corruption bug and someone else got there first](https://blog.himanshuanand.com/2026/08/i-found-a-kvm-guest-to-host-heap-corruption-bug-and-someone-else-got-there-first/). Reporter number two on a VM escape, the same story against a much harder target.
- [I had some free time, so I tried to pwn V8](https://blog.himanshuanand.com/2026/08/i-had-some-free-time-so-i-tried-to-pwn-v8/). Chained three public V8 bugs, escaped the sandbox, printed a real flag, and got no bounty.
- [fine-tune an LLM on Vertex AI, own the whole GCP project](https://blog.himanshuanand.com/2026/06/fine-tune-an-llm-on-vertex-ai-own-the-whole-gcp-project/). One training permission to effective project Editor, reported to the VRP and closed as Won't Fix.
- [defender playbook for the LLM era](https://blog.himanshuanand.com/2026/06/defender-playbook-for-the-llm-era/). The constructive one. Attackers already point LLMs at your code, so you may as well point them at your own code first.

## sources

- Daniel Stenberg, [the end of the curl bug-bounty](https://daniel.haxx.se/blog/2026/01/26/the-end-of-the-curl-bug-bounty/), 26 January 2026, covering the closure, 87 vulnerabilities, $100,000+ paid, the sub 5% valid rate and the Ruby/Node/Rails comparison.
- Daniel Stenberg, [death by a thousand slops](https://daniel.haxx.se/blog/2025/07/14/death-by-a-thousand-slops/), 14 July 2025, where roughly 20% of 2025 submissions were AI slop.
- Apache Logging Services PMC member, [public comment on the curl announcement](https://daniel.haxx.se/blog/2026/01/26/the-end-of-the-curl-bug-bounty/#comment-27393), 26 January 2026, with 67 submissions since July 2024 and half of them in two months.
- @d0rsky, [on the wave of LLM driven duplicate reports](https://x.com/d0rsky/status/2040848736713126365), 5 April 2026.
- @anand_himanshu, [apparently all vulnerabilities are now race condition](https://x.com/anand_himanshu/status/2057097135347106047), 20 May 2026.
- LiveOverflow, [on bug bounties and exploitation of labour at scale](https://x.com/LiveOverflow/status/1441939484535361537), 26 September 2021.
- Nico Waisman, [the road to top 1: how XBOW did it](https://xbow.com/blog/top-1-how-xbow-did-it), 24 June 2025, with roughly 1,060 submissions and 208 duplicates.
- Adrian Losada Pita, [engineering the impossible: how XBOW de-duplicates findings](https://xbow.com/blog/how-xbow-deduplicates-findings), 2 September 2026, with a 30% volume reduction and 90% of duplicates eliminated.
- HackerOne, [report states documentation](https://docs.hackerone.com/en/articles/8475030-report-states), for the definitions of Duplicate, Informative and Not Applicable plus the reputation effects.
- Bugcrowd, [accuracy documentation](https://docs.bugcrowd.com/researchers/managing-account/performance-metrics/accuracy/), for the greater than 50% accuracy requirement on private programme invitations.
- GitHub, [report quality guidance](https://bounty.github.com/report-quality) and [programme rules](https://bounty.github.com/rules), on responsibility for verifying AI assisted output and first report only duplicate handling.
- Herr, Schneier & Morris, [taking stock: estimating vulnerability rediscovery](https://www.belfercenter.org/publication/taking-stock-estimating-vulnerability-rediscovery), Belfer Center, July 2017 revised edition, for 15-20% annual rediscovery across 4,300+ vulnerabilities.
- Ablon & Bogart, [zero days, thousands of nights](https://www.rand.org/pubs/research_reports/RR1751.html), RAND, 9 March 2017, for the 6.9 year average life expectancy, 5.7% annual collision and 22 day median exploit development.
- Hacktron AI, [hacking OpenAI](https://hacktron.ai/blog/hacking-openai), 13 September 2026, for the libheif to Discourse to OpenAI SSO chain, the $6,500 award dated 1 September 2026, OpenAI's scope clarification and Hacktron's response to it.
- Discourse security advisory [GHSA-vhm9-85gw-x335](https://github.com/discourse/discourse/security/advisories/GHSA-vhm9-85gw-x335) (CVE-2026-32882), 28 July 2026, for the upstream libheif issue reachable through Discourse image uploads.
- [Hacker News discussion](https://news.ycombinator.com/item?id=49749656), 18 September 2026, 486 points, including the "beyond pathetic" and "insulting" reactions to the bounty amount plus Discourse co-founder Sam Saffron on their sandboxing response.
- Wall Street Journal, [hackers used Anthropic's Claude to break into OpenAI](https://www.wsj.com/tech/ai/hackers-used-anthropics-claude-to-break-into-openai-b40ba883), 18 September 2026, paywalled.
