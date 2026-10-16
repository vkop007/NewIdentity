# Security Policy

## Supported versions

Only the latest release of New Identity gets security fixes.

| Version | Supported |
| --- | --- |
| Latest release | ✅ |
| Older releases | ❌ |

## Reporting a vulnerability

**Please don't report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Report them privately with GitHub's [private vulnerability reporting](https://github.com/vkop007/NewIdentity/security/advisories/new):

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Fill in as much of the following as you can:
   - What the issue is and what an attacker could do with it.
   - Steps to reproduce, or a proof of concept.
   - The affected file(s), extension version, and Chrome version.
   - A suggested fix, if you have one.

### What to expect

- We aim to acknowledge your report within **7 days**.
- We'll keep you updated as we investigate and fix the issue.
- Once a fix is released, we'll publish a security advisory and credit you, unless you'd rather stay anonymous.

Please give us a reasonable amount of time to fix the issue before you disclose it publicly.

## Scope

Examples of issues we especially want to hear about:

- A web page reading or changing extension data, such as identities, inbox contents, the Webshare token, or private card details.
- Card data leaking into storage, exports, history, logs, or network requests.
- Cross-site scripting in the popup, for example through email content or proxy list data.
- Permission escalation, or content scripts running on sites the user didn't allow.
- Proxy credentials being sent to the wrong host.

Out of scope:

- Vulnerabilities in third-party services (Catchmail, Mail.tm, Webshare, or proxy list providers). Please report those to the provider.
- The fact that free public proxies are untrusted. This is expected and documented.
- Problems that need an already-compromised browser or machine.
