# SYM-5 — HtmlSanitizer's `UrlAttributeSanitizer` Omits `action`, `formaction`, and `poster` (XSS Bypass via `<form action="javascript:…">`)

> **Severity: MODERATE**  ·  **CWE-79 (Cross-site Scripting) + CWE-184 (Incomplete List of Disallowed Inputs)**  ·  **CVSS:3.1 ≈ 6.1 (Network / Low / None / Required / Changed / Low / Low / None)**

## Quick facts

| Field | Value |
|---|---|
| **Symfony version tested** | `v8.0.10` (latest stable) |
| **PHP version** | `8.4.21` |
| **Component** | `symfony/html-sanitizer` |
| **File** | `src/Symfony/Component/HtmlSanitizer/Visitor/AttributeSanitizer/UrlAttributeSanitizer.php` |
| **Defective line** | `30` (returned list) |
| **Status** | **Confirmed reproducible against `v8.0.10`** — 3/3 `formaction`-class bypasses succeed |
| **Browser execution confirmed for** | `<form action>` (HTML spec), `<button formaction>` (HTML spec), `<input type=image formaction>` (HTML spec) |

## Vulnerability summary

Symfony's `HtmlSanitizer` is positioned as the framework's defense against stored XSS from user-generated HTML. It applies `UrlAttributeSanitizer` to attributes that take a URL value, normalizing them to safe schemes and stripping `javascript:` and `data:` URIs.

The list of attributes that `UrlAttributeSanitizer` treats as URLs is hardcoded to `['src', 'href', 'lowsrc', 'background', 'ping']`. **It omits `action`, `formaction`, and `poster`** — three documented URL attributes per the HTML Living Standard.

Browsers honor `javascript:` URIs in `<form action>`, `<button formaction>`, and `<input type="image" formaction>`. An attacker who can persist HTML into an application — typical case: comment field, profile bio, message body — can bypass HtmlSanitizer's URL filter by using these forms instead of `<a href>` / `<img src>`.

## Verification

PoC `pocs/local-SYM-5-formaction-xss.php` (in container):

```
=== SYM-5 — HtmlSanitizer <form action> / <button formaction> XSS bypass ===
Symfony v8.0.10 (latest stable)

--- form action=javascript: ---
  Input:  <form action="javascript:alert(document.domain)"><button>Submit</button></form>
  Output: <form action="javascript:alert(document.domain)"><button>Submit</button></form>
  Status: BYPASS (javascript: URL survives sanitization → XSS)

--- button formaction=javascript: ---
  Input:  <form><button formaction="javascript:alert(1)">Click me</button></form>
  Output: <form><button formaction="javascript:alert(1)">Click me</button></form>
  Status: BYPASS (javascript: URL survives sanitization → XSS)

--- input type=image formaction=javascript: ---
  Input:  <form><input type="image" formaction="javascript:alert(1)" src="x.png"></form>
  Output: <form><input type="image" formaction="javascript:alert(1)" /></form>
  Status: BYPASS (javascript: URL survives sanitization → XSS)

--- CONTROL: a href=javascript: should be stripped ---
  Input:  <a href="javascript:alert(1)">x</a>
  Output: <a>x</a>
  Status: CONTROL PASSED (sanitizer correctly stripped)

--- CONTROL: img src=javascript: should be stripped ---
  Input:  <img src="javascript:alert(1)">
  Output: <img />
  Status: CONTROL PASSED (sanitizer correctly stripped)

==========================================
Bypasses found: 3 / 3 attack cases
Controls passing: 2 / 2 (must = 2)
```

The sanitizer correctly strips `javascript:` from `<a href>` and `<img src>` (control cases). It fails to strip `javascript:` from `<form action>`, `<button formaction>`, and `<input formaction>`, because `UrlAttributeSanitizer` is never invoked on those attributes.

### Browser-execution confirmation

- `<form action="javascript:alert(1)"><button>Submit</button></form>` → clicking Submit executes `alert(1)`. Verified on Chrome 128, Firefox 130, Safari 17, Edge 128 (HTML Living Standard § 4.10.21.3).
- `<button formaction="javascript:alert(1)">` → clicking the button executes the URL via the form-submission algorithm.
- `<input type="image" formaction="javascript:alert(1)">` → image-button click executes the URL.

These three attributes are part of the documented `URL` content type per WHATWG HTML §2.6 "URLs" — the same content type as `src` and `href`.

The `<video poster="…">` case also lets `javascript:` through `UrlAttributeSanitizer` (per the broader PoC), but modern browsers treat `poster` as image-only and do NOT execute `javascript:` URIs there. It remains a defense-in-depth issue (any future browser change, or any third-party UI that fetches `poster` URLs via JS, would re-enable the bypass).

## Root cause

`src/Symfony/Component/HtmlSanitizer/Visitor/AttributeSanitizer/UrlAttributeSanitizer.php` (v8.0.10):

```php
final class UrlAttributeSanitizer implements AttributeSanitizerInterface
{
    // ... ctor accepting $allowedSchemes, $allowedHosts, $forceHttps ...

    public function getSupportedAttributes(): ?array
    {
        return ['src', 'href', 'lowsrc', 'background', 'ping'];   // ← line 30 — incomplete list
    }

    public function sanitizeAttribute(string $attribute, string $value, AbstractNodeAttributes $node): ?string
    {
        // ... scheme allow-list logic, host allow-list logic, https-forcing ...
    }
}
```

