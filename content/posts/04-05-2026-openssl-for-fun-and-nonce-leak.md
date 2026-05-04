---
title: "I Read OpenSSL for Fun and Found a Nonce Leak"
date: 2026-05-04
tags: ["OpenSSL", "Crypto", "Post-quantum", "security", "blog"]
author: "Himanshu Anand"
draft: false
---

I was poking around the OpenSSL source code recently. Not really hunting for anything specific (one of the most heavily audited codebases), just curious about how the new post-quantum crypto stuff was wired up in version 4.0.0. I went in expecting to find nothing interesting. Instead I tripped over a single-character logic bug that leaks cryptographic randomness onto the stack on every signing call.

Quick disclaimer: I am not a crypto person. I had to look up (In current world look up means, asking LLM please explain me like a kid ) half of these acronyms while writing this. So if you also feel a bit lost when people start saying things like "FIPS 205 addrnd nonce" and your brain just freezes, you are in the right place. We will go slow.
Let me walk you through what I found.

## What is SLH-DSA anyway

A tiny crash course before we get to the bug.
SLH-DSA stands for Stateless Hash-based Digital Signature Algorithm. It is one of the post-quantum signature schemes that NIST standardized in FIPS 205. The "post-quantum" part means it is built to survive against future quantum computers that would shred classical schemes like RSA and ECDSA.
The cool thing about SLH-DSA is that it only relies on hash functions. No fancy lattice math, no elliptic curves, just hashes all the way down. The not-so-cool thing is that signatures are huge (think tens of kilobytes) and signing is slow.
Alongside SLH-DSA there is also ML-DSA. Same NIST batch, different math. ML-DSA uses lattices and is way faster but the API in OpenSSL looks almost identical for both. That detail matters, hold onto it.
When you sign something with SLH-DSA in randomized mode, the algorithm needs a fresh random nonce called `addrnd`. This nonce gets mixed into the signature. It does not need to stay secret forever (the signature itself is public anyway) but it should not be left lying around in memory after we are done with it. That is just basic crypto hygiene. You wash your hands after handling raw chicken. You wipe nonces after signing.

 ![Picture this](/images/aqurfj.jpg) 

## How I found it

I was reading through `providers/implementations/signature/slh_dsa_sig.c` to learn how the provider plumbing worked. I had the equivalent ML-DSA file open in another tab for comparison because they share the same shape.
Both files have a function that does roughly this:
1. Allocate a small stack buffer for randomness
2. Either copy in a test value from the context, or fill the buffer with fresh entropy
3. Call the actual signing routine
4. Wipe the buffer with `OPENSSL_cleanse`
Step four is the important one. When you are done with sensitive bytes, you scrub them. Otherwise they sit on the stack until someone else's function call happens to write over them. Which might be never if your signing function returns and the program does something else on a different code path.
Here is what `slh_dsa_sign()` looks like, lightly trimmed (lines 244 and 245 of the file in 4.0.0):

```c
if (sig != NULL) {
    if (ctx->add_random_len != 0) {
        opt_rand = ctx->add_random;
    } else if (ctx->deterministic == 0) {
        n = ossl_slh_dsa_key_get_n(ctx->key);
        if (RAND_priv_bytes_ex(ctx->libctx, add_rand, n, 0) <= 0)
            return 0;
        opt_rand = add_rand;
    }
}
ret = ossl_slh_dsa_sign(ctx->hash_ctx, msg, msg_len,
    ctx->context_string, ctx->context_string_len,
    opt_rand, ctx->msg_encode,
    sig, siglen, sigsize);
if (opt_rand != add_rand)
    OPENSSL_cleanse(opt_rand, n);
return ret;
```

Read that last `if` statement carefully.
`add_rand` is the local stack buffer. That is the variable we want to wipe, because that is where our fresh secrets sit. `opt_rand` is a pointer that ends up pointing at one of three things:
	- `ctx->add_random`, if the caller supplied a test value (heap memory in the context)
	- `add_rand`, our stack buffer, if we generated fresh random
	- `NULL`, in deterministic mode
So the check `if (opt_rand != add_rand)` says: if `opt_rand` is NOT pointing at our stack buffer, wipe whatever it is pointing at. Which translates to: in the normal random signing path where `opt_rand` IS pointing at the stack buffer, do nothing.
That is exactly backwards.

![code review](/images/aqurmf.jpg) 


