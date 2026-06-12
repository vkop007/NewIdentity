import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'manifest.json',
  'background.js',
  'popup.html',
  'popup.css',
  'popup.js',
  'content-autofill.js',
  'content-spoof.js',
];

function readText(file) {
  return readFileSync(path.join(root, file), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertFile(file) {
  const fullPath = path.join(root, file);
  assert(existsSync(fullPath), `${file} is missing.`);
  assert(statSync(fullPath).isFile(), `${file} is not a file.`);
  assert(statSync(fullPath).size > 0, `${file} is empty.`);
}

function checkJavaScript(file) {
  execFileSync(process.execPath, ['--check', path.join(root, file)], {
    stdio: 'pipe',
  });
}

function parseManifest() {
  try {
    return JSON.parse(readText('manifest.json'));
  } catch (error) {
    throw new Error(`manifest.json is invalid JSON: ${error.message}`);
  }
}

function checkManifest(manifest) {
  assert(manifest.manifest_version === 3, 'manifest.json must use Manifest V3.');
  assert(manifest.name === 'New Identity', 'Manifest name should be "New Identity".');
  assert(typeof manifest.description === 'string' && manifest.description.length >= 20, 'Manifest description is too short.');
  assert(/^\d+\.\d+\.\d+$/.test(manifest.version || ''), 'Manifest version must be semver-like, for example 1.0.0.');
  assert(manifest.action?.default_popup === 'popup.html', 'Manifest action must point to popup.html.');

  assert(manifest.background?.service_worker === 'background.js', 'Manifest background service worker must point to background.js.');

  for (const permission of ['activeTab', 'alarms', 'proxy', 'scripting', 'storage', 'webRequest', 'webRequestAuthProvider']) {
    assert(manifest.permissions?.includes(permission), `Manifest is missing the ${permission} permission.`);
  }

  for (const origin of ['http://*/*', 'https://*/*']) {
    assert(manifest.optional_host_permissions?.includes(origin), `Manifest is missing optional host permission ${origin}.`);
  }

  for (const host of [
    'https://api.catchmail.io/*',
    'https://api.mail.tm/*',
    'https://api.proxifly.dev/*',
    'https://api.proxyscrape.com/*',
    'https://api.country.is/*',
    'https://cdn.jsdelivr.net/*',
    'https://ipwho.is/*',
    'https://proxy.webshare.io/*',
    'https://proxylist.geonode.com/*',
  ]) {
    assert(manifest.host_permissions?.includes(host), `Manifest is missing host permission ${host}.`);
  }

  for (const iconPath of Object.values(manifest.icons || {})) {
    assertFile(iconPath);
  }

  for (const iconPath of Object.values(manifest.action?.default_icon || {})) {
    assertFile(iconPath);
  }
}

function checkPopupHtml() {
  const html = readText('popup.html');
  assert(html.includes('<link rel="stylesheet" href="popup.css"'), 'popup.html must load popup.css.');
  assert(html.includes('<script src="popup.js"></script>'), 'popup.html must load popup.js.');
  assert(!/\son[a-z]+\s*=/i.test(html), 'popup.html must not use inline event handlers.');
  assert(!/<script(?![^>]+src=["']popup\.js["'])/i.test(html), 'popup.html must not include inline scripts.');
  assert(html.includes('role="status"'), 'popup.html should expose status updates to assistive technology.');
}

function checkSecurityText(file) {
  const source = readText(file);
  assert(!/\beval\s*\(/.test(source), `${file} must not call eval().`);
  assert(!/new Function\s*\(/.test(source), `${file} must not create dynamic functions.`);
  assert(!/chrome\.tabs\.executeScript/.test(source), `${file} must use MV3 scripting APIs, not MV2 executeScript.`);
}

for (const file of requiredFiles) {
  assertFile(file);
}

const manifest = parseManifest();
checkManifest(manifest);
checkPopupHtml();
checkJavaScript('background.js');
checkJavaScript('popup.js');
checkJavaScript('content-autofill.js');
checkJavaScript('content-spoof.js');
checkSecurityText('background.js');
checkSecurityText('popup.js');
checkSecurityText('content-autofill.js');
checkSecurityText('content-spoof.js');

console.log('New Identity extension checks passed.');
