# Symfony Security Audit — Final Tested Reports

**Methodology:** Each finding was re-validated against the **latest stable Symfony release** (`v8.0.10`) running inside a Docker container with PHP 8.4.21. Every PoC was executed end-to-end and the captured output is embedded in the per-bug report.

**Test environment:**

| | |
|---|---|
| Symfony version | `v8.0.10` (pulled from `https://github.com/symfony/symfony` tag `v8.0.10`) |
| PHP version | `8.4.21` (`php:8.4-cli` Docker base) |
| Container image | `symfony-poc:latest` (Dockerfile in `verify/` workspace) |
| Composer | v2 (host-side; in-container vendor pre-installed) |
| Test method | One PoC per bug, executed via `docker run --rm symfony-poc:latest php /app/pocs/<poc>.php` |

**Result:** every finding was reproduced against `v8.0.10`. No false positives.

---

## Report index

Reports ranked by severity (CRITICAL → LOW).

| Rank | ID | Severity | Title | Components |
|---|---|---|---|---|
| 1 | [CHAIN-1](CHAIN-1-messenger-pre-auth-rce.md) | **CRITICAL** | Pre-authentication RCE on Messenger workers (SYM-8 + SYM-9 composed) | `messenger`, `security-core` |
| 2 | [SYM-8](SYM-8-signing-serializer-verify-after.md) | **HIGH** | `SigningSerializer::decode()` verifies signature AFTER `unserialize()` | `messenger` |
| 3 | [SYM-4](SYM-4-mailjet-mailtrap-unauthenticated-webhooks.md) | MODERATE / HIGH | Mailjet & Mailtrap webhook bridges silently discard the shared secret | `mailer` |
| 4 | [SYM-3](SYM-3-jsonpath-redos.md) | MODERATE | JsonPath `search()` / `match()` allow attacker-controlled PCRE (ReDoS / worker exhaustion) | `json-path` |
| 5 | [SYM-5](SYM-5-htmlsanitizer-formaction-bypass.md) | MODERATE | HtmlSanitizer misses `action`, `formaction`, `poster` → XSS bypass on `<form action="javascript:…">` | `html-sanitizer` |
| 6 | [SYM-9](SYM-9-security-token-nested-unserialize.md) | LOW (standalone) | Security tokens & exceptions perform nested `unserialize()` in `__unserialize()` (gadget amplifier) | `security-core` |
| 7 | [SYM-7](SYM-7-expressionlanguage-type-errors.md) | LOW | `ExpressionLanguage::evaluate()` leaks `TypeError` / `ValueError` outside the documented exception contract | `expression-language` |
| 8 | [SYM-6](SYM-6-yaml-binary-typeerror.md) | LOW | `Yaml::evaluateBinaryScalar()` throws `TypeError` on `!!binary !php/object …` payloads | `yaml` |
| 9 | [SYM-1](SYM-1-ahasend-hash-equals.md) | LOW | AhaSend webhook signature compared with `!==` instead of `hash_equals` | `mailer` |
| 10 | [SYM-2](SYM-2-vonage-hash-equals.md) | LOW | Vonage webhook JWT signature compared with `!==` instead of `hash_equals` | `notifier` |

---

## Suggested disclosure timeline

| Priority | Items | Channel |
|---|---|---|
| **Immediate (private)** | CHAIN-1, SYM-8 | `security@symfony.com` per https://symfony.com/security |
| Short term (private) | SYM-4, SYM-5, SYM-9 (chains with SYM-8), SYM-3 | `security@symfony.com` |
| Routine (public PR) | SYM-1, SYM-2, SYM-6, SYM-7 | GitHub Pull Request — code-hygiene improvements |

---

## Layout of this directory

```
final-reports/
├── README.md                                              # this file
├── CHAIN-1-messenger-pre-auth-rce.md                      # CRITICAL
├── SYM-8-signing-serializer-verify-after.md               # HIGH
├── SYM-4-mailjet-mailtrap-unauthenticated-webhooks.md     # MODERATE
├── SYM-3-jsonpath-redos.md                                # MODERATE
├── SYM-5-htmlsanitizer-formaction-bypass.md               # MODERATE
├── SYM-9-security-token-nested-unserialize.md             # LOW (CRITICAL when chained)
├── SYM-7-expressionlanguage-type-errors.md                # LOW
├── SYM-6-yaml-binary-typeerror.md                         # LOW
├── SYM-1-ahasend-hash-equals.md                           # LOW
└── SYM-2-vonage-hash-equals.md                            # LOW
```

Each report contains:

- **Quick facts** — version tested, file:line affected, current status
- **Vulnerability summary** — what is broken and why it matters
- **Verification** — exact reproduction steps + captured container output
- **Root cause** — annotated source code from `v8.0.10`
- **Recommended fix** — unified-diff patch ready to drop into a PR
- **Regression test** — PHPUnit test that catches re-introduction
- **Disclosure recommendation** — channel + suggested commit message
- **References** — CWE IDs, related docs, prior art

## Re-running the tests

The test container can be rebuilt and re-run end-to-end:

```bash
# Clone Symfony v8.0.10 source on host (corporate SSL MITM workaround)
mkdir -p /tmp/symfony-verify && cd /tmp/symfony-verify
git clone --depth 1 --branch v8.0.10 https://github.com/symfony/symfony.git symfony-src
(cd symfony-src && composer install --no-progress --prefer-dist)

# Copy PoCs in and build the image
cp -r /path/to/codereview-results/symfony-8.1/exploits ./pocs
cat > Dockerfile <<'EOF'
FROM php:8.4-cli
RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip libicu-dev libzip-dev libxml2-dev libxslt1-dev \
 && docker-php-ext-install -j$(nproc) intl zip xsl opcache \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY symfony-src /app/symfony-src
COPY pocs /app/pocs
EOF
docker build -t symfony-poc:latest .

# Run each PoC
for poc in pocs/local-*.php pocs/exploit-*.php; do
  echo "===== $(basename $poc) ====="
  docker run --rm symfony-poc:latest php "/app/$poc"
done
```