## Three flavors of broken
Let me walk through what actually happens in each path.
**Path 1: normal random signing**
`ctx->add_random_len == 0` and `deterministic == 0`. The code generates fresh entropy into `add_rand`, then sets `opt_rand = add_rand`. They point at the same place. `opt_rand != add_rand` is false. The cleanse never runs. The nonce sits on the stack waiting for someone to read it.
**Path 2: test entropy override**
`ctx->add_random_len != 0`. The caller supplied test bytes through the context. Now `opt_rand = ctx->add_random` which lives on the heap. `opt_rand != add_rand` is true. Cleanse runs. Except `n` is still 0 because the code never assigned it in this branch. So we call `OPENSSL_cleanse(opt_rand, 0)`. A cleanse of zero bytes. Useless.
**Path 3: deterministic mode**
`deterministic == 1`. Neither branch in the `if/else if` runs. `opt_rand` stays `NULL` and `n` stays 0. The check `opt_rand != add_rand` is true (NULL is not equal to the stack address). Cleanse runs as `OPENSSL_cleanse(NULL, 0)`. Defined behavior in OpenSSL but completely pointless.
So in three paths, three different ways of being wrong. The most common path leaves a real secret on the stack. The other two do nothing useful. A perfect score.

## Comparing with the sibling code
This bug stings even more once you look at the sister file `ml_dsa_sig.c` in the same directory. ML-DSA has the exact same structure and gets it right:
```c
ret = ossl_ml_dsa_sign(ctx->key, ctx->mu, msg, msg_len,
    ctx->context_string, ctx->context_string_len,
    rnd, sizeof(rand_tmp), ctx->msg_encode,
    sig, siglen, sigsize);
if (rnd != ctx->test_entropy)
    OPENSSL_cleanse(rand_tmp, sizeof(rand_tmp));
```
Look at the differences from the SLH-DSA version:
1. The check is against `ctx->test_entropy` (the heap context value) not against `rand_tmp` (the stack buffer)
2. The cleanse always targets `rand_tmp` (the stack buffer) with `sizeof(rand_tmp)` (a compile-time constant)
In ML-DSA the logic reads as: if we did not use the supplied test entropy, we must have used the stack buffer, so wipe the stack buffer. Easy. Correct. Boring.
The SLH-DSA version reads like someone copied this pattern from somewhere and got the variables mixed up halfway through.
> *Spider-Man pointing at Spider-Man. Left Spidey labelled "ml_dsa_sign". Right Spidey labelled "slh_dsa_sign". They look identical. Except one of them is leaking nonces and does not know it.*
## The fix
It is a one-line change. Or two depending how you count.
```diff
-    if (opt_rand != add_rand)
-        OPENSSL_cleanse(opt_rand, n);
+    if (opt_rand == add_rand)
+        OPENSSL_cleanse(add_rand, sizeof(add_rand));
```
Two reasons to use `sizeof(add_rand)` instead of `n`:
1. `n` is conditionally set. If a future refactor moves things around it is easy to land in a code path where `n` is zero and we silently cleanse nothing
2. `sizeof(add_rand)` is `SLH_DSA_MAX_ADD_RANDOM_LEN`, evaluated at compile time. Always correct. Always the full buffer
You always want to wipe the whole buffer anyway. Wiping just `n` bytes leaves the rest of the buffer untouched, which might still contain whatever previous garbage was there. Most of the time fresh entropy fills the whole thing, but defense in depth is cheap.
## Why does this even matter
I have to be honest here. By itself this bug is not a critical-severity find. It does not let an attacker forge signatures, recover private keys or directly do anything mean to your server.
But.
Cryptographic nonces leaking onto the stack is the kind of thing that becomes a real problem when chained with another bug. Some examples:
- **Core dumps.** If your process crashes and dumps core, the stack contents go straight to disk. If your crash dump handler ships those off to a Sentry-style service, your nonces just left the building
- **Swap files.** The OS pages your process to disk. The unwiped stack pages go with it. Now the nonces live on a spinning disk somewhere until the page is overwritten
- **Information disclosure bugs.** Pair this with any unrelated bug that lets an attacker read uninitialized stack memory, like an out-of-bounds read elsewhere in the same process, and now they have something interesting to look at
- **Side channels.** Knowing the exact addrnd value used for a signature lets an attacker do more precise work on side-channel attacks against the SLH-DSA hash inputs. Not a panic-button thing, but it is a useful primitive
- **FIPS 140-3 compliance.** Organizations in finance, healthcare or government often have hard requirements that "sensitive security parameters" must be zeroized after use. A randomized signing nonce qualifies. So if you are using OpenSSL 4.0.0 SLH-DSA in a FIPS context you are technically out of compliance
The thing about leaking secrets to the stack is, it does not bite you until it does, and then it bites everyone at once. Better to stamp it out before that happens.
> *Galaxy brain meme. Level 1: "I scrub my secrets". Level 2: "I scrub my secrets but with the wrong condition". Level 3: "I scrub my secrets but with the wrong condition AND zero bytes". Level 4 glowing brain: "I scrub NULL".*

