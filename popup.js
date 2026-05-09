const MAIL_TM_BASE = 'https://api.mail.tm';
const MAIL_TM_FALLBACK_DOMAINS = ['wshu.net'];
const CATCHMAIL_BASE = 'https://api.catchmail.io';
const CATCHMAIL_DOMAIN = 'catchmail.io';
const AUTOFILL_ORIGINS = ['http://*/*', 'https://*/*'];
const AUTOFILL_SCRIPT_ID = 'new-identity-auto-fill';

const STORAGE_KEYS = {
  identity: 'newIdentity.current',
  history: 'newIdentity.history',
  settings: 'newIdentity.settings',
};

const DEFAULT_SETTINGS = {
  country: 'US',
  nameStyle: 'any',
  saveHistory: true,
  autoCopy: false,
  autoFill: false,
};

const COUNTRIES = {
  US: {
    label: 'United States',
    states: ['California', 'New York', 'Texas', 'Florida', 'Washington', 'Illinois'],
    cities: ['San Diego', 'Austin', 'Seattle', 'Chicago', 'Brooklyn', 'Miami'],
    streets: ['Maple Avenue', 'Cedar Street', 'Lakeview Road', 'Pine Lane', 'Sunset Drive'],
    postal: () => String(rand(10000, 99999)),
    phone: () => `+1 ${rand(201, 989)}-${rand(200, 999)}-${rand(1000, 9999)}`,
  },
  IN: {
    label: 'India',
    states: ['Maharashtra', 'Delhi', 'Karnataka', 'Gujarat', 'Tamil Nadu', 'Rajasthan'],
    cities: ['Mumbai', 'Delhi', 'Bengaluru', 'Ahmedabad', 'Chennai', 'Jaipur'],
    streets: ['MG Road', 'Park Street', 'Nehru Marg', 'Station Road', 'Lake View Road'],
    postal: () => String(rand(110001, 855999)),
    phone: () => `+91 ${rand(70000, 99999)} ${rand(10000, 99999)}`,
  },
  GB: {
    label: 'United Kingdom',
    states: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    cities: ['London', 'Manchester', 'Bristol', 'Leeds', 'Edinburgh', 'Cardiff'],
    streets: ['High Street', 'Church Road', 'Station Road', 'Victoria Street', 'King Street'],
    postal: () => `${pick(['SW', 'NW', 'M', 'BS', 'LS'])}${rand(1, 19)} ${rand(1, 9)}${pick('ABCDEFGHJKLMNPQRSTUVWXYZ'.split(''))}${pick('ABCDEFGHJKLMNPQRSTUVWXYZ'.split(''))}`,
    phone: () => `+44 7${rand(100, 999)} ${rand(100000, 999999)}`,
  },
  CA: {
    label: 'Canada',
    states: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Nova Scotia'],
    cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Halifax'],
    streets: ['Queen Street', 'King Street', 'Granville Street', 'Jasper Avenue', 'Main Street'],
    postal: () => `${pick('ABCEGHJKLMNPRSTVXY'.split(''))}${rand(1, 9)}${pick('ABCEGHJKLMNPRSTVWXYZ'.split(''))} ${rand(1, 9)}${pick('ABCEGHJKLMNPRSTVWXYZ'.split(''))}${rand(1, 9)}`,
    phone: () => `+1 ${rand(204, 905)}-${rand(200, 999)}-${rand(1000, 9999)}`,
  },
  AU: {
    label: 'Australia',
    states: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia'],
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
    streets: ['George Street', 'Collins Street', 'Queen Street', 'Hay Street', 'King William Street'],
    postal: () => String(rand(2000, 7999)),
    phone: () => `+61 4${rand(10, 99)} ${rand(100, 999)} ${rand(100, 999)}`,
  },
};

const FIRST_NAMES = {
  female: ['Ava', 'Mia', 'Sophia', 'Olivia', 'Emma', 'Anaya', 'Priya', 'Isla', 'Grace', 'Zara'],
  male: ['Liam', 'Noah', 'Ethan', 'Oliver', 'Aarav', 'Vihaan', 'Leo', 'Henry', 'Mason', 'Arjun'],
};

