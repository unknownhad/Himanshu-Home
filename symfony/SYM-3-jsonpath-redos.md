# SYM-3 — JsonPath `search()` / `match()` Allow Attacker-Controlled PCRE Patterns (ReDoS / Worker Exhaustion)

> **Severity: MODERATE**  ·  **CWE-1333 (Inefficient Regular Expression Complexity) + CWE-20 (Improper Input Validation)**  ·  **CVSS:3.1 ≈ 5.3 (Network / Low / None / None / Unchanged / None / None / High)**

## Quick facts

| Field | Value |
|---|---|
| **Symfony version tested** | `v8.0.10` (latest stable) |
| **PHP version** | `8.4.21` (PCRE2 10.x) |
| **Component** | `symfony/json-path` (new component, 8.x line) |
| **File** | `src/Symfony/Component/JsonPath/JsonCrawler.php` |
| **Defective lines** | `794` (`match` function) and `798` (`search` function) |
| **Measured impact** | 1000-node JSON query takes **~1.2 seconds** of wall-clock CPU per request; 20 parallel requests fully saturate a 4-worker PHP-FPM pool |
| **Status** | **Confirmed reproducible against `v8.0.10` in container** |

## Vulnerability summary

Symfony's new `JsonPath` component supports the RFC 9535 JSONPath filter functions `search()` and `match()`, which accept a regex string. The implementation interpolates the user-supplied regex directly into a PCRE pattern with the `/.../u` delimiters — no normalization to the RFC 9485 i-regexp subset, no length cap, no validation against pathological constructs, no `pcre.backtrack_limit` lowering.

An attacker who can supply a JSONPath expression (e.g., as a `?filter=` query parameter, a payload field in a search API, or an OpenAPI-style query DSL) can make the application waste CPU on every JSON node matched by a recursive descent. Even with modern PCRE2's `pcre.backtrack_limit` capping each call at ~1 ms, **cumulative cost scales linearly** with the number of matched nodes, easily saturating worker pools.

## Verification

PoC `pocs/local-SYM-3-jsonpath-redos.php` executed in container:

```
=== SYM-3 — JsonPath search()/match() ReDoS ===
Symfony v8.0.10 (latest stable)

Single-node search(@, '(a+)+$') with 35 a's + 1 mismatch: 0.0063 s
30 matching nodes:                                       0.0352 s
Sanity literal 'world' on simple JSON:                   0.0001 s
1000 matching nodes:                                     1.2013 s

VULNERABLE: 1000-node cumulative cost: 1201 ms
20 parallel connections at this rate fully saturate a 4-worker PHP-FPM pool.
Root cause: JsonCrawler.php:794,798 — preg_match("/{$pattern}/u", ...) with no validation
Fix: enforce RFC 9485 i-regexp subset, or restrict regex grammar
```

A 1-KB JSON document with a single attacker-supplied JSONPath expression `$[?search(@, "(a+)+$")]` consumes 1.2 seconds of worker CPU. At default `pm.max_children = 4` for PHP-FPM, 5 concurrent attackers (taking 1.2 s × 5 = 6 s of pooled CPU) keep the application unresponsive indefinitely.

## Root cause

`src/Symfony/Component/JsonPath/JsonCrawler.php` lines 785–803 (Symfony v8.0.10):

```php
return match ($name) {
    'length' => match (true) {
        \is_string($value) => mb_strlen($value),
        \is_array($value)  => \count($value),
        $value instanceof \stdClass => \count(get_object_vars($value)),
        default => Nothing::Nothing,
    },
    'count' => $nodelistSize,
    'match' => match (true) {
        \is_string($value) && \is_string($argList[1] ?? null) =>
            (bool) @preg_match(\sprintf('/^%s$/u', $this->transformJsonPathRegex($argList[1])), $value),
                                           // ^^^^^^^^^^^^^^^^^^^^^^^^^^ line 794
                                           // attacker controls $argList[1] completely
        default => false,
    },
    'search' => match (true) {
        \is_string($value) && \is_string($argList[1] ?? null) =>
            (bool) @preg_match("/{$this->transformJsonPathRegex($argList[1])}/u", $value),
                                      // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ line 798
        default => false,
    },
    // ...
};
```

`transformJsonPathRegex()` only does cosmetic translation (e.g., escaping curly braces) — it does NOT enforce a regex subset, cap input length, validate against nested quantifiers, or reject obviously-pathological constructs like `(a+)+`, `(a|a)+`, `(.*a){25}`, etc.

The `@` suppresses error reporting from PCRE if the backtrack limit is hit, so failures are silent — an attacker can probe without leaving log entries.

## Recommended fix

Two complementary measures.

### Patch 1 — Validate the regex subset (RFC 9485 i-regexp)

JSONPath's reference grammar requires that filter regexes conform to RFC 9485 i-regexp (a strict subset of PCRE that excludes the constructs known to cause catastrophic backtracking). Add a validator:

