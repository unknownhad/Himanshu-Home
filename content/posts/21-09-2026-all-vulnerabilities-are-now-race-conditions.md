---
title: "all vulnerabilities are now race conditions"
date: 2026-09-21
draft: false
tags: ["security", "bug-bounty", "llm", "disclosure", "vulnerability-management"]
author: "Himanshu Anand"
---

## TLDR

AI made finding bugs cheap without making it any easier to get paid for them. The same bug now gets found by ten different people inside a fortnight, one of them collects the money and the other nine collect a polite duplicate notice along with a dent in their platform reputation. The programmes are drowning as well, which is why curl shut down its entire bounty operation in January 2026 after fewer than one submission in twenty turned out to be real. The ceiling is also lower than most people assume, because in September 2026 a team proved they could reach OpenAI's internal monorepo and were paid $6,500 for the trouble. Meanwhile the underlying bug frequently sits unpatched, since telling somebody that you already know about a problem is an inbox status rather than a fix.

If you run a security programme, the part that should worry you is not the annoyed researcher but what happens to vulnerability information once the legitimate buyer stops being the best buyer.

---

## first, a story about a delete button

I once reported a bug that let somebody delete data belonging to another person, which in security jargon is called an **arbitrary delete** and in ordinary English means that if you press the right buttons and send the right request then something that is not yours quietly disappears.

I wrote it up the way you are supposed to, with steps to reproduce, the exact request, the evidence and a clear explanation of who gets hurt and how, at which point the person triaging it came back and asked for a video. So I recorded myself deleting a thing, in order to demonstrate that the delete button did in fact delete the thing.

> At that point I was no longer sure whether I was reporting a vulnerability or auditioning for a Netflix documentary.

![Netflix continue watching screen captioned: bug bounty triage, after the written report, the screenshots, the raw HTTP request and the reproduction steps](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/continue-watching.jpg)
*Bug bounty triage, after the written report, the screenshots, the raw HTTP request and the reproduction steps.*

I am not telling that story because it was unusual but because it was completely ordinary and because the hours it consumed are the thing actually being traded here rather than the bug itself.

## my scoreboard, since we are being honest

Over the years I have sent more than 50 vulnerability reports through HackerOne, of which twenty-three came back marked duplicate and five were accepted as valid, with most of the remainder closed as Not Applicable.

| stage | count |
| --- | --- |
| submitted | 50+ |
| duplicate | 23 |
| not applicable | most of the rest |
| valid | 5 |

![HackerOne reports dashboard filtered to Closed and Duplicate, showing the saved view holding twenty-three duplicate reports out of sixty-three total. The report list itself is redacted](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/h1-duplicates.png)
*The same thing on HackerOne: a saved view filtered to Closed → Duplicate. Report list redacted; the count is the point.*

Then there was 5 August, when I sent six reports to Google in a single day and every one of them came back as a duplicate, including three that I had assessed as critical.

> **being fair about this**
>
> A duplicate verdict does not mean Google agreed with my severity rating, it means somebody else had already told them and the critical rating was my assessment rather than theirs. I am not claiming that I was robbed. I am claiming something considerably more boring and more important, which is that six pieces of genuine work produced nothing at all purely because of timing.

![Google Bug Hunters dashboard showing six reports submitted to Google VRP on 5 August 2026, every one of them closed with the status Duplicate. Report titles and reporter identities are redacted](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/google-duplicates.png)
*Six reports to Google VRP, submitted on 5 August 2026 and closed as Duplicate. Titles and other reporters' identities redacted.*

Here is the part that people outside security always find strange when I explain it at a party. The bugs were real, the work was real and the hours came out of real evenings, yet the payment turned out to be the only theoretical component in the entire arrangement.

## how bug bounty actually works, in normal words

If you have never done this, the whole model fits into one paragraph.

A company puts up a poster saying that if you find a security hole in their product and tell them privately instead of abusing it then they will pay you, so you go looking on your own time with your own equipment at your own risk. If you find something that qualifies and you can prove it and nobody has told them already, you get paid. Otherwise you get nothing at all.

This is a bounty in the old Wild West sense of the word rather than a job or a contract, which sounds like an obvious point until you follow it through to the economics.