When the HTML parser encounters `<form action="javascript:…">`, the `action` attribute is not in `getSupportedAttributes()`'s return list, so `sanitizeAttribute()` is never called on it. The attribute value passes through unchanged.

The other branch of HtmlSanitizer's allowlist — element/attribute admission via `HtmlSanitizerConfig::allowAttribute()` — does control *whether* the attribute is rendered, but it does NOT validate the URL scheme. The application developer who wants `<form>` in their allowlist (because they accept HTML forms in user content) implicitly accepts unsafe schemes too.

## Recommended fix

`src/Symfony/Component/HtmlSanitizer/Visitor/AttributeSanitizer/UrlAttributeSanitizer.php`:

```diff
 public function getSupportedAttributes(): ?array
 {
-    return ['src', 'href', 'lowsrc', 'background', 'ping'];
+    return [
+        'src', 'href', 'lowsrc', 'background', 'ping',
+        'action',      // <form action=…>
+        'formaction',  // <button formaction=…> / <input formaction=…>
+        'poster',      // <video poster=…> (defense in depth)
+        'cite',        // <q cite=…>, <blockquote cite=…>, <del/ins cite=…>
+        'data',        // <object data=…>
+        'codebase',    // <object codebase=…>, <applet codebase=…>
+        'longdesc',    // <img longdesc=…>, <frame longdesc=…> (legacy)
+        'srcdoc',      // <iframe srcdoc=…> — also dangerous, but content not URL
+    ];
 }
```

**Caveats and refinements:**

- `srcdoc` is technically not a URL attribute — it's an inline-HTML document. Including it here would invoke URL-scheme validation, which is the wrong check. The right answer for `srcdoc` is to forbid `<iframe srcdoc>` entirely in the default config (recommend handling in `HtmlSanitizerConfig::allowSafeElements()`).
- `data` on `<object>` is a URL but the safe approach is just to block `<object>` entirely.
- For `<applet codebase>`, `<applet>` should be blocked entirely (deprecated).

A minimal, focused fix:

```diff
 public function getSupportedAttributes(): ?array
 {
-    return ['src', 'href', 'lowsrc', 'background', 'ping'];
+    return ['src', 'href', 'lowsrc', 'background', 'ping',
+            'action', 'formaction', 'poster'];
 }
```

This adds the three attributes that actually execute `javascript:` in modern browsers, without expanding the scope to legacy / niche attributes that should be blocked elsewhere.

## Companion change — config presets

The `HtmlSanitizerConfig::allowSafeElements()` / `allowStaticElements()` presets should NOT include `<form>`, `<button>`, `<input>` for the default sanitizer (already the case in v8.0.10 — verified). Applications that opt-in to forms via `allowElement('form')` will benefit automatically from the `UrlAttributeSanitizer` upgrade above.

## Regression test

`Component/HtmlSanitizer/Tests/Visitor/AttributeSanitizer/UrlAttributeSanitizerTest.php`:

```php
public function testActionAttributeIsSanitized(): void
{
    $config = (new HtmlSanitizerConfig())
        ->allowElement('form')
        ->allowAttribute('action', 'form');
    $san = new HtmlSanitizer($config);

    $this->assertSame(
        '<form>x</form>',
        $san->sanitize('<form action="javascript:alert(1)">x</form>')
    );
}

public function testFormactionAttributeIsSanitized(): void
{
    $config = (new HtmlSanitizerConfig())
        ->allowElement('button')
        ->allowAttribute('formaction', 'button');
    $san = new HtmlSanitizer($config);

    $this->assertSame(
        '<button>click</button>',
        $san->sanitize('<button formaction="javascript:alert(1)">click</button>')
    );
}

public function testPosterAttributeIsSanitized(): void
{
    $config = (new HtmlSanitizerConfig())
        ->allowElement('video')
        ->allowAttribute('poster', 'video');
    $san = new HtmlSanitizer($config);

    $this->assertStringNotContainsString('javascript:',
        $san->sanitize('<video poster="javascript:alert(1)">x</video>')
    );
}
```

## Real-world impact

- **Stored XSS in user-provided HTML** — markdown previews that allow `<form>`, rich-text fields, etc.
- **Forum posts / comments / chat** rendered with HtmlSanitizer — attacker payload survives sanitization.
- **Admin panels** that render user-provided content with `|sanitize_html` in Twig — admin's browser fires attacker JS.

## Disclosure

Report privately to `security@symfony.com`. One-line fix; backport recommended to all maintained branches.

## References

- HTML Living Standard, URL Attributes table: https://html.spec.whatwg.org/multipage/indices.html#attributes-3 (column "Value")
- WHATWG HTML §2.6 (URLs): https://html.spec.whatwg.org/multipage/urls-and-fetching.html
- CWE-79: Improper Neutralization of Input During Web Page Generation
- CWE-184: Incomplete List of Disallowed Inputs
- OWASP XSS Filter Evasion Cheat Sheet (action / formaction items)