const LAST_NAMES = ['Patel', 'Sharma', 'Khan', 'Smith', 'Johnson', 'Williams', 'Brown', 'Miller', 'Wilson', 'Davis'];

let state = {
  settings: { ...DEFAULT_SETTINGS },
  identity: null,
  history: [],
  inboxMessages: [],
  messageDetails: {},
};

const els = {
  countrySelect: document.querySelector('#countrySelect'),
  nameStyleSelect: document.querySelector('#nameStyleSelect'),
  saveHistoryToggle: document.querySelector('#saveHistoryToggle'),
  autoCopyToggle: document.querySelector('#autoCopyToggle'),
  autoFillToggle: document.querySelector('#autoFillToggle'),
  statusLines: document.querySelectorAll('[data-status-line]'),
  messageList: document.querySelector('#messageList'),
  historyList: document.querySelector('#historyList'),
  inboxAddress: document.querySelector('#inboxAddress'),
  inboxList: document.querySelector('#inboxList'),
  mailboxState: document.querySelector('#mailboxState'),
};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  populateCountries();
  bindEvents();
  await loadState();
  const upgradedIdentity = ensurePasswordFields();
  if (upgradedIdentity) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.identity]: state.identity,
      [STORAGE_KEYS.history]: state.history,
    });
  }
  hydrateControls();
  await syncAutoFillPermissionState();

  if (!state.identity?.mailbox?.address) {
    await generateIdentity(false);
    return;
  }

  renderAll();
}

function populateCountries() {
  for (const [code, country] of Object.entries(COUNTRIES)) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = country.label;
    els.countrySelect.append(option);
  }
}

function bindEvents() {
  document.querySelectorAll('.tab').forEach(button => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
  });

  document.querySelector('#generateBtn').addEventListener('click', () => generateIdentity(true));
  document.querySelector('#copyAllBtn').addEventListener('click', copyFullIdentity);
  document.querySelector('#fillPageBtn').addEventListener('click', fillCurrentPage);
  document.querySelector('#saveSettingsBtn').addEventListener('click', saveSettingsFromControls);
  document.querySelector('#refreshInboxBtn').addEventListener('click', () => refreshInbox(true));
  document.querySelector('#copyInboxBtn').addEventListener('click', copyInboxAddress);
  document.querySelector('#clearHistoryBtn').addEventListener('click', clearHistory);
  els.autoFillToggle.addEventListener('change', handleAutoFillToggle);

  els.countrySelect.addEventListener('change', () => {
    state.settings.country = els.countrySelect.value;
    persistSettings();
    generateIdentity(true);
  });

  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', () => copyValue(button.dataset.copy));
  });
}

async function loadState() {
  const stored = await chrome.storage.local.get(Object.values(STORAGE_KEYS));
  state.settings = { ...DEFAULT_SETTINGS, ...(stored[STORAGE_KEYS.settings] || {}) };
  state.identity = stored[STORAGE_KEYS.identity] || null;
  state.history = Array.isArray(stored[STORAGE_KEYS.history])
    ? stored[STORAGE_KEYS.history].filter(item => item?.mailbox?.address)
    : [];
}

function hydrateControls() {
  els.countrySelect.value = state.settings.country;
  els.nameStyleSelect.value = state.settings.nameStyle;
  els.saveHistoryToggle.checked = state.settings.saveHistory;
  els.autoCopyToggle.checked = state.settings.autoCopy;
  els.autoFillToggle.checked = state.settings.autoFill;
}

function activateTab(tab) {
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.panel === tab));

  if (tab === 'messages' && state.identity?.mailbox?.address) {
    refreshInbox(false);
  }
}

