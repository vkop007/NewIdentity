# New Identity

A zero-dependency Chrome extension for generating test identities with a working temporary inbox.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this `NewIdentity` folder.

## Features

- Generate names, phone, address, city, postal code, and state across 250 embedded countries and territories.
- Create a real temporary Catchmail inbox for each new identity.
- Refresh the inbox and open incoming messages from the popup.
- Detect common verification codes inside incoming emails.
- Copy individual fields or the full identity.
- Fill matching inputs on the active page.
- Use autocomplete attributes, labels, placeholders, and select options to fill richer profile fields like middle name, address line 2, date of birth, company, job title, username, and gender.
- Save recent identities locally in Chrome storage.
- Create quick message templates from the current identity.

Identity data is generated locally. Inbox refresh uses the public Catchmail API, with Mail.tm as a fallback provider.