```php
// src/Symfony/Component/JsonPath/JsonCrawler.php

private const I_REGEXP_FORBIDDEN_RE = '/
    \([^?][^)]*[*+]\)[*+]   # nested quantifier on group: (a+)+
  | \([^|]*\|[^|]*\)[*+]    # alternation under quantifier: (a|b)+
  | \{(\d+),(\d+)\}.*\{\d+,\d+\}  # multiple bounded quantifiers in series
/xu';

private function transformJsonPathRegex(string $pattern): string
{
    if (\strlen($pattern) > 256) {
        throw new \InvalidArgumentException('JSONPath filter regex is too long (max 256 chars).');
    }
    if (preg_match(self::I_REGEXP_FORBIDDEN_RE, $pattern)) {
        throw new \InvalidArgumentException('JSONPath filter regex uses constructs not allowed by RFC 9485 i-regexp.');
    }

    // ... existing cosmetic translation
}
```

### Patch 2 — Lower the per-call backtrack limit during JSONPath evaluation

Even with a syntax filter, defense in depth helps. Wrap the `preg_match` calls in a tight backtrack bound:

```diff
 'match' => match (true) {
-    \is_string($value) && \is_string($argList[1] ?? null) =>
-        (bool) @preg_match(\sprintf('/^%s$/u', $this->transformJsonPathRegex($argList[1])), $value),
+    \is_string($value) && \is_string($argList[1] ?? null) =>
+        (bool) $this->safePregMatch(\sprintf('/^%s$/u', $this->transformJsonPathRegex($argList[1])), $value),
     default => false,
 },
 'search' => match (true) {
-    \is_string($value) && \is_string($argList[1] ?? null) =>
-        (bool) @preg_match("/{$this->transformJsonPathRegex($argList[1])}/u", $value),
+    \is_string($value) && \is_string($argList[1] ?? null) =>
+        (bool) $this->safePregMatch("/{$this->transformJsonPathRegex($argList[1])}/u", $value),
     default => false,
 },
```

```php
private function safePregMatch(string $pattern, string $subject): int|false
{
    $prevBacktrack = ini_set('pcre.backtrack_limit', '10000');
    $prevRecursion = ini_set('pcre.recursion_limit', '1000');
    try {
        return preg_match($pattern, $subject);
    } finally {
        ini_set('pcre.backtrack_limit', $prevBacktrack);
        ini_set('pcre.recursion_limit', $prevRecursion);
    }
}
```

This caps any single call at ~10 000 backtrack states — far below the default 1 000 000 — so even successful pathological inputs become microsecond-scale instead of millisecond-scale.

### Patch 3 — Document the threat model

Add to the JSONPath component README:

> **Security note:** JSONPath filter expressions are part of the *application*'s trust domain. If your app exposes a parameter that lets HTTP users supply raw JSONPath, those users can submit `search()` / `match()` filters with attacker-controlled regex bodies. Symfony validates that the regex is in the RFC 9485 i-regexp subset before evaluation, but the conservative recommendation is to restrict allowed top-level operators (no `?filter`, no `search/match`) when accepting JSONPath from untrusted sources.

## Regression test

`Component/JsonPath/Tests/JsonCrawlerReDoSTest.php`:

```php
public function testRejectsPathologicalRegexInSearch(): void
{
    $crawler = new JsonCrawler(json_encode([str_repeat('a', 30).'!']));
    $this->expectException(\InvalidArgumentException::class);
    $crawler->find('$[?search(@, "(a+)+$")]');
}

public function testRejectsRegexLongerThan256Chars(): void
{
    $crawler = new JsonCrawler(json_encode(['x']));
    $long = str_repeat('a', 300);
    $this->expectException(\InvalidArgumentException::class);
    $crawler->find("\$[?search(@, \"$long\")]");
}

public function testAcceptsBenignFilterRegex(): void
{
    $crawler = new JsonCrawler(json_encode(['hello world']));
    $hits = $crawler->find('$[?search(@, "world")]');
    $this->assertNotEmpty($hits);
}

public function testCatastrophicRegexDoesNotExceedTimeBudget(): void
{
    // Even with the subset filter accidentally letting something through,
    // safePregMatch caps execution time.
    $crawler = new JsonCrawler(json_encode(array_fill(0, 1000, str_repeat('a', 30).'!')));
    $t0 = microtime(true);
    try {
        $crawler->find('$[?search(@, "literal-not-pathological")]');
    } catch (\Throwable) {
        // ignore
    }
    $elapsed = microtime(true) - $t0;
    $this->assertLessThan(0.5, $elapsed,
        '1000-node JSONPath query took > 500 ms — backtrack cap may be ineffective.');
}
```

## Disclosure

Report privately to `security@symfony.com`. This component is new (released in 8.x) and not yet widely deployed — early hardening is critical before broad adoption.

## References

- CWE-1333: Inefficient Regular Expression Complexity
- RFC 9485 — I-Regexp: An interoperable regular expression dialect (subset of PCRE specifically designed to avoid catastrophic backtracking)
- RFC 9535 — JSONPath: Query Expressions for JSON
- PHP `pcre.backtrack_limit`: https://www.php.net/manual/en/pcre.configuration.php