async function generateIdentity(showStatus) {
  const country = COUNTRIES[state.settings.country] || COUNTRIES.US;
  const style = state.settings.nameStyle;
  const firstName = style === 'any'
    ? pick([...FIRST_NAMES.female, ...FIRST_NAMES.male])
    : pick(FIRST_NAMES[style]);
  const lastName = pick(LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;
  const city = pick(country.cities);
  const stateName = pick(country.states);
  const address1 = `${rand(18, 998)} ${pick(country.streets)}`;
  const accountPassword = createAccountPassword();

  if (showStatus) setStatus('Creating a real temporary inbox...', '');

  let mailbox;
  try {
    mailbox = await createTemporaryMailbox(firstName, lastName);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create a temporary inbox.';
    setStatus(message, 'error');
    renderInbox();
    return;
  }

  state.identity = {
    firstName,
    lastName,
    fullName,
    email: mailbox.address,
    password: accountPassword,
    confirmPassword: accountPassword,
    phone: country.phone(),
    address1,
    city,
    state: stateName,
    postalCode: country.postal(),
    country: country.label,
    countryCode: state.settings.country,
    mailbox,
    createdAt: new Date().toISOString(),
  };
  state.inboxMessages = [];
  state.messageDetails = {};

  if (state.settings.saveHistory) {
    state.history = [state.identity, ...state.history.filter(item => item.email !== state.identity.email)].slice(0, 8);
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.identity]: state.identity,
    [STORAGE_KEYS.history]: state.history,
  });

  renderAll();

  if (state.settings.autoCopy) {
    await copyFullIdentity();
  } else {
    setStatus('Real temporary inbox is ready.', 'success');
  }
}

function renderAll() {
  renderIdentity();
  renderInbox();
  renderMessages();
  renderHistory();
}

function renderIdentity() {
  for (const key of ['firstName', 'lastName', 'fullName', 'email', 'password', 'confirmPassword', 'phone', 'address1', 'city', 'postalCode', 'state']) {
    document.querySelector(`#${key}`).textContent = state.identity?.[key] || '-';
  }
}

function renderInbox() {
  const mailbox = state.identity?.mailbox;
  els.mailboxState.textContent = mailbox ? `Live ${mailbox.label || mailbox.provider} mailbox` : 'No mailbox';
  els.inboxAddress.textContent = mailbox?.address || 'Generate an identity first';
  renderInboxMessages();
}

function renderInboxMessages() {
  if (!state.identity?.mailbox?.address) {
    els.inboxList.replaceChildren(emptyCard('No mailbox yet', 'Generate an identity to create a working temporary email address.', 'mail'));
    return;
  }

  if (!state.inboxMessages.length) {
    els.inboxList.replaceChildren(emptyCard('Inbox is empty', 'Send a verification email to this address, then tap Check mail.', 'empty'));
    return;
  }

  els.inboxList.replaceChildren(...state.inboxMessages.map(message => {
    const detail = state.messageDetails[message.id];
    const from = normalizeSender(message.from);
    const code = extractCode([message.subject, message.intro, getMessageBody(detail)].filter(Boolean).join(' '));
    const body = detail ? getMessageBody(detail).slice(0, 900) : '';
    const button = document.createElement('button');
    button.className = 'message-card inbox-message';
    button.type = 'button';
    button.innerHTML = [
      '<div class="message-topline">',
      `<span class="message-meta">${escapeHtml(from)}</span>`,
      code ? `<span class="message-code">Code ${escapeHtml(code)}</span>` : '<span class="message-status">Open</span>',
      '</div>',
      `<strong>${escapeHtml(message.subject || 'No subject')}</strong>`,
      `<small>${escapeHtml(message.intro || 'Open to read the full message and extract verification codes.')}</small>`,
      body ? `<p class="message-body">${escapeHtml(body)}</p>` : '',
    ].join('');
    button.addEventListener('click', () => openInboxMessage(message.id));
    return button;
  }));
}

function emptyCard(title, body, tone = '') {
  const card = document.createElement('div');
  card.className = `empty-state ${tone}`.trim();
  card.innerHTML = [
    '<span class="empty-icon" aria-hidden="true"></span>',
    `<strong>${escapeHtml(title)}</strong>`,
    `<small>${escapeHtml(body)}</small>`,
  ].join('');
  return card;
}

