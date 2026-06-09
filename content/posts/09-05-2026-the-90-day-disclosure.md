---
title: "The 90 day disclosure policy is dead"
date: 2026-05-09
draft: false
tags: ["security", "llm", "disclosure", "vulnerability-management", "linux", "blog"]
author: "Himanshu Anand"
---

## TLDR
The 90 day responsible disclosure window was built for a world where bug finders were rare and exploit development was slow. That world is gone. LLMs have compressed both timelines to near-zero. I have seen it first hand, and so has everyone else paying attention. This post lays out why the old model is broken, with real stories, and makes one ask to the industry: treat every critical security issue as P0 and patch it immediately. patch it immediately, not over the next sprint.

---

I have been doing security work for a while now, and the last 12 months feel different. Not in a "AI is going to take over the world" way. In a much more boring, much more practical way. The tools we use, the tools attackers use, and the tools researchers use to find bugs have all gotten smarter at roughly the same speed. And that has quietly killed some of the fundamental assumptions the security industry has been running on for over a decade.
Let me walk you through what I mean, with stories.

## the old world (rest in peace)
Pretend it is 2019. You find a critical bug. You write up a report. You send it to the vendor. The vendor takes a few days to triage, a couple of weeks to fix, maybe a month to roll out. If you follow [Google Project Zero](https://googleprojectzero.blogspot.com/) style disclosure, you give them 90 days before going public. During those 90 days, you assume:
- You are probably the only person who found this bug
- Even if someone else finds it, they will take their own time
- The vendor has a comfortable head start on writing the patch
- After the patch lands, attackers need days or weeks to reverse engineer it into a working exploit
Every single one of these assumptions is now wrong.

## story 1: 10 people, 1 bug, 6 weeks

In late April, I reported a pretty bad bug to a company. I am keeping the details vague because the issue is still not patched, but the shape of it goes like this: an attacker can buy anything from the website, send back their own crafted response to the server, and because there is no signature verification on the response, the server happily accepts it. Buy a $5000 item for $0. Mark your purchase as completed without paying. Critical, easy to exploit, very bad day for the company.
Cool. I write it up, I send it in, I feel good about myself for about 10 minutes.
Then the triage team comes back and says "yeah we know, first reported in March. You are reporter number eleven." **Eleven Freaking people** found the same critical bug in roughly six weeks. 

![sashko](/images/11_submittions.png)

A friend from BlueWater CTF had flagged this pattern months ago, that LLM-assisted hunters were converging on the same bugs almost simultaneously, across totally unrelated reporters using totally unrelated workflows.
And it is not just me noticing this. [@d0rsky](https://x.com/d0rsky/status/2040848736713126365), who works on the triage side, posted this:
> *"Once a new vulnerability is discovered - especially via some LLM prompt/skills/automation, we start getting a wave of duplicate reports within days. Same root cause, slightly different wording. [...] What concerns me more, is, if researchers can replicate these findings so quickly, what's stopping blackhats from doing the same before the issue is fixed? Feels like the window between 'first discovery' and 'mass awareness' is getting dangerously short."*
Exactly. The triage teams are seeing it too. This is not a researcher's paranoia. It is a pattern.
![sashko](/images/sashko.png)

![NobodyIsNobody](/images/nobody.png)

At first I thought, okay, same tools, same prompts, makes sense. But then I did the uncomfortable math.
If 10 people reported the bug, how many found it and did **not** report it?
The same LLM that helped 10 honest researchers is also available to everyone else. It does not check your intentions at the door. Out of those 10 reporters, only 1 gets the CVE credit. Only 1 gets the bounty. What about the other 9? How many get frustrated? How many decide to sell it instead of wait? And the people who never reported it at all they are not sitting on a 90 day clock. They are not sitting on any clock.
**The 90 day window is not protecting users. It is giving everyone who already has the bug a 90 day head start.**

## story 2: 30 minutes from patch to exploit

Recently, React patched a bunch of security issues ([CVE-2026-23870](https://nvd.nist.gov/vuln/detail/CVE-2026-23870), [CVE-2026-44575](https://nvd.nist.gov/vuln/detail/CVE-2026-44575), [CVE-2026-44579](https://nvd.nist.gov/vuln/detail/CVE-2026-44579), [CVE-2026-44574](https://nvd.nist.gov/vuln/detail/CVE-2026-44574), [CVE-2026-44578](https://nvd.nist.gov/vuln/detail/CVE-2026-44578)) and wrote a public blog post about it. Standard practice. Show your work, explain the fix, give the community a heads up.
I read the post out of curiosity. Then I thought, let me see how hard it would be to turn this patch into a working exploit. Just an experiment, on my own machine, against a local test app.
**30 minutes.** From reading the patch to having a working exploit (DOS, as it was DoS only). AI did most of the heavy lifting: understanding the diff, identifying the vulnerable code path, writing the PoC. The published issue was a denial of service, but the underlying primitive could go further with more work.
In the old world, turning a public patch into a working exploit (n-day exploitation) took skilled reverse engineers days to weeks. That gap was the safety net. "We shipped the patch, admins have a few days to update."
That safety net is gone. The gap is now measured in minutes for simple bugs, maybe hours for complex ones. The skilled reverse engineer is optional. The LLM does the boring parts and the human just steers.
**The moment a patch ships, assume the exploit exists.** There is no grace period. Companies cannot afford to "schedule" patch deployment for the next maintenance window. The maintenance window is now.

## story 3: the week linux caught fire

If you want the clearest possible proof that the 90 day disclosure model is dead, look at the last two weeks of the Linux kernel. Two back-to-back critical vulnerabilities. Both with public exploits. Both affecting every major distribution. The timeline reads like a horror movie.
### act 1: copy fail
On **April 29**, [Xint Code](https://code.xint.io/) (the team behind [Theori](https://theori.io/), nine-time DEF CON CTF champions) publicly disclosed [Copy Fail](https://copy.fail/) [**CVE-2026-31431**](https://nvd.nist.gov/vuln/detail/CVE-2026-31431). A straight-line logic flaw in the kernel crypto subsystem. No race condition needed. 100% reliable. A **732-byte Python script** that gives you root on every single Linux distribution shipped since 2017.
Every single one Ubuntu, RHEL, Amazon Linux, SUSE, all of them. One `curl | python3 && su` away from game over.
The terrifying detail: they found it using an AI-assisted workflow at unprecedented speed. The discovery didn't come from blindly running a scanner, but began with a human insight. Theori researcher Taeyang Lee was studying how the Linux crypto subsystem interacts with page-cache-backed data. Once he had that initial thread, he used Xint Code to scale his research across the entire crypto subsystem. What would normally take weeks of manual code auditing took about an hour of AI-assisted scaling. It came down to one researcher's insight, scaled by about an hour of AI work against a bug that had been exposed for nine years. For the full technical breakdown, read [Xint's writeup](https://xint.io/blog/copy-fail-linux-distributions).
Copy Fail did get a patch (mainline commit [`a664bf3d603d`](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a664bf3d603d)) and a straightforward mitigation: disable the `algif_aead` module. People started patching. Deep breath. Okay. Maybe we can handle this.
Then threat actors showed up. Iranian adversaries were observed leveraging the vulnerability to compromise Ubuntu servers and repurpose them as nodes for DDoS campaigns. A kernel privilege escalation found by AI, disclosed publicly, weaponized by nation-state actors, used to build attack infrastructure. All within days.

![Enlightment](/images/llm_disclosure_meme.jpg)

### act 2: dirty frag

**Barely one week later**, on **May 7**, researcher Hyunwoo Kim ([@v4bel](https://x.com/v4bel)) published [Dirty Frag](https://github.com/V4bel/dirtyfrag) [**CVE-2026-43284**](https://nvd.nist.gov/vuln/detail/CVE-2026-43284) and **CVE-2026-43500**. Two chained vulnerabilities in the kernel's IPSec ESP (`esp4`/`esp6`) and RxRPC networking modules. Same bug class as Copy Fail and [Dirty Pipe](https://dirtypipe.cm4all.com/). Same page-cache corruption technique. Different attack path.
The critical part: **Dirty Frag works even if you applied the Copy Fail mitigation.** Even if you blacklisted `algif_aead`. Dirty Frag does not use that module. It takes a completely different route to the same result: unprivileged user to root, deterministically, on every major distro. Ubuntu, RHEL 10.1, openSUSE, CentOS Stream, AlmaLinux, Fedora 44. A one-liner to compile and run.
And here is where the disclosure model completely fell apart.
Hyunwoo Kim reported to `security@kernel.org` on April 29-30. He submitted patches publicly. He coordinated with the [`linux-distros`](https://oss-security.openwall.org/wiki/mailing-lists/distros) mailing list on May 7, with a 5-day embargo agreed upon. On that same day **within hours** an unrelated third party published detailed exploit information for the ESP vulnerability, breaking the embargo.
After consulting with the distro maintainers, Hyunwoo published the [full Dirty Frag writeup](https://github.com/V4bel/dirtyfrag/blob/master/assets/write-up.md), exploit code, and a working PoC.
**At that moment, zero Linux distributions had a patch available.**
As of today, only CVE-2026-43284 (the ESP side) has a [mainline fix](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f4c50a4034e62ab75f1d5cdd191dd5f9c77fdff4). CVE-2026-43500 (the RxRPC component) **still has no upstream patch**. And the chained exploit that combines both works on basically everything. ([Ubuntu](https://ubuntu.com/blog/dirty-frag-linux-vulnerability-fixes-available), [Red Hat](https://access.redhat.com/security/vulnerabilities/RHSB-2026-003), and [others](https://www.tenable.com/blog/dirty-frag-cve-2026-43284-cve-2026-43500-frequently-asked-questions-linux-kernel-lpe) have published their own advisories.)
Microsoft's Defender team [confirmed limited in-the-wild exploitation](https://www.microsoft.com/en-us/security/blog/2026/05/08/active-attack-dirty-frag-linux-vulnerability-expands-post-compromise-risk/) within **24 hours** of disclosure. Attackers gaining SSH access, deploying an ELF binary, popping root via `su`, modifying authentication configs, wiping session files, moving laterally. The full playbook, live, in production environments.
CTS ([@gf_256](https://x.com/gf_256/status/2052480591489122747)) summed it up in five words:
> **"responsible disclosure is dead🤦"**
![CTS Tweet](/images/cts_tweet.png)
https://x.com/gf_256/status/2052480591489122747
Yeah.

## so what is actually dead here

Let me be specific about what I think is broken beyond repair.
**The 90 day disclosure window is dead.** Not "needs reform", actually dead. It was designed for a world where finders were rare and exploit development was slow. LLMs have made finders abundant and exploit development fast. When 10 unrelated researchers find the same bug in 6 weeks, and AI can turn a patch diff into a working exploit in 30 minutes, what exactly is the 90 day window protecting?
It isn't protecting anyone It is just exposure that we have given a polite name.
Copy Fail went from AI scan to public PoC to nation-state weaponization in days. Dirty Frag's embargo was broken within hours by a third party who independently found the same bug class. You cannot coordinate disclosure when the same vulnerability is being independently rediscovered by multiple researchers and AI tools at the same time. The information does not stay contained anymore.

**Monthly patch cycles are dead too.** A 30 day window between vulnerability and fix assumes attackers are slower than your release train. They are not. They have been faster for a while now, and the gap is only widening. Microsoft saw Dirty Frag in the wild within 24 hours. Your monthly maintenance window is not a safety margin. It is an attack window.
**"Wait for the advisory" is dead.** If you are reading CVE descriptions while attackers are reading `git log --diff-filter=M`, you are already behind. By the time the advisory is written, the patch diff has already told attackers everything.
## what the industry needs to do (and I am not sugarcoating this)
I have one ask. One. And I know it sounds extreme. I know it is a lot. But everything I have shown you above points to the same conclusion:
**Treat every critical security issue as P0 and fix it immediately.**
Not "within 24 hours". Not "in the next sprint". Not "after we assess impact". Now. As in, stop what you are doing and fix it now. I know that sounds unreasonable. I know production deployments are complicated. I know change management exists for good reasons. But the threat landscape does not care about your change management process.
Here is what "immediately" actually looks like in practice:
**If you are a vendor receiving a critical bug report**, your clock starts the moment the report lands. Not when you finish triaging. Not when engineering picks it up. The moment it lands. Because if someone reported it to you, assume 10 other people have it and at least one of them is not friendly.
**If you are a researcher**, stop sitting on critical bugs. Push for the shortest possible disclosure window. If the vendor cannot fix it in a week, that is a vendor problem, not a disclosure problem. The old "give them time" courtesy made sense when you were the only finder. You are not the only finder anymore.
**If you are running vulnerability management**, it needs to be real-time. The old cadence of "scan weekly, triage in sprint, patch in cycle" is a timeline that attackers left behind months ago. The new maximum response time for a critical issue is hours. Not days. Hours. And even that might be too slow.
### a note for the blue team
This part is important enough that it gets its own section.
The attackers have already integrated LLMs into their exploit pipelines. If you have not done the same on the defensive side, you are bringing a clipboard to a gunfight. Here is what I think every engineering and security team should be building toward right now:
**Integrate LLMs at the point of code push.** Every pull request, every merge, every deploy. Run AI-assisted security review as part of your CI pipeline, the same way you run linters and unit tests. Not as an afterthought, not as a quarterly audit. At push time. If the code has a vulnerability, catch it before it reaches production. The cost of fixing a bug in a PR review is orders of magnitude lower than fixing it after a CVE drops.
**Integrate LLMs for patch analysis.** When an upstream dependency releases a security patch, your pipeline should automatically pull the diff, analyze what changed, determine if your codebase is affected, and flag it. This should not require a human to read a mailing list and open a Jira ticket. It should happen in minutes, automatically, the moment the patch hits the public repo. If [Xint Code](https://code.xint.io/) found Copy Fail in one hour of automated scanning, what is your excuse for not scanning your own dependencies the same way?
**Integrate LLMs for dependency scanning.** Your supply chain is only as strong as your weakest transitive dependency. AI-powered dependency scanners can now trace vulnerability impact through dependency trees, flag affected versions, and even suggest upgrade paths. Run them continuously, not weekly.
**Test your patches with AI before you ship them.** One of the scariest things about the React story is that an LLM can turn a patch into an exploit in 30 minutes. Flip that on its head: before you publish a security patch, use AI to verify that the patch actually fixes the issue and does not introduce a new one. Use it to generate regression tests. Use it to check if the same pattern exists elsewhere in your codebase. If attackers will do this the moment your patch lands, you should do it first.
I know this sounds like a lot. I know not every team has the resources to build all of this tomorrow. But the trajectory is clear. The window between "vulnerability exists" and "vulnerability is exploited" is shrinking to zero. The only way to keep up is to automate the defensive side at the same speed the offensive side is already moving. We are going to see more and more zero-days getting exploited in the wild, faster and faster. That's not a guess the inputs all point the same way: lower barrier, more finders, shorter timelines. Same tools, lower barrier to entry, more finders, shorter timelines. The teams that survive this shift will be the ones who made AI a first-class citizen in their security pipeline before they were forced to.
## final thoughts
I keep coming back to the same image in my head. It is a sysadmin reading the Dirty Frag advisory on May 7, realizing that there is no patch available, that the exploit is already public, that Microsoft is already seeing it in the wild, and that the mitigation is "disable your IPSec modules". And this person has 400 servers to touch.
That is the new reality. Not a hypothetical. Not a war game scenario. That was last Wednesday.
The 90 day disclosure policy is dead. Monthly patch cycles are dead. The assumption that you have time between disclosure and exploitation is dead. What is not dead is the ability to move fast, automate hard, and treat critical bugs like the emergencies they are.
The same AI wave that broke the old model also enables the new one. Faster patching, automated scanning, real-time threat intel, AI-assisted code review. The tools exist. The question is whether defenders will use them before attackers do.
Right now, the attackers are winning that race.
Let us fix that.

If you're still reading this, you're awesome. Thanks for sticking with me!

---
I will go deeper on several of these points in follow-up posts:
- **score by collisions, patch by panic** → [Link](https://blog.himanshuanand.com/2026/05/score-by-collisions-patch-by-panic/)
- **10 people found my bug before me** (the duplicate finder problem and what it means for bounties) → [Link](https://blog.himanshuanand.com/TBD/)
- **30 minutes from patch to exploit** (the React story and the death of the n-day gap) → [Link](https://blog.himanshuanand.com/2026/05/30-minutes-from-patch-to-exploit/)
- **Defender playbook for the LLM era** (practical integration patterns for defenders) → [Link](https://blog.himanshuanand.com/2026/06/defender-playbook-for-the-llm-era/)
If any of this resonated, hit me up on Twitter/X (https://x.com/anand_himanshu). And if you disagree, *especially* hit me up. I would love to hear the other side.

Thanks for reading.