> "Earn up to $50,000" is the advertisement. The chance of actually getting paid is the business model.

That distinction carries the whole article, so it is worth sitting with for a moment. When a company hires a penetration tester it is paying for the *search*, which means the tester gets paid whether or not that particular week turns up anything alarming, because what is being bought is time and expertise. When a company runs a bug bounty the researchers collectively fund the search and the company buys only the winning result, so everybody else works for free and finds out about it afterwards.

That arrangement worked reasonably well for as long as finding a good bug stayed hard and rare and both of those conditions have now changed.

## I was never a big fan of bug bounty

I should put my bias on the table, because I have never been a bounty hunter in any serious sense and the reason was always economics rather than ethics.

I did not usually wake up, pick a public programme and spend a week competing for its reward pool. Almost every report I have filed happened because I tripped over something while doing other research and thought that somebody ought to know about it and finding the bug first while checking whether a bounty exists afterwards is a completely different activity from building your income around being first.

I am not alone in the discomfort either. LiveOverflow, one of the most widely watched security educators on the internet, put it like this back in 2021:

![LiveOverflow tweet saying he is not a huge fan of bug bounties and criticises the exploitation of labor at scale, while still standing with HackerOne and the triagers](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/tweet-liveoverflow.png)
*[LiveOverflow, 26 September 2021](https://x.com/LiveOverflow/status/1441939484535361537)*

Read that second sentence carefully, because it is the honest part of the post. He criticises the labour model and defends the triagers in the same breath, which is possible because both things are true at the same time. Programmes can push the cost of searching onto unpaid strangers while those same programmes are being buried under garbage reports and neither of those facts cancels out the other.

### but if you are starting out, go hunt anyway

None of this means bug bounty is bad for everybody, because if you are learning offensive security then it is one of the best classrooms in existence. You get legal targets, real production software instead of a lab with the answers printed in the back, practice at writing for an audience that will push back and something concrete to show an employer and a single valid report will teach you more than a month of tutorials.

Plenty of people have also made serious money and built careers, companies and reputations out of it, which is entirely real. It also happens to be the most visible part of the market, which is exactly what makes it such a bad guide. Leaderboards show you the winners alongside their payouts, but they never show the unpaid evenings, the duplicates, the rejected reports, the abandoned leads, the tooling bills or the third video recorded for a triager who never read the second one.

My position has therefore never been that bug bounty is a scam, only that **it makes a very good apprenticeship and a very poor salary** and AI has made the salary part considerably worse.

## the maths nobody prints on the poster

AI genuinely has made parts of this work cheaper, since it reads unfamiliar code, generates test cases, compares responses, explains a protocol you have never touched and drafts the first version of a report, so work that used to take days can now take hours.

All of which leads to a perfectly reasonable assumption, namely that if researchers can find bugs faster then researchers should earn more. Unfortunately a bounty is paid to whoever arrives first rather than by the hour.

Say a target gives you a one in five chance of landing a $1,000 bounty.

> **20% × $1,000 = $200 expected return**

Now add the crowd. The bug is the same and the reward is the same, but AI assisted tooling has brought four times as many people to the same surface, so your chance of being first drops to one in twenty.

> **5% × $1,000 = $50 expected return**

The poster still says $1,000 while your actual business has quietly lost three quarters of its revenue and nobody sent a memo about it. Those percentages are illustrative rather than measured, but the direction of travel is not in dispute and the rest of this article is the evidence for it.

There is a second squeeze underneath the first one, which is that AI shortens the *finding* without shortening the proving, the writing, the screenshotting, the video, the back and forth with triage or the appeal you file when somebody closes your report as Not Applicable. Saving an hour on discovery does not help very much when you then spend three more hours explaining why deleting another user's data counts as a security problem.

![Three Spider-Men pointing at each other, labelled three researchers, three AI subscriptions, one vulnerability and one bounty](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/spiderman-duplicate.jpg)
*Three researchers, three AI subscriptions, one vulnerability, one bounty.*

## "sounds like a you problem"

The easiest way to dismiss everything above is to assume that I am simply slow, so let us leave my anecdotes behind and look at what other people have been reporting on the record, with dates attached.

### the triagers see the wave

In April 2026 a triage engineer who goes by @d0rsky described exactly this pattern from the other side of the desk:

![Tweet from triage engineer d0rsky describing a wave of duplicate reports arriving within days of any new vulnerability being discovered](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/tweet-d0rsky.png)
*[@d0rsky, 5 April 2026](https://x.com/d0rsky/status/2040848736713126365)*

X truncates that one, so here is the rest of it:

> "It almost feels like: 1/ One person actually finds the issue 2/ Others re-run scans/prompts and 'rediscover' it … What concerns me more, is, if researchers can replicate these findings so quickly, what's stopping blackhats from doing the same before the issue is fixed? Feels like the window between 'first discovery' and 'mass awareness' is getting dangerously short."

That last question is the one I would like CISOs to sit with and I will come back to it later.

A month after that @pyn3rd said the quiet part out loud, observing that AI keeps producing duplicate vulnerability reports over and over and has increased the likelihood of several people reporting the same thing. I replied with the joke that has been living rent free in my head ever since.

![pyn3rd tweets that AI keeps producing duplicate vulnerability reports, attaching a HackerOne message closing a report as a duplicate. Himanshu Anand replies that all vulnerabilities are now race conditions](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/tweet-race-condition.png)
*The whole argument in one screenshot. [@pyn3rd](https://x.com/pyn3rd/status/2057095914138087693) attached a real HackerOne closure notice, which is the same message I have now collected twenty-three times. [My reply](https://x.com/anand_himanshu/status/2057097135347106047), 20 May 2026.*

That is where this post takes its title from. The longer I look at my own scoreboard the less it reads like a joke, because a race condition is what you get when the outcome depends on who arrives first rather than on what anybody actually did, which is now a perfectly fair description of how a bug report gets paid.

### one AI agent, 1,060 reports, 208 duplicates

If you would prefer a number to a vibe, XBOW is an autonomous AI pentester which reached the top of HackerOne's United States leaderboard in June 2025 and their own write-up is refreshingly candid about the volume involved:

> "XBOW submitted nearly 1,060 vulnerabilities."
>
> "Across all submissions, 208 were marked as duplicates, 209 as informative and 36 as not applicable."

That works out to roughly a one in five duplicate rate from a *single* automated participant, sitting on top of everything the humans are already sending. XBOW have since published a follow-up describing the engineering they had to do just to stop their own system reporting the same weakness repeatedly, which cut their reported volume by about 30% and removed around 90% of duplicate findings. When a machine has to be explicitly taught not to spam the queue, you can safely conclude that the queue was being spammed.

Now imagine a hundred smaller versions of that same thing, operated by people who never built a de-duplication pipeline.

### curl switched the lights off

The bluntest evidence comes from curl, a piece of software that runs on billions of devices. On 26 January 2026 the maintainer Daniel Stenberg announced the end of its bug bounty:

![Daniel Stenberg's blog post titled The end of the curl bug-bounty, dated 26 January 2026, with a photograph of a pile of money next to a sign reading NO MORE](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/curl-bounty-ends.png)
*"There is no longer a curl bug-bounty program. It officially stops on January 31, 2026." [daniel.haxx.se](https://daniel.haxx.se/blog/2026/01/26/the-end-of-the-curl-bug-bounty/), 26 January 2026.*

This was not a programme that had failed, because over its lifetime it paid out more than $100,000 for 87 confirmed vulnerabilities. Then the signal to noise ratio collapsed underneath it:

> "Previous years we have had a rate of somewhere north of 15% of the submissions ending up confirmed vulnerabilities. Starting 2025, the confirmed-rate plummeted to below 5%. Not even one in twenty was real."

The cost was not purely financial either:

> "The never-ending slop submissions take a serious mental toll to manage and sometimes also a long time to debunk. Time and energy that is completely wasted while also hampering our will to live."

Stenberg also included a detail that undercuts the comfortable explanation about curl simply being popular, which is that comparable open source programmes such as Ruby, Node and Rails did *not* see the same surge. His theory is uncomfortable and probably correct, namely that money brings in real reports while also making it very cheap to be annoying.

curl was not alone in this. In a public comment on that same announcement, a member of the Apache Logging Services project described reviewing 67 submissions since July 2024 with half of them arriving in the final two months and said the committee's consensus was to close their programme by the end of February if adjustments did not work.

| number | what it measures |
| --- | --- |
| **<5%** | of curl's 2025 submissions were confirmed vulnerabilities, down from over 15% |
| **1,060** | vulnerability reports from one AI agent, 208 of them duplicates |
| **15-20%** | of vulnerabilities are independently rediscovered within a year, per Belfer Center research |

### bug collision was always real, long before AI

Researchers at Harvard's Belfer Center studied more than 4,300 vulnerabilities and found that rediscovery happens "more than twice as often as the 1-9% range previously reported", with 15% to 20% of vulnerabilities discovered independently at least twice within a year. For Android specifically, around 20% were rediscovered within 90 days.

That research was published in 2017, well before any of this tooling existed. If one bug in five was already being found twice a year when discovery was slow and manual, it is worth asking what that number looks like now that a competent LLM can be pointed at a codebase by anybody with a credit card.

My scoreboard is not really bad luck so much as a collision rate that I happened to be standing in front of.

## duplicate is a filing decision, not a security outcome

Here is where this stops being a story about researcher income and starts being a story about your organisation.

A duplicate label answers an administrative question, which is whether somebody has already told you about this and it does not answer the security question, which is whether somebody can still exploit it.

HackerOne's own documentation defines Duplicate as an issue that has "already been reported or is otherwise previously known by the customer team" and it is worth noticing what that sentence leaves out, because there is nothing in it about whether the bug has been fixed or whether it is still live in production this afternoon.

I have written about the extreme version of this before. In [the 90 day disclosure policy is dead](https://blog.himanshuanand.com/2026/05/the-90-day-disclosure-policy-is-dead/) I described reporting a serious payment bug and being told that I was reporter number **eleven**, with those eleven reports arriving over roughly six weeks and it was still unpatched at the time I wrote that post. I published the full technical story later in [reporter 11](https://blog.himanshuanand.com/2026/07/reporter-11-10-people-found-the-wpforms-paypal-bug-before-me-cve-2026-4986/), once it had been fixed and the CVE was public.

![HackerOne screenshot showing the report marked as a duplicate of an earlier submission, with eleven reporters on the same issue](https://blog.himanshuanand.com/images/11_submittions.png)
*Reporter eleven of eleven. The bug was still live when I wrote that post.*

It happened again at the other end of the difficulty scale. When I independently found a heap corruption bug in KVM that let a guest corrupt host kernel memory, the reply was the same shape, just with a shorter queue in front of me.

![Email from the kernel security team saying the issue had already been reported a couple of weeks earlier](https://blog.himanshuanand.com/images/Duplicate_email.png)
*Reporter number two on a VM escape. The full story is in [I found a KVM guest-to-host heap corruption bug and someone else got there first](https://blog.himanshuanand.com/2026/08/i-found-a-kvm-guest-to-host-heap-corruption-bug-and-someone-else-got-there-first/).*

The organisation's answer was that they already knew, while the security question was why it still worked. Those are two entirely different conversations of which only one protects anybody.

> **11×** — A smoke alarm goes off eleven times and the correct response is probably not to mark the last ten as duplicates because you already heard the first one.

This is my actual ask of defenders and it is a cheap one, because **a duplicate count is free threat intelligence that almost nobody uses**. If eleven independent people found the same flaw in six weeks then the eleventh report contains very little new technical information and a great deal of new operational information, which is that the bug is no longer hard to find. That belongs in your prioritisation rather than in a closed tickets metric.

I made the same argument at greater length in [score by collisions, patch by panic](https://blog.himanshuanand.com/2026/05/score-by-collisions-patch-by-panic/), where the short version is that if several unrelated people trip over the same thing within days then that collision count is a better severity signal than most CVSS vectors.

## the other side of the desk is genuinely suffering

I want to be fair here, because the greedy companies exploiting hackers version of this story is both too easy and mostly wrong.

A modern report can be cheap to generate and expensive to disprove, since AI writes confident, well formatted and entirely fictional vulnerabilities and somebody on an actual salary then has to read the code, replay the requests, check the logs and prove a negative. curl called it slop and quantified the damage and they were right to.

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

Both of those columns are real and both of them are getting worse. They also feed each other, because overloaded triagers close faster, fast closes produce wrong decisions, wrong decisions produce appeals and appeals consume whatever time the triager had left.

GitHub's own guidance puts the responsibility somewhere I completely agree with, which is that automated and AI assisted analysis makes a fine starting point but you are responsible for confirming the finding is real and reproducible before you submit it and unverified automated output is the most common source of invalid reports. That is the correct rule and researchers who ignore it are the reason curl's programme no longer exists.

An overloaded queue does not make every individual decision correct though and this is where a real process failure hides. A video is genuinely useful when timing, motion or a complicated workflow matters and considerably less useful when it simply re-enacts the steps already written out in the report. The question worth asking before requesting more evidence is a simple one:

> What specific uncertainty will this extra evidence resolve?

If nobody can answer that question then the request has stopped being investigation and turned into ritual, paid for by somebody who is not on the payroll.

### the time I had to film myself attacking a bug bounty platform

My favourite example of this involves a bug bounty platform itself.

I found a way to delete data arbitrarily on the site, not as a theoretical path but as a working one against the infrastructure of the very company whose entire business is receiving reports like mine. I wrote it up the way I always do, covering the request, the steps, the mechanism and who it affects.

The triager did not understand the impact, so I explained it again and then explained it a third time. Each time the answer came back identical, which was that they needed a video.

In the end I asked for explicit permission to demonstrate it, received that permission and recorded the video, which was accepted, so I want to be fair and say that I did eventually get through.

Look at what that process actually was though. A written explanation of a destructive bug, from somebody who had already proven it, counted for less with the queue than a screen recording would and that was not because the writing was unclear but because video is how an overloaded queue converts "I do not follow this" into "fine, approved". The evidence format ended up substituting for understanding the bug.

![A triage requirement reading: a video POC showing the full environment setup and flow and execution of your finding, and clearly showing the initial state versus what the actor was able to achieve](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/video-request-thread.png)
*The standing requirement: a video showing "the initial state vs what the actor was able to achieve" — even for a written, already-proven destructive bug.*

## what a wrong N/A actually costs a researcher

This is the part that most people outside bug bounty do not know and it is also the part that turns a triage mistake into a career problem.

- **duplicate** — Already reported or otherwise already known by the customer team, which says nothing whatsoever about whether it has been fixed.
- **informative** — Valid information that does not require action.
- **not applicable** — No valid reproducible issue and no demonstrated security impact, which is the one label that records your work as simply wrong.

Which brings me to the report I did *not* record a video for.

Earlier, on a different finding, I had something that could take infrastructure down and when the triager asked for a video of it happening I refused.

I refused because producing that footage would have meant actually degrading a live service and because a claim like "I can take this down" is something you demonstrate with a mechanism rather than with wreckage, given that anybody can break something whereas the report explained precisely why it broke.

The report was closed as Not Applicable, which is the platform's way of recording that there was nothing there at all.

> **sit with the incentive that creates**
>
> I was penalised for declining to run a destructive attack against a production system, which means the behaviour the platform financially rewarded was the more dangerous of the two options available to me. If you have ever wondered why some researchers push further than they should before filing, this is a large part of the answer, because restraint gets scored as a failed report.

Put those two experiences together and the consequence is not hurt feelings but something structural. You did real work, you proved a real bug, and the system recorded it as nothing at all, and in many programmes there is no meaningful appeal against that verdict either.

These categories also carry very different meanings that all collapse into the same empty wallet. A real vulnerability can be out of scope, a company can know about a bug and consciously accept the risk and a finding can be perfectly valid while remaining ineligible under the policy. *None* of those is the same statement as "there is no vulnerability", yet they frequently arrive wearing the same label.

## who gets asked for a video and who gets believed

Now hold my two stories up next to a third one that played out in public.

In September 2026 a team from Hacktron AI published [how they got into OpenAI](https://hacktron.ai/blog/hacking-openai). The short version is that a heap overflow in libheif, reachable because Discourse hands image uploads to ImageMagick, gave them code execution on `community.openai.com` and an OpenAI single sign-on misconfiguration then turned that forum compromise into control of employee ChatGPT and Codex accounts. To prove the impact they used a compromised employee's Codex to open a pull request inside OpenAI's internal monorepo.

That is about as serious as a report gets. It produced a real CVE for Discourse and OpenAI confirmed a fix roughly fourteen hours after submission, which is genuinely fast. By 18 September the Wall Street Journal had written the whole thing up.

At no point did anybody ask them to record a video and I am not being snide about that, because their write-up is excellent and they had long since earned the benefit of the doubt. It is still worth naming the asymmetry though. A recognised team with a track record publishes a chain and the industry reads it carefully, while an individual reports that data can be deleted and gets asked to film the deletion twice, because a crowded queue cannot easily tell the difference between a serious claim and a merely confident one.

And here is the part your own economics should notice, because for that entire chain OpenAI paid **$6,500**.

Hacker News did not take that well, with the thread reaching 486 points and comments including "a $6500 bounty is insulting." This one was the most widely shared:

![Hacker News comment calling the 6,500 dollar bounty beyond pathetic for a company valued near 1.2 trillion dollars that had just been breached with a complete potential source code leak](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/hn-6500-reaction.png)
*[Hacker News](https://news.ycombinator.com/item?id=49749976), 18 September 2026.*

There is also a scope twist that will feel familiar to anyone reading this from the researcher's side of the desk, because OpenAI clarified where the money had come from:

![Disclosure timeline entry dated 1 September 2026 reading OpenAI Rewarded 6,500 dollar Bounty and Marked Resolved, followed by an OpenAI comment clarifying that testing against the Discourse-hosted community.openai.com was explicitly excluded from the bug bounty program](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/openai-6500-scope.png)
*From the disclosure timeline in [Hacktron's write-up](https://hacktron.ai/blog/hacking-openai), 1 September 2026.*

Read that carefully, because it is not villainy at all. It is a programme owner correctly declining to pay for testing against somebody else's hosted service, which they had no authority to authorise in the first place. The rule is entirely defensible.

It is also the exact shape of the problem, since the half of the work that *demonstrated the impact* turned out to be the half sitting outside scope. Hacktron pushed back on that framing in their own post, pointing out that the escalation was never really a Discourse problem:

> "We want to emphasize that the vulnerability to escalate is not Discourse-specific. It is an OpenAI SSO issue that turned the forum compromise into access to ChatGPT and Codex. If any first-party or third-party OpenAI service using the OpenAI SSO was compromised, it would lead to same access."

And the $6,500 was not a one-off number. A fortnight later another researcher, Oliver Fish, posted the reward for a bug that handed out free access to OpenAI's paid models with no API key and no account at all:

![Oliver Fish tweets that OpenAI paid 300 dollars for a bug giving free access to OpenAI's paid models with no API key or account, attaching the award notice titled Unauthenticated Sandbox Escape Enables Access to Internal OpenAI Responses API, and says there is zero reason to report anything else he finds to them](https://blog.himanshuanand.com/images/all-vulnerabilities-are-now-race-conditions/tweet-oliver-fish.png)
*"$300 for a bug that gives free access to OpenAI's paid models with no API key or account. Zero reason to report anything else I find to them." [@_Oliver_Fish](https://x.com/_Oliver_Fish/status/2107676642491629569), 7 October 2026.*

That last sentence is the whole thing said in one line by somebody who had just lived it. So stack the outcomes up against each other and look at what the market actually paid for effort.

| reward | for what |
| --- | --- |
| **$6,500** | for code execution, employee account takeover and a pull request inside OpenAI's internal monorepo |
| **$300** | for an unauthenticated bug handing out free access to OpenAI's paid models |
| **$0** | for my arbitrary delete, until I filmed a video proving that a delete button deletes |

None of those decisions is corrupt and every one of them follows a written policy, which is precisely why this is an economics problem rather than a morality tale. The rules are all being applied correctly and the numbers still do not add up.

If the ceiling for compromising one of the most valuable companies on earth sits at $6,500, and an unauthenticated path to its paid models is worth $300, then every calculation further down the ladder is worse than the people making it realise. When the reward is that low the researcher does not decide they were unlucky, they decide that reporting is a bad trade and quietly recalibrate what they do with the next bug, and that recalibration is the thing a programme owner should actually be frightened of.

## now the part that should worry CISOs

Everything so far has been about fairness, whereas this section is about risk and I want to make the argument carefully because it is very easy to overstate.

A bug bounty is better understood as a marketplace for behaviour than as a marketplace for information, because the money exists to make telling the vendor privately the most attractive option available to somebody who has just found something powerful, which makes it a subsidy on good conduct rather than a purchase of data.

Now look at what a duplicate decision does to that subsidy. The vendor is behaving perfectly rationally, since it already holds this information and a second copy is worth nothing to its inbox, but the researcher is now sitting on a working and reproducible attack that officially has zero value and that quite often still works in production weeks later.

The bounty market asks whether you were first while every other market asks whether it still works. Those two questions have very different answers, which is precisely where the risk lives. RAND's landmark study of vulnerability markets found that zero days have an average life expectancy of around 6.9 years and that only about 5.7% of a stockpile gets independently discovered and disclosed by somebody else in a given year, so knowledge of a vulnerability does not expire simply because it stopped being novel to one vendor's ticketing system.

Here is the uncomfortable arithmetic. Ten people find the same bug, one gets paid, and the other nine are told that their working, reproducible attack is worth nothing. What happens to those nine? Most shrug and move on, some publish where the policy allows it, but the bug still works and the legitimate buyer has just told nine capable people that it will not give them a cent for it.

I am not claiming that a thriving black market for rejected duplicates already exists, and it is entirely possible that AI abundance *lowers* the resale price of common findings rather than raising it, since scarcity was what made them valuable in the first place. What I am saying is narrower and much harder to argue with. When you systematically tell the second, fifth and eleventh finder that a live attack is worth zero, you are running an experiment on human incentives at a scale nobody has tried before, and not everyone in that experiment is going to decide that quietly moving on is the best use of a working exploit.

The most common failure is still completely undramatic, the researcher closes the tab and goes somewhere else, your report quality quietly declines while your report volume grows, and none of it shows up on a dashboard until it shows up years later in an incident.

Then remember the triager's question from earlier. If ten researchers can independently rediscover a bug within days of the first one, what exactly is stopping anybody else from doing the same before you have patched it? That is the actual chaos scenario and it looks less like a black market than like a patch window that has quietly shrunk to nothing while everybody argued about who deserved the $1,000.

## what programme owners can actually do

Paying a full bounty for every duplicate is not the answer, because it would invite copy and paste abuse while bankrupting most programmes, but "not first" does not have to mean "worth nothing" and several of the alternatives cost very little.

### pay for material additional value

If a later report proves greater impact, finds a different root cause, shows your patch was incomplete, extends the bug to another product or demonstrates that it is still exploitable in production, then that is new information and it deserves a partial bounty, a flat bonus or a severity re-rating.

### treat duplicate volume as a risk signal rather than an inbox statistic

Count independent rediscoveries per bug and feed that number into your remediation priority, because eleven reports in six weeks means the bug is trivially findable. That is the cheapest threat intelligence you will ever be handed and most programmes are currently deleting it.

### say why, in enough detail to be credible

Explain whether the root cause is genuinely the same, what evidence was missing or why the claimed impact does not hold, none of which requires exposing another researcher's confidential report, then give people a real appeal path with a human being at the end of it.

### stop letting reports turn into free consulting

Clarifying questions are part of reporting, whereas testing across five more accounts, three environments and two rounds of fix verification is an engagement, so if you need that then pay for it as a fixed follow-up fee, an hourly arrangement or a remediation verification bonus.

### measure security outcomes rather than ticket closure

Track time from confirmation to remediation, time from validation to payment, how many independent reports arrived before the fix, how often appeals overturn decisions and how many duplicate closed bugs were still exploitable 30 days later, because a fast first response is not the same thing as a correct assessment and a closed ticket is not the same thing as a patched system.

### publish a dedupe policy that reflects reality

Two findings can share a category while needing two entirely different fixes and HackerOne's own definition allows Duplicate to cover cases where a single deployment resolves several submissions, so state plainly when you are collapsing by root cause and when you are collapsing by label, because those are not the same thing and researchers can tell the difference.

### and researchers do not get a free pass either

Everything above is void if our side of the desk keeps making things worse. Verify that the thing actually reproduces, describe impact you have demonstrated rather than impact you can imagine, respect scope, strip sensitive data and separate what you proved from what you merely suspect. Above all, do not forward confident AI output that you have not checked yourself, because somebody on a salary will lose an afternoon proving it was fiction and enough of those afternoons is precisely how curl's programme died.

AI should be removing our repetitive work rather than transferring our verification costs onto somebody else's security team.

## the bargain needs rewriting, not defending

Bug bounty is not dead. AI may well make it more valuable to defenders by surfacing bugs that would otherwise have sat undisturbed for years, while simultaneously making bounty hunting a worse deal for the humans doing it through more competition, more collisions and more arguments about genuine findings. Both of those are true at the same time and pretending otherwise is how we end up with more programmes quietly switching the lights off.

The question was never whether researchers deserve payment for every hour they spend hunting, because that was never the deal and nobody sensible is asking for it. The question is whether skilled people still have a good reason to bring what they find to you first.

> A duplicate policy decides who gets paid. It cannot patch the vulnerability.

For a CISO, none of the numbers on your bug bounty dashboard actually describe your security posture, since reports received, reports closed and median first response time all measure clerical throughput rather than risk. The only question worth asking is whether exploitable risk is being found and removed faster than strangers are independently rediscovering it. Right now, for a great many organisations, it is not.

If the legitimate market keeps telling capable people that their working attack is worth nothing, nobody should be surprised when it stops being the first place they take it. When reporting a security problem becomes harder than finding one you no longer have an inbox problem, you have an incentive problem and incentive problems do not stay contained.

## related posts

This argument has been building across several posts, so if you want the evidence behind it:

- [the 90 day disclosure policy is dead](https://blog.himanshuanand.com/2026/05/the-90-day-disclosure-policy-is-dead/) — Eleven people found the same critical bug in six weeks and why AI has compressed both discovery and exploitation to near zero.
- [score by collisions, patch by panic](https://blog.himanshuanand.com/2026/05/score-by-collisions-patch-by-panic/) — The follow-up with an actual proposal, using collision count as a severity signal and having researchers ship patches rather than just reports.
- [30 minutes from patch to exploit](https://blog.himanshuanand.com/2026/05/30-minutes-from-patch-to-exploit/) — Five security patches and five working exploits, the slowest of which took half an hour.
- [reporter 11: 10 people found the WPForms PayPal bug before me](https://blog.himanshuanand.com/2026/07/reporter-11-10-people-found-the-wpforms-paypal-bug-before-me-cve-2026-4986/) — The full technical story of the duplicate from the 90 day post, published once CVE-2026-4986 was fixed.
- [I found a KVM guest-to-host heap corruption bug and someone else got there first](https://blog.himanshuanand.com/2026/08/i-found-a-kvm-guest-to-host-heap-corruption-bug-and-someone-else-got-there-first/) — Reporter number two on a VM escape, which is the same story against a much harder target.
- [I had some free time, so I tried to pwn V8](https://blog.himanshuanand.com/2026/08/i-had-some-free-time-so-i-tried-to-pwn-v8/) — Chained three public V8 bugs, escaped the sandbox, printed a real flag and received no bounty.
- [fine-tune an LLM on Vertex AI, own the whole GCP project](https://blog.himanshuanand.com/2026/06/fine-tune-an-llm-on-vertex-ai-own-the-whole-gcp-project/) — One training permission to effective project Editor, reported to the VRP and closed as Won't Fix.
- [defender playbook for the LLM era](https://blog.himanshuanand.com/2026/06/defender-playbook-for-the-llm-era/) — The constructive one, since attackers already point LLMs at your code so you may as well point them at your own code first.

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