async function refreshInbox(showStatus) {
  const mailbox = state.identity?.mailbox;
  if (!mailbox?.address) {
    setStatus('Generate an identity first.', 'error');
    renderInbox();
    return;
  }

  if (showStatus) setStatus('Checking the temporary inbox...', '');

  try {
    state.inboxMessages = await listMailboxMessages(mailbox);
    renderInboxMessages();
    if (showStatus) {
      const count = state.inboxMessages.length;
      setStatus(`Inbox refreshed. ${count} message${count === 1 ? '' : 's'} found.`, 'success');
    }
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Unable to refresh inbox.', 'error');
  }
}

async function openInboxMessage(messageId) {
  const mailbox = state.identity?.mailbox;
  if (!mailbox?.address || !messageId) return;

  if (state.messageDetails[messageId]) {
    renderInboxMessages();
    return;
  }

  try {
    state.messageDetails[messageId] = await readMailboxMessage(mailbox, messageId);
    renderInboxMessages();
    const body = getMessageBody(state.messageDetails[messageId]);
    const code = extractCode(body);
    setStatus(code ? `Message opened. Verification code: ${code}` : 'Message opened.', 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Unable to open message.', 'error');
  }
}

function renderMessages() {
  const identity = state.identity;
  if (!identity) return;

  const messages = [
    {
      title: 'Intro',
      label: 'Name + email',
      text: `Hi, my name is ${identity.fullName}. You can reach me at ${identity.email}.`,
    },
    {
      title: 'Address',
      label: 'Shipping block',
      text: `${identity.fullName}\n${identity.address1}\n${identity.city}, ${identity.state} ${identity.postalCode}\n${identity.country}`,
    },
    {
      title: 'Contact',
      label: 'Email + phone',
      text: `${identity.fullName}\n${identity.email}\n${identity.phone}`,
    },
    {
      title: 'Credentials',
      label: 'Login fields',
      text: `Email: ${identity.email}\nPassword: ${identity.password}\nConfirm password: ${identity.confirmPassword}`,
    },
  ];

  els.messageList.replaceChildren(...messages.map(message => {
    const button = document.createElement('button');
    button.className = 'message-card';
    button.type = 'button';
    button.innerHTML = [
      `<span class="message-meta">${escapeHtml(message.label)}</span>`,
      `<strong>${escapeHtml(message.title)}</strong>`,
      `<small>${escapeHtml(message.text)}</small>`,
    ].join('');
    button.addEventListener('click', () => copyText(message.text, `${message.title} copied.`));
    return button;
  }));
}

function renderHistory() {
  if (!state.history.length) {
    els.historyList.replaceChildren(emptyCard('No history yet', 'Generated identities will appear here.', 'history'));
    return;
  }

  els.historyList.replaceChildren(...state.history.slice(0, 4).map(identity => {
    const button = document.createElement('button');
    button.className = 'history-card';
    button.type = 'button';
    button.innerHTML = `<strong>${escapeHtml(identity.fullName)}</strong><small>${escapeHtml(identity.email)} · ${escapeHtml(identity.country)}</small>`;
    button.addEventListener('click', async () => {
      state.identity = identity;
      state.inboxMessages = [];
      state.messageDetails = {};
      await chrome.storage.local.set({ [STORAGE_KEYS.identity]: identity });
      renderAll();
      refreshInbox(false);
      setStatus('Loaded identity with temporary inbox.', 'success');
      activateTab('home');
    });
    return button;
  }));
}

async function saveSettingsFromControls() {
  state.settings = {
    ...state.settings,
    country: els.countrySelect.value,
    nameStyle: els.nameStyleSelect.value,
    saveHistory: els.saveHistoryToggle.checked,
    autoCopy: els.autoCopyToggle.checked,
    autoFill: state.settings.autoFill,
  };
  hydrateControls();
  await persistSettings();
  setStatus('Settings saved.', 'success');
}

async function persistSettings() {
  await chrome.storage.local.set({ [STORAGE_KEYS.settings]: state.settings });
}

async function handleAutoFillToggle() {
  const shouldEnable = els.autoFillToggle.checked;

  try {
    if (shouldEnable) {
      setStatus('Chrome will ask for website access before auto-fill turns on.', '');
      const granted = await requestAutoFillPermission();
      if (!granted) {
        state.settings.autoFill = false;
        hydrateControls();
        await persistSettings();
        setStatus('Auto-fill permission was not granted.', 'error');
        return;
      }

      state.settings.autoFill = true;
      await persistSettings();
      await registerAutoFillScript();
      await runAutoFillOnActiveTab();
      setStatus('Auto-fill is on. New forms will fill automatically.', 'success');
      return;
    }

    state.settings.autoFill = false;
    await persistSettings();
    await unregisterAutoFillScript();
    await removeAutoFillPermission();
    setStatus('Auto-fill is off and website access was removed.', 'success');
  } catch (error) {
    state.settings.autoFill = false;
    hydrateControls();
    await persistSettings();
    setStatus(error instanceof Error ? error.message : 'Unable to update auto-fill.', 'error');
  }
}

async function syncAutoFillPermissionState() {
  if (!state.settings.autoFill) {
    await unregisterAutoFillScript();
    return;
  }

  if (!(await hasAutoFillPermission())) {
    state.settings.autoFill = false;
    await persistSettings();
    hydrateControls();
    return;
  }

  try {
    await registerAutoFillScript();
  } catch {
    state.settings.autoFill = false;
    await persistSettings();
    hydrateControls();
  }
}

async function hasAutoFillPermission() {
  return chrome.permissions.contains({ origins: AUTOFILL_ORIGINS });
}

async function requestAutoFillPermission() {
  if (await hasAutoFillPermission()) return true;
  return chrome.permissions.request({ origins: AUTOFILL_ORIGINS });
}

async function removeAutoFillPermission() {
  if (!(await hasAutoFillPermission())) return false;
  return chrome.permissions.remove({ origins: AUTOFILL_ORIGINS });
}

async function registerAutoFillScript() {
  await unregisterAutoFillScript();
  await chrome.scripting.registerContentScripts([{
    id: AUTOFILL_SCRIPT_ID,
    matches: AUTOFILL_ORIGINS,
    js: ['content-autofill.js'],
    runAt: 'document_idle',
    allFrames: true,
    persistAcrossSessions: true,
  }]);
}

async function unregisterAutoFillScript() {
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [AUTOFILL_SCRIPT_ID] });
  } catch {
    // Chrome throws if the script was not registered yet.
  }
}

