(() => {
  if (window.__newIdentityAutofillLoaded && window.__newIdentityFillFields) return;
  window.__newIdentityAutofillLoaded = true;

  const STORAGE_KEYS = {
    identity: 'newIdentity.current',
    settings: 'newIdentity.settings',
  };
  const FIELD_MARK = 'data-new-identity-autofilled';
  const SKIPPED_INPUT_TYPES = new Set([
    'button',
    'checkbox',
    'color',
    'file',
    'hidden',
    'image',
    'radio',
    'range',
    'reset',
    'submit',
    'time',
    'week',
  ]);
  const ADDRESS2_PREFIXES = ['Apt', 'Suite', 'Unit', 'Flat', 'Floor'];
  const MIDDLE_NAMES = ['Alex', 'Avery', 'Blair', 'Casey', 'Dev', 'Ellis', 'Gray', 'Harper', 'Jordan', 'Quinn', 'Reese', 'Riley'];
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const AUTOCOMPLETE_KEYS = {
    name: 'fullName',
    'honorific-prefix': 'prefix',
    'given-name': 'firstName',
    'additional-name': 'middleName',
    'family-name': 'lastName',
    nickname: 'username',
    username: 'username',
    email: 'email',
    tel: 'phone',
    'tel-national': 'phoneNational',
    'street-address': 'addressBlock',
    'address-line1': 'address1',
    'address-line2': 'address2',
    'address-level2': 'city',
    'address-level1': 'state',
    'postal-code': 'postalCode',
    country: 'countryCode',
    'country-name': 'country',
    organization: 'company',
    'organization-title': 'jobTitle',
    bday: 'dateOfBirth',
    'bday-day': 'birthDay',
    'bday-month': 'birthMonth',
    'bday-year': 'birthYear',
    sex: 'gender',
    url: 'website',
  };
  const FIELD_RULES = [
    ['confirmPassword', ['confirm password', 'password confirmation', 'repeat password', 'retype password', 'verify password', 'confirm pass']],
    ['password', ['new password', 'create password', 'password', 'passcode']],
    ['birthDay', ['birth day', 'birthday day', 'date day', 'dob day', 'day of birth']],
    ['birthMonth', ['birth month', 'birthday month', 'date month', 'dob month', 'month of birth']],
    ['birthYear', ['birth year', 'birthday year', 'date year', 'dob year', 'year of birth']],
    ['dateOfBirth', ['date of birth', 'birth date', 'birthday', 'dob']],
    ['middleName', ['middle name', 'middlename', 'additional name', 'mname', 'middle initial']],
    ['firstName', ['first name', 'firstname', 'given name', 'forename', 'fname']],
    ['lastName', ['last name', 'lastname', 'surname', 'family name', 'lname']],
    ['username', ['user name', 'username', 'login id', 'screen name', 'nickname']],
    ['email', ['email address', 'e-mail address', 'email', 'e-mail', 'mail address']],
    ['phone', ['phone number', 'mobile number', 'telephone', 'mobile', 'phone', 'tel']],
    ['address2', ['address line 2', 'address 2', 'addr2', 'suite', 'apartment', 'apt', 'unit', 'floor', 'building']],
    ['city', ['city', 'town', 'locality', 'suburb', 'address level 2']],
    ['state', ['state', 'province', 'region', 'county', 'address level 1']],
    ['postalCode', ['postal code', 'postcode', 'post code', 'zip code', 'zip', 'pin code', 'pincode']],
    ['country', ['country name', 'country']],
    ['address1', ['address line 1', 'address 1', 'addr1', 'street address', 'street', 'address']],
    ['company', ['company name', 'company', 'organization', 'organisation', 'business', 'employer']],
    ['jobTitle', ['job title', 'occupation', 'profession', 'position', 'role']],
    ['website', ['website', 'web site', 'homepage', 'profile url', 'url']],
    ['gender', ['gender', 'sex']],
    ['prefix', ['salutation', 'honorific', 'name prefix']],
    ['fullName', ['full name', 'your name', 'contact name', 'display name', 'name']],
  ];

  let cachedIdentity = null;
  let cachedSettings = null;
  let pendingFill = 0;

  window.__newIdentityFillFields = (identity, options = {}) => fillFields(identity, {
    fillOnlyEmpty: !options.force,
    markFields: options.markFields !== false,
  });

  init();

  async function init() {
    try {
      const stored = await chrome.storage.local.get(Object.values(STORAGE_KEYS));
      cachedIdentity = stored[STORAGE_KEYS.identity] || null;
      cachedSettings = stored[STORAGE_KEYS.settings] || null;
      scheduleFill();
      observePage();
      observeStorage();
    } catch {
      // The extension context can disappear after a reload. Failing closed is safer.
    }
  }

  function observePage() {
    const observer = new MutationObserver(scheduleFill);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function observeStorage() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (changes[STORAGE_KEYS.identity]) cachedIdentity = changes[STORAGE_KEYS.identity].newValue || null;
      if (changes[STORAGE_KEYS.settings]) cachedSettings = changes[STORAGE_KEYS.settings].newValue || null;
      scheduleFill();
    });
  }

  function scheduleFill() {
    window.clearTimeout(pendingFill);
    pendingFill = window.setTimeout(() => {
      if (!cachedSettings?.autoFill || !cachedIdentity?.email) return;
      fillFields(cachedIdentity, { fillOnlyEmpty: true, markFields: true });
    }, 120);
  }

  function fillFields(identity, options) {
    const profile = normalizeIdentity(identity);
    if (!profile.email && !profile.fullName) return 0;

    const fields = Array.from(document.querySelectorAll('input, textarea, select'));
    let filled = 0;

    for (const field of fields) {
      if (!canFillField(field, options)) continue;

      const descriptor = buildDescriptor(field);
      if (!descriptor.text || shouldSkipDescriptor(descriptor)) continue;

      const key = detectFieldKey(field, descriptor);
      if (!key) continue;

      const candidates = getCandidateValues(profile, key, field);
      if (!candidates.length) continue;
      if (!applyValue(field, candidates, key)) continue;

      if (options.markFields) field.setAttribute(FIELD_MARK, 'true');
      dispatchFieldEvents(field);
      filled += 1;
    }

    return filled;
  }

  function canFillField(field, options) {
    if (!options.fillOnlyEmpty && field.hasAttribute(FIELD_MARK)) field.removeAttribute(FIELD_MARK);
    if (options.fillOnlyEmpty && field.hasAttribute(FIELD_MARK)) return false;
    if (field.disabled || field.readOnly) return false;
    if (!isVisible(field)) return false;
    if (field.tagName === 'INPUT' && SKIPPED_INPUT_TYPES.has((field.type || '').toLowerCase())) return false;
    return !options.fillOnlyEmpty || isFieldEmpty(field);
  }

  function isFieldEmpty(field) {
    if (field.tagName === 'SELECT') return !field.value || field.selectedIndex <= 0;
    return !String(field.value || '').trim();
  }

  function isVisible(field) {
    const style = window.getComputedStyle(field);
    return style.display !== 'none'
      && style.visibility !== 'hidden'
      && style.opacity !== '0'
      && field.getClientRects().length > 0;
  }

  function buildDescriptor(field) {
    const text = [
      field.name,
      field.id,
      field.type,
      field.autocomplete,
      field.getAttribute('aria-label'),
      field.getAttribute('placeholder'),
      field.getAttribute('title'),
      field.getAttribute('data-label'),
      field.getAttribute('data-testid'),
      textById(field.getAttribute('aria-labelledby')),
      textById(field.getAttribute('aria-describedby')),
      field.closest('label')?.textContent,
      field.labels ? Array.from(field.labels).map(label => label.textContent).join(' ') : '',
    ].filter(Boolean).join(' ');

    return {
      text: normalizeText(text),
      autocomplete: String(field.autocomplete || '').toLowerCase(),
      inputType: String(field.type || '').toLowerCase(),
      tagName: field.tagName,
    };
  }

  function shouldSkipDescriptor(descriptor) {
    return [
      'search',
      'filter',
      'captcha',
      'one time code',
      'one-time-code',
      '2fa',
      'otp',
      'current password',
      'old password',
      'credit card',
      'card number',
      'cc number',
      'cc num',
      'cvc',
      'cvv',
      'expiry',
      'expiration',
      'iban',
      'routing number',
      'bank account',
      'passport',
      'social security',
      'ssn',
      'tax id',
      'national id',
    ].some(term => descriptor.text.includes(term) || descriptor.autocomplete.includes(term));
  }

  function detectFieldKey(field, descriptor) {
    const autocompleteKey = keyFromAutocomplete(descriptor.autocomplete);
    if (autocompleteKey) return autocompleteKey;
    if (descriptor.inputType === 'email') return 'email';
    if (descriptor.inputType === 'tel') return 'phone';
    if (descriptor.inputType === 'url') return 'website';
    if (descriptor.inputType === 'password') {
      return hasAnyPhrase(descriptor.text, ['confirm password', 'repeat password', 'retype password', 'verify password'])
        ? 'confirmPassword'
        : 'password';
    }

    const optionKey = keyFromSelectOptions(field);
    if (optionKey && !hasAnyPhrase(descriptor.text, ['state', 'province', 'country'])) return optionKey;

    const rule = FIELD_RULES.find(([, phrases]) => hasAnyPhrase(descriptor.text, phrases));
    return rule?.[0] || optionKey || '';
  }

  function keyFromAutocomplete(autocomplete) {
    const tokens = String(autocomplete || '').toLowerCase().split(/\s+/).filter(Boolean);
    for (let index = tokens.length - 1; index >= 0; index -= 1) {
      const key = AUTOCOMPLETE_KEYS[tokens[index]];
      if (key) return key;
    }
    return '';
  }

  function keyFromSelectOptions(field) {
    if (field.tagName !== 'SELECT') return '';
    const optionText = Array.from(field.options).map(option => normalizeText(`${option.value} ${option.textContent || ''}`)).join(' ');
    if (hasAnyPhrase(optionText, ['female', 'male', 'woman', 'man'])) return 'gender';
    if (MONTH_NAMES.some(month => optionText.includes(month.toLowerCase()))) return 'birthMonth';
    if (hasAnyPhrase(optionText, ['mr', 'mrs', 'ms', 'miss'])) return 'prefix';
    return '';
  }

  function getCandidateValues(identity, key, field) {
    const values = {
      fullName: [identity.fullNameWithMiddle, identity.fullName],
      addressBlock: [field.tagName === 'TEXTAREA' ? identity.addressBlock : identity.address1, identity.address1],
      country: [identity.country, identity.countryCode],
      countryCode: [identity.countryCode, identity.country],
      state: [identity.state],
      birthMonth: [identity.birthMonth, identity.birthMonthPadded, identity.birthMonthName, identity.birthMonthName?.slice(0, 3)],
      birthDay: [identity.birthDay, identity.birthDayPadded],
      gender: [identity.gender, identity.genderShort, identity.gender?.toLowerCase()],
      prefix: [identity.prefix, identity.title, identity.genderShort === 'F' ? 'Ms' : 'Mr'],
      company: [identity.company, identity.organization],
      jobTitle: [identity.jobTitle, identity.occupation],
    }[key] || [identity[key]];

    return unique(values.map(value => value == null ? '' : String(value)).filter(Boolean));
  }

  function applyValue(field, candidates, key) {
    if (field.tagName === 'SELECT') {
      const option = findSelectOption(field, candidates, key) || fallbackSelectOption(field, key);
      if (!option) return false;
      field.value = option.value;
      return true;
    }

    const value = candidates[0];
    const proto = field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (valueSetter) {
      valueSetter.call(field, value);
    } else {
      field.value = value;
    }
    return true;
  }

  function findSelectOption(field, candidates, key) {
    const options = Array.from(field.options).filter(isUsableOption);
    const normalizedCandidates = candidates.map(normalizeText);

    return options.find(option => normalizedCandidates.includes(normalizeText(option.value)))
      || options.find(option => normalizedCandidates.includes(normalizeText(option.textContent || '')))
      || options.find(option => key === 'countryCode' && candidates.some(candidate => String(option.value).toUpperCase() === String(candidate).toUpperCase()))
      || options.find(option => normalizedCandidates.some(candidate => candidate && normalizeText(option.textContent || '').includes(candidate)))
      || options.find(option => normalizedCandidates.some(candidate => candidate && candidate.includes(normalizeText(option.textContent || ''))));
  }

  function fallbackSelectOption(field, key) {
    if (!['state', 'birthMonth', 'birthDay', 'birthYear', 'gender', 'prefix'].includes(key)) return null;
    return Array.from(field.options).find(isUsableOption) || null;
  }

  function isUsableOption(option) {
    const text = normalizeText(option.textContent || '');
    return !option.disabled
      && String(option.value || '').trim()
      && !['choose', 'select', 'please select', 'none'].some(term => text === term || text.startsWith(`${term} `));
  }

  function dispatchFieldEvents(field) {
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function normalizeIdentity(identity) {
    const profile = { ...(identity || {}) };
    const birth = profile.dateOfBirth ? parseBirthDate(profile.dateOfBirth) : createBirthDate();

    profile.firstName ||= '';
    profile.lastName ||= '';
    profile.middleName ||= pick(MIDDLE_NAMES);
    profile.fullName ||= [profile.firstName, profile.lastName].filter(Boolean).join(' ');
    profile.fullNameWithMiddle ||= [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ');
    profile.username ||= `${slug(profile.firstName || 'user')}.${slug(profile.lastName || 'test')}${rand(10, 999)}`;
    profile.phoneNational ||= String(profile.phone || '').replace(/^\+\d+\s*/, '').trim();
    profile.address2 ||= `${pick(ADDRESS2_PREFIXES)} ${rand(2, 998)}`;
    profile.addressBlock ||= [profile.address1, profile.address2, `${profile.city || ''}, ${profile.state || ''} ${profile.postalCode || ''}`.trim(), profile.country].filter(Boolean).join('\n');
    profile.gender ||= pick(['Female', 'Male']);
    profile.genderShort ||= profile.gender === 'Female' ? 'F' : 'M';
    profile.prefix ||= profile.genderShort === 'F' ? 'Ms.' : 'Mr.';
    profile.title ||= profile.prefix;
    profile.company ||= profile.organization || 'Northstar Labs';
    profile.organization ||= profile.company;
    profile.jobTitle ||= profile.occupation || 'Product Analyst';
    profile.occupation ||= profile.jobTitle;
    profile.website ||= `https://${slug(profile.company)}.example`;
    profile.dateOfBirth ||= birth.dateOfBirth;
    profile.birthDay ||= birth.day;
    profile.birthDayPadded ||= String(birth.day).padStart(2, '0');
    profile.birthMonth ||= birth.month;
    profile.birthMonthPadded ||= String(birth.month).padStart(2, '0');
    profile.birthMonthName ||= MONTH_NAMES[birth.month - 1];
    profile.birthYear ||= birth.year;
    profile.age ||= birth.age;

    return profile;
  }

  function parseBirthDate(value) {
    const [yearValue, monthValue, dayValue] = String(value || '').split('-').map(Number);
    if (!yearValue || !monthValue || !dayValue) return createBirthDate();

    const today = new Date();
    const birthdayThisYear = new Date(today.getFullYear(), monthValue - 1, dayValue);
    return {
      year: yearValue,
      month: monthValue,
      day: dayValue,
      age: today.getFullYear() - yearValue - (birthdayThisYear > today ? 1 : 0),
      dateOfBirth: `${yearValue}-${String(monthValue).padStart(2, '0')}-${String(dayValue).padStart(2, '0')}`,
    };
  }

  function createBirthDate() {
    const today = new Date();
    const age = rand(21, 58);
    const year = today.getFullYear() - age;
    const month = rand(1, 12);
    const day = rand(1, 28);
    return {
      age,
      year,
      month,
      day,
      dateOfBirth: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    };
  }

  function hasAnyPhrase(text, phrases) {
    return phrases.some(phrase => text.includes(normalizeText(phrase)));
  }

  function textById(ids) {
    if (!ids) return '';
    return ids
      .split(/\s+/)
      .map(id => document.getElementById(id)?.textContent || '')
      .join(' ');
  }

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/[^a-z0-9+\s.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function unique(items) {
    return [...new Set(items.filter(Boolean))];
  }

  function slug(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }
})();
