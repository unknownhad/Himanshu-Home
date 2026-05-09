---
title: "The 90 day disclosure policy is dead"
date: 2026-05-09
draft: false
tags: ["security", "llm", "disclosure", "vulnerability-management", "linux", "blog"]
author: "Himanshu Anand"
---
## TLDR
The 90 day responsible disclosure window was built for a world where bug finders were rare and exploit development was slow. That world is gone. LLMs have compressed both timelines to near-zero. I have seen it first hand, and so has everyone else paying attention. This post lays out why the old model is broken, with real stories, and makes one ask to the industry: treat every critical security issue as P0 and patch it immediately. Not tomorrow. Not next sprint. Now.
---
I have been doing security work for a while now, and the last 12 months feel different. Not in a "AI is going to take over the world" way. In a much more boring, much more practical way. The tools we use, the tools attackers use, and the tools researchers use to find bugs have all gotten smarter at roughly the same speed. And that has quietly killed some of the fundamental assumptions the security industry has been running on for over a decade. Let me walk you through what I mean, with stories.
## the old world (rest in peace)
Pretend it is 2019. You find a critical bug. You write up a report. You send it to the vendor. The vendor takes a few days to triage, a couple of weeks to fix, maybe a month to roll out. If you follow [Google Project Zero](https://googleprojectzero.blogspot.com/) style disclosure, you give them 90 days before going public. During those 90 days, you assume:
- You are probably the only person who found this bug
- Even if someone else finds it, they will take their own time
- The vendor has a comfortable head start on writing the patch
- After the patch lands, attackers need days or weeks to reverse engineer it into a working exploit
Every single one of these assumptions is now wrong.
## story 1: 10 people, 1 bug, 6 weeks
In late April, I reported a pretty bad bug to a company. I am keeping the details vague because the issue is still not patched, but the shape of it goes like this: an attacker can buy anything from the website, send back their own crafted response to the server, and because there is no signature verification on the response, the server happily accepts it. Buy a $5000 item for $0. Mark your purchase as completed without paying. Critical, easy to exploit, very bad day for the company. Cool. I write it up, I send it in, I feel good about myself for about 10 minutes.
Then the triage team comes back and says "yeah we know, first reported in March. You are reporter number eleven." **Eleven Freaking people** found the same critical bug in roughly six weeks. A friend from [BlueWater CTF](https://ctftime.org/team/137936) had flagged this pattern months ago, that LLM-assisted hunters were converging on the same bugs almost simultaneously, across totally unrelated reporters using totally unrelated workflows.
![NobodyIsNobody](/images/chat1.jpg)
![BWCTF](/images/chat2.jpg)
At first I thought, okay, same tools, same prompts, makes sense. But then I did the uncomfortable math. If 10 people reported the bug, how many found it and did **not** report it?
The same LLM that helped 10 honest researchers is also available to everyone else. It does not check your intentions at the door. Out of those 10 reporters, only 1 gets the CVE credit. Only 1 gets the bounty. What about the other 9? How many get frustrated? How many decide to sell it instead of wait? And the people who never reported it at all — they are not sitting on a 90 day clock. They are not sitting on any clock.
**The 90 day window is not protecting users. It is giving everyone who already has the bug a 90 day head start.**
## story 2: 30 minutes from patch to exploit
Recently, React patched a bunch of security issues ([CVE-2026-23870](https://nvd.nist.gov/vuln/detail/CVE-2026-23870), [CVE-2026-44575](https://nvd.nist.gov/vuln/detail/CVE-2026-44575), [CVE-2026-44579](https://nvd.nist.gov/vuln/detail/CVE-2026-44579), [CVE-2026-44574](https://nvd.nist.gov/vuln/detail/CVE-2026-44574), [CVE-2026-44578](https://nvd.nist.gov/vuln/detail/CVE-2026-44578) — if I am not wrong all reported by my friends at [Hacktron](https://hacktron.ai)) and wrote a public blog post about it. Standard practice. Show your work, explain the fix, give the community a heads up. I read the post out of curiosity. Then I thought, let me see how hard it would be to turn this patch into a working exploit. Just an experiment, on my own machine, against a local test app. **30 minutes.** From reading the patch to having a working exploit (DOS, as it was DoS only). AI did most of the heavy lifting: understanding the diff, identifying the vulnerable code path, writing the PoC. The published issue was a denial of service, but the underlying primitive could go further with more work. (Funny story, I managed to identify 1 more DoS — later I learned it was also reported by Hacktron folks, just not patched yet.)
In the old world, turning a public patch into a working exploit (n-day exploitation) took skilled reverse engineers days to weeks. That gap was the safety net. "We shipped the patch, admins have a few days to update." That safety net is gone. The gap is now measured in minutes for simple bugs, maybe hours for complex ones. The skilled reverse engineer is optional. The LLM does the boring parts and the human just steers. **The moment a patch ships, assume the exploit exists.** There is no grace period. Companies cannot afford to "schedule" patch deployment for the next maintenance window. The maintenance window is now.
## story 3: the week linux caught fire
If you want the clearest possible proof that the 90 day disclosure model is dead, look at the last two weeks of the Linux kernel. Two back-to-back critical vulnerabilities. Both with public exploits. Both affecting every major distribution. The timeline reads like a horror movie.
### act 1: copy fail
On **April 29**, [Xint Code](https://code.xint.io/) (the team behind [Theori](https://theori.io/), nine-time DEF CON CTF champions) publicly disclosed [Copy Fail](https://copy.fail/) — [**CVE-2026-31431**](https://nvd.nist.gov/vuln/detail/CVE-2026-31431). A straight-line logic flaw in the kernel crypto subsystem. No race condition needed. 100% reliable. A **732-byte Python script** that gives you root on every single Linux distribution shipped since 2017.
Every. Single. One. Ubuntu, RHEL, Amazon Linux, SUSE, all of them. One `curl | python3 && su` away from game over.
The terrifying detail: they found it using AI. About an hour of automated scanning against the kernel `crypto/` subsystem. That is it. One hour. One scanner. Nine years of exposure. For the full technical breakdown, read [Xint's writeup](https://xint.io/blog/copy-fail-linux-distributions).
Copy Fail did get a patch (mainline commit [`a664bf3d603d`](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a664bf3d603d)) and a straightforward mitigation: disable the `algif_aead` module. People started patching. Deep breath. Okay. Maybe we can handle this.
Then threat actors showed up. Iranian adversaries were observed leveraging the vulnerability to compromise Ubuntu servers and repurpose them as nodes for DDoS campaigns. A kernel privilege escalation found by AI, disclosed publicly, weaponized by nation-state actors, used to build attack infrastructure. All within days.
![meme goes here](/images/meme_mitigation.jpg)
<!-- Suggested meme: Witcher Geralt standing in front of a burning building labeled "our Linux fleet", calmly cutting a single wire labeled "algif_aead module", caption: "mitigation applied" -->
### act 2: dirty frag
**Barely one week later**, on **May 7**, researcher Hyunwoo Kim ([@v4bel](https://x.com/v4bel)) published [Dirty Frag](https://github.com/V4bel/dirtyfrag) — [**CVE-2026-43284**](https://nvd.nist.gov/vuln/detail/CVE-2026-43284) and **CVE-2026-43500**. Two chained vulnerabilities in the kernel's IPSec ESP (`esp4`/`esp6`) and RxRPC networking modules. Same bug class as Copy Fail and [Dirty Pipe](https://dirtypipe.cm4all.com/). Same page-cache corruption technique. Different attack path.
The critical part: **Dirty Frag works even if you applied the Copy Fail mitigation.** Even if you blacklisted `algif_aead`. Dirty Frag does not use that module. It takes a completely different route to the same result: unprivileged user to root, deterministically, on every major distro. Ubuntu, RHEL 10.1, openSUSE, CentOS Stream, AlmaLinux, Fedora 44. A one-liner to compile and run.
And here is where the disclosure model completely fell apart.
Hyunwoo Kim reported to `security@kernel.org` on April 29-30. He submitted patches publicly. He coordinated with the [`linux-distros`](https://oss-security.openwall.org/wiki/mailing-lists/distros) mailing list on May 7, with a 5-day embargo agreed upon. On that same day — **within hours** — an unrelated third party published detailed exploit information for the ESP vulnerability, breaking the embargo.
After consulting with the distro maintainers, Hyunwoo published the [full Dirty Frag writeup](https://github.com/V4bel/dirtyfrag/blob/master/assets/write-up.md), exploit code, and a working PoC.
**At that moment, zero Linux distributions had a patch available.**
As of today, only CVE-2026-43284 (the ESP side) has a [mainline fix](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f4c50a4034e62ab75f1d5cdd191dd5f9c77fdff4). CVE-2026-43500 (the RxRPC component) **still has no upstream patch**. And the chained exploit that combines both works on basically everything. ([Ubuntu](https://ubuntu.com/blog/dirty-frag-linux-vulnerability-fixes-available), [Red Hat](https://access.redhat.com/security/vulnerabilities/RHSB-2026-003), and [others](https://www.tenable.com/blog/dirty-frag-cve-2026-43284-cve-2026-43500-frequently-asked-questions-linux-kernel-lpe) have published their own advisories.)
Microsoft's Defender team [confirmed limited in-the-wild exploitation](https://www.microsoft.com/en-us/security/blog/2026/05/08/active-attack-dirty-frag-linux-vulnerability-expands-post-compromise-risk/) within **24 hours** of disclosure. Attackers gaining SSH access, deploying an ELF binary, popping root via `su`, modifying authentication configs, wiping session files, moving laterally. The full playbook, live, in production environments.
CTS ([@gf_256](https://x.com/gf_256/status/2052480591489122747)) summed it up in five words:
> **"responsible disclosure is dead🤦"**
[![CTS Tweet](/images/cts_tweet.jpg)](https://x.com/gf_256/status/2052480591489122747)
Yeah.
## so what is actually dead here
Let me be specific about what I think is broken beyond repair.
**The 90 day disclosure window is dead.** Not "needs reform". Not "could use some tweaking". Dead. It was designed for a world where finders were rare and exploit development was slow. LLMs have made finders abundant and exploit development fast. When 10 unrelated researchers find the same bug in 6 weeks, and AI can turn a patch diff into a working exploit in 30 minutes, what exactly is the 90 day window protecting?
Nobody. It is protecting nobody. It is just exposure with a polite name.
Copy Fail went from AI scan to public PoC to nation-state weaponization in days. Dirty Frag's embargo was broken within hours by a third party who independently found the same bug class. You cannot coordinate disclosure when the same vulnerability is being independently rediscovered by multiple researchers and AI tools at the same time. The information does not stay contained anymore. It has LLM-powered legs.
**Monthly patch cycles are dead too.** A 30 day window between vulnerability and fix assumes attackers are slower than your release train. They are not. They have been faster for a while now, and the gap is only widening. Microsoft saw Dirty Frag in the wild within 24 hours. Your monthly maintenance window is not a safety margin. It is an attack window.
**"Wait for the advisory" is dead.** If you are reading CVE descriptions while attackers are reading `git log --diff-filter=M`, you are already behind. The advisory is a downstream artifact. The patch diff is the signal.
## what the industry needs to do (and I am not sugarcoating this)
I have one ask. One. And I know it sounds extreme. I know it is a lot. But everything I have shown you above points to the same conclusion:
**Treat every critical security issue as P0 and fix it immediately.**
Not "within 24 hours". Not "in the next sprint". Not "after we assess impact". Now. As in, stop what you are doing and fix it now. I know that sounds unreasonable. I know production deployments are complicated. I know change management exists for good reasons. But the threat landscape does not care about your change management process.
Here is what "immediately" actually looks like in practice:
**If you are a vendor receiving a critical bug report**, your clock starts the moment the report lands. Not when you finish triaging. Not when engineering picks it up. The moment it lands. Because if someone reported it to you, assume 10 other people have it and at least one of them is not friendly.
**If you are a company running infrastructure**, build AI into your CI/CD pipeline yesterday. If [Xint Code](https://code.xint.io/) found Copy Fail in one hour of automated scanning, what is your excuse for not scanning your own dependencies the same way? Run patch-diff analysis on every upstream release the moment it ships. Find your exposure yourself. Do not be the company that learned about a critical kernel LPE from Twitter.
**If you are a researcher**, stop sitting on critical bugs. Push for the shortest possible disclosure window. If the vendor cannot fix it in a week, that is a vendor problem, not a disclosure problem. The old "give them time" courtesy made sense when you were the only finder. You are not the only finder anymore.
**If you are running vulnerability management**, it needs to be real-time. The old cadence of "scan weekly, triage in sprint, patch in cycle" is a timeline that attackers left behind months ago. The new maximum response time for a critical issue is hours. Not days. Hours. And even that might be too slow.
**If you are a defender**, use the same tools the attackers are using. The same LLM pipelines that attackers use to find bugs in your code can be pointed at your code *by you*, before they get there. Automated patch-diff analysis, AI-assisted code review on every PR, real-time dependency monitoring. This is not "nice to have" anymore. It is table stakes.
## final thoughts
I keep coming back to the same image in my head. It is a sysadmin reading the Dirty Frag advisory on May 7, realizing that there is no patch available, that the exploit is already public, that Microsoft is already seeing it in the wild, and that the mitigation is "disable your IPSec modules". And this person has 400 servers to touch.
That is the new reality. Not a hypothetical. Not a war game scenario. That was last Wednesday.
The 90 day disclosure policy is dead. Monthly patch cycles are dead. The assumption that you have time between disclosure and exploitation is dead. What is not dead is the ability to move fast, automate hard, and treat critical bugs like the emergencies they are.
The same AI wave that broke the old model also enables the new one. Faster patching, automated scanning, real-time threat intel, AI-assisted code review. The tools exist. The question is whether defenders will use them before attackers do.
Right now, the attackers are winning that race.
Let us fix that.
---
I will go deeper on several of these points in follow-up posts:
- **10 people found my bug before me** (the duplicate finder problem and what it means for bounties) → *coming soon*
- **30 minutes from patch to exploit** (the React story and the death of the n-day gap) → *coming soon*
- **the week linux caught fire** (Copy Fail + Dirty Frag technical deep dive) → *coming soon*
- **your CI/CD pipeline needs AI now** (the defensive playbook) → *coming soon*
If any of this resonated, hit me up on [X](https://x.com/anand_himanshu). And if you disagree, *especially* hit me up. I would love to hear the other side.
Thanks for reading.
---
