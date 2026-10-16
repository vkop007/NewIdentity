# Privacy Policy

_Last updated: October 16, 2026_

New Identity is an open-source browser extension. This page explains what data it handles, where that data goes, and what stays on your device.

**In short:** New Identity has no servers, no accounts, no analytics, and no tracking. Generated identities stay on your device. The extension only contacts the third-party services needed for the features you choose to use.

## Data stored on your device

The following is stored in Chrome's local extension storage (`chrome.storage.local`) and is only sent to the services described in [Data sent to third parties](#data-sent-to-third-parties):

- Your settings and preferences.
- The current identity and, if **Save history** is on, your recent identities.
- The address and access token of the current temporary inbox.
- Your Webshare API token and proxy credentials, if you add a Webshare source.
- A SHA-256 hash of your private card reveal PIN, if you set one. The PIN itself is not stored. The PIN lock is meant to stop people casually looking at your screen. It is not encryption.

You can remove this data at any time by clearing history in the popup or by removing the extension.

**Private card data** is read from the `private-card.json` file you create in the extension folder. It is kept only in memory while the popup is open. It is never written to extension storage, history, or exports. It only leaves the popup when you click **Fill form** with card autofill turned on, or when you click **Copy profile**, which includes the card on your clipboard.

## Data sent to third parties

New Identity contacts these services only when you use the related feature:

| Service | When | What is sent |
| --- | --- | --- |
| [Catchmail](https://catchmail.io) (`api.catchmail.io`) | Creating and reading the temporary inbox | The generated inbox address and requests for its messages. |
| [Mail.tm](https://mail.tm) (`api.mail.tm`) | Fallback inbox provider | The generated inbox address and password, and requests for its messages. |
| ProxyScrape, Proxifly (via `cdn.jsdelivr.net`), Geonode | Refreshing proxy lists | Requests for public proxy lists, optionally filtered by country. |
| [Webshare](https://www.webshare.io) (`proxy.webshare.io`) | Only if you add a Webshare token | Your API token, to fetch your proxy list. |
| `api.country.is`, `ipwho.is` | Checking the active proxy's IP and location | A lookup request, which comes from your current IP or proxy IP. |
| The proxy you connect to | While a proxy is connected | **All of your browser traffic** is routed through it. |

Each service has its own privacy policy. New Identity has no control over how they handle data.

> [!WARNING]
> Free public proxies are run by unknown third parties and can see, log, or change unencrypted traffic. Don't log in to real accounts or send sensitive data while connected to a public proxy. HTTPS protects the content of your traffic, but not which sites you visit.

## Website access

Access to websites is an **optional** permission. Chrome asks you before it is granted, and you can revoke it from the extension's Settings tab or from `chrome://extensions` at any time. With website access, the extension can:

- Fill form fields with generated identity data.
- Spoof timezone, locale, geolocation, and hardware fingerprint values, if you turn those features on.

The extension does not read, collect, or send page content anywhere.

## Analytics and tracking

None. New Identity contains no analytics, telemetry, crash reporting, advertising, or remote code.

## Children's privacy

New Identity is a developer tool and is not directed at children.

## Changes to this policy

Changes to this policy are made in this file and tracked in the project's git history.

## Contact

Questions or concerns? Open an issue at <https://github.com/vkop007/NewIdentity/issues>. For security issues, see [SECURITY.md](SECURITY.md).
