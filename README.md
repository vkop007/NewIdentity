<p align="center">
  <img src="icons/icon-128.png" alt="New Identity logo" width="96" height="96">
</p>

<h1 align="center">New Identity</h1>

<p align="center">
  A zero-dependency Chrome extension that generates realistic test identities, gives each one a working temporary inbox, and fills web forms for you.
</p>

<p align="center">
  <a href="https://github.com/vkop007/NewIdentity/actions/workflows/ci.yml"><img src="https://github.com/vkop007/NewIdentity/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <img src="https://img.shields.io/badge/Manifest-V3-4285F4?logo=googlechrome&logoColor=white" alt="Manifest V3">
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen" alt="Zero dependencies">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license"></a>
</p>

---

New Identity is built for developers, QA engineers, and testers who need to sign up for things over and over without using real personal data. Click **Generate**, get a complete profile with a real disposable email address, fill the signup form in one click, and read the verification email (or copy the OTP) without leaving the popup.

There is no build step, no framework, and no npm dependencies. The source you read is the code that runs.

> [!IMPORTANT]
> **About the name:** "New Identity" means a *fictional test profile* that keeps your real identity safe. It does not mean pretending to be someone else. Every generated person is made up, and the extension is meant for testing and protecting your own privacy. Please read [Responsible use](#responsible-use) before using it.

## Why New Identity?

Every time you type your real details into a random signup form, you share them with another company that can spam you, sell your data, or get breached. New Identity gives you a safe stand-in instead:

- 🛡️ **Protect your real email and phone.** Use a disposable inbox for newsletters, free trials of tools you're only evaluating, downloads behind an email wall, and other sites you don't trust yet.
- 🧪 **Test your own apps safely.** Developers and QA engineers can run signup, onboarding, and email verification flows hundreds of times without using real customer or personal data.
- 🔐 **Limit tracking.** Optional proxy and anti-fingerprinting tools reduce how easily websites can follow you across sessions.
- 🧹 **Avoid leaking data in screenshots and demos.** Record tutorials, bug reports, and demos with realistic data that belongs to nobody.

## Table of contents

- [Why New Identity?](#why-new-identity)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Permissions](#permissions)
- [Privacy](#privacy)
- [Project structure](#project-structure)
- [Development](#development)
- [Contributing](#contributing)
- [Responsible use](#responsible-use)
- [License](#license)

## Features

### Identity generation

- Names, phone numbers, addresses, cities, postal codes, and states for **250 countries and territories**, all generated locally.
- Rich profile fields: title, gender, age, date of birth, middle name, username, password, company, job title, and website.
- **Seeded generation**: enter a seed (or click **Roll**) to reproduce the same identity every time.
- Configurable name style (any / female / male), age range, middle names, and password rules (length, uppercase, numbers, symbols, readable characters).
- Recent identities history, with export to JSON or CSV and import from JSON.

### Temporary inbox

- Every identity gets a real disposable inbox from [Catchmail](https://catchmail.io), with [Mail.tm](https://mail.tm) as a fallback provider.
- Read incoming mail in the popup, with optional auto refresh.
- Verification codes and OTPs are detected automatically. Copy them, or fill them into the page.

### Form autofill

- Fill matching inputs on the current page in one click.
- Matches fields using `autocomplete` attributes, labels, placeholders, names, and `<select>` options.
- **Autofill preview** shows which fields will be filled before anything is written.
- **Custom field mappings** let you teach it about unusual forms (`page keyword = profile key`).
- Optional automatic filling of empty fields on every page you allow.

### Proxy and privacy tools

- One-click browser proxy using free public proxy lists (ProxyScrape, Proxifly, Geonode), refreshed every minute and ranked by quality.
- Optional stable source: a free [Webshare](https://www.webshare.io) proxy API token.
- Auto reconnect rotates to a fresh route if the active one fails.
- **Match proxy country** keeps the proxy country in sync with the identity's country.
- **Anti-fingerprinting** aligns timezone, locale, and geolocation with the active proxy or identity.
- **Extended masking** spoofs CPU/RAM hardware hints, WebGL renderer details, and the canvas fingerprint.

### Private test card (optional)

- Load a payment card from a local, git-ignored `private-card.json` file for checkout testing.
- Card fields are blurred in the popup, masked on pages after filling, and can be locked behind a reveal PIN.
- Card data is never stored in history, never exported, and never included in the release package.

### Other

- Copy individual fields, the full profile, or ready-made message snippets.
- Light, dark, and system themes.

## Installation

### Option 1: Download a release (recommended)

1. Download the latest `new-identity-x.y.z.zip` from the [Releases page](https://github.com/vkop007/NewIdentity/releases).
2. Unzip it to a folder you'll keep. Chrome loads the extension from this folder, so don't delete it.
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode** (top-right corner).
5. Click **Load unpacked** and select the unzipped folder.
6. Pin **New Identity** from the puzzle-piece menu in the toolbar.

### Option 2: Install from source

```bash
git clone https://github.com/vkop007/NewIdentity.git
```

Then follow steps 3 to 6 above, selecting the cloned `NewIdentity` folder.

To update later, run `git pull` and click the reload icon on the extension's card in `chrome://extensions`.

> **Other browsers:** New Identity is a standard Manifest V3 extension, so it should also work in Chromium-based browsers like Edge, Brave, Arc, and Opera through their own "load unpacked" option. Chrome is the only browser it's actively tested on.

## Usage

1. Click the New Identity icon in the toolbar.
2. Choose a **Country** and click **Generate**. A new profile and inbox are created.
3. Open a signup form and click **Fill form**. If preview is enabled, check the matched fields and confirm.
   - The first time you fill on a site, Chrome asks for permission to access it.
4. Switch to the **Inbox** tab and click **Check mail** to see incoming messages. Use **Copy OTP** to grab a verification code.
5. Use the **Proxy** tab to route the browser through a proxy. Click **Connect** to start, and click the same button again to disconnect.

Every field in the profile has its own copy button. **Copy profile** copies everything at once.

## Configuration

All options are in the **Settings** tab and are saved in Chrome's local storage.

| Setting | What it does |
| --- | --- |
| Theme | System, light, or dark popup theme. |
| Name style | Generate any, female, or male names. |
| Min age / Max age | Age range for generated birth dates. |
| Include middle name | Add a middle name to generated profiles. |
| Generation seed | Same seed and settings produce the same identity. Leave it empty for random identities. |
| Password rules | Length and character classes for generated passwords. |
| Save history | Keep recent identities in local storage. |
| Auto-copy profile | Copy the full profile to the clipboard after each generation. |
| Auto-fill pages | Fill empty matching fields automatically on sites you allow. |
| Preview before filling | Show matched fields before the manual **Fill form** action. |
| Custom field mapping | One rule per line, e.g. `promo_email = email`. |
| Card autofill | Include the private card when you click **Fill form**. |
| Private card lock | Require a PIN before card details are revealed. |
| Anti-fingerprinting | Spoof timezone, locale, and coordinates. |
| Match proxy country | Refresh proxy routes when the identity's country changes. |
| Extended masking | Spoof hardware, WebGL, and canvas fingerprints. |

### Custom field mappings

Use custom mappings when a site's fields have unusual names. Each line maps a keyword found in the page field (name, id, label, or placeholder) to a profile key:

```text
signup_mail = email
handle = username
given = firstName
family = lastName
mobile = phone
street = address1
town = city
zip = postalCode
```

You can use `=`, `:`, `->`, or `=>` as the separator. Lines starting with `#` are ignored. Custom rules are checked before the built-in matching.

<details>
<summary>All profile keys</summary>

| Group | Keys |
| --- | --- |
| Name and account | `fullName`, `fullNameWithMiddle`, `firstName`, `middleName`, `lastName`, `username`, `email`, `password`, `confirmPassword` |
| Personal | `prefix`, `gender`, `age`, `dateOfBirth`, `birthDay`, `birthMonth`, `birthYear` |
| Contact and address | `phone`, `phoneNational`, `address1`, `address2`, `addressBlock`, `city`, `state`, `postalCode`, `country`, `countryCode` |
| Work | `company`, `jobTitle`, `website` |
| Card (only with card autofill on) | `cardName`, `cardNumber`, `cardExpiry`, `cardExpiryMonth`, `cardExpiryYear`, `cardCvv` |

</details>

### Webshare proxy source (optional)

Free public proxies can be slow or unreliable. For a more stable connection:

1. Create a free account at [webshare.io](https://www.webshare.io).
2. Copy your API key from the **API** section of the Webshare dashboard.
3. In the **Proxy** tab, paste it into **API token** and click **Save source**.

The token is stored only in Chrome's local storage on your machine and is sent only to `proxy.webshare.io`.

### Private test card (optional)

To test checkout flows, create a `private-card.json` file in the extension folder. Start from the example:

```bash
cp private-card.example.json private-card.json
```

```json
{
  "paymentCard": {
    "number": "4242424242424242",
    "expiryMonth": "12",
    "expiryYear": "2030",
    "cvv": "123"
  }
}
```

Then reload the extension in `chrome://extensions`.

> [!WARNING]
> Use your payment provider's **test card numbers** whenever possible. `private-card.json` is listed in `.gitignore` and left out of `npm run package`, but it is a plain-text file on your disk. Never commit it, share it, or put a real card in a folder that syncs to the cloud.

## Permissions

New Identity asks for as little access as it can. Website access is **optional** and is only requested when you first fill a form or enable a feature that needs it.

| Permission | Why it's needed |
| --- | --- |
| `activeTab`, `scripting` | Fill forms on the page you're looking at. |
| `storage` | Save settings, history, and the current identity locally. |
| `alarms` | Refresh proxy lists and the inbox in the background. |
| `proxy` | Route browser traffic through the selected proxy. |
| `webRequest`, `webRequestAuthProvider` | Supply credentials for authenticated (Webshare) proxies and detect failed routes. |
| Optional `http://*/*`, `https://*/*` | Automatic filling and fingerprint spoofing on sites you allow. You can revoke this from Settings. |
| Fixed API hosts | Catchmail, Mail.tm, proxy list providers, Webshare, and IP geolocation lookups (`api.country.is`, `ipwho.is`). |

## Privacy

- Identities are generated **entirely on your device**.
- There are **no analytics, telemetry, or tracking**, and no server operated by this project.
- Network requests go only to the third-party services listed in [Permissions](#permissions), and only for the features you use.

See [PRIVACY.md](PRIVACY.md) for full details.

## Project structure

```text
NewIdentity/
├── manifest.json              # Extension manifest (MV3)
├── background.js              # Service worker: proxy management, alarms, auth handling
├── popup.html                 # Popup markup
├── popup.css                  # Popup styles and themes
├── popup.js                   # Identity generation, inbox, settings, autofill orchestration
├── content-autofill.js        # Injected into pages to match and fill form fields
├── content-spoof.js           # Injected into pages for timezone/locale/fingerprint spoofing
├── .github/                   # Issue/PR templates, CI and release workflows
├── icons/                     # Extension icons (PNG + source SVG)
├── scripts/
│   └── verify-extension.mjs   # Static checks run by `npm run check`
├── private-card.example.json  # Template for the optional local test card
└── package.json               # npm scripts only, no dependencies
```

## Development

**Requirements:** [Node.js](https://nodejs.org) 18 or newer (only for the check and package scripts), Google Chrome, and `zip` (preinstalled on macOS and most Linux distributions).

```bash
git clone https://github.com/vkop007/NewIdentity.git
cd NewIdentity
npm run check
```

1. Load the folder as an unpacked extension (see [Installation](#installation)).
2. Edit the source files directly. There is no build step.
3. Click the reload icon on the extension's card in `chrome://extensions` to apply your changes.
4. Reopen the popup. To debug, right-click inside the popup and choose **Inspect**. The service worker has its own **Inspect views** link on the extensions page.

### Scripts

| Command | Description |
| --- | --- |
| `npm run check` | Validates the manifest, permissions, and icons, checks the syntax of every script, and blocks `eval`, `new Function`, inline scripts, and inline event handlers. |
| `npm run package` | Runs the checks, then builds `dist/new-identity-<version>.zip` for release. |

### Releasing

1. Bump `version` in **both** `manifest.json` and `package.json` (`npm run check` fails if they don't match).
2. Move the `Unreleased` notes in [CHANGELOG.md](CHANGELOG.md) under the new version.
3. Commit, then tag and push:
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```
4. The [Release workflow](.github/workflows/release.yml) builds the zip and publishes a GitHub release with it attached.

## Contributing

Contributions are welcome! Read [CONTRIBUTING.md](CONTRIBUTING.md) to get started, and please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

- 🐛 Found a bug? [Open an issue](https://github.com/vkop007/NewIdentity/issues/new/choose).
- 💡 Have an idea? Open a feature request.
- 🔒 Found a security issue? Please follow [SECURITY.md](SECURITY.md) and **don't** open a public issue.

## Responsible use

New Identity is a **privacy and testing tool**. It exists to keep *your* real information safe, not to deceive anyone.

✅ **Good uses**

- Testing signup, login, checkout, and email verification flows in apps you build or are authorized to test.
- Keeping your real email and phone number away from sites you don't trust yet.
- Creating realistic demo data for screenshots, tutorials, and bug reports.
- Reducing tracking and fingerprinting while you browse.

❌ **Not allowed**

- Fraud, scams, or any financial or identity crime.
- Impersonating real people or organizations.
- Evading bans, abusing free trials, referral programs, or promotions, or creating fake accounts in bulk.
- Using any payment card you aren't authorized to use. Only use the private card feature with test cards or your own card.
- Breaking any website's terms of service or any law where you live.

All generated identities are fictional, and any resemblance to real people is coincidental. Free public proxies are run by unknown third parties, so never log in to real accounts or send sensitive data while connected to one.

This software is provided "as is", without warranty (see [LICENSE](LICENSE)). **You are responsible for how you use it.** The authors are not responsible for any misuse.

## License

[MIT](LICENSE) © VK
