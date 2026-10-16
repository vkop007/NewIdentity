# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Open-source project files: README, LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, PRIVACY, issue and pull request templates, and CI and release workflows.
- `private-card.example.json` template.
- `npm run check` now verifies that the `manifest.json` and `package.json` versions match.

### Changed

- `npm run package` names the zip after the version in `package.json` instead of a hard-coded `1.0.0`.

## [1.0.0]

First public version.

### Added

- Identity generation for 250 countries and territories: names, phone, address, date of birth, username, password, company, job title, and website.
- Seeded, reproducible identity generation.
- Generation preferences: name style, age range, middle names, and password rules.
- Real temporary inbox through Catchmail, with Mail.tm as a fallback, plus OTP detection, copy, and fill.
- Form autofill using autocomplete attributes, labels, placeholders, and select options, with a fill preview and custom field mappings.
- Recent identity history with JSON/CSV export and JSON import.
- Browser proxy from free public lists (ProxyScrape, Proxifly, Geonode), with quality badges, auto reconnect, and country matching.
- Optional Webshare free proxy source.
- Anti-fingerprinting: timezone, locale, and geolocation alignment.
- Extended masking: hardware, WebGL, and canvas fingerprint spoofing.
- Optional private test card loaded from a local file, with blurring, on-page masking, and a reveal PIN.
- Light, dark, and system themes.

[Unreleased]: https://github.com/vkop007/NewIdentity/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/vkop007/NewIdentity/releases/tag/v1.0.0
