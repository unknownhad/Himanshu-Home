---
title: "someone is filing your GST return, and it is not your CA"
date: 2026-08-18
author: Himanshu Anand
tags: [malware, threat-intel, India, reverse-engineering, any.run]
draft: false
---


*Disclosure: this research was conducted using an ANY.RUN account provided as part of a collaboration. All analysis and conclusions are my own.*

---

## TLDR

Found an **unreported Silver Fox campaign** serving ValleyRAT to Indian taxpayers with a fake "GSTR-3B overdue" lure, timed to the real 20 August GST filing deadline. The delivery is a disk image containing a *genuinely Microsoft-signed* SystemSettings.exe that sideloads a *patched* SystemSettings.dll (Microsoft cert still attached, hash broken  cute). Stage 2 injects into RuntimeBroker.exe with a full UACMe kit, a Defender tamperer and an AV process-killer. Reversed both stages, recovered the full config: **3 C2 endpoints, a dormant backup domain, build date Aug 2 2026,and a 15 subdomain delivery platform that is serving per victim lure links as I type this.**

---

## how this started

I was doing something completely different measuring how much India-targeted APT tooling even shows up in public sandbox feeds (spoiler: the APT36 stuff barely does, that is a whole separate post). While tag-hunting `valleyrat` on [ANY.RUN's public submissions](https://app.any.run/submissions), the feed was the usual suspects: fake VPN installers, something literally named `jiazaiqitest.exe` (加载器测试  "loader test", they are not even trying), the usual Chinese-locale noise.

And then this, submitted **7 August 2026**:

```
GST_Filing_Overdue_GSTR-3B_GSTIN27ABCDE1234F1Z5_Due_20082026.zip
```

If you are not Indian: GSTR-3B is the monthly GST return every registered business files, GSTIN is the tax ID, and the 20th of the month is the actual deadline. The GSTIN in the filename even uses the correct format  `27` is Maharashtra. Somebody on the operator side *did the homework*.

Sandbox verdict: **Malicious**. Tracker: Backdoor, RAT, ValleyRAT. Tags: `silverfox`, `winos`, `processkiller`. 

Public coverage of this file, its C2s or a GST lure wave: **zero**. Nada, One lonely urlscan scan of the delivery domain.


!["it's free real estate"  finding unreported APT infra in a public feed](https://blog.himanshuanand.com/images/malware-free-realestate.jpg)

## the actor you already know

Quick refresher, because context matters. **Silver Fox** (SwimSnake / Void Arachne / 银狐) is a China-nexus crew running **ValleyRAT** (built on the WinOS 4.0 framework plugin-based RAT, keylogger, screen capture, the works). The group has been [targeting Indian users since at least December 2025 with Income Tax Department lures](https://www.cloudsek.com/blog/silver-fox-targeting-india-using-tax-themed-phishing-lures) (nice work by CloudSEK on that one) and separately running [SEO-poisoned fake software installers](https://www.nccgroup.com/research-blog/black-hole-of-trust-seo-poisoning-in-silver-fox-s-space-odyssey/) (NCC Group) and even a [Russian false flag operation](https://reliaquest.com) to muddy attribution. Their comfort food: DLL sideloading behind signed binaries, disposable free-domain C2, tax-season timing.

What nobody had reported: a GST wave, this infrastructure or this exact sideload pair. Until the ANY.RUN feed coughed it up.

## unboxing the lure

The ZIP contains a **1.2 MB `.img` disk image**. Why a disk image? Because files inside a mounted image don't inherit Mark-of-the-Web the "this came from the internet, are you sure?" prompts never fire. Double click and it mounts like a USB drive. Very 2024 technique still printing money in 2026.

Inside the image, two files:

```
GST_Filing_Overdue_GSTR-3B_..._Due_20082026.exe   98 KB
SystemSettings.dll                                59 KB
```

And here is where it gets spicy. 

Signature check:

```
EXE:  VALID signature  Microsoft Corporation
      OriginalFilename: SystemSettings.exe (the real Windows Settings app, renamed)
DLL:  Microsoft cert attached… but HashMismatch
```

The EXE is the *actual, legit, Microsoft-signed* SystemSettings.exe. The DLL *was* a real Microsoft binary  until someone patched it. The signature is still there, it just no longer validates. To a reputation based filter, both files "are Microsoft."

**No unsigned attacker code ever touches disk.** The whole stage-1 lives inside a tampered system DLL that a signed Microsoft process happily loads. 

![not sure if Windows component… or malware](https://blog.himanshuanand.com/images/windows-or-malware.jpg)

## ghidra time: the dll that lies

I opened the DLL in Ghidra DllMain? Stock CRT boilerplate Exports? Stubs If your static scanner keys on entry point weirdness, it sees nothing  the implant is grafted into the CRT init path instead.

![Ghidra CodeBrowser: the most innocent DllMain you will ever see](https://blog.himanshuanand.com/images/ghidra-entry.png)

The fun starts in the orchestrator (`FUN_180003030`). This function never touches a readable string. Everything  API names, C2, paths  is built as **stack constants**, decoded in place, used, zeroed. With junk noop calls sprinkled between real instructions, because apparently my time is worthless.

![The orchestrator: stack-string city, population me](https://blog.himanshuanand.com/images/ghidra-orchestrator.png)

The decoder is a single-byte XOR:

```c
void decode(byte *buf, uint len) {
    for (i = 0; i < len; i++) buf[i] ^= 0x70;
}
```

First decoded block resolves `kernel32.dll` -> `GetModuleHandleA`. Standard "resolve everything at runtime so the import table says nothing" tradecraft:

![Stack strings decoding to kernel32.dll before GetModuleHandleA](https://blog.himanshuanand.com/images/ghidra-stackstrings.png)

And then  my favorite screenshot of this entire analysis  the C2, hiding in a `movabs`:

![MOVABS RAX, 0x5e13080a14030919  the XOR'd C2 being assembled](https://blog.himanshuanand.com/images/ghidra-c2-constants.png)

```asm
180003234  MOV  RAX, 0x5e13080a14030919
180003246  MOV  RAX, 0x13135e05155e13
180003263  MOV  EDX, 0xd
180003268  CALL decode        ; 13 bytes
```

Thirteen bytes, XOR 0x70: `iysdzxc.eu.cc`. Which is *exactly* the domain the sandbox saw on the wire. Static and dynamic analysis shaking hands.

But wait  the DLL's `.rdata` has a full XOR'd config block. Decoding it:

```
iysdzxc.eu.cc        <- primary delivery domain (sandbox saw this one)
/d/ee2b12fbd661      <- URI path
bdgsewa.eu.cc        <- BACKUP DOMAIN (sandbox never saw this  nobody had it)
/d/6c42e162ed46      <- second path
GetTickCount         <- hello timing checks
```

`bdgsewa.eu.cc` had **zero** hits anywhere on the internet. A dormant failover channel, pulled out of the binary with tweezers. This is why you do static analysis even when the sandbox report looks "complete."

The downloader itself is dressed up as Edge 131  full fake UA, proper Accept headers… and one beautiful mistake: `Accept-Language: en-US,en;q=0.9,zh-CN;q=0.8`. A Chinese-locale fallback copied straight from the operator's dev template. Attribution fibers are the best fibers.

The downloaded stage 2 is then mapped into memory by a **hand-rolled reflective PE loader** (copy sections, VirtualProtect per section). It never exists as a file. Of course.

## stage 2: reading valleyrat's diary

ANY.RUN showed the lure EXE injecting into **RuntimeBroker.exe**  and bless them, the task exposes **process dumps** of the injected regions. Downloaded both, opened in Ghidra the dump is where this RAT stops pretending.

**The config** (UTF-16, sitting right there):

```
|p1:103.97.131.179|o1:8888|t1:1|p2:103.97.131.179|o2:6666|t2:1|p3:103.97.128.141|o3:7777|t3:1|dd:1|cl:1|fz:默认|
|bb:1.0|bz:2026. 8. 2|jp:0|bh:0|ll:0|dl:0|
```

Translation: three C2 endpoints  `103.97.131.179:8888` (this exact one showed up in sandbox traffic), plus **`:6666` and `103.97.128.141:7777` which are NOT in any public feed**. Build date **2026-08-02**  five days before the lure dropped. And `fz:默认`  the victim group field is literally Chinese for "default." Operator console confirmed Chinese. We knew, but it's nice when they label it.

**The toolkit.** The dumped module's manifest identifies itself as **"Akagi"**  as in [UACMe](https://github.com/hfiref0x/UACME), the open-source UAC-bypass collection, complete with the aircraft-carrier description string intact. Alongside it: references to `computerdefaults.exe`, `dccw.exe`, `tracerpt.exe` (signed auto-elevating Microsoft binaries  the UAC-bypass menu), Defender's private COM interfaces `MpManagerOpen`/`MpThreatOpen`, service-control APIs for stopping security services, token theft (`NtDuplicateToken` -> `CreateProcessAsUserW`), a keylogger (`GetKeyState` polling), GDI+ screenshot capture, clipboard theft, event-log tampering, persistence via Startup and AppCompatFlags.

And it's not theoretical. The sandbox's Suricata alerts read like the RAT's to-do list being completed in real time:

![Suricata: XORed executable loaded -> ProcessKiller CnC init -> SilverFox TCP init -> WinOS4.0 login](https://blog.himanshuanand.com/images/anyrun-threats.png)

`Win32/ProcessKiller CnC Initialization`  the AV-killer literally phones home to say it's ready. Then the actual C2 channel: **custom binary TCP** (length-prefixed frames, port 8888), SilverFox init -> WinOS4.0 login -> encrypted tasking -> keep-alives. The HTTPS from stage 1 was just the delivery boy.

![RuntimeBroker.exe -> 103.97.131.179:8888, flagged malicious](https://blog.himanshuanand.com/images/anyrun-connections.png)

Full task is public if you want to poke it yourself: [app.any.run/tasks/f6eeccd8-…](https://app.any.run/tasks/f6eeccd8-93e8-4f49-8cc0-f8e815c835b9)

![The full sandbox view: tags, tracker, process tree](https://blog.himanshuanand.com/images/anyrun-analysis.png)

![RuntimeBroker doing crimes while looking like Windows](https://blog.himanshuanand.com/images/thisisfile-malware.jpg)

## the platform

Here is where it went from "nice find" to "oh, this is big."

I pivoted on the delivery IP (`103.23.172.118`) using only passive sources. It is hosting **15 randomized `.eu.cc` subdomains**  `kaiwyrey`, `isudcnzy`, `idutyarwse`, and friends. urlscan has 236 scans against this IP, including **four different lure links scanned TODAY**, each following the pattern:

```
/d/<file-id>/file?code=<32-hex-chars>
```

Every `?code=` is a per victim, one-time download token. Individually tracked targets. One of today's links served **`Tax-Number852690.zip`**  which matches the `Tax-Number.zip` ValleyRAT submission sitting in the same ANY.RUN feed. So the GST lure is one plank of a multi-region, multi-lure operation, and it is actively serving victims *right now*.

Oh, and the server's TLS certificate? Let's Encrypt, issued to `bdgsewa.eu.cc`, dated **June 8, 2026**. The "backup" domain from the config is the server's actual identity, and this platform was staged a full **two months** before the GST wave. Infra June 8 -> build Aug 2 -> lure Aug 7 -> still hot Aug 17.

![it was a delivery platform](https://blog.himanshuanand.com/images/always-has-been-malware.jpg)

## what they actually want

Code tells you how and targeting tells you why.

A GSTR-3B lure selects for exactly one population: **Indian accountants, finance teams, CA firms.** Those machines hold corporate net-banking (used for tax payments), GST-portal creds and  the crown jewel  the email identity that approves payments.

Silver Fox's documented monetization for finance-staff compromise is **payment-diversion fraud**: persist quietly (UAC bypass + Defender tampering + AV-killer = long-term silence), watch how payments get approved, then divert them. Espionage grade collection comes free with the implant. The per-victim token links seal it: this is a crew that monetizes *specific* finance departments, not bulk infections.

One line: **quiet, AV-immune, persistent control of Indian corporate finance machines during filing season, monetized through credential theft and payment diversion.**

## what is new here

| # | Finding | Before this post |
|---|---|---|
| 1 | Silver Fox **GST/GSTR-3B lure wave** timed to the 20 Aug filing deadline | Unreported ([Dec 2025 was income-tax lures](https://www.cloudsek.com/blog/silver-fox-targeting-india-using-tax-themed-phishing-lures)) |
| 2 | `SystemSettings.exe` + patched `SystemSettings.dll` sideload pair (sig attached, HashMismatch) | Undocumented for Silver Fox |
| 3 | Backup domain `bdgsewa.eu.cc` + URI paths | Zero public references |
| 4 | C2s `103.97.131.179:6666` and `103.97.128.141:7777` | Zero public references |
| 5 | Full stage-2 config (build 2026-08-02, group tag 默认) | First publication |
| 6 | UACMe/Akagi + Defender COM tampering + ProcessKiller in this build | First publication |
| 7 | The 15-subdomain `eu.cc` delivery platform + per-victim `?code=` tokens + June-8 cert timeline | Unmapped |
| 8 | All hashes below | None previously published |

## iocs

**Files**

| Artifact | SHA-256 / MD5 |
|---|---|
| Patched `SystemSettings.dll` (stage 1) | `9FA3609CBEA11930BB76DBFD6253A397C10A833CE9DAC19CE55E18501B2F5D10` |
| Lure EXE (signed `SystemSettings.exe`, benign-but-abused) | `D3A50D173AF5B0FDD44CBFD7BF7C7471A3B8998EB45C9B49AA2F1C98C9D54CA9` |
| Lure ZIP | MD5 `FE22479CCB81AEC2BC069765484641E5` |

**Network** (live at time of writing  `103.97.131.179:8888` and `:6666` answering)

| Indicator | Role |
|---|---|
| `iysdzxc.eu.cc` -> `103.23.172.118:443` | stage-2 delivery |
| `bdgsewa.eu.cc` | backup delivery (dormant-ish) |
| `/d/ee2b12fbd661`, `/d/6c42e162ed46` | delivery URI paths |
| `103.97.131.179:8888` / `:6666` | ValleyRAT C2 (custom TCP) |
| `103.97.128.141:7777` | tertiary C2 (not yet up) |
| 15 `.eu.cc` subs: `iysdzxc bdgsewa kaiwyrey isudcnzy idutyarwse fuerubuiaie hsaueraw kcjsjyeaw ksidxhcte laiwybstw oaiwuyda oaosifytaw pzidiauwytsd rcyawday xkcisetr zuxyegea` | delivery platform fronts |

**YARA (stage-1 DLL)**

```yara
rule SilverFox_GSTR3B_Patched_SystemSettings_dll
{
    meta:
        description = "Silver Fox ValleyRAT stage-1: patched Microsoft SystemSettings.dll, XOR-0x70 config"
        date = "2026-08-17"
        sha256 = "9FA3609CBEA11930BB76DBFD6253A397C10A833CE9DAC19CE55E18501B2F5D10"
    strings:
        $name     = "SystemSettings.dll" ascii
        $ua       = "Edg/131.0.0.0" ascii
        $xor_c2_1 = { 19 09 03 14 0a 08 13 5e 15 05 5e 13 13 }
        $xor_c2_2 = { 12 14 17 03 15 07 11 5e 15 05 5e 13 13 }
        $movabs   = { 48 b8 19 09 03 14 0a 08 13 5e }
    condition:
        uint16(0) == 0x5A4D and $name and $ua and any of ($xor_c2_*, $movabs)
}
```

**Quick wins for your SOC:** alert on `SystemSettings.exe` running from anywhere except `%SystemRoot%\ImmersiveControlPanel`; flag Microsoft-named DLLs with HashMismatch signatures; block `*.eu.cc` if you can (you can); mail-gateway rule for GSTR/GSTIN + `.img`/`.iso` attachments during filing windows; hunt RuntimeBroker.exe making outbound TCP to hosting providers. Report to [CERT-In](https://www.cert-in.org.in/) if you see hits  I have a full reporting pack ready.

## final thoughts

Two things stuck with me from this one.

**One:** the public sandbox feed is underrated as a hunting ground. This whole campaign  unreported by every vendor  was sitting in ANY.RUN's public submissions with a giant GST-themed name tag on it. The samples, the dumps, the network telemetry: all public. The expensive part was knowing what to pull on the thread.

**Two:** the defense-evasion bar keeps rising in the boring direction. No zero-days here, No novel exploit. Just a signed Microsoft binary, a patched Microsoft DLL, a disk image, and a cloud URL  every individual component "trusted" by something. The only broken signature in the entire chain still says "Microsoft" on it. If your detections are still waiting for something that *looks* malicious, this is what sails past.

The GST deadline is the 20th. If you work with Indian finance teams, today is a good day to send them a very boring, very lifesaving email: *tax notices don't arrive as disk images.*

Stay safe, patch your detections, and remember  RuntimeBroker.exe has no business calling Hong Kong.

---
