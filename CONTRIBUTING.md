# Contributing to New Identity

Thanks for your interest in improving New Identity! Bug reports, feature ideas, documentation fixes, and code are all welcome.

Please read and follow the [Code of Conduct](CODE_OF_CONDUCT.md) in every interaction with the project.

## Ways to contribute

- **Report a bug.** [Open a bug report](https://github.com/vkop007/NewIdentity/issues/new?template=bug_report.yml). Include your Chrome version, steps to reproduce, and any errors from the popup or service worker console.
- **Suggest a feature.** [Open a feature request](https://github.com/vkop007/NewIdentity/issues/new?template=feature_request.yml) that describes the problem you want solved, not only the solution.
- **Improve the docs.** Typos, unclear setup steps, and missing explanations are all worth a pull request.
- **Write code.** Look for issues labelled `good first issue` or `help wanted`, or comment on an issue to say you'd like to work on it.

> **Security issues:** please don't open a public issue. Follow [SECURITY.md](SECURITY.md) instead.

## Development setup

You need:

- Google Chrome (or another Chromium-based browser)
- [Node.js](https://nodejs.org) 18 or newer, used only for the check and package scripts
- `zip`, used only for `npm run package`

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/NewIdentity.git
cd NewIdentity

# 2. Run the checks
npm run check
```

3. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and select the project folder.
4. After editing a file, click the reload icon on the extension's card, then reopen the popup.

There are **no dependencies to install** and **no build step**. Files are loaded by Chrome exactly as written.

### Debugging tips

| Part | How to debug it |
| --- | --- |
| Popup (`popup.html`, `popup.js`, `popup.css`) | Right-click inside the open popup and choose **Inspect**. |
| Service worker (`background.js`) | Click **Inspect views: service worker** on the extension's card in `chrome://extensions`. |
| Content scripts (`content-autofill.js`, `content-spoof.js`) | Open DevTools on the web page and pick the extension's context from the console's context dropdown. |

## Project guidelines

### Keep it dependency-free

New Identity has no runtime or build dependencies, and we'd like to keep it that way. Please don't add npm packages, bundlers, frameworks, or CDN-loaded libraries. If you think something really needs one, open an issue to discuss it first.

### Follow Manifest V3 and the extension security policy

`npm run check` enforces these, and CI runs it on every pull request:

- No `eval()` or `new Function()`.
- No inline `<script>` blocks or inline event handlers (`onclick="..."`) in HTML.
- Use `chrome.scripting`, not the MV2 `chrome.tabs.executeScript`.
- Keep `manifest.json` and `package.json` versions in sync.

### Be careful with permissions

- Don't add a new permission or host permission unless the feature can't work without it. Explain why in your pull request.
- Prefer **optional** host permissions that are requested at the moment they're needed.
- If you add a new network host, add it to `host_permissions`, to the list in `scripts/verify-extension.mjs`, and to the [Permissions](README.md#permissions) and [Privacy](PRIVACY.md) docs.

### Protect user data

- Identity generation must stay local. Don't send generated profiles to any server.
- Never add analytics, telemetry, or tracking.
- Card data must never be written to history, exports, logs, or `chrome.storage`.
- Never commit `private-card.json`, API tokens, or real personal data, including in test fixtures and screenshots.

### Code style

- Match the style of the surrounding code: 2-space indentation, single quotes, semicolons, `const`/`let`, and `async`/`await`.
- Use plain DOM APIs. Build elements with `textContent` rather than injecting untrusted strings with `innerHTML`.
- Keep functions small and descriptive. Add a comment only when the *why* isn't obvious.
- An [`.editorconfig`](.editorconfig) is included. Most editors pick it up automatically.

## Submitting a pull request

1. Create a branch from `main`:
   ```bash
   git checkout -b fix/short-description
   ```
   Use a prefix such as `feat/`, `fix/`, `docs/`, or `refactor/`.
2. Make your change. Keep each pull request focused on one thing.
3. Run the checks:
   ```bash
   npm run check
   ```
4. Test it manually in Chrome. At a minimum:
   - Generate a few identities in different countries.
   - Fill a real signup form, with and without autofill preview.
   - Check that the inbox still receives mail.
   - If you touched proxy or spoofing code, connect and disconnect a proxy and check that browsing still works afterwards.
5. Write a clear commit message in the imperative mood, for example `Add Brazilian CPF field` or `Fix inbox refresh after provider fallback`.
6. Push to your fork and open a pull request against `main`. Fill in the template, link the issue it fixes (`Fixes #123`), and add screenshots for any UI change.

A maintainer will review your pull request. Please be patient and open to feedback. Every contributor's time is appreciated.

## Adding or fixing country data

Country, phone, and address data lives in `popup.js`. When editing it:

- Use realistic formats: phone number length, postal code pattern, and address layout.
- Use fictional values. Don't use real people's names paired with real addresses.
- Mention your source (for example, a national postal service's format guide) in the pull request.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
