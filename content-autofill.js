(() => {
  if (window.__newIdentityAutofillLoaded && window.__newIdentityFillFields && window.__newIdentityFillOtp && window.__newIdentityPreviewFillFields) return;
  window.__newIdentityAutofillLoaded = true;

  const STORAGE_KEYS = {
    identity: 'newIdentity.current',
    settings: 'newIdentity.settings',
    otp: 'newIdentity.latestOtp',
  };
  const FIELD_MARK = 'data-new-identity-autofilled';
  const CARD_FIELD_MARK = 'data-new-identity-card-autofilled';
  const CARD_MASK_STYLE_ID = 'new-identity-card-mask-style';
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
    'cc-name': 'cardName',
    'cc-number': 'cardNumber',
    'cc-exp': 'cardExpiry',
    'cc-exp-month': 'cardExpiryMonth',
    'cc-exp-year': 'cardExpiryYear',
    'cc-csc': 'cardCvv',
    bday: 'dateOfBirth',
    'bday-day': 'birthDay',
    'bday-month': 'birthMonth',
    'bday-year': 'birthYear',
    sex: 'gender',
    url: 'website',
  };
  const FIELD_RULES = [
    ['cardName', ['name on card', 'cardholder name', 'card holder name', 'cc name']],
    ['cardCvv', ['security code', 'card security code', 'cvv', 'cvc', 'csc', 'card code']],
    ['cardExpiry', ['card expiry', 'credit card expiry', 'expiration date', 'expiry date', 'expires']],
    ['cardExpiryMonth', ['expiry month', 'expiration month', 'card month', 'cc month']],
    ['cardExpiryYear', ['expiry year', 'expiration year', 'card year', 'cc year']],
    ['cardNumber', ['card number', 'credit card number', 'cc number', 'cc num', 'payment card number']],
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
  const SENSITIVE_CARD_KEYS = new Set([
    'cardNumber',
    'cardExpiry',
    'cardExpiryMonth',
    'cardExpiryYear',
    'cardCvv',
  ]);
  const VALID_FIELD_KEYS = new Set([
    'fullName',
    'fullNameWithMiddle',
    'firstName',
    'middleName',
    'lastName',
    'username',
    'email',
    'password',
    'confirmPassword',
    'prefix',
    'gender',
    'age',
    'phone',
    'phoneNational',
    'address1',
    'address2',
    'addressBlock',
    'city',
    'state',
    'postalCode',
    'country',
    'countryCode',
    'dateOfBirth',
    'birthDay',
    'birthMonth',
    'birthYear',
    'company',
    'jobTitle',
    'website',
    'cardName',
    'cardNumber',
    'cardExpiry',
    'cardExpiryMonth',
    'cardExpiryYear',
    'cardCvv',
  ]);

  let cachedIdentity = null;
  let cachedSettings = null;
  let cachedOtp = null;
  let pendingFill = 0;

  window.__newIdentityFillFields = (identity, options = {}) => fillFields(identity, {
    fillOnlyEmpty: !options.force,
    markFields: options.markFields !== false,
    customFieldMappings: options.customFieldMappings || cachedSettings?.customFieldMappings || '',
  });
  window.__newIdentityPreviewFillFields = (identity, options = {}) => previewFillFields(identity, {
    fillOnlyEmpty: !options.force,
    customFieldMappings: options.customFieldMappings || cachedSettings?.customFieldMappings || '',
  });
  window.__newIdentityFillOtp = (code, options = {}) => fillOtpFields(code, {
    fillOnlyEmpty: !options.force,
    markFields: options.markFields !== false,
  });

  init();

  async function init() {
    try {
      injectCardMaskStyle();
      const stored = await chrome.storage.local.get(Object.values(STORAGE_KEYS));
      cachedIdentity = stored[STORAGE_KEYS.identity] || null;
      cachedSettings = stored[STORAGE_KEYS.settings] || null;
      cachedOtp = stored[STORAGE_KEYS.otp] || null;
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
      if (changes[STORAGE_KEYS.otp]) {
        cachedOtp = changes[STORAGE_KEYS.otp].newValue || null;
        if (cachedSettings?.autoFill && cachedOtp?.code) fillOtpFields(cachedOtp.code, { fillOnlyEmpty: true, markFields: true });
      }
      scheduleFill();
    });
  }

  function scheduleFill() {
    window.clearTimeout(pendingFill);
    pendingFill = window.setTimeout(() => {
      if (!cachedSettings?.autoFill || !cachedIdentity?.email) return;
      fillFields(cachedIdentity, {
        fillOnlyEmpty: true,
        markFields: true,
        customFieldMappings: cachedSettings?.customFieldMappings || '',
      });
      if (cachedOtp?.code) fillOtpFields(cachedOtp.code, { fillOnlyEmpty: true, markFields: true });
    }, 120);
  }

  function fillFields(identity, options) {
    const plans = findFillPlans(identity, options);
    let filled = 0;

    for (const plan of plans) {
      if (!applyValue(plan.field, plan.candidates, plan.key)) continue;

      if (options.markFields) plan.field.setAttribute(FIELD_MARK, 'true');
      markSensitiveCardField(plan.field, plan.key, plan.profile);
      dispatchFieldEvents(plan.field);
      filled += 1;
    }

    return filled;
  }

  function previewFillFields(identity, options) {
    return findFillPlans(identity, { ...options, preview: true })
      .slice(0, 24)
      .map((plan, index) => ({
        index: index + 1,
        key: plan.key,
        label: plan.label,
        previewValue: plan.previewValue,
        tagName: plan.field.tagName.toLowerCase(),
        inputType: plan.field.type || '',
      }));
  }

  function findFillPlans(identity, options = {}) {
    const profile = normalizeIdentity(identity);
    if (!profile.email && !profile.fullName) return [];

    const customMappings = parseCustomFieldMappings(options.customFieldMappings || '');
    const fields = Array.from(document.querySelectorAll('input, textarea, select'));
    const plans = [];

    for (const field of fields) {
      if (!canFillField(field, options)) continue;

      const descriptor = buildDescriptor(field);
      if (!descriptor.text || shouldSkipDescriptor(descriptor)) continue;

      const key = detectFieldKey(field, descriptor, customMappings);
      if (!key) continue;

      const candidates = getCandidateValues(profile, key, field);
      if (!candidates.length) continue;

      plans.push({
        field,
        key,
        candidates,
        profile,
        label: readableFieldLabel(field, descriptor),
        previewValue: getPreviewValue(field, candidates, key),
      });
    }

    return plans;
  }

  function fillOtpFields(rawCode, options) {
    const code = normalizeOtpCode(rawCode);
    if (!code) return 0;

    const fields = Array.from(document.querySelectorAll('input, textarea'))
      .filter(field => canFillOtpField(field, options));
    const describedFields = fields.map(field => ({ field, descriptor: buildDescriptor(field) }));
    const explicitOtpFields = describedFields.filter(item => isOtpField(item.field, item.descriptor));
    const splitFields = explicitOtpFields
      .filter(item => isSingleOtpInput(item.field))
      .map(item => item.field);

    if (splitFields.length >= code.length) {
      return fillSplitOtpFields(splitFields, code, options);
    }

    const singleField = explicitOtpFields
      .map(item => item.field)
      .find(field => !isSingleOtpInput(field) && canAcceptOtpLength(field, code));
    if (singleField) {
      return fillSingleOtpField(singleField, code, options);
    }

    const groupedSplitFields = findGroupedOtpDigitFields(fields, code.length);
    if (groupedSplitFields.length >= code.length) {
      return fillSplitOtpFields(groupedSplitFields, code, options);
    }

    return 0;
  }

  function canFillOtpField(field, options) {
    if (!options.fillOnlyEmpty && field.hasAttribute(FIELD_MARK)) field.removeAttribute(FIELD_MARK);
    if (options.fillOnlyEmpty && field.hasAttribute(FIELD_MARK)) return false;
    if (field.disabled || field.readOnly) return false;
    if (!isVisible(field)) return false;
    if (field.tagName === 'INPUT' && SKIPPED_INPUT_TYPES.has((field.type || '').toLowerCase())) return false;
    return !options.fillOnlyEmpty || isFieldEmpty(field);
  }

  function isOtpField(field, descriptor) {
    if (descriptor.autocomplete.includes('one-time-code')) return true;
    if (hasAnyPhrase(descriptor.text, ['otp', 'one time code', 'one-time-code', 'verification code', 'security code', 'auth code', 'login code', 'passcode', 'two factor', '2fa', 'mfa'])) return true;
    if (!descriptor.text.includes('code')) return false;
    if (hasAnyPhrase(descriptor.text, ['postal code', 'zip code', 'country code', 'area code', 'promo code', 'coupon code', 'referral code'])) return false;

    const maxLength = getMaxLength(field);
    return ['numeric', 'decimal', 'tel'].includes(descriptor.inputMode)
      || descriptor.inputType === 'number'
      || (maxLength >= 4 && maxLength <= 8);
  }

  function fillSingleOtpField(field, code, options) {
    if (!applyValue(field, [code], 'otp')) return 0;
    if (options.markFields) field.setAttribute(FIELD_MARK, 'true');
    dispatchFieldEvents(field);
    return 1;
  }

  function fillSplitOtpFields(fields, code, options) {
    const usableFields = fields.slice(0, code.length);
    usableFields.forEach((field, index) => {
      applyValue(field, [code[index]], 'otp');
      if (options.markFields) field.setAttribute(FIELD_MARK, 'true');
      dispatchFieldEvents(field);
    });
    return usableFields.length;
  }

  function findGroupedOtpDigitFields(fields, codeLength) {
    const groups = new Map();

    for (const field of fields) {
      if (!isSingleOtpInput(field)) continue;
      const container = field.closest('form, fieldset, [role="group"], section, div') || document.body;
      if (!groups.has(container)) groups.set(container, []);
      groups.get(container).push(field);
    }

    for (const [container, groupFields] of groups) {
      const containerText = normalizeText(container.textContent || '');
      if (groupFields.length >= codeLength && hasAnyPhrase(containerText, ['otp', 'one time code', 'verification code', 'security code', 'login code', '2fa', 'mfa'])) {
        return groupFields;
      }
    }

    return [];
  }

  function isSingleOtpInput(field) {
    return getMaxLength(field) === 1 || Number(field.size || 0) === 1;
  }

  function canAcceptOtpLength(field, code) {
    const maxLength = getMaxLength(field);
    return maxLength <= 0 || maxLength >= code.length;
  }

  function getMaxLength(field) {
    const value = Number(field.maxLength || field.getAttribute('maxlength') || 0);
    return value > 0 ? value : 0;
  }

  function normalizeOtpCode(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length >= 4 && digits.length <= 8 ? digits : '';
  }

  function canFillField(field, options) {
    if (!options.preview && !options.fillOnlyEmpty && field.hasAttribute(FIELD_MARK)) field.removeAttribute(FIELD_MARK);
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
      inputMode: String(field.inputMode || field.getAttribute('inputmode') || '').toLowerCase(),
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

  function detectFieldKey(field, descriptor, customMappings = []) {
    const customMatch = customMappings.find(rule => rule.phrase && descriptor.text.includes(rule.phrase));
    if (customMatch) return customMatch.key;

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

  function parseCustomFieldMappings(raw) {
    return String(raw || '')
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const match = line.match(/^(.+?)(?:=>|->|=|:)([A-Za-z][A-Za-z0-9]*)$/);
        if (!match) return null;
        const phrase = normalizeText(match[1]);
        const key = match[2];
        return phrase && VALID_FIELD_KEYS.has(key) ? { phrase, key } : null;
      })
      .filter(Boolean);
  }

  function readableFieldLabel(field, descriptor) {
    const text = [
      field.getAttribute('aria-label'),
      field.getAttribute('placeholder'),
      field.getAttribute('title'),
      field.closest('label')?.textContent,
      field.labels ? Array.from(field.labels).map(label => label.textContent).join(' ') : '',
      field.name,
      field.id,
      field.autocomplete,
      descriptor.inputType,
      descriptor.tagName,
    ].find(value => String(value || '').trim());

    return String(text || 'Field')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);
  }

  function getPreviewValue(field, candidates, key) {
    if (key === 'password' || key === 'confirmPassword') return 'Password ••••••••';
    if (SENSITIVE_CARD_KEYS.has(key)) return key === 'cardCvv' ? 'CVV •••' : 'Card ••••';

    if (field.tagName === 'SELECT') {
      const option = findSelectOption(field, candidates, key) || fallbackSelectOption(field, key);
      if (option) return String(option.textContent || option.value || '').trim();
    }

    return String(candidates[0] || '').slice(0, 80);
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
      cardName: identity.cardAutofillEnabled ? [identity.cardName, identity.fullName] : [],
      cardNumber: identity.cardAutofillEnabled ? [identity.cardNumber] : [],
      cardExpiry: identity.cardAutofillEnabled ? [identity.cardExpiry] : [],
      cardExpiryMonth: identity.cardAutofillEnabled ? [identity.cardExpiryMonth] : [],
      cardExpiryYear: identity.cardAutofillEnabled ? [identity.cardExpiryYear] : [],
      cardCvv: identity.cardAutofillEnabled ? [identity.cardCvv] : [],
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

  function injectCardMaskStyle() {
    if (document.getElementById(CARD_MASK_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = CARD_MASK_STYLE_ID;
    style.textContent = `
      input[${CARD_FIELD_MARK}],
      textarea[${CARD_FIELD_MARK}] {
        -webkit-text-security: disc !important;
        caret-color: transparent !important;
      }

      select[${CARD_FIELD_MARK}] {
        filter: blur(4px) !important;
      }
    `;
    (document.head || document.documentElement).append(style);
  }

  function markSensitiveCardField(field, key, identity) {
    if (!identity.cardAutofillEnabled || !SENSITIVE_CARD_KEYS.has(key)) {
      clearCardFieldMask(field);
      return;
    }

    field.setAttribute(CARD_FIELD_MARK, 'true');
    if (field.tagName === 'SELECT') {
      field.style.setProperty('filter', 'blur(4px)', 'important');
      return;
    }

    field.style.setProperty('-webkit-text-security', 'disc', 'important');
    field.style.setProperty('caret-color', 'transparent', 'important');
  }

  function clearCardFieldMask(field) {
    if (!field.hasAttribute(CARD_FIELD_MARK)) return;
    field.removeAttribute(CARD_FIELD_MARK);
    field.style.removeProperty('-webkit-text-security');
    field.style.removeProperty('caret-color');
    field.style.removeProperty('filter');
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
    profile.cardAutofillEnabled = Boolean(profile.cardAutofillEnabled);
    if (!profile.cardAutofillEnabled) {
      profile.cardName = '';
      profile.cardNumber = '';
      profile.cardExpiry = '';
      profile.cardExpiryMonth = '';
      profile.cardExpiryYear = '';
      profile.cardCvv = '';
    }

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
