(() => {
  if (window.__newIdentityAutofillLoaded) return;
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
    'date',
    'datetime-local',
    'file',
    'hidden',
    'image',
    'month',
    'radio',
    'range',
    'reset',
    'submit',
    'time',
    'week',
  ]);
  const MAPPINGS = [
    ['confirmPassword', ['confirm password', 'password confirmation', 'confirm-password', 'confirmpassword', 'repeat password', 'retype password', 'verify password']],
    ['password', ['password', 'passcode', 'new password']],
    ['firstName', ['first name', 'firstname', 'given name', 'fname']],
    ['lastName', ['last name', 'lastname', 'surname', 'lname', 'family name']],
    ['fullName', ['full name', 'your name', 'contact name']],
    ['email', ['email', 'e-mail', 'mail address']],
    ['phone', ['phone', 'mobile', 'telephone', 'tel']],
    ['address1', ['address line 1', 'street address', 'street', 'address']],
    ['city', ['city', 'town']],
    ['state', ['state', 'province', 'region']],
    ['postalCode', ['zip', 'postal', 'postcode', 'pin code', 'pincode']],
    ['country', ['country']],
  ];

  let cachedIdentity = null;
  let cachedSettings = null;
  let pendingFill = 0;

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
      fillEmptyFields(cachedIdentity);
    }, 120);
  }

  function fillEmptyFields(identity) {
    const fields = Array.from(document.querySelectorAll('input, textarea, select'));

    for (const field of fields) {
      if (!canFillField(field)) continue;

      const descriptor = buildDescriptor(field);
      if (!descriptor || shouldSkipDescriptor(descriptor)) continue;

      const match = MAPPINGS.find(([, aliases]) => aliases.some(alias => descriptor.includes(alias)));
      if (!match) continue;

      const value = identity[match[0]];
      if (!value) continue;
      if (!applyValue(field, String(value))) continue;

      field.setAttribute(FIELD_MARK, 'true');
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  }

  function canFillField(field) {
    if (field.hasAttribute(FIELD_MARK)) return false;
    if (field.disabled || field.readOnly) return false;
    if (!isVisible(field)) return false;
    if (field.tagName === 'INPUT' && SKIPPED_INPUT_TYPES.has((field.type || '').toLowerCase())) return false;
    return isFieldEmpty(field);
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
    return [
      field.name,
      field.id,
      field.type,
      field.autocomplete,
      field.getAttribute('aria-label'),
      field.getAttribute('placeholder'),
      textById(field.getAttribute('aria-labelledby')),
      field.closest('label')?.textContent,
      field.labels ? Array.from(field.labels).map(label => label.textContent).join(' ') : '',
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function shouldSkipDescriptor(descriptor) {
    return descriptor.includes('search')
      || descriptor.includes('filter')
      || descriptor.includes('captcha')
      || descriptor.includes('one-time-code')
      || descriptor.includes('2fa')
      || descriptor.includes('otp')
      || descriptor.includes('current-password')
      || descriptor.includes('old password')
      || descriptor.includes('username')
      || descriptor.includes('user name');
  }

  function textById(ids) {
    if (!ids) return '';
    return ids
      .split(/\s+/)
      .map(id => document.getElementById(id)?.textContent || '')
      .join(' ');
  }

  function applyValue(field, value) {
    if (field.tagName === 'SELECT') {
      const option = Array.from(field.options).find(item => {
        const optionText = item.textContent || '';
        return optionText.toLowerCase().includes(value.toLowerCase()) || item.value.toLowerCase() === value.toLowerCase();
      });
      if (!option) return false;
      field.value = option.value;
      return true;
    }

    const proto = field.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (valueSetter) {
      valueSetter.call(field, value);
    } else {
      field.value = value;
    }
    return true;
  }
})();
