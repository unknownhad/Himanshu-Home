# SYM-6 — Yaml `evaluateBinaryScalar()` Throws `TypeError` on `!!binary !php/object …` Input (Exception-Contract Violation)

> **Severity: LOW**  ·  **CWE-755 (Improper Handling of Exceptional Conditions) + CWE-209 (Generation of Error Message Containing Sensitive Information)**  ·  **CVSS:3.1 ≈ 3.7 (Network / Low / None / None / Unchanged / None / Low / None)**

## Quick facts

| Field | Value |
|---|---|
| **Symfony version tested** | `v8.0.10` (latest stable) |
| **PHP version** | `8.4.21` |
| **Component** | `symfony/yaml` |
| **File** | `src/Symfony/Component/Yaml/Inline.php` |
| **Defective lines** | `836` (`strlen` on null) and `840` (`preg_match` on null) |
| **Status** | **Confirmed reproducible against `v8.0.10` — `TypeError` escapes the `ParseException` contract** |

## Vulnerability summary

`Symfony\Component\Yaml\Yaml::parse()` documents one exception type: `Symfony\Component\Yaml\Exception\ParseException`. Callers are expected to catch `ParseException` when parsing untrusted YAML.

A specific payload — `!!binary !php/object O:1:"A":0:{}` — triggers an **uncaught `TypeError`** from PHP's `strlen()` / `preg_match()`. The exception class is not in the documented contract, so application-level catch-blocks miss it. The resulting unhandled exception:

1. Leaks framework internals (file path, line number, stack frame) in the default Symfony error response.
2. Can deny service if the application's error handler doesn't also catch `\Throwable`.
3. Conceals the (otherwise-valid) `ParseException` that would have been raised about an unsupported tag.

Severity is LOW because the impact is limited to error-handler bypass / minor info disclosure. The fix is trivial.

## Verification

PoC `pocs/exploit-SYM-6-yaml-typeerror.php` run in container:

```
=== SYM-6 — Yaml Parser TypeError PoC ===
Symfony v8.0.10 (latest stable)

--- Valid YAML (baseline) ---
Input: key: value\nlist:\n  - a\n  - b\n
Result: {"key":"value","list":["a","b"]}
Status: Safe (ParseException caught or valid parse)

--- !!binary !php/object (THE CRASH) ---
Input: !!binary !php/object O:1:"A":0:{}

CRASH: TypeError: Symfony\Component\Yaml\Parser::preg_match():
       Argument #2 ($subject) must be of type string, null given,
       called in /app/symfony-src/src/Symfony/Component/Yaml/Inline.php on line 840
       in Parser.php:1061
Status: VULNERABLE — TypeError escapes ParseException handler!

--- !!binary !php/object minimal payload ---
Input: !!binary !php/object a
Status: VULNERABLE — TypeError escapes ParseException handler!

==========================================
Unhandled TypeErrors: 2

VULNERABLE: Yaml::parse() throws TypeError not ParseException
```

The minimum reproducing payload is **22 bytes**: `!!binary !php/object a`.

## Root cause

`src/Symfony/Component/Yaml/Inline.php` (v8.0.10) — `evaluateBinaryScalar()`:

```php
public static function evaluateBinaryScalar(string $scalar): string
{
    $parsedBinaryData = self::parseScalar(preg_replace('/\s/', '', $scalar));
    //                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //                                  may return null when scalar starts with a
    //                                  tag that parseScalar refuses to evaluate

    if (0 !== (\strlen($parsedBinaryData) % 4)) {   // ← line 836 — strlen(null) → TypeError
        throw new ParseException(...);
    }

    if (!Parser::preg_match('#^[A-Z0-9+/]+={0,2}$#i', $parsedBinaryData)) {   // ← line 840 — preg_match(null) → TypeError
        throw new ParseException(...);
    }

    return base64_decode($parsedBinaryData, true);
}
```

`parseScalar()` returns `null` when it encounters a tag (like `!php/object`) inside what `!!binary` expects to be a plain base64 string. The caller `evaluateBinaryScalar()` then passes that `null` to `strlen()` and `preg_match()`, both of which require `string`-typed arguments in PHP 8.x → `TypeError`.

## Recommended fix

`src/Symfony/Component/Yaml/Inline.php`:

```diff
 public static function evaluateBinaryScalar(string $scalar): string
 {
     $parsedBinaryData = self::parseScalar(preg_replace('/\s/', '', $scalar));

+    if (!\is_string($parsedBinaryData)) {
+        throw new ParseException(\sprintf('Expected base64-encoded string after "!!binary", got %s.', get_debug_type($parsedBinaryData)),
+            self::$parsedLineNumber + 1, $scalar, self::$parsedFilename);
+    }
+
     if (0 !== (\strlen($parsedBinaryData) % 4)) {
         throw new ParseException(\sprintf('The normalized base64 encoded data (data without whitespace characters) length must be a multiple of four (%d bytes given).', \strlen($parsedBinaryData)), self::$parsedLineNumber + 1, $scalar, self::$parsedFilename);
     }

     if (!Parser::preg_match('#^[A-Z0-9+/]+={0,2}$#i', $parsedBinaryData)) {
         throw new ParseException(\sprintf('The base64 encoded data (%s) contains invalid characters.', $parsedBinaryData), self::$parsedLineNumber + 1, $scalar, self::$parsedFilename);
     }

     return base64_decode($parsedBinaryData, true);
 }
```

This converts the `TypeError` into the documented `ParseException`, restoring the framework's exception contract.

### Optional companion change — global try/catch in `Yaml::parse()`

To guarantee the contract regardless of which inner function throws, add a top-level catch in `Yaml::parseFile()` / `Yaml::parse()`:

```diff
 // src/Symfony/Component/Yaml/Yaml.php
 public static function parse(string $input, int $flags = 0): mixed
 {
     $yaml = new Parser();
-    return $yaml->parse($input, $flags);
+    try {
+        return $yaml->parse($input, $flags);
+    } catch (ParseException $e) {
+        throw $e;
+    } catch (\Throwable $e) {
+        throw new ParseException(\sprintf('Internal YAML parsing error: %s', $e->getMessage()), 0, null, null, $e);
+    }
 }
```

This is more defensive — any future TypeError introduced by a PHP-version upgrade or new node type gets normalized to `ParseException`. The trade-off is one extra stack frame on every parse, which is negligible.

## Regression test

`Component/Yaml/Tests/InlineTest.php`:

```php
public function testBinaryWithNestedPhpObjectTagThrowsParseException(): void
{
    $this->expectException(ParseException::class);
    Inline::evaluateBinaryScalar('!php/object O:1:"A":0:{}');
}

public function testBinaryWithNestedPhpObjectTagMinimalThrowsParseException(): void
{
    $this->expectException(ParseException::class);
    Inline::evaluateBinaryScalar('!php/object a');
}

public function testYamlParseExceptionContractIsHonored(): void
{
    // The full Yaml::parse() facade should also produce ParseException, not TypeError.
    $this->expectException(ParseException::class);
    Yaml::parse('!!binary !php/object O:1:"A":0:{}');
}
```

## Real-world impact scenarios

- **YAML-based config loaders** that catch only `ParseException` (the documented type) — e.g., application bootstrap, dynamic config reload, CI/CD pipelines that lint config files. An attacker who can submit a YAML file via UI (or who can poison a YAML config endpoint via a related bug) triggers an unhandled exception path.
- **Symfony's own `Loader\YamlFileLoader`** in `Component/Config` — used by `services.yaml`, `routes.yaml`, etc. — wraps `Yaml::parse()` in a `try/catch (ParseException $e)`. The `TypeError` bypasses this handler, surfacing as a full-stack-trace 500 error page that includes file paths.
- **HTTP 500 spam** at the application level if YAML parsing happens in request flow (rare but exists — e.g., admin tools that accept YAML import).

## Disclosure

Low severity. Can be reported via a regular GitHub PR. Suggested commit message:

```
[Yaml] Convert TypeError to ParseException in evaluateBinaryScalar()

When !!binary is combined with another tag (e.g., !!binary !php/object …),
parseScalar() returns null, which then causes strlen()/preg_match() to throw
TypeError in PHP 8.x. The caller is documented to throw only ParseException;
restore that contract by adding an is_string() check.
```

## References

- CWE-755: Improper Handling of Exceptional Conditions
- CWE-209: Generation of Error Message Containing Sensitive Information
- Symfony Yaml component docs: https://symfony.com/doc/current/components/yaml.html
- PHP 8.x type-strict-function changelog