async function runAutoFillOnActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https?:\/\//.test(tab.url || '')) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ['content-autofill.js'],
    });
  } catch {
    // Some active pages block scripting. Future normal pages still auto-fill.
  }
}

async function copyValue(key) {
  const value = state.identity?.[key];
  if (!value) return;
  await copyText(value, `${labelForKey(key)} copied.`);
}

async function copyInboxAddress() {
  const email = state.identity?.email;
  if (!email) {
    setStatus('No inbox address to copy.', 'error');
    return;
  }
  await copyText(email, 'Inbox address copied.');
}

async function copyFullIdentity() {
  if (!state.identity) return;
  const text = [
    state.identity.fullName,
    state.identity.email,
    `Password: ${state.identity.password}`,
    `Confirm password: ${state.identity.confirmPassword}`,
    state.identity.phone,
    state.identity.address1,
    `${state.identity.city}, ${state.identity.state} ${state.identity.postalCode}`,
    state.identity.country,
  ].join('\n');
  await copyText(text, 'Full identity copied.');
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus(message, 'success');
  } catch {
    setStatus('Clipboard access was blocked by the browser.', 'error');
  }
}

async function fillCurrentPage() {
  if (!state.identity) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab found.');

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillFormFields,
      args: [state.identity],
    });

    setStatus(result > 0 ? `Filled ${result} field${result === 1 ? '' : 's'} on this page.` : 'No matching fields found.', result > 0 ? 'success' : 'error');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Unable to fill this page.', 'error');
  }
}

async function createTemporaryMailbox(firstName, lastName) {
  try {
    return createCatchmailMailbox(firstName, lastName);
  } catch {
    return createMailTmMailbox(firstName, lastName);
  }
}

function createCatchmailMailbox(firstName, lastName) {
  const localPart = buildMailboxLocalPart(firstName, lastName, 0).slice(0, 48);
  return {
    provider: 'catchmail',
    label: 'Catchmail',
    address: `${localPart}@${CATCHMAIL_DOMAIN}`,
    createdAt: new Date().toISOString(),
  };
}