## Proof of concept
I wrote a small standalone reproducer that mirrors the structure of `slh_dsa_sign()`. It uses a magic byte (`0xA5`) in place of real random data so we can spot it on the stack. There are two versions of the function: a buggy one that mirrors OpenSSL 4.0.0, and a fixed one that mirrors the ML-DSA pattern. After each call we probe the stack to see what is still there.
```c
/*
 * PoC: SLH-DSA Stack Nonce Leak
 * Compile: gcc -O0 -fno-stack-protector -o slh_dsa_poc slh_dsa_poc.c
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#define SLH_DSA_MAX_ADD_RANDOM_LEN 32
#define MAGIC_BYTE 0xA5
typedef struct {
    uint8_t add_random[SLH_DSA_MAX_ADD_RANDOM_LEN];
    size_t  add_random_len;
    int     deterministic;
} FakeCtx;
static size_t fake_get_n(void) { return 32; }
static int fake_rand_bytes(uint8_t *p, size_t n) {
    for (size_t i = 0; i < n; i++) p[i] = MAGIC_BYTE;
    return 1;
}
static void fake_slh_sign(const uint8_t *opt_rand, size_t n) {
    volatile uint8_t sink = 0;
    if (opt_rand) for (size_t i = 0; i < n; i++) sink ^= opt_rand[i];
    (void)sink;
}
/* OpenSSL 4.0.0 buggy behavior */
__attribute__((noinline))
static int buggy_slh_dsa_sign(FakeCtx *ctx) {
    uint8_t  add_rand[SLH_DSA_MAX_ADD_RANDOM_LEN];
    uint8_t *opt_rand = NULL;
    size_t   n = 0;
    if (ctx->add_random_len != 0) {
        opt_rand = ctx->add_random;
    } else if (ctx->deterministic == 0) {
        n = fake_get_n();
        if (fake_rand_bytes(add_rand, n) <= 0) return 0;
        opt_rand = add_rand;
    }
    fake_slh_sign(opt_rand, n);
    if (opt_rand != add_rand)
        memset(opt_rand, 0, n);
    return 1;
}
/* ML-DSA style fixed behavior */
__attribute__((noinline))
static int fixed_slh_dsa_sign(FakeCtx *ctx) {
    uint8_t  add_rand[SLH_DSA_MAX_ADD_RANDOM_LEN];
    uint8_t *opt_rand = NULL;
    size_t   n = 0;
    if (ctx->add_random_len != 0) {
        opt_rand = ctx->add_random;
    } else if (ctx->deterministic == 0) {
        n = fake_get_n();
        if (fake_rand_bytes(add_rand, n) <= 0) return 0;
        opt_rand = add_rand;
    }
    fake_slh_sign(opt_rand, n);
    if (opt_rand == add_rand)
        memset(add_rand, 0, sizeof(add_rand));
    return 1;
}
__attribute__((noinline))
static int probe(FakeCtx *ctx, const char *label) {
    uint8_t  probe_buf[SLH_DSA_MAX_ADD_RANDOM_LEN];
    uint8_t *dummy_ptr = NULL;
    size_t   n_dummy = 0;
    int hits = 0;
    for (size_t i = 0; i < sizeof(probe_buf); i++)
        if (probe_buf[i] == MAGIC_BYTE) hits++;
    printf("  [probe after %-24s] stack buffer = ", label);
    for (size_t i = 0; i < sizeof(probe_buf); i++)
        printf("%02x", probe_buf[i]);
    printf("  (MAGIC bytes: %d/%zu)\n", hits, sizeof(probe_buf));
    (void)ctx; (void)dummy_ptr; (void)n_dummy;
    return hits;
}
int main(void) {
    FakeCtx ctx = { .add_random_len = 0, .deterministic = 0 };
    printf("=== SLH-DSA Stack Nonce Leak PoC ===\n");
    printf("[A] BUGGY version (current OpenSSL 4.0.0):\n");
    buggy_slh_dsa_sign(&ctx);
    int buggy_hits = probe(&ctx, "buggy_slh_dsa_sign");
    printf("\n[B] FIXED version:\n");
    fixed_slh_dsa_sign(&ctx);
    int fixed_hits = probe(&ctx, "fixed_slh_dsa_sign");
    printf("\n=== RESULT ===\n");
    if (buggy_hits > fixed_hits) {
        printf("VULN CONFIRMED: buggy path left %d magic bytes on the stack\n", buggy_hits);
    }
    return 0;
}
```


