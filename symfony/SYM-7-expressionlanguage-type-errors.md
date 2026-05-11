# SYM-7 — ExpressionLanguage `evaluate()` Leaks `TypeError` / `ValueError` Outside the Documented Exception Contract

> **Severity: LOW (DoS-grade in security-expression context)**  ·  **CWE-755 (Improper Handling of Exceptional Conditions) + CWE-20 (Improper Input Validation)**  ·  **CVSS:3.1 ≈ 3.7 (Network / Low / None / None / Unchanged / None / Low / None)**

## Quick facts

| Field | Value |
|---|---|
| **Symfony version tested** | `v8.0.10` (latest stable) |
| **PHP version** | `8.4.21` |
| **Component** | `symfony/expression-language` |
| **Files affected** | `src/Symfony/Component/ExpressionLanguage/Node/BinaryNode.php`, `UnaryNode.php`, `GetAttrNode.php` |
| **Status** | **Confirmed reproducible against `v8.0.10`** — 8/12 fuzz-derived inputs leak `TypeError` / `ValueError` outside the documented `SyntaxError | RuntimeException` contract |

## Vulnerability summary

`Symfony\Component\ExpressionLanguage\ExpressionLanguage::evaluate()` documents two exception types in its callers and tests:

- `Symfony\Component\ExpressionLanguage\SyntaxError` — for parse failures
- `\RuntimeException` (or subclass) — for evaluation failures

PHP 8.x is strict about type compatibility for many operators. `BinaryNode::evaluate()` and `UnaryNode::evaluate()` apply raw PHP operators (`+`, `**`, `..`, unary `-`, `~`, `matches`) without pre-checking operand types. When a user-supplied expression mixes incompatible types (e.g., `int + string`, `array ** int`, `[1,2] .. 5`), PHP throws a `TypeError` or `ValueError` that **bypasses** the documented contract.

The 8 confirmed leak paths give a DoS primitive whenever an application:
- Evaluates user-supplied expressions
- Catches only `SyntaxError` and/or `RuntimeException`
- Renders unhandled exceptions to the response (default Symfony behavior is a HTTP 500 with the exception class + message + a trace in debug mode)

This is especially dangerous in security contexts: `#[IsGranted(expression(...))]`, `access_control` rules in `security.yaml`, route `condition:` expressions — places where the application explicitly catches *expected* errors and fail-closes only on those.

## Verification

PoC `pocs/local-SYM-7-expressionlang-typeerrors.php` run in container — 12 fuzz-derived inputs, with verdict per case:

```
=== SYM-7 — ExpressionLanguage unhandled TypeError/ValueError ===
Symfony v8.0.10 (latest stable)

  case  1: a ** 2 + "💥"                 =>  LEAKED   (TypeError): Unsupported operand types: int + string
  case  2: "hello" ** 2                  =>  LEAKED   (TypeError): Unsupported operand types: string ** int
  case  3: 2 ** "hello"                  =>  LEAKED   (TypeError): Unsupported operand types: int ** string
  case  4: [1,2] ** 2                    =>  LEAKED   (TypeError): Unsupported operand types: array ** int
  case  5: 2 ** [1]                      =>  LEAKED   (TypeError): Unsupported operand types: int ** array
  case  6: -[1,2]                        =>  LEAKED   (TypeError): Unsupported operand types: array * int
  case  7: ~[1,2]                        =>  LEAKED   (TypeError): Cannot perform bitwise not on array
  case  8: "ab" .. "c"                   =>  RETURNED array(3)
  case  9: "ab" .. "x"                   =>  RETURNED array(24)
  case 10: [1,2] .. 5                    =>  LEAKED   (TypeError): range(): Argument #1 must be of type string|int|float, array given
  case 11: "x" matches "/re/"            =>  RETURNED 0
  case 12: [1,2][0][1]                   =>  DOCUMENTED (RuntimeException): Unable to get an item of non-array "[1, 2][0]".

==========================================
Documented (SyntaxError/RuntimeException): 1
OK (returned a value):                     3
LEAKED (TypeError/ValueError/Error):       8

VULNERABLE: 8 test cases leak TypeError/ValueError outside the documented exception contract.
```

## Root cause

### `BinaryNode::evaluate()` — `src/Symfony/Component/ExpressionLanguage/Node/BinaryNode.php` (v8.0.10):

```php
public function evaluate(array $functions, array $values): mixed
{
    // ...
    switch ($operator) {
        case '+':
            return $left + $right;                  // ← line 158 — int+string → TypeError
        case '**':
            return $left ** $right;                 // ← line 113 — array**int → TypeError
        case '..':
            return range($left, $right);            // ← line ~113 — array→range → TypeError
        case 'matches':
            // ...preg_match($right, $left)...     // ← line 189 — TypeError on non-string $left
    }
    // ...
}
```

### `UnaryNode::evaluate()` (line ~56-57):

```php
case '-':
    return -$value;        // ← TypeError if $value is array
case '~':
    return ~$value;        // ← TypeError if $value is array
```

The implementations rely on PHP raising its own errors and never normalize them.

## Recommended fix

Two complementary patches.

### Patch A — Wrap `evaluate()` in a normalizing try/catch (single point fix)

`src/Symfony/Component/ExpressionLanguage/ExpressionLanguage.php`:

```diff
 public function evaluate(Expression|string $expression, array $values = []): mixed
 {
-    return $this->parse($expression, array_keys($values))
-        ->getNodes()
-        ->evaluate($this->functions, $values);
+    try {
+        return $this->parse($expression, array_keys($values))
+            ->getNodes()
+            ->evaluate($this->functions, $values);
+    } catch (SyntaxError | \RuntimeException $e) {
+        throw $e;
+    } catch (\TypeError | \ValueError | \Error $e) {
+        throw new \RuntimeException(
+            \sprintf('Failed to evaluate expression %s: %s',
+                $expression instanceof Expression ? '"'.$expression.'"' : '"'.$expression.'"',
+                $e->getMessage()
+            ),
+            previous: $e
+        );
+    }
 }
```

This converts any rogue `TypeError`/`ValueError`/`Error` into `RuntimeException`, honoring the documented contract for all callers.

### Patch B — Per-operator type pre-checks (more precise errors)

`src/Symfony/Component/ExpressionLanguage/Node/BinaryNode.php`:

```diff
 case '+':
+    $this->ensureNumericOrString($left, $right, '+');
     return $left + $right;
 case '-':
+    $this->ensureNumeric($left, $right, '-');
     return $left - $right;
 case '**':
+    $this->ensureNumeric($left, $right, '**');
     return $left ** $right;
 case '..':
+    if (!is_int($left) && !is_string($left) && !is_float($left)) {
+        throw new \RuntimeException(\sprintf('Operator "..": left operand must be int|float|string, %s given.', get_debug_type($left)));
+    }
+    if (!is_int($right) && !is_string($right) && !is_float($right)) {
+        throw new \RuntimeException(\sprintf('Operator "..": right operand must be int|float|string, %s given.', get_debug_type($right)));
+    }
     return range($left, $right);
```

```php
private function ensureNumeric(mixed $a, mixed $b, string $op): void
{
    if (!is_numeric($a) || !is_numeric($b)) {
        throw new \RuntimeException(\sprintf(
            'Operator "%s": both operands must be numeric, got %s and %s.',
            $op, get_debug_type($a), get_debug_type($b)
        ));
    }
}

private function ensureNumericOrString(mixed $a, mixed $b, string $op): void
{
    if (!is_numeric($a) && !is_string($a)) {
        throw new \RuntimeException(\sprintf('Operator "%s": left operand must be numeric or string, got %s.', $op, get_debug_type($a)));
    }
    if (!is_numeric($b) && !is_string($b)) {
        throw new \RuntimeException(\sprintf('Operator "%s": right operand must be numeric or string, got %s.', $op, get_debug_type($b)));
    }
}
```

Apply equivalent guards to `UnaryNode::evaluate()` (`-`, `~`, `+`).

**Recommendation:** ship Patch A immediately (defense-in-depth, single-line semantic change) and follow up with Patch B (better error messages, easier to debug for users).

## Regression tests

`Component/ExpressionLanguage/Tests/ExpressionLanguageTest.php`:

```php
/**
 * @dataProvider provideTypeMismatchExpressions
 */
public function testTypeMismatchThrowsRuntimeExceptionNotTypeError(string $expr, array $vars = []): void
{
    $el = new ExpressionLanguage();
    try {
        $el->evaluate($expr, $vars);
        $this->fail("Expected exception was not thrown for: $expr");
    } catch (SyntaxError | \RuntimeException $e) {
        // OK — documented exception type
    } catch (\TypeError | \ValueError | \Error $e) {
        $this->fail("Expression $expr leaked ".$e::class.": ".$e->getMessage()." — should be RuntimeException.");
    }
}

public static function provideTypeMismatchExpressions(): array
{
    return [
        ['a ** 2 + "💥"', ['a' => 1]],
        ['"hello" ** 2'],
        ['2 ** "hello"'],
        ['[1,2] ** 2'],
        ['2 ** [1]'],
        ['-[1,2]'],
        ['~[1,2]'],
        ['[1,2] .. 5'],
    ];
}
```

## Realistic exploitation paths

The bug is "DoS only" in the default case (an unhandled exception → HTTP 500), but in specific Symfony deployments the impact is larger:

1. **`#[IsGranted("permission", subject: expression(...))]`** — Symfony's expression-based authorization. If the `subject:` expression references user-influenceable variables (e.g., a route parameter), the attacker can pick a value that triggers a TypeError. The voter's exception path may or may not fail-closed; needs verification per-app.
2. **`security.yaml access_control[].allow_if`** — Same threat model. Default Symfony fail-closes (RuntimeException → access denied), but some custom voters fail-open.
3. **`condition:` on a route definition** — `condition: "request.headers.get('X-Tier') == 'premium'"`. If the condition reference user input and triggers a TypeError, the route matcher may produce an HTTP 500.
4. **Form `Expression` constraint** — used for cross-field validation. Throwing an uncaught TypeError causes form rendering to fail.

In every case, Patch A (normalize to RuntimeException) eliminates the cross-boundary leak.

## Disclosure

Low/Medium severity. Patch A is a one-method change with no behavior break for legitimate uses. Suggested commit message:

```
[ExpressionLanguage] Normalize TypeError/ValueError to RuntimeException

ExpressionLanguage::evaluate() is documented to throw SyntaxError or
RuntimeException. PHP 8.x's strict-type operators in BinaryNode/UnaryNode
can throw TypeError/ValueError that escape this contract. Wrap evaluate()
in a normalizing try/catch so callers can rely on the documented surface.
```

## References

- CWE-755: Improper Handling of Exceptional Conditions
- Symfony ExpressionLanguage docs: https://symfony.com/doc/current/components/expression_language.html
- PHP 8.x strict-type-operator changelog