async function createMailTmMailbox(firstName, lastName) {
  const domain = await getMailTmDomain();
  if (!domain) throw new Error('Mail.tm did not return an available domain.');

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const localPart = buildMailboxLocalPart(firstName, lastName, attempt);
    const address = `${localPart}@${domain}`;
    const password = createPassword();

    try {
      const account = await mailTmRequest('/accounts', {
        method: 'POST',
        body: { address, password },
      });
      const tokenResponse = await loginMailTm(address, password);

      if (!tokenResponse.token) throw new Error('Mail.tm did not return an inbox token.');

      return {
        provider: 'mail.tm',
        label: 'Mail.tm',
        address,
        password,
        token: tokenResponse.token,
        accountId: account.id,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error?.status === 422 && attempt < 4) continue;
      throw error;
    }
  }

  throw new Error('Unable to reserve a unique temporary mailbox.');
}

async function loginMailTm(address, password) {
  let lastError;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      if (attempt > 0) await delay(450 * attempt);
      return await mailTmRequest('/token', {
        method: 'POST',
        body: { address, password },
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to sign in to the temporary inbox.');
}

async function listMailboxMessages(mailbox) {
  if (mailbox.provider === 'catchmail') {
    const response = await catchmailRequest(`/api/v1/mailbox?address=${encodeURIComponent(mailbox.address)}`);
    return (response.messages || []).map(message => ({
      id: String(message.id),
      from: message.from,
      subject: message.subject || 'No subject',
      intro: message.subject || '',
      date: message.date,
      provider: 'catchmail',
    }));
  }

  const response = await mailTmRequest('/messages', { token: mailbox.token });
  return response['hydra:member'] || [];
}

async function readMailboxMessage(mailbox, messageId) {
  if (mailbox.provider === 'catchmail') {
    return catchmailRequest(`/api/v1/message/${encodeURIComponent(messageId)}?mailbox=${encodeURIComponent(mailbox.address)}`);
  }

  return mailTmRequest(`/messages/${messageId}`, { token: mailbox.token });
}

async function getMailTmDomain() {
  const responses = [];

  try {
    responses.push(await mailTmRequest('/domains'));
  } catch {
    responses.push(null);
  }

  try {
    responses.push(await mailTmRequest('/domains?page=1'));
  } catch {
    responses.push(null);
  }

  for (const response of responses) {
    const domain = extractMailTmDomains(response).find(item => item.isActive !== false && item.domain)?.domain;
    if (domain) return domain;
  }

  return MAIL_TM_FALLBACK_DOMAINS[0] || '';
}

function extractMailTmDomains(response) {
  const collections = [
    response?.['hydra:member'],
    response?.member,
    response?.domains,
    response?.items,
    response?.data,
    Array.isArray(response) ? response : null,
  ].filter(Array.isArray);

  return collections
    .flat()
    .map(item => typeof item === 'string' ? { domain: item, isActive: true } : item)
    .filter(item => item?.domain);
}

async function mailTmRequest(path, options = {}) {
  const headers = {
    accept: 'application/json',
  };

  if (options.body) headers['content-type'] = 'application/json';
  if (options.token) headers.authorization = `Bearer ${options.token}`;

  const response = await fetch(`${MAIL_TM_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    const message = data?.detail || data?.message || `Mail.tm request failed with status ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data || {};
}

async function catchmailRequest(path) {
  const response = await fetch(`${CATCHMAIL_BASE}${path}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  });
  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    const message = data?.error?.message || data?.message || `Catchmail request failed with status ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data || {};
}

function fillFormFields(identity) {
  const mappings = [
    ['firstName', ['first name', 'firstname', 'given name', 'fname']],
    ['lastName', ['last name', 'lastname', 'surname', 'lname', 'family name']],
    ['fullName', ['full name', 'name', 'your name']],
    ['email', ['email', 'e-mail']],
    ['confirmPassword', ['confirm password', 'password confirmation', 'confirm-password', 'confirmpassword', 'repeat password', 'retype password', 'verify password']],
    ['password', ['password', 'passcode', 'new password']],
    ['phone', ['phone', 'mobile', 'tel']],
    ['address1', ['address', 'street', 'address line 1']],
    ['city', ['city', 'town']],
    ['state', ['state', 'province', 'region']],
    ['postalCode', ['zip', 'postal', 'postcode', 'pin code', 'pincode']],
    ['country', ['country']],
  ];

  const fields = Array.from(document.querySelectorAll('input, textarea, select'));
  let filled = 0;

  for (const field of fields) {
    const descriptor = [
      field.name,
      field.id,
      field.type,
      field.getAttribute('aria-label'),
      field.getAttribute('placeholder'),
      field.labels ? Array.from(field.labels).map(label => label.textContent).join(' ') : '',
    ].filter(Boolean).join(' ').toLowerCase();

    const match = mappings.find(([, aliases]) => aliases.some(alias => descriptor.includes(alias)));
    if (!match) continue;

    const [key] = match;
    const value = identity[key];
    if (!value) continue;

    if (field.tagName === 'SELECT') {
      const option = Array.from(field.options).find(item => {
        const optionText = item.textContent || '';
        return optionText.toLowerCase().includes(String(value).toLowerCase()) || item.value.toLowerCase() === String(value).toLowerCase();
      });
      if (!option) continue;
      field.value = option.value;
    } else {
      field.value = value;
    }

    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    filled += 1;
  }

  return filled;
}

async function clearHistory() {
  state.history = [];
  await chrome.storage.local.set({ [STORAGE_KEYS.history]: [] });
  renderHistory();
  setStatus('History cleared.', 'success');
}

function setStatus(message, type = '') {
  els.statusLines.forEach(line => {
    line.textContent = message;
    line.className = `status-line ${type}`.trim();
  });
}

function buildMailboxLocalPart(firstName, lastName, attempt) {
  const seed = `${slug(firstName)}.${slug(lastName)}.${Date.now().toString(36)}${rand(100, 999)}${attempt || ''}`;
  return seed.replace(/^\.+|\.+$/g, '').slice(0, 54) || `user.${Date.now().toString(36)}`;
}

function createPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, value => chars[value % chars.length]).join('');
}

function createAccountPassword() {
  const groups = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnopqrstuvwxyz',
    '23456789',
    '!@#$%',
  ];
  const allChars = groups.join('');
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  const required = groups.map((group, index) => group[bytes[index] % group.length]);
  const rest = Array.from(bytes.slice(required.length), value => allChars[value % allChars.length]);
  return shuffle([...required, ...rest]).join('');
}

function ensurePasswordFields() {
  let changed = false;

  state.identity = ensureIdentityPasswordFields(state.identity);
  if (state.identity?.__passwordFieldsAdded) {
    changed = true;
    delete state.identity.__passwordFieldsAdded;
  }

  state.history = state.history.map(identity => {
    const updated = ensureIdentityPasswordFields(identity);
    if (updated?.__passwordFieldsAdded) {
      changed = true;
      delete updated.__passwordFieldsAdded;
    }
    return updated;
  });

  return changed;
}

function ensureIdentityPasswordFields(identity) {
  if (!identity) return identity;

  if (identity.password && identity.confirmPassword === identity.password) {
    return identity;
  }

  const password = identity.password || createAccountPassword();
  return {
    ...identity,
    password,
    confirmPassword: password,
    __passwordFieldsAdded: true,
  };
}

function getMessageBody(detail) {
  if (!detail) return '';
  const catchmailBody = detail.body?.text || detail.body?.html;
  const value = catchmailBody || detail.body_text || detail.text || (Array.isArray(detail.html) ? detail.html.join('\n') : detail.html) || detail.intro || '';
  return stripHtml(value).replace(/\s+\n/g, '\n').trim();
}

function normalizeSender(sender) {
  if (!sender) return 'Unknown sender';
  if (typeof sender === 'string') return sender;
  return sender.address || sender.name || 'Unknown sender';
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stripHtml(value) {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ');
}

function extractCode(value) {
  const match = String(value || '').match(/\b\d{4,8}\b/);
  return match?.[0] || '';
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function labelForKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase());
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = rand(0, index);
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