The way this works is `probe()` declares a local stack buffer at roughly the same offset that the previous function call used. Compilers reuse stack frames a lot, so whatever was on the stack at offset X in one function is often visible at offset Y in the next one if Y is close to X. With `-O0` and `-fno-stack-protector` it becomes very predictable.
When I ran it the buggy version showed dozens of `0xA5` bytes still in the probe buffer. The fixed version showed zero. Smoking gun.


After I filed the issue, [Mounir IDRASSI](https://github.com/idrassi) opened [PR #31029](https://github.com/openssl/openssl/pull/31029) titled "slh_dsa: cleanse generated add_random buffer". The patch is 
basically the same one-liner I proposed, with an added comment to make the intent clearer:

```diff
@@ -241,8 +241,9 @@ static int slh_dsa_sign(void *vctx, unsigned char *sig, size_t *siglen,
     ctx->context_string, ctx->context_string_len,
     opt_rand, ctx->msg_encode,
     sig, siglen, sigsize);
-    if (opt_rand != add_rand)
-        OPENSSL_cleanse(opt_rand, n);
+    /* Only cleanse the temporary buffer generated for this signature. */
+    if (opt_rand == add_rand)
+        OPENSSL_cleanse(add_rand, sizeof(add_rand));
     return ret;
}
```

The OpenSSL bot tagged it with "severity: fips change" because changing FIPS provider sources triggers the formal FIPS process, which is a thing I learned exists thanks to this. After the standard 24-hour grace period the change was merged on May 3, 2026.
Even better, it was backported to the 3.5, 3.6 and 4.0 release branches as well as master. So if you are running any of those versions, the fix will be in your distro's next OpenSSL point release. No action needed beyond `apt upgrade` or whatever your platform calls it.
You can see the actual merged commit [here](https://github.com/openssl/openssl/commit/8780b5bcff9dc3be5c072bdb179ce975a0d05cfd) (it also shows up on mirrors like [this fork](https://github.com/maximmasiutin/openssl/commit/8780b5bcff9dc3be5c072bdb179ce975a0d05cfd)).
Total time from "huh, that condition looks weird" to "merged into upstream and backported to four branches": about ten days. That is shockingly fast for a project the size of OpenSSL. Big thanks to Mounir for picking it up so quickly and to Shane and Paul for the review.

## What this taught me
A few things stuck with me from this whole journey:
**Read sister code together.** I would not have spotted this if I had only been looking at `slh_dsa_sig.c`. Putting the two files side by side made the inversion obvious. Whenever there are two files in a codebase that do almost the same thing, diff them. Pull up both. Look for the spot where they disagree on a small detail. That is where the bugs are.
**Cleanup code is high-value review material.** Bugs in cleanup paths do not show up in tests because tests usually only check that the right value comes out, not that the wrong value gets erased. Cleanup is the place where security bugs love to hide. It runs after the success case, often nobody looks at it.
**Tiny conditions matter.** One character. `!=` versus `==`. That is the entire bug. The compiler does not care, the tests pass, the code looks fine on a quick read. Slow review beats fast review.
**Post-quantum crypto is new code.** SLH-DSA and ML-DSA only landed in OpenSSL recently. New crypto code in any library is worth reading. It has been touched by fewer eyes than the OG stuff like AES or RSA, which means the easy wins have not been picked clean yet.
**Filing a clean issue gets a quick fix.** This one surprised me. I included a focused write-up, a small reproducer and a one-line diff that matched the existing pattern in the sibling file. Six days later there was a PR. I think putting in a little extra effort on the report saved everyone time downstream.

## Final Thoughts
I filed the issue as [openssl/openssl#30950](https://github.com/openssl/openssl/issues/30950) on April 23, and ten days later the patch was merged into master and backported to 3.5, 3.6 and 4.0 via [PR #31029](https://github.com/openssl/openssl/pull/31029). Pretty satisfying turnaround.
The main takeaway is honestly more about how I found it than what I found. I wandered into a codebase I do not deeply know, picked a file, found a similar file, read them next to each other and noticed something off. Anyone can do that. You do not need to be a crypto expert to spot dumb logic bugs. You just need to read code and ask "wait, that does not look right".
If you read all the way to the end, thanks for hanging out. Next time you are cleaning up sensitive memory in your own code, double check the condition. Maybe even triple check it. Your future self standing over the core dump will thank you.

Thanks to Bas, Jordan and Thea for your time and help.
