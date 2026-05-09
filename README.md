# New Identity

A zero-dependency Chrome extension for generating test identities with a working temporary inbox.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this `NewIdentity` folder.

## Features

- Generate names, phone, address, city, postal code, and state by country.
- Create a real temporary Catchmail inbox for each new identity.
- Refresh the inbox and open incoming messages from the popup.
- Detect common verification codes inside incoming emails.
- Copy individual fields or the full identity.
- Fill matching inputs on the active page.
- Save recent identities locally in Chrome storage.
- Create quick message templates from the current identity.

Identity data is generated locally. Inbox refresh uses the public Catchmail API, with Mail.tm as a fallback provider.
