---
title: "The Anti-India Influence Machine: Troll Farms, Fake News, Newsrooms, Algorithms and AI"
date: 2026-08-14
description: "A cybersecurity-style investigation into how troll farms, fake accounts, recycled footage, news amplification, algorithms and generative AI can manufacture hatred and manipulate public sentiment about India."
author: Himanshu Anand
tags: [cybersecurity, disinformation, influence-operations, social-media, ai, india]
draft: false
---
# The Anti-India Influence Machine: Troll Farms, Fake News, Newsrooms, Algorithms and AI

![The anti-India influence machine: social engineering at internet scale](https://blog.himanshuanand.com/images/anti-india-influence/hero-influence-operation.png)

> **Scope and disclaimer:** This is a cybersecurity research article focused on India because I am from India, India is the information environment I notice most and the change became personally obvious to me after Operation Sindoor. It is not an accusation against an entire country, nationality, religion or political group. The same playbook is used against many communities around the world and this article separates verified platform attribution from research-based indications and unverified allegations. Criticism of India, the Indian government or any Indian political party is not automatically anti-India hate. The subject here is coordinated deception, fake identities, manufactured amplification and language that attacks Indians as people.

> **Content warning:** Some sections discuss racist stereotypes, threats and alleged calls for violence. I have avoided reproducing slurs or naming people from unauthenticated screenshots unless a reliable public investigation established the connection.

> **Evidence-media note:** The local evidence images are low-resolution excerpts from public takedown reports and fact-checking investigations, used here for criticism, verification and research commentary. Keep each caption and source link attached to the image, do not present an investigator's annotation as an original social-media post and review the source publisher's terms before commercial or syndicated republication. Video shortcodes load the original YouTube or Vimeo host rather than copying the video into this package.

## TLDR

I had seen anti-India posts for years and mostly treated them as the normal background radiation of the internet. After Operation Sindoor, however, my timeline began filling with the same small set of insults in places where they made no sense: Indians are dirty, Indians do not use deodorant, cow urine, cow dung, street-defecation memes and random videos from anywhere in South Asia relabelled as India. The repetition felt less like spontaneous criticism and more like somebody had handed the internet a very boring script.

The research shows that coordinated networks are real, but the phrase **"one giant anti-India botnet"** is usually the wrong model. What exists is closer to an influence supply chain in which state-linked employees, political interests, public-relations firms, fake media brands, account operators, volunteers, influencers, AI tools, genuine racists and recommendation algorithms can all play a part. Some networks are automated, many are human-operated nd most are hybrids.

The strongest public findings include:

- Meta linked one specific 2019 Pakistan-origin network to **employees of Inter-Services Public Relations or ISPR**, the Pakistani military's communications organisation. That network used 103 Facebook and Instagram assets and reached Pages followed by roughly 2.8 million accounts.
- Meta and Graphika connected a separate 2021 network to individuals associated with **AlphaPro**, a Pakistan-based PR firm. It used fake media outlets, fake identities, professional presenters, paid actors and freelance journalists to push political narratives, including material attacking India.
- Stanford Internet Observatory documented a Pakistan-based mass-reporting network that used a Chrome extension called **Auto Reporter**. Researchers identified the public developer and his company connection, but explicitly said they did not know who controlled the wider operation.
- Google removed **447 Pakistan-linked YouTube channels** across three reported quarters from late 2025 to mid-2026. The channels supported Pakistan and criticised India, although Google did not publicly identify a government sponsor.
- A 2026 report on high-engagement anti-Indian posts on X counted more than **24,600 posts from nearly 14,000 authors**, with more than **300 million reported views, 8.5 million likes and 901,000 reposts** during 2025. Much of this activity came from Western nativist and immigration politics, which is an important reminder that not every anti-Indian account is Pakistani or state-controlled.
- During the May 2025 India–Pakistan crisis, one research group collected roughly **1,200 misleading or relevant posts** across major platforms. Its closer X sample contained 437 posts, 179 from verified accounts, while only 73 had Community Notes at the time of analysis. Individual fake visuals reached millions of views.
- The visual evidence is not limited to charts. This version follows real cases involving a 2023 naval-drill image presented as a Karachi attack, Philadelphia crash footage moved to Pakistan, Gaza footage relabelled as Operation Sindoor, ARMA 3 and flight-simulator clips promoted as combat, an old Islamabad fire described as a drone strike and AI-generated stadium, surrender and captured-pilot narratives.
- BOOM documented a recurring X cluster that seeded AI-manipulated videos through handles including `@InsiderWB`, `@Baba_Thoka`, `@Hawkss_eye` and `@abubakarqassam`, alongside fake personas posing as Indian users. BOOM found strong signs of a troll-farm-style influence operation but said the ultimate operator was unknown.
- OpenAI caught an Israeli political-campaign company, **STOIC**, using AI-generated material and fake personas in an operation that briefly entered India's 2024 election conversation. OpenAI disrupted the India activity within roughly 24 hours and found little authentic reach.
- India-linked political influence networks also exist. Meta and Google have removed coordinated networks promoting Indian parties, leaders and government positions. Any article that hides this is not research; it is a fan club with footnotes.

My conclusion is not that one country controls everything. It is that **identity-based hatred has become an inexpensive cyber operation**. The target is not a server. The target is the human mind and the objective is often not to make everybody believe one perfect lie. It is to make contempt feel normal, exhaust the people being targeted, create confusion during a crisis and push regular users into doing the amplification for free.

---

## why I started looking

I had seen anti-India content before Operation Sindoor, but it never mattered enough for me to investigate. The internet has always contained people who wake up, make a good cup of tea, open a social network and immediately decide that insulting 1.4 billion strangers is a productive use of electricity. I normally scrolled past it.

After Operation Sindoor, the pattern became harder to ignore. I would open a post about Indian technology, an athlete, a company, immigration or something completely unrelated to politics and the replies would suddenly contain the same hygiene jokes. A bad video from Pakistan, Bangladesh, Nepal or an older Indian event would be posted as "India today." A discussion about foreign policy would be pulled down into cow urine and cow dung jokes within minutes. It was not the existence of one insult that stood out; it was the repeated arrival of the same payload across unrelated conversations.

At first, I assumed this was only the recommendation algorithm learning that anti-India content made me stop scrolling, that's certainly part of it. A feed is not a neutral survey of world opinion; it is a prediction engine that watches what makes us pause, open replies, argue, quote-post and come back later. The algorithm saw that I was angry and interpreted it as five-star customer feedback.

But an algorithm can amplify a pattern without creating the first pattern. That led me to a more useful question: **what is the attack chain behind the content?** Who creates the first claim, who gives it the first thousand interactions, how does it move from anonymous accounts into verified profiles and news clips, where does AI fit and what can we actually prove about the operators?

That is a cybersecurity question.

## this is cybersecurity, except the endpoint is a person

Cybersecurity people normally describe an attack using assets, adversaries, infrastructure, tactics, techniques and impact. We ask how the attacker performed reconnaissance, created resources, established access, evaded detection, maintained persistence and achieved an objective. Influence operations can be studied in almost the same way, except the final endpoint is not a Linux server or an employee laptop. The endpoint is a person's perception of another person.

The [DISARM Red Framework](https://www.disarm.foundation/framework) exists for exactly this reason. It provides a common language for documenting influence operation behaviour, in the same broad spirit that [MITRE ATT&CK](https://attack.mitre.org/) provides a common language for technical adversary behaviour. The details are different, but the analyst's job is familiar: collect indicators, connect infrastructure, measure coordination, separate confidence from speculation and avoid declaring attribution because two accounts used the same meme.

![An influence operation described as a cybersecurity kill chain](https://blog.himanshuanand.com/images/anti-india-influence/influence-kill-chain.png)

A simplified influence-operation kill chain looks like this:

1. **Reconnaissance:** Find an angry audience, a political fault line, a vulnerable community and a stereotype that already produces engagement.
2. **Resource development:** Create fake personas, pages, websites, Telegram groups, backup accounts and a library of reusable videos and images.
3. **Seeding:** Publish the first claim, fake news report, meme or edited clip.
4. **Amplification:** Use coordinated accounts, paid influencers, volunteers, advertisements and reply brigades to create the appearance of momentum.
5. **Laundering:** Move the claim through verified accounts, news channels, short-video pages and WhatsApp until the original anonymous source disappears.
6. **Impact:** Change sentiment, create panic, exhaust critics, intimidate a community, damage trust or make hostility feel socially acceptable.

The original accounts do not need to convince the whole internet. They only need to push the content across the first few trust boundaries. Once real people become angry, frightened or patriotic enough to share it, the operation gains an enormous unpaid workforce.

## is it actually a botnet?

In technical security, a botnet is a collection of compromised or automated systems controlled by an operator. Social media discussions use the word much more loosely, often meaning "many accounts I dislike." That creates bad analysis because a coordinated influence network can contain several different kinds of participants at the same time.

Some accounts may be fully automated. Others may be controlled by a human operator managing dozens of profiles, while another group uses scheduling software, AI generated replies and prewritten message templates. There may also be genuine volunteers following instructions in a private group, paid account farms, influencers who understand exactly what they are promoting, influencers who do not ask enough questions nd ordinary users who simply repeat a viral joke.

![Sometimes a botnet is a group chat with funding and unhealthy ambition](https://blog.himanshuanand.com/images/anti-india-influence/meme-group-chat-with-ambition.png)

The better term is often **coordinated inauthentic behaviour**. The important features are not only automation they are deceptive identity, hidden coordination and an attempt to manipulate public debate. A hundred humans pretending to be a thousand independent citizens can be more persuasive than a thousand obvious bots.

This also explains why bot detection websites frequently disappoint people. Posting frequency, account age and repetitive language are useful signals, but none of them is conclusive alone. A news bot can be harmless, a very online human can post every three minutes and a professional influence operator can deliberately behave slowly to look normal. The strongest finding comes from several correlated indicators: shared infrastructure, unusual phrase reuse, synchronized timing, common administrators, repeated early engagement and cross-platform coordination.

## evidence before vibes

The easiest way to ruin an investigation is to mix three different evidence levels into one dramatic conclusion. A platform attribution based on internal login and infrastructure data is not equal to a screenshot from a private group and a network being linked to a country is not automatically evidence that the government of that country ordered it.

![Three evidence levels used in this article](https://blog.himanshuanand.com/images/anti-india-influence/evidence-ladder.png)

I use three labels throughout this article:

- **Platform-attributed:** A platform such as Meta, Google or OpenAI investigated the network using internal signals that outsiders cannot normally access. This is the strongest public evidence available, although the public report may still omit details.
- **Research-linked:** Independent researchers found shared employees, domains, administrators, content assets, posting patterns or other connections, but the final client or command chain remains unknown.
- **Alleged or unverified:** A screenshot, anonymous document or social media thread makes a claim that has not been independently authenticated with original records and supporting evidence.

The country question needs another warning because it is where online discussions lose their minds fastest.

![Country linkage organisation linkage and government command are different claims](https://blog.himanshuanand.com/images/anti-india-influence/country-attribution-not-government.png)

These three sentences are not interchangeable:

1. A network was linked to accounts operating from Pakistan.
2. A network was linked to employees of a named Pakistani organisation.
3. Pakistan's government ordered and funded the operation.

Evidence for the first sentence does not automatically prove the third. In one important 2019 case, Meta did reach the second level by linking a network to employees of Pakistan's ISPR. In many other cases, Google reported only that an operation was linked to Pakistan and did not name a state sponsor. Both findings matter, but they are not the same finding.

The same caution applies everywhere else. Content originating on a China-based platform is not automatically a Chinese-government campaign. A network operating from India is not automatically controlled by the Indian government. An Israeli company running an influence operation does not mean "Israel controls the internet." Attribution should become more specific only when the evidence becomes more specific.

## the numbers that made me stop scrolling

A 2026 report from the Network Contagion Research Institute examined high engagement anti-Indian posts on X during 2025. The sample included posts with at least ten likes and excluded posts originating in India, so this was not a complete census of every hateful post. It was a study of material that had achieved at least some traction outside India.

![Reported scale of high-engagement anti-Indian content on X in 2025](https://blog.himanshuanand.com/images/anti-india-influence/anti-indian-hate-metrics.png)

The reported dataset contained:

| Metric | Reported figure |
|---|---:|
| High-engagement anti-Indian posts | More than 24,600 |
| Authors | Nearly 14,000 |
| Views or impressions | More than 300 million |
| Likes | 8.5 million |
| Reposts | More than 901,000 |
| Change in weekly volume during 2025 | Approximately 3× |

The research also found that a very small number of prolific accounts captured a disproportionate share of engagement. Three accounts produced more than ten percent of the likes and twenty percent of the reposts in the dataset, according to the report's published summaries. This is a classic power law pattern: most accounts contribute a little, while a small number of high-output or high-reach nodes shape what everybody else sees.

There are two important caveats. First, 300 million views do not mean 300 million unique people. One person can see the same post more than once, automated traffic can create impressions and platforms count views differently. Second, much of the material in this dataset was tied to Western immigration politics, H-1B arguments, nativist communities and "replacement" narratives. It would be dishonest to look at those numbers and declare that one neighbouring country created all of it.

That second point is central to this investigation. The anti-Indian hate market has several suppliers. A geopolitical operator may want to damage India's reputation. A Western extremist may want to attack Indian immigrants. An engagement farmer may not care about either issue and simply notice that a deodorant joke produces replies. These actors do not need to coordinate with one another because the platform gives all of them the same incentive: content that makes people angry travels farther.

A large PNAS study of more than 2.7 million political posts found that posts mentioning an opposing group were shared roughly twice as often as posts about the in-group. Each additional term referring to the political out-group increased the odds of sharing by 67 percent in that study. The research was about US political groups rather than India, but it helps explain the machinery: attacking an out-group is unusually effective engagement bait. [Read the PNAS paper](https://www.pnas.org/doi/10.1073/pnas.2024292118).

## Operation Sindoor: when every flight simulator became a war correspondent

My personal observation became much stronger after Operation Sindoor in May 2025 and independent research shows that the wider information environment was flooded during the crisis. The Center for the Study of Organized Hate collected roughly 1,200 relevant posts across X, Facebook, Instagram and YouTube while studying misinformation and disinformation around the India–Pakistan confrontation.

Its closer analysis of X covered 437 posts. Of those, 179 came from verified accounts, while only 73 had Community Notes at the time of analysis. Verification did not guarantee accuracy; in several cases, it simply gave a false claim a nicer badge and a faster launch.

![Key findings from the Operation Sindoor misinformation report](https://blog.himanshuanand.com/images/anti-india-influence/csoh-key-findings.png)

![Audit numbers from the Operation Sindoor misinformation report](https://blog.himanshuanand.com/images/anti-india-influence/operation-sindoor-audit.png)

The false visuals were not small. The report documented an AI-generated image claiming that Rawalpindi Cricket Stadium had been destroyed which received around 9.6 million views, 129,000 likes and 12,700 reposts. Flight-simulator footage presented as real combat received roughly 2.2 million views, while separate video-game clips received around 1.6 million and 1.3 million views. Old Gaza footage relabelled as part of the India–Pakistan crisis received about 727,000 views.

![Reported reach of several false visuals during Operation Sindoor](https://blog.himanshuanand.com/images/anti-india-influence/viral-falsehood-views.png)

![A page from the CSOH report showing AI-generated stadium claims](https://blog.himanshuanand.com/images/anti-india-influence/csoh-ai-stadium.png)

![Apparently every flight simulator with dramatic music is now a defence correspondent](https://blog.himanshuanand.com/images/anti-india-influence/meme-flight-simulator-breaking.png)

The report found misleading content on both sides. Pakistan linked accounts circulated recycled footage, video game clips and fabricated claims about Indian losses. Indian influencers and television channels also amplified false victory claims and unrelated visuals. This is where a patriotic article could conveniently stop reading, but the evidence refuses to cooperate. Information warfare is reciprocal and the lie does not become clean because it arrives wrapped in the tricolour.

The [Reuters Institute's account of Indian fact-checkers during the crisis](https://reutersinstitute.politics.ox.ac.uk/news/truth-casualty-how-indian-fact-checkers-debunked-false-claims-during-india-pakistan-crisis) describes the first hours as producing roughly a month's normal volume of misinformation. One fact-checker had examined about 70 unique false posts by the end of 7 May. The same material moved from X into television, Facebook, WhatsApp and Instagram, which meant a false claim could escape the original account long before a correction arrived.

The Indian government later said that more than [1,400 URLs were ordered blocked during Operation Sindoor](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2150213). That number shows the size of the government response, but it should not be misread as proof that all 1,400 URLs belonged to one network or that every block decision was independently verified. A block order is an enforcement action, not a forensic attribution report.

## the visual case files: opening the packet capture

Charts are useful, but disinformation is easier to understand when we put the claim beside the source material and follow the route it travelled. This section therefore works like a small incident-response notebook. For every example, I separate the **payload** that people saw, the **original artefact** that investigators found, the **distribution path** and the **confidence level**. I am not claiming that every account shown below belonged to one command centre. Some cases show coordination, some show opportunistic copying and some show mainstream newsrooms turning an unverified social-media post into a national broadcast before anybody had located the reverse-image-search button.

The screenshots below are low-resolution excerpts from public takedown reports and fact-checking investigations, included for criticism, verification and public-interest research. Each image links back to the report or article that explains it. A screenshot proves that an account published a particular post; it does not, by itself, prove who controlled the account or who paid for the campaign.

### case 1: an old roadside fire became an Indian drone strike

Pakistan-side misinformation used the same context-replacement method. Posts claimed a fire near Islamabad's Faisal Mosque showed damage from an Indian drone attack. AFP traced the footage to local reporting from **28 May 2024**, when a roadside fire occurred near the mosque during a heatwave. An AFP reporter visited the mosque after the 2025 posts circulated and found no evidence of attack damage, while Islamabad's deputy commissioner publicly said the rumour was false.

![An older fire near Faisal Mosque was reframed as an Indian drone strike by several accounts](https://blog.himanshuanand.com/images/anti-india-influence/real-csoh-faisal-mosque.png)

*Source: [CSOH report, page 33](https://www.csohate.org/wp-content/uploads/2025/05/Report_CSOH_Inside-the-Misinformation-and-Disinformation-War-.pdf), independently verified by [AFP Fact Check](https://factcheck.afp.com/doc.afp.com.46X649D).*

This example matters because it is a near mirror image of the Karachi cases. On one side, old footage became evidence of an Indian victory. On the other, old footage became evidence of an Indian attack. The flags changed, but the exploit was identical: take a real frightening visual, overwrite its metadata in the caption and publish while the audience is too alarmed to ask why the same video existed a year earlier.

### case 2: an ARMA 3 simulation became evidence of an Indian aircraft being shot down
The same trick worked in the opposite direction. The Quint traced a viral clip claiming to show the Pakistan Air Force shooting down an Indian aircraft to an **ARMA 3 simulation** uploaded by the YouTube channel BattleDragons on 25 December 2024. The original description openly called it a military simulation. The false posts simply removed that inconvenient detail, which is the misinformation equivalent of deleting `README.md` and calling the malware undocumented.

![The Quint compared a viral combat claim with the ARMA 3 simulation source](https://blog.himanshuanand.com/images/anti-india-influence/real-quint-arma3-false.webp)

*Source: [The Quint WebQoof fact-check](https://www.thequint.com/news/webqoof/arma-3-game-simulation-viral-as-pak-attacking-india-fact-check).*

Here is the older simulation clip identified by The Quint as the source material:

{{< youtube QsbkF7tZiys >}}

**Verification method:** extract key frames, run reverse-image searches, compare the scene with older uploads and inspect descriptions or interfaces that identify the game. This is basic OSINT, but it works because many operators rely on speed and audience emotion rather than perfect fabrication.


### case 3: the white flag appeared in several versions

CSOH also documented a Pakistan-side campaign claiming the Indian Army had raised a white flag to surrender. Multiple users shared the same narrative with small wording changes, while the visual evidence included unrelated footage and an image openly marked as AI-generated by one publisher. The repeated message created the appearance of several independent confirmations even though the source material did not support the claim.

![Several accounts repeated a false Indian surrender narrative using unrelated or synthetic visuals](https://blog.himanshuanand.com/images/anti-india-influence/real-csoh-white-flag.png)

*Source: [CSOH report, page 35](https://www.csohate.org/wp-content/uploads/2025/05/Report_CSOH_Inside-the-Misinformation-and-Disinformation-War-.pdf).*

This is a common influence technique called **false consensus**. The audience does not see one unsupported claim; it sees six accounts apparently confirming one another. If the accounts have different logos, writing styles and follower communities, the repetition feels independent even when all roads lead to the same weak source.

### case 4: synthetic prisoners and the fake capture of Shivangi Singh

The report found a sustained AI-driven narrative falsely claiming that Indian Squadron Leader Shivangi Singh had been captured. The package included synthetic images, fake audio and clips claiming to show her in custody. A related fabricated video depicted Indian military personnel surrendering. This is more dangerous than a generic explosion image because it attaches a fake event to an identifiable person, potentially affecting the person's family, colleagues and public safety while the country is in a military crisis.

![AI-generated images, audio and videos were used in false claims about Squadron Leader Shivangi Singh](https://blog.himanshuanand.com/images/anti-india-influence/real-csoh-shivangi-ai.png)

*Source: [CSOH report, page 37](https://www.csohate.org/wp-content/uploads/2025/05/Report_CSOH_Inside-the-Misinformation-and-Disinformation-War-.pdf).*

The personal cost is easy to miss when we talk only about "narratives." A fake casualty or capture report can reach relatives before an official channel does. It can lead to harassment of the named person, panic among military families, pressure on authorities to respond to something that never happened and a permanent cloud of search results that survives after the correction.


The cases above are the ones I wanted to put first because they show the kind of manipulation that originally made me investigate this subject: false or synthetic narratives aimed at India, Indian institutions and Indian people. The mirror-image failures from Indian accounts and newsrooms matter too, but I have deliberately kept them later in the article so the threat model is clear before we examine our own side.

## names and handles, with a very large evidence label

The following table is not a blacklist and should not be read as one. It groups public names according to **what the evidence actually establishes**. A page listed in a platform-attributed takedown is different from an account that a fact-checker saw posting several deepfakes and both are different from a television channel that aired one false clip. I am including the names because hiding every identifier makes the research impossible to audit, but the label beside each name is more important than the name itself.

| Public page, handle or outlet | What the public evidence says | Evidence category | What not to conclude |
|---|---|---|---|
| **Pakistan Cyber Defence News**, **Kashmir News**, **Gilgit Baltistan Times**, **Kashmir for Kashmiris**, **Painter's Palette**, **PakistaN Army — the BEST** | DFRLab identified these among pages in the 2019 network that Meta removed; Meta linked the overall network to employees of Pakistan's ISPR. | **Platform-attributed network assets** | The public record does not identify which employee ran each page or prove that every follower knew it was coordinated. |
| **CJ Post**, **Pakistan Media Check**, **Islamabad Press**, **Asal Baat / Real Talk** | Meta, Graphika and Coda described these as pages posing as media outlets inside the 2021 AlphaPro-associated network. CJ Post used a Fiverr actor as a fictional news presenter. | **Platform-attributed / research-linked fake media** | The identity of the final paying client was not publicly established and some hired presenters may not have known how their work would be used. |
| `@InsiderWB`, `@Baba_Thoka`, `@Hawkss_eye`, `@abubakarqassam` | BOOM identified these as recurring seed accounts for AI-manipulated videos targeting India. X's "About this account" information showed Pakistan as their location, according to BOOM. | **Research-identified suspicious cluster** | BOOM explicitly said it was unclear who controlled the campaign. Location metadata is not proof of government command. |
| `@akrittisharma`, `@TaraSharma02`, `@Kussikhuelafn` | BOOM documented these as fake personas imitating Indian users with tricolour imagery and political slogans while X metadata showed Pakistan as their location. | **Research-identified inauthentic personas** | A patriotic profile picture is not proof by itself; the finding came from the wider identity and metadata pattern. |
| `@Mushk_0` | BOOM documented this account sharing four deepfake videos falsely claiming that Sonam Wangchuk had died in custody. | **Documented synthetic-media distributor** | One documented account does not establish the size or sponsor of the wider network. |
| `@amnofc`, `@SonOfBharat7`, `@MeghUpdates` | CSOH documented these handles publishing specific false or miscaptioned Operation Sindoor visuals that received between hundreds of thousands and millions of views. | **Documented false-content amplification** | This alone does not prove they are bots, paid operators or members of one covert organisation. |
| **The Jaipur Dialogues**, **Kreately Media**, `@erbmjha`, **Voice of Hindus**, **Cyber Hunts** | CSOH documented near-identical radiation-emergency claims, reused imagery and a fabricated letter within a synchronized narrative. | **Research-indicated coordination around a claim** | The report does not establish a foreign sponsor or prove that every employee or follower participated. |
| **ABP Ananda, Zee News, Aaj Tak, India Today, TV9 Bharatvarsh** and other named Indian outlets | Alt News and CSOH documented specific false or unverified Operation Sindoor visuals and claims appearing in broadcasts or online reports. | **Mainstream amplification failure** | A bad broadcast is not automatically a troll farm or covert state operation. The issue here is verification failure and trust laundering. |
| **Samaa TV, GNN News, Dunya News, Pakistan Today** and other named Pakistani outlets | CSOH documented sensational, false or unverified claims on the Pakistan side of the same crisis. | **Mainstream amplification failure** | The evidence does not show that every false report came from one command channel. |

The strongest list is the first one because the pages were part of a network removed by Meta and attributed at the organisational-employee level. The BOOM list is useful but belongs one confidence step lower: it is a well-documented cluster with suspicious behaviour and repeated synthetic media, while the ultimate operator remains unknown. The last two rows should be read as editorial incident reports, not attribution. A newsroom can become an unwilling amplifier because it is careless, competitive or ideologically excited; none of those explanations requires a secret payroll.

![Examples of pages from the 2019 Pakistan-origin network removed by Meta](https://blog.himanshuanand.com/images/anti-india-influence/real-meta-ispr-sample-1.jpg)

![More samples from the same removed network, including Kashmir and anti-Indian-military material](https://blog.himanshuanand.com/images/anti-india-influence/real-meta-ispr-sample-2.jpg)

*Source: Facebook/Meta takedown samples republished by [Dawn](https://www.dawn.com/news/1473232). Dawn reported that DFRLab identified the page names from the removed dataset.*

![DFRLab screenshot of Pakistan Cyber Defence News, one of the pages in the removed network](https://blog.himanshuanand.com/images/anti-india-influence/real-dfrlab-pakistan-cyber-defence-news.png)

*Source: [DFRLab, Pakistan Army's Covert Social Network](https://medium.com/dfrlab/pakistan-armys-covert-social-network-23ce90feb0d0).*

The page samples are important because they show the disguise. A covert network does not need every page to say "official military propaganda department." It can use hobby pages, Kashmir community pages, military fan pages, local-news brands and apparently harmless cultural accounts. The diversity is part of the security model: each page reaches a different audience and makes the wider network look less centralised than it is.

## the fake-news laundering pipeline

A rumour becomes dangerous when it stops looking like a rumour. The original anonymous account may have twelve followers and a profile photo stolen from a dentist in another country, but that does not matter if a verified influencer reposts it, a television channel puts it inside a red "BREAKING" frame, a short video account removes the source nd somebody forwards the clip into ten family groups.

![How anonymous misinformation gets laundered into common knowledge](https://blog.himanshuanand.com/images/anti-india-influence/news-laundering-pipeline.png)

Each hand off adds borrowed credibility. The influencer implies that the claim is important the news clip implies that a newsroom checked it. The WhatsApp forward implies that a trusted relative believes it. By the time the content reaches most people, the original account and its suspicious behaviour have disappeared.

This is why news organisations are part of the attack surface. They may not be part of the hostile network, but they can become high-trust relay infrastructure when speed beats verification. In a technical intrusion, an attacker compromises a trusted service to reach more victims. In an information operation, a false claim compromises the credibility of a trusted broadcaster and uses that credibility to reach millions.

The correction then faces a completely different problem. The false clip is short, emotional and easy to understand. The correction requires reverse image search, timestamps, geolocation and an explanation of where the original footage came from. The lie has dramatic music and d correction has a PDF.

## case file 1: the network Meta linked to Pakistan's ISPR

The strongest public attribution in this investigation comes from [Meta's April 2019 coordinated-behaviour report](https://about.fb.com/news/2019/04/cib-and-spam-from-india-pakistan/). Meta removed a Pakistan-origin network containing 24 Facebook Pages, 57 Facebook accounts, seven Facebook Groups and 15 Instagram accounts, for a total of 103 assets.

Approximately 2.8 million accounts followed one or more of the Facebook Pages. Roughly 4,700 accounts had joined the Groups, around 1,050 followed the Instagram accounts and the operation had spent only about $1,100 on advertising. The content discussed the Indian government, political leaders, the military, Kashmir and other regional subjects, while some Pages presented themselves as general news or community resources.

Meta said its investigation linked the activity to **employees of ISPR**, the Pakistani military's public-relations organisation. That is unusually specific platform attribution and should not be diluted into "probably some trolls." Meta had internal access to signals such as account relationships, administration and technical behaviour that outside observers could not see.

It is equally important not to inflate the finding. The public report did not name the individual employees, identify the officer who may have approved the activity, publish internal orders or establish that every later Pakistan-linked operation belonged to the same team. The accurate statement is that Meta linked **this specific network** to employees of ISPR. The inaccurate statement is that ISPR controls every anti India account on the internet.

The advertising number is also interesting. A network reaching Pages followed by millions of accounts had spent only around $1,100 on ads. Influence operations do not always need enormous media budgets when they can build Pages over time, reuse existing communities and persuade real users to distribute the content. The expensive part may be the patient construction of trust, not the final promoted post.

## case file 2: AlphaPro or the troll farm that put on a blazer

In 2021, Meta removed another Pakistan-origin network containing 40 Facebook accounts, 25 Pages, six Groups and 28 Instagram accounts. Meta linked it to individuals associated with **AlphaPro**, a Pakistan-based public-relations firm. [Meta's report is available here](https://about.fb.com/news/2021/06/may-2021-coordinated-inauthentic-behavior-report/).

Graphika independently analysed the network and found something more sophisticated than a pile of low-quality anonymous accounts. The operation used pages posing as independent media outlets, fake identities, stolen profile photographs, original video production, professional script readers, paid actors and freelance journalists acting as presenters. The network promoted narratives supportive of Pakistan and its armed forces, backed the China–Pakistan Economic Corridor and published material denigrating India or highlighting attacks by Hindu nationalists against religious minorities.

[Graphika's report](https://www.graphika.com/reports/lights-camera-coordinated-action) found multiple connections between the network and AlphaPro, including suspended accounts belonging to employees, pages promoting AlphaPro-produced material and overlap with the company's commercial marketing activity. Graphika also found open-source links between AlphaPro and ISPR.

However, Graphika did **not** find a direct connection proving that the 2021 AlphaPro-associated operation and the 2019 ISPR-linked operation were the same network. It also did not publish a client contract, payment trail or order showing who commissioned the campaign. That missing layer matters because a contractor can perform the hands-on work while keeping the beneficiary one step away from the keyboard.

This is influence-as-a-service. A client wants a narrative, a marketing firm supplies fake media brands, presenters, accounts and distribution and the public sees what appears to be independent journalism. It is basically a managed security service provider, except the service is making the internet worse.

![The influence supply chain from client objective to algorithmic distribution](https://blog.himanshuanand.com/images/anti-india-influence/influence-supply-chain.png)

The AlphaPro case is useful because it breaks the "government employee manually runs every troll account" mental model. Modern influence campaigns can be outsourced through commercial firms, just as advertising, analytics and software development are outsourced. That makes attribution harder, provides plausible deniability and creates a market in which the same company skills used for ordinary brand marketing can be applied to hidden political persuasion.

## case file 3: Auto Reporter and the mass-reporting machine

Influence operations do not only spread content. They can also attempt to remove opposing content by abusing platform moderation systems.

In August 2020, Facebook removed 103 Pages, 78 Groups, 453 Facebook accounts and 107 Instagram accounts in a Pakistan-based coordinated network. The company shared part of the network with Stanford Internet Observatory, whose researchers found that it organised mass reporting against accounts viewed as critical of Islam, Pakistan's government or military and in some cases members of the Ahmadi religious community. The network primarily targeted users in Pakistan and India.

The operation had access to Pages followed by about 70,000 accounts and Groups containing roughly 1.1 million members. Researchers identified 208 targeted profiles that were no longer available, but they could not establish that the reporting operation caused those suspensions. Some targets may have independently violated Facebook policies, so "reported by the network" and "removed because of the network" are different claims.

A key tool was a Chrome extension called **Auto Reporter**, which automated parts of the reporting workflow. Stanford reported that the extension had more than 2,000 users and included delays that appeared designed to reduce detection, including a pause after batches of reports.

![Stanford report page describing the Auto Reporter tool](https://blog.himanshuanand.com/images/anti-india-influence/stanford-auto-reporter.png)

Stanford identified the extension's public developer as Nasir Ali, who at the time described himself as founder and chief executive of **Tigerzplace**. Researchers also documented related public pages containing pro-Pakistan and anti-India material. That establishes a connection to the tool development layer.

It does not automatically establish that the developer selected every target, controlled all the accounts, received orders from a government organisation or managed the entire campaign. A person who writes a tool may also operate it, but that requires separate evidence. The researchers' final conclusion was deliberately cautious: they did not know who controlled the wider operation.

![Stanford's conclusion that the wider controller remained unknown](https://blog.himanshuanand.com/images/anti-india-influence/stanford-unknown-controller.png)

[Read the full Stanford Internet Observatory report](https://fsi-live.s3.us-west-1.amazonaws.com/s3fs-public/20200901_pakistan_report.pdf).

The mass-reporting case is important for regular users because it targets their ability to speak, not only their ability to know what is true. A coordinated group can flood a moderation system with complaints, create the appearance that a target is widely violating rules and force the victim to spend days appealing. Even when the platform eventually restores the account, the interruption may arrive during the exact political event when the person's voice matters most.

## case file 4: 447 Pakistan-linked YouTube channels in three quarters

Google's influence-operation bulletins show that Pakistan-linked campaigns supporting Pakistan and criticising India continued into 2026. Google reported removing 170 YouTube channels in the fourth quarter of 2025, 127 channels in the first quarter of 2026 and 150 channels plus one advertising account in the second quarter of 2026.

That is a total of **447 channels across three reported quarters**.

![Pakistan-linked YouTube channels removed by Google across three quarters](https://blog.himanshuanand.com/images/anti-india-influence/google-pakistan-linked-channels.png)

The original Google reports are:

- [Threat Analysis Group bulletin, Q4 2025](https://blog.google/threat-analysis-group/tag-bulletin-q4-2025/)
- [Influence Operations Bulletin, Q1 2026](https://blog.google/security/influence-operations-bulletin-q1-2026/)
- [Influence Operations Bulletin, Q2 2026](https://blog.google/security/influence-operations-bulletin-q2-2026/)

These numbers prove repeated platform enforcement against Pakistan-linked networks with a clear pro-Pakistan and anti-India orientation. They do not prove that all 447 channels were one continuous network, that 447 separate humans operated them or that a Pakistani government organisation funded them. Google's public bulletins identify origin and content orientation but usually do not reveal the complete sponsor or contractor chain.

That may feel unsatisfying, but "unknown sponsor" is a valid research result. Cybersecurity reports routinely identify malware infrastructure, command patterns or regional operators without naming the final customer. Influence analysis should be allowed the same honesty.

## case file 5: the BOOM cluster and AI deepfakes on X

By late 2025, the operation had moved beyond recycled explosion footage. BOOM documented a cluster of X accounts repeatedly seeding AI-manipulated videos, fake quotes, bogus letters and fabricated news articles aimed at India's military, political leadership and internal social tensions. BOOM said X's "About this account" feature showed Pakistan as the location for the central accounts it examined, but it also stated that **the identity of the operator remained unclear**.

The recurring seed handles named by BOOM were `@InsiderWB`, `@Baba_Thoka`, `@Hawkss_eye` and `@abubakarqassam`. The investigators also found fake personas such as `@akrittisharma`, `@TaraSharma02` and `@Kussikhuelafn` presenting themselves as Indian users with tricolour imagery or political slogans while the platform metadata showed Pakistan as their location. Some central accounts deleted posts after fact-checks, periodically purged their histories or were later withheld or suspended, which made the final network size difficult to estimate.

One doctored video posted by `@Baba_Thoka` falsely made Army chief General Upendra Dwivedi appear to say that the military would reduce non-Hindu soldiers by more than 50 percent. BOOM compared it with the original footage and reported that two voice-analysis systems found strong evidence of an overlaid AI voice. Another account, `@Mushk_0`, shared four deepfake videos falsely claiming that climate activist Sonam Wangchuk had died in custody. BOOM also documented synthetic videos using the faces or voices of journalists to push a fabricated financial link between Indian political figures and a Pakistani party.

![A BOOM example showing how a public statement was turned into an AI voice deepfake](https://blog.himanshuanand.com/images/anti-india-influence/real-boom-deepfake-alert.jpg)

*Source: [BOOM's synthetic-media investigations](https://www.boomlive.in/fact-check/the-x-accounts-distorting-indias-reality-online-through-ai-powered-fakes-30155). This graphic is an example from BOOM's fact-checking coverage; it is not proof that every account in the wider cluster distributed this exact clip.*

This cluster is important because it shows an operational shift. Recycled media is fast but limited by whatever old footage the operator can find. AI allows a campaign to manufacture the missing sentence, insert it into the mouth of a real official and publish the clip while the official's original speech is still in the news cycle. It is essentially quote injection against a human identity.

The attribution line still matters. BOOM described behaviour consistent with a troll-farm-style influence operation: synchronized activity, rapid amplification, central seed accounts and fake Indian personas. It did **not** publish evidence proving that a government department ordered the campaign. The safe conclusion is that BOOM identified a Pakistan-located, coordinated-looking cluster using large amounts of synthetic media; the ultimate controller and client were not publicly established.

That may sound less exciting than "AI BOT ARMY EXPOSED," but it is much more useful. A cybersecurity analyst does not convert an IP address into a cabinet-level attribution without intermediate evidence. We should not convert a country label in X metadata into an intelligence-agency command structure either.

## AI joins the night shift

AI did not invent propaganda, fake newspapers, sockpuppet accounts or racial stereotypes. It makes all of them cheaper to produce, easier to translate and faster to adapt.

![AI increases production while humans still choose the mission](https://blog.himanshuanand.com/images/anti-india-influence/ai-intern-not-general.png)

An operator can use a generative model to create hundreds of variations of the same comment, which helps avoid exact-duplicate detection. AI can translate a slogan into several languages, generate names and biographies for fake personas, create profile images, summarise news, draft fake articles, produce political cartoons and write replies that make an account appear conversational. It can also help with simple scripts, website maintenance and the boring operational work that previously required a larger team.

Humans still choose the target, grievance, political objective, launch time and acceptable level of risk. AI is the intern who never sleeps; it is not the general.

A confirmed India-related example appeared in [OpenAI's investigation of "Zero Zeno"](https://openai.com/index/disrupting-malicious-uses-of-ai-zero-zeno/). OpenAI connected the operation to **STOIC**, an Israeli political-campaign-management company. In May 2024, part of the network began generating English-language comments aimed at Indian audiences, criticising the BJP and praising Congress. Accounts also shifted between unrelated campaigns and used generated material for persona building and replies.

OpenAI disrupted the India-focused activity less than 24 hours after it began. More importantly, it found little authentic engagement outside the operation's own inauthentic accounts and rated the campaign as Category 2 on a six-level influence scale. That is useful evidence against both complacency and panic: foreign commercial interference happened, but the specific campaign did not appear to persuade a large real audience.

OpenAI later said it had disrupted more than 40 malicious networks between February 2024 and October 2025 and its broad conclusion was that threat actors were adding AI to existing playbooks rather than gaining a magical new capability. [OpenAI's October 2025 report](https://openai.com/global-affairs/disrupting-malicious-uses-of-ai-october-2025/) describes AI as a productivity tool inside larger systems involving websites, social accounts and human operators.

Meta reached a similar conclusion after the major 2024 elections. Generative AI gave covert influence networks incremental gains in content production, but many operations still struggled to build authentic audiences. [Meta's election review](https://about.fb.com/news/2024/12/2024-global-elections-meta-platforms/) is worth reading because it separates the scary capability to generate content from the much harder capability to earn trust.

The main AI risk is therefore not one fully autonomous army making perfect decisions. It is that ten mediocre operators can now produce the volume, language coverage and visual variety that previously required a much larger organisation. The cost of trying a campaign falls, so more actors can afford to fail repeatedly until something catches fire.

### the ceasefire ended; the synthetic editor did not clock out

The May 2025 crisis created a large library of speeches, press conferences, interviews and television clips involving Indian military officers and politicians. Once those clean source videos were online, an influence operator no longer needed to invent an entire scene. The easier attack was to keep the real face, uniform, studio and camera angle, replace the audio, adjust the mouth movement and publish the counterfeit sentence while the original event was still familiar to the audience.

This is a form of **synthetic quote injection**. It resembles business-email compromise more than a traditional fake photograph: the attacker borrows a trusted identity and uses it to deliver a message the real person never sent.

In July 2026, AFP examined a video that appeared to show newly appointed Indian Army chief General Dhiraj Seth speaking in English about hidden Indian deaths during Operation Sindoor and accusing the previous military leadership of misleading the government. AFP traced the pictures to his real 1 July speech, where he spoke mainly in Hindi about military strategy and did not make those claims. Hive Moderation assessed the altered clip as **97.6 percent likely to contain AI-generated speech**. Detection scores should not be treated as magic truth machines, but in this case the score supported stronger provenance evidence: the original recording existed and contained different words.

The authentic speech used as source material is embedded below. Watching the original is often more useful than staring at one suspicious lip movement because it lets a reader compare the language, pacing, audio and complete context.

{{< youtube fQMD8_HKPfk >}}

[Read AFP's full verification of the manipulated General Dhiraj Seth clip](https://factcheck.afp.com/doc.afp.com.B96J8KF).

On 14 August 2026, AFP published another investigation involving an altered video of Congress MP Shashi Tharoor. Social-media posts made him appear to praise Pakistan's diplomatic position, criticise Narendra Modi and describe Indian diplomacy as ineffective. AFP found that the visual source was an older NDTV interview from 9 April about Pakistan's role in Middle East ceasefire talks, months before the agreement discussed in the false caption. Tharoor's press team said the circulating version was fake, the original interview contained no such criticism and Hive Moderation assessed the counterfeit speech as **97.2 percent likely to be AI-generated**.

Here is the authentic NDTV interview that supplied the face, studio and visual credibility:

{{< youtube rXgGmg_FoJ4 >}}

[Read AFP's full verification of the altered Shashi Tharoor video](https://factcheck.afp.com/doc.afp.com.C4DA29E).

A third AFP investigation, published on 11 August 2026, concerned an image used to claim that an Indian official had secretly joined a protest connected to Pakistan-administered Kashmir. Investigators found the original rally footage and showed that a different person stood in the crowd. The circulating image had placed an Indian official's face over that person's face, while a separate portrait in the graphic actually showed another Indian diplomat. AFP reported that OpenAI's verification system detected a SynthID watermark and concluded that the altered image had been generated using OpenAI tools.

[Read AFP's image-provenance investigation](https://factcheck.afp.com/doc.afp.com.C43J9G4).

I have linked these AFP reports rather than copying their photographs into the local image folder because AFP's page carries explicit restrictions on commercial republication. That is also a useful reminder for researchers: proving that a picture is fake does not make the fact-checker's comparison graphic copyright-free. Evidence collection still needs a legal and ethical layer, which is annoying but generally preferable to receiving an invoice from a news agency.

These examples show why the threat continues after the immediate military crisis. Old-fashioned context manipulation depends on finding a convenient explosion. Synthetic media can manufacture the missing confession, insult or admission on demand. The attacker can target whichever institution currently needs destabilising: the Army, an opposition politician, a journalist, a protest movement or an ethnic community.

The defence is not to trust every AI detector score. The stronger workflow is to combine several checks:

1. Find the earliest available upload and the complete original recording.
2. Compare the spoken words, language, room sound, cuts and lip movement.
3. Look for the same speech on official or reputable channels.
4. Inspect content credentials or provenance signals where available.
5. Use detection tools as supporting indicators, not as the only evidence.
6. Preserve the false post, because accounts frequently delete it after a fact-check appears.

AI has made the forgery faster. It has not made source verification obsolete; it has made source verification the main event.

## this is related to Cambridge Analytica, but it is not the same case

The Cambridge Analytica comparison is useful as long as we do not turn it into a slogan. The [US Federal Trade Commission found](https://www.ftc.gov/news-events/news/press-releases/2019/12/ftc-issues-opinion-order-against-cambridge-analytica-deceiving-consumers-about-collection-facebook) that Cambridge Analytica used deceptive practices to obtain Facebook information for voter profiling and targeting. FTC records describe data collected from roughly 250,000 to 270,000 US app users and approximately 50 million to 65 million of their Facebook friends, including at least 30 million identifiable US consumers.

![Cambridge Analytica compared with modern influence operations](https://blog.himanshuanand.com/images/anti-india-influence/cambridge-analytica-vs-influence-ops.png)

The common logic is straightforward: learn about an audience, divide it into useful segments, test which messages produce a response, target emotion and repeat what works. Cambridge Analytica's scandal centred on deceptive data collection, personality profiling and voter targeting. The exact degree to which its work changed election outcomes remains much harder to establish than the fact that the data practices occurred.

Today's influence market can use a wider and sometimes simpler approach. An operator may not need a secret psychological profile for every user because social platforms already reveal trending topics, public communities, engagement patterns and advertising audiences. Recommendation systems perform continuous experiments on what keeps users watching. The operator can inject many pieces of content, measure which one receives anger or support and then scale the successful version.

There is also a change in the target. Cambridge Analytica is usually discussed as an attempt to influence voters. Modern identity operations may aim to change the sentiment of whole populations toward people from a particular country, colour, religion or migration group. The desired result may not be "vote for candidate X." It may be "when you hear Indian, immediately think dirty, dishonest, dangerous or unwanted."

That is slower, less measurable and potentially more damaging. Election campaigns end. A racial association can remain inside ordinary conversation for years.

## why the "dirty India" payload works

The recurring stereotypes about smell, deodorant, cow urine, cow dung and street defecation are effective online because they are simple, visual and emotionally unpleasant. The person sharing them needs no knowledge of Indian history, policy or economics. They need one image, the word "India" and a caption short enough to fit above it.

This content also works through association rather than argument. A false policy claim can be disproved with a document. A dehumanising stereotype does not need to be logically consistent; it only needs to be repeated until it becomes the first mental image associated with a group. The goal is often not to win a debate but to lower the social cost of contempt.

India has real sanitation, pollution and public-health problems, just as other countries have real problems. Saying that a city needs better waste management is criticism. Saying that every Indian is dirty or smells is racism. The difference is not complicated, although the replies section will pretend it is doing a PhD on the matter.

The payload is also portable across political groups. A geopolitical propagandist can use it to damage India. A Western nativist can use it against Indian immigrants. A religious extremist can attach it to anti-Hindu content. An engagement farmer can post it with no ideology at all. These actors may hate one another, yet they can still reuse the same meme because the meme produces reach.

Once the phrase becomes common, organic users do the rest. Some repeat it as a joke, some use it to signal membership in a group, some reply because they are angry and some quote-post it to condemn it. All of those actions can increase distribution. The operation lights the match; the public supplies the petrol.

## about the leaked Telegram screenshot

I also came across the widely shared Telegram screenshot in which a participant allegedly discussed creating so much hatred toward Indians that people would become willing to attack them in real life. That screenshot is one reason the subject stopped feeling like annoying internet trolling and started feeling like a safety issue.

However, I could not independently authenticate the original Telegram archive. Public copies do not provide the complete export, original message and channel identifiers, reliable account-ownership evidence, full timestamp context or an independent forensic report. Several online threads went much further, naming an alleged operator and claiming links to Pakistani state organisations, but I did not find enough public technical evidence to repeat those claims as fact.

I have therefore chosen not to embed an unredacted screenshot or identify the alleged individual in this post. That is not because the message is unimportant. It is because a screenshot is a lead, not a court judgment, no matter how many red circles, siren emojis and words like "EXPOSED" somebody adds around it.

![What is needed to turn a leaked screenshot into reliable evidence](https://blog.himanshuanand.com/images/anti-india-influence/telegram-evidence-checklist.png)

In cybersecurity terms, the screenshot is an **indicator of interest**, not attribution. Anyone holding the original export should preserve the complete files, message identifiers, timestamps, hashes and surrounding conversation, then provide them to a reputable platform investigation, digital forensics team or law-enforcement body. Publishing addresses, family details or unrelated private information would not make the evidence stronger; it would only create another harassment campaign.

If the message is authenticated, its intent is deeply serious because it describes the normalisation of hatred as a route toward physical violence. Until authentication is available, the responsible statement is narrower: a disturbing screenshot circulated publicly and deserves investigation, but its authorship, network size and alleged state links remain unverified.

## so who is controlling these networks?

The honest answer is that there is no public evidence of one controller behind all anti India hate. The best-supported picture contains several distinct networks and several different control layers.

| Actor or organisation | What the public evidence establishes | What remains unknown | Confidence |
|---|---|---|---|
| Employees of Pakistan's ISPR | Meta linked them to a specific 2019 network discussing India, Kashmir, Indian leaders and the military | Named operators, superior officers, orders and the relationship to later networks | High for that specific network |
| Individuals associated with AlphaPro | Meta and Graphika linked them to a 2021 influence-for-hire network using fake media and personas | The paying client, contract, payment trail and direct state instructions | High association; client unknown |
| Auto Reporter / Tigerzplace connection | Stanford identified the public tool developer and documented use of the extension in a mass-reporting ecosystem | Who controlled the wider network and who selected or commissioned targets | High for the tool layer; controller unknown |
| Pakistan-linked Google clusters | Google repeatedly removed channels supporting Pakistan and criticising India | Government sponsorship and whether the quarterly clusters were connected | High for origin and behaviour; sponsor unknown |
| STOIC | OpenAI connected the Israeli company to a specific AI-assisted operation that entered India's 2024 election discussion | The customer that financed the India-focused work | High for the specific operation |
| Western nativist and extremist accounts | Research found concentrated high-engagement anti-Indian content around immigration and identity politics | Which accounts coordinated privately or received payment | Strong evidence of the ecosystem; no single controller |
| Alleged Telegram network | Public screenshots and threads allege coordinated activity and violent intent | Authenticity, ownership, scale, financing and state links | Unverified |
| Organic users and influencers | Real people amplify the same stereotypes, sometimes knowingly and sometimes without understanding the origin | Individual motive and exposure to coordinated seeding | Organic amplification, not centrally controlled |

The influence supply chain may include a state-linked employee setting an objective, a commercial firm producing content, an account farm creating fake consensus, an influencer giving the material visibility and a recommendation engine completing the distribution. Another campaign may contain no government at all and simply be a group of ideological accounts farming anger.

One giant Bond-villain control room would be easier to explain. The evidence points to something more boring and possibly worse: several actors with different motives have discovered that the same small collection of stereotypes is cheap, portable and profitable, while the platform coordinates their incentives for free.

## the uncomfortable part: India-linked networks exist too

A credible investigation cannot describe India only as a victim. In the same April 2019 announcement that linked the Pakistan-origin network to ISPR employees, Meta separately removed **687 Facebook Pages and accounts** connected to individuals associated with the Indian National Congress IT Cell. It also removed a smaller group of 15 Pages, Groups and accounts linked to people associated with the Indian IT company **Silver Touch**. Meta said these were separate and unrelated operations.

Google's 2026 bulletins also listed multiple India-linked YouTube clusters promoting the Indian government, political parties or public figures. The Q1 report alone described several large groups, including one containing 628 channels, while the Q2 report documented additional India-linked clusters.

The Operation Sindoor research similarly found misinformation from Indian accounts, influencers and mainstream media as well as Pakistan-linked sources. This does not cancel the ISPR attribution, excuse anti-Indian racism or make an alleged threat less serious. It shows that covert influence tactics are tools, not national personality traits.

India can be targeted by influence operations and Indian political actors can participate in influence operations. Both statements can be true. Hiding the second statement would make the first one easier to dismiss as partisan propaganda.

## the uncomfortable mirror: examples where Indian accounts and newsrooms got it wrong

A research article becomes propaganda very quickly if it only preserves evidence that is convenient. So after looking at the Pakistan-linked networks, foreign influence operations and anti-India synthetic-media cases, here are the examples where Indian accounts, influencers or newsrooms amplified false material during the same information war. I am keeping these later deliberately: they are important context, but they are not the reason I began this investigation.

### case 1: Karachi port briefly relocated to Philadelphia

One of the clearest examples of context manipulation began with reports that the Indian Navy had destroyed Karachi port. The claim moved through social media and several Indian news outlets even though the official military briefings had not announced such an attack. The Center for the Study of Organized Hate documented multiple outlets using an image from a **2023 naval exercise** as supposed evidence of a 2025 strike. Alt News separately found that the ship shown in the widely reused image was INS Vikramaditya, not INS Vikrant and that the picture came from an earlier drill rather than combat.

![A 2023 naval-drill image and other unrelated visuals were presented as evidence of an attack on Karachi port](https://blog.himanshuanand.com/images/anti-india-influence/real-csoh-karachi-naval-drill.png)

*Source: [Center for the Study of Organized Hate, Inside the Misinformation and Disinformation War, page 6](https://www.csohate.org/wp-content/uploads/2025/05/Report_CSOH_Inside-the-Misinformation-and-Disinformation-War-.pdf). The report lists Prabhat Khabar, Lokmat Times, Live Hindustan, The Mojo Story and ABP News among outlets that used the old drill image.*

Then the geography became even more ambitious. ABP Ananda broadcast footage as destruction at Karachi port, but Alt News traced it to the aftermath of a **January 2025 plane crash in Philadelphia**, thousands of kilometres away. Other accounts copied the same clip and added captions about Pakistan being destroyed. This technique is called context laundering: the pixels may be real, but the date, place and meaning are replaced.

![Philadelphia plane-crash footage circulated as destruction at Karachi port](https://blog.himanshuanand.com/images/anti-india-influence/real-csoh-philadelphia-karachi.png)

*Source: [CSOH report, page 15](https://www.csohate.org/wp-content/uploads/2025/05/Report_CSOH_Inside-the-Misinformation-and-Disinformation-War-.pdf), with further verification by [Alt News](https://www.altnews.in/the-fictional-strikes-on-the-karachi-port-and-what-it-says-about-indian-media/).*

The following is the broadcast clip preserved by Alt News. It is useful evidence because it shows how a false social-media claim acquired studio graphics, an anchor and the visual authority of television. It also shows why "mainstream media" and "social-media troll farm" should not be analysed as separate universes; one can ingest the other's untrusted input and then send it back to the internet with a much larger amplifier.

{{< vimeo 1082772229 >}}

[Open the preserved ABP Ananda clip directly on Vimeo](https://vimeo.com/1082772229).

**What this proves:** old and unrelated visuals were used by identifiable accounts and news outlets to support a false Karachi-port narrative.

**What this does not prove:** every outlet or account involved was part of one secret network. Some may have copied one another, trusted a bad source or simply abandoned verification because the red BREAKING NEWS template was already open.

### case 2: Gaza footage acquired an Operation Sindoor caption

The next technique required almost no image editing. Footage of bombings and destruction in Gaza was reposted as Indian strikes on Karachi, Sialkot and other locations in Pakistan. The visual remained the same; the caption performed the entire operation. CSOH documented the material being shared by influential Indian accounts and pages including The Jaipur Dialogues, Megh Updates and Kreately Media.

![Gaza footage was relabelled as Indian strikes during Operation Sindoor](https://blog.himanshuanand.com/images/anti-india-influence/real-csoh-gaza-relabelled.png)

*Source: [CSOH report, page 14](https://www.csohate.org/wp-content/uploads/2025/05/Report_CSOH_Inside-the-Misinformation-and-Disinformation-War-.pdf).*

One post from `@MeghUpdates` received more than **727,000 views**, according to the report. This is the kind of number that helps explain why a correction arriving six hours later can feel like a person whispering into a hurricane. The false post has already been clipped, translated, forwarded to family groups and absorbed into people's mental record of the conflict.

This example also shows why the word **morphed** can sometimes be misleading. Many successful fakes do not require Photoshop, face replacement or a clever AI model. A genuine image plus a false sentence is often enough. From an attacker's perspective, this is excellent return on investment: no GPU bill, no complicated prompt, just a recycled explosion and confidence.

### case 3: flight simulators and video games received battlefield promotions

Military simulation footage is especially effective because it was designed to look dramatic. A clip already contains missiles, aircraft, tracers and explosions, so the operator only needs to remove the game context, add patriotic music and write "exclusive footage." During Operation Sindoor, CSOH documented `@amnofc` posting flight-simulator footage as Pakistani jets being shot down over Bhuj; the post received about **2.2 million views**. The report also documented `@SonOfBharat7` sharing game footage that received roughly **1.6 million views**, with another clip reaching around **1.3 million**.

![Flight-simulator and game footage was presented as real combat by high-reach accounts](https://blog.himanshuanand.com/images/anti-india-influence/real-csoh-game-footage.png)

*Source: [CSOH report, page 16](https://www.csohate.org/wp-content/uploads/2025/05/Report_CSOH_Inside-the-Misinformation-and-Disinformation-War-.pdf).*

### case 4: AI generated a stadium attack that never happened

Not every fake reused old material. Some were created from scratch. CSOH documented an AI-generated image claiming Rawalpindi Cricket Stadium had been destroyed. One post received about **9.6 million views, 129,000 likes and 12,700 reposts**. A separate account posting the same general claim received around one million views. The image was visually dramatic, immediately understandable and perfectly shaped for a crisis feed, which is another way of saying it had everything except the minor administrative detail of being real.

![An AI-generated Rawalpindi Stadium image received millions of views](https://blog.himanshuanand.com/images/anti-india-influence/real-csoh-ai-stadium.png)

*Source: [CSOH report, page 18](https://www.csohate.org/wp-content/uploads/2025/05/Report_CSOH_Inside-the-Misinformation-and-Disinformation-War-.pdf).*

The attack surface here is larger than one image. Generative models allow operators to produce the same event from several angles, create a fake "citizen journalist" photograph, add smoke to a real landmark, generate a matching witness account and translate the package into several languages. The result does not need to survive a forensic examination for months. It may only need to survive for twenty minutes, which is long enough for a verified account or a television producer to pick it up.

### case 5: a fake radiation emergency behaved like a coordinated campaign

A single wrong post can be a mistake. A group of accounts publishing near-identical language, using the same old hospital photographs, at roughly the same time and promoting the same fabricated document is a stronger coordination signal. CSOH reported such a pattern around a supposed nuclear-radiation leak in Pakistan. The report named Kreately Media, `@erbmjha`, Voice of Hindus, The Jaipur Dialogues and Cyber Hunts among the accounts amplifying the claim and said keyword searches showed near-identical posts appearing around midnight.

![Old hospital photographs were reused in a false radiation-emergency narrative](https://blog.himanshuanand.com/images/anti-india-influence/real-csoh-radiation-campaign-1.png)

![The campaign included a fabricated Pakistani government letter and repeated claims across large accounts](https://blog.himanshuanand.com/images/anti-india-influence/real-csoh-radiation-campaign-2.png)

*Source: [CSOH report, pages 26–27](https://www.csohate.org/wp-content/uploads/2025/05/Report_CSOH_Inside-the-Misinformation-and-Disinformation-War-.pdf).*

This case is closer to what security analysts look for when they say **coordinated behaviour**. The strongest indicator is not that several people discussed radiation; a major incident would naturally produce that. The stronger pattern is shared wording, shared source assets, synchronized publication and a common fabricated artefact. It resembles a phishing campaign in which many emails contain the same lure and attachment, except the attachment is a story designed to execute inside public opinion.


These examples do not cancel the foreign influence cases described earlier. They show why the defensive lesson has to be broader than nationality: once a crisis rewards speed, certainty and outrage, domestic actors can become part of the same misinformation supply chain even without being connected to a hostile network.

## what this does to regular people

The impact of an influence operation is often described using abstract words such as sentiment, polarisation and narrative dominance. Regular people experience it in much simpler ways.

![How influence operations reach an ordinary person](https://blog.himanshuanand.com/images/anti-india-influence/ordinary-people-impact.png)

An Indian student abroad may receive hygiene abuse under an ordinary post and begin hiding where they are from. A worker may watch colleagues repeat a stereotype as a joke and wonder whether it affects hiring or promotion. A family may panic during a military crisis because a fake video claims that a city, airport or base has been attacked. A journalist or researcher may lose access to an account after coordinated reporting. A shop, temple, mosque or community organisation may receive threats after an online narrative turns a whole group into an enemy.

The danger is not limited to content that directly orders violence. Repetition can make dehumanising language feel normal and normal language changes what people believe they are allowed to say or do. The transition from "it is only a meme" to discrimination does not happen in one dramatic moment. It happens through thousands of small permissions.

A useful example appeared in Singapore in 2026. The Ministry of Home Affairs ordered platforms to block 14 posts targeting Singapore's Indian community. The posts used crowded footage from Little India and religious events to portray the country as being overrun by Indians and used language assessed as attempting to incite ill-will. The government later said the material likely originated on a China-based platform but found **no evidence that it was a coordinated campaign by a particular government or organisation**. [Read the initial action](https://www.mha.gov.sg/media-room/newsroom/issuance-of-disabling-directions-under-the-online-criminal-harms-act-to-deal-with-social-media-content-containing-problematic-narratives-about-the-indian-community-in-singapore/) and [the investigation findings](https://www.mha.gov.sg/media-room/newsroom/investigation-findings-on-social-media-posts-targeting-singapore-indian-community-and-measures-against-external-influences/).

That case demonstrates both halves of responsible analysis. The posts were serious enough to threaten social cohesion, yet investigators did not claim a government campaign without evidence. "No proven state sponsor" does not mean "no harm" and "harmful content came from abroad" does not mean "an entire foreign population is responsible."

Influence operations also damage the people who fight them. Fact-checkers, moderators and researchers must repeatedly view violent, racist or traumatic content while working against a clock. Ordinary users become suspicious of every account, every video and sometimes every person from the country they believe is responsible. A campaign designed to create hatred succeeds twice if its target responds by hating another nationality in return.

## how to investigate without becoming the next misinformation account

Cybersecurity investigations work best when the analyst collects repeatable evidence rather than relying on instinct. The same rule applies here One suspicious profile is an anecdote. Several accounts sharing the same unusual language, infrastructure, timing and engagement network are a case.

| Signal | Why it matters | Common false positive |
|---|---|---|
| Identical long captions, including the same unusual typo | Suggests a shared script or central source | Copying a popular slogan or press release |
| Many accounts post the same link within seconds or minutes | Suggests coordinated launching or scheduling | Breaking news naturally causing simultaneous posts |
| Accounts were created in the same narrow date range | Can indicate batch account creation | A platform migration or public event bringing in real users |
| The same small group immediately replies to every post | Can reveal an engagement ring | A genuine tight-knit community |
| Accounts repeatedly share unknown domains with matching templates | Can expose common infrastructure or fake media networks | Legitimate syndication across related publications |
| A profile changes identity, country and subject overnight | May show account resale or repurposing | A real user rebranding an account |
| The same image appears with different country labels | Suggests recycled or deliberately miscaptioned media | A genuine wire-service image used by many outlets |
| Activity continues at high speed for 24 hours every day | May indicate automation or multiple operators | Scheduled news accounts or an unusually online human |
| Suspended accounts reappear with similar names and followers | Suggests backup infrastructure and persistence | Supporters independently creating tribute accounts |
| The same content moves from Telegram to X, video sites and Facebook in a fixed order | Can reveal a command or distribution channel | Organic cross-posting after content becomes viral |

A good evidence package should preserve the full URL, account handle, numeric account ID where available, exact timestamp, full-page screenshot, screen recording showing context, archived copy, original media file and cryptographic hash. It should also document matching posts and explain why the behaviour is suspicious.

Do not crop away the timestamp and then complain that nobody can verify the timestamp. Do not edit the screenshot, add filters or cover the only useful account identifier with a giant red arrow. Do not publish home addresses, family photographs or unrelated personal information. Evidence is meant to establish behaviour, not start a revenge mob.

Reverse-image search remains one of the fastest checks during a crisis. Look for the earliest known upload, landmarks, weather, language on signs, uniforms and whether the "war footage" contains a video-game interface. AI-image detection tools can be useful leads, but they are not reliable enough to serve as the only proof. Provenance, source history and visual inconsistencies together are stronger than one detector score.

The most important habit is to write confidence levels into the notes. Use phrases such as "consistent with coordination," "linked by the platform," "likely shared infrastructure" and "unverified allegation." This may sound less exciting than "MASSIVE BOT ARMY EXPOSED," but it has the small advantage of being useful.

## what platforms should do

Platforms should detect behaviour, not only prohibited words. A generated comment may contain no banned phrase, while the suspicious part is that 500 newly created accounts posted variations of it within ten minutes and immediately liked one another. Shared administrators, payment instruments, domains, device patterns, account-creation bursts and synchronized amplification are often more valuable than the text alone.

Takedown reports should also contain more structured information. Researchers need safe access to account identifiers, creation periods, shared domains, network relationships, engagement measurements and removal reasons. When a platform deletes every asset without preserving a research archive, it removes the operation and much of the evidence at the same time.

New accounts should face reasonable friction before gaining massive political reach, especially when they immediately post high-volume content or operate as part of a coordinated cluster. Platforms should preserve evidence of violent threats for lawful investigation rather than simply deleting an account and declaring the problem solved.

Finally, recommendation systems should stop treating angry quote-posts as unconditional endorsements. When thousands of Indians repost a racist account to condemn it, the platform often rewards the original account with more distribution. The algorithm understands engagement; it does not understand dignity.

## what newsrooms should do

Every newsroom covering a military or communal crisis needs a verification desk with authority to slow publication. The basic process is not glamorous: locate the original upload, reverse-search key frames, inspect timestamps, contact the claimed source, compare landmarks and wait for independent confirmation. It is still cheaper than broadcasting video-game footage as an air strike and spending the next week quietly deleting clips.

Corrections should receive visibility comparable to the original false report. A ten-second correction at 2 a.m. does not repair a false claim shown for hours under a "BREAKING" banner. News organisations should preserve a public correction log and explain how the failure happened, particularly when a social-media account was the only source.

Newsrooms should also treat anonymous viral posts as potentially hostile input, just as a security team treats an unexpected attachment. Verification is the content-security gateway. Bypassing it because a clip looks dramatic is the editorial version of disabling antivirus because the file name says `totally_real_report.pdf.exe`.

## what governments should do

Governments should publish influence-operation findings with explicit confidence levels and separate foreign-linked activity, state-attributed activity, commercial influence work, organic misinformation and unverified allegations. Combining everything under a phrase such as "anti-national propaganda" may be politically convenient, but it makes serious attribution less believable.

India would benefit from an independent influence-operations research centre involving digital forensics specialists, linguists, civil-society organisations, journalists, legal experts, diaspora groups and platform representatives. Its reports should publish evidence regardless of which political party benefits. A centre that investigates only the opposition is not a research centre; it is a campaign office with better WiFi.

During crises, a public evidence dashboard could show each major false claim, earliest known source, authentic source material, reverse-image result, platforms involved, estimated reach and confidence level. The response must also be precise enough that fighting disinformation does not become a general excuse to block inconvenient journalism.

Governments and embassies should treat identity-based disinformation as a community-safety issue, not only a national-image problem. Students, workers, businesses and religious institutions need clear routes for reporting credible threats, impersonation, doxxing and calls for violence.

## what regular users can do

Before sharing a dramatic post, find the original source rather than the largest account repeating it. Check the date, location and whether the visual appeared during an older war, disaster or protest. Search a few frames, inspect the account's history and ask whether the caption provides evidence or only confidence.

When a post is racist, avoid giving it free distribution through an angry quote-post unless there is a clear public-interest reason. Save the URL, preserve the context, report the content and send credible threats to the appropriate authorities. Replying with racism against Pakistanis, Chinese people, Muslims, Hindus, Jews, Westerners or anybody else does not defend India. It gives the original operator exactly the screenshot they wanted.

The most useful personal defence is emotional delay. Influence content is designed to make the share button feel urgent. Waiting five minutes, checking one source and refusing to become unpaid distribution infrastructure is a small but real security control.

## final thoughts

I started looking into this because my feed felt different after Operation Sindoor. The same insults appeared too often, under too many unrelated posts and with too little originality to dismiss as random noise. The research confirms that organised anti India influence networks exist, including one Meta linked directly to employees of Pakistan's ISPR, another connected to people associated with a PR company and repeated Pakistan linked channel clusters removed by Google.

The research also confirms that the wider hate wave is not controlled by one country or one company. Western nativist accounts, commercial operators, political campaigns, state-linked employees, fake media pages, AI tools, real influencers and ordinary users all contribute. India-linked influence networks exist as well. AI accelerates production, while recommendation algorithms reward the resulting conflict.

The goal is not always to make the world believe one exact falsehood. Sometimes the goal is to fill the information space with so much noise that nobody knows what happened. Sometimes it is to force Indians to spend all day defending their humanity. Sometimes it is to turn a nationality into a punchline, then turn the punchline into a permission structure for discrimination. Sometimes it is simply to earn money from anger.

The right response sits between two bad extremes. We should not believe every dramatic screenshot and declare a state conspiracy without evidence. We should also not pretend that repeated platform takedowns, fake media networks, mass-reporting tools and millions of views are imaginary because complete attribution is difficult.

Cybersecurity has a useful discipline for this problem: preserve the artefact, document the behaviour, state the confidence level, identify what remains unknown and update the conclusion when better evidence arrives. No dramatic background music required.

If you are still reading, thanks for surviving the longest replies-section investigation I have ever done. Please do not celebrate by opening the replies section.

---

## primary sources and further reading

### Platform attribution and network investigations

- [Meta: Removing Coordinated Inauthentic Behavior and Spam From India and Pakistan, April 2019](https://about.fb.com/news/2019/04/cib-and-spam-from-india-pakistan/)
- [Meta: May 2021 Coordinated Inauthentic Behavior Report](https://about.fb.com/news/2021/06/may-2021-coordinated-inauthentic-behavior-report/)
- [Graphika: Lights, Camera, Coordinated Action](https://www.graphika.com/reports/lights-camera-coordinated-action)
- [DFRLab: Pakistan Army's Covert Social Network](https://medium.com/dfrlab/pakistan-armys-covert-social-network-23ce90feb0d0)
- [Coda Story: Fiverr actors in Pakistan's fake-media network](https://www.codastory.com/disinformation/fake-media-accounts-promoting-pakistan/)
- [Stanford Internet Observatory: Reporting for Duty — Pakistan-Based Mass Reporting Network](https://fsi-live.s3.us-west-1.amazonaws.com/s3fs-public/20200901_pakistan_report.pdf)
- [Google Threat Analysis Group Bulletin, Q4 2025](https://blog.google/threat-analysis-group/tag-bulletin-q4-2025/)
- [Google Influence Operations Bulletin, Q1 2026](https://blog.google/security/influence-operations-bulletin-q1-2026/)
- [Google Influence Operations Bulletin, Q2 2026](https://blog.google/security/influence-operations-bulletin-q2-2026/)

### Operation Sindoor and crisis misinformation

- [Center for the Study of Organized Hate: Inside the Misinformation and Disinformation War](https://www.csohate.org/wp-content/uploads/2025/05/Report_CSOH_Inside-the-Misinformation-and-Disinformation-War-.pdf)
- [Center for the Study of Organized Hate: India–Pakistan Digital War summary](https://www.csohate.org/2025/05/16/india-pakistan-digital-war/)
- [Reuters Institute: How Indian fact-checkers handled the India–Pakistan crisis](https://reutersinstitute.politics.ox.ac.uk/news/truth-casualty-how-indian-fact-checkers-debunked-false-claims-during-india-pakistan-crisis)
- [Press Information Bureau: Government statement on more than 1,400 blocked URLs](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2150213)
- [Alt News: The fictional strikes on Karachi port and what they say about Indian media](https://www.altnews.in/the-fictional-strikes-on-the-karachi-port-and-what-it-says-about-indian-media/)
- [The Quint WebQoof: ARMA 3 simulation shared as Pakistan attacking India](https://www.thequint.com/news/webqoof/arma-3-game-simulation-viral-as-pak-attacking-india-fact-check)
- [AFP Fact Check: Old Faisal Mosque fire relabelled as an Indian drone attack](https://factcheck.afp.com/doc.afp.com.46X649D)

### AI and influence operations

- [OpenAI: Operation Zero Zeno](https://openai.com/index/disrupting-malicious-uses-of-ai-zero-zeno/)
- [OpenAI: Disrupting deceptive uses of AI by covert influence operations](https://openai.com/index/disrupting-deceptive-uses-of-ai-by-covert-influence-operations/)
- [OpenAI: Disrupting malicious uses of AI, October 2025](https://openai.com/global-affairs/disrupting-malicious-uses-of-ai-october-2025/)
- [Meta: What We Saw During the 2024 Global Elections](https://about.fb.com/news/2024/12/2024-global-elections-meta-platforms/)
- [BOOM: How AI-driven deepfakes are fuelling disinformation against India on X](https://www.boomlive.in/fact-check/the-x-accounts-distorting-indias-reality-online-through-ai-powered-fakes-30155)
- [AFP Fact Check: Manipulated video of Indian Army chief General Dhiraj Seth](https://factcheck.afp.com/doc.afp.com.B96J8KF)
- [AFP Fact Check: Altered Shashi Tharoor interview](https://factcheck.afp.com/doc.afp.com.C4DA29E)
- [AFP Fact Check: AI-altered image used to frame India in Kashmir protests](https://factcheck.afp.com/doc.afp.com.C43J9G4)

### Hate, engagement and impact

- [Network Contagion Research Institute: From Policy Drift to Purity Grift](https://networkcontagion.us/reports/from-policy-drift-to-purity-grift-how-a-small-network-hijacked-the-immigration-debate/)
- [American Bazaar summary of the NCRI anti-Indian content findings](https://americanbazaaronline.com/2026/03/12/how-2025-became-a-minefield-for-indian-americans-476724/)
- [PNAS: Out-group animosity drives engagement on social media](https://www.pnas.org/doi/10.1073/pnas.2024292118)
- [Singapore Ministry of Home Affairs: Action against 14 posts targeting the Indian community](https://www.mha.gov.sg/media-room/newsroom/issuance-of-disabling-directions-under-the-online-criminal-harms-act-to-deal-with-social-media-content-containing-problematic-narratives-about-the-indian-community-in-singapore/)
- [Singapore Ministry of Home Affairs: Investigation findings and attribution limits](https://www.mha.gov.sg/media-room/newsroom/investigation-findings-on-social-media-posts-targeting-singapore-indian-community-and-measures-against-external-influences/)

### Cambridge Analytica and analytical frameworks

- [FTC: Cambridge Analytica decision](https://www.ftc.gov/news-events/news/press-releases/2019/12/ftc-issues-opinion-order-against-cambridge-analytica-deceiving-consumers-about-collection-facebook)
- [FTC: Cambridge Analytica data-collection allegations and figures](https://www.ftc.gov/news-events/news/press-releases/2019/07/ftc-sues-cambridge-analytica-settles-former-ceo-app-developer)
- [DISARM Red Framework](https://www.disarm.foundation/framework)
- [MITRE ATT&CK](https://attack.mitre.org/)
