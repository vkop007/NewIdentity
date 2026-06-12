const GEONODE_BASE_URL = 'https://proxylist.geonode.com/api/proxy-list?page=1&limit=500&sort_by=lastChecked&sort_type=desc';
const WEBSHARE_API_BASE_URL = 'https://proxy.webshare.io/api/v2/proxy/list/?mode=direct&page=1&page_size=100&valid=true';
const PROXIFLY_API_BASE_URL = 'https://api.proxifly.dev/proxy?protocol=http&https=true&quantity=20&format=json';
const PROXIFLY_COUNTRY_BASE_URL = 'https://cdn.jsdelivr.net/gh/proxifly/free-proxy-list@main/proxies/countries';
const PROXYSCRAPE_BASE_URL = 'https://api.proxyscrape.com/v4/free-proxy-list/get?request=displayproxies&proxy_format=protocolipport&format=text&protocol=http&ssl=yes&anonymity=elite,anonymous&timeout=5000&limit=2000';
const PROXY_VERIFY_URLS = [
  'https://api.country.is/?fields=location',
  'https://ipwho.is/',
];
const PROXY_STATE_KEY = 'newIdentity.proxy';
const PROXY_SECRET_KEY = 'newIdentity.proxySecrets';
const PROXY_REFRESH_ALARM = 'newIdentity.proxy.refresh';
const REFRESH_PERIOD_MINUTES = 1;
const DEFAULT_PROXY_COUNTRY = 'US';
const MAX_PROXIES = 40;
const MAX_CONNECT_ATTEMPTS = 25;
const PROXY_TEST_TIMEOUT_MS = 5000;
const SUPPORTED_PROTOCOLS = ['https', 'http', 'socks5', 'socks4'];
const PROTOCOL_PRIORITY = {
  http: 0,
  https: 1,
  socks5: 2,
  socks4: 3,
};
const WEBSHARE_PROVIDER = 'Webshare Free';
const SOURCE_PRIORITY = {
  [WEBSHARE_PROVIDER]: 0,
  'Proxifly API': 1,
  ProxyScrape: 2,
  Proxifly: 3,
  Geonode: 4,
};
const DEFAULT_PROXY_STATE = {
  country: DEFAULT_PROXY_COUNTRY,
  enabled: false,
  connected: false,
  autoReconnect: true,
  proxies: [],
  currentProxy: null,
  lastRefreshAt: '',
  error: '',
};
const DEFAULT_PROXY_SECRETS = {
  webshareToken: '',
};

let activeProxyAuth = null;

if (chrome.webRequest?.onAuthRequired) {
  chrome.webRequest.onAuthRequired.addListener(
    handleProxyAuthRequired,
    { urls: ['<all_urls>'] },
    ['blocking']
  );
}

chrome.runtime.onInstalled.addListener(() => {
  setupProxyRefresh();
  updateActiveSpoof().catch(() => {});
});

chrome.runtime.onStartup.addListener(() => {
  setupProxyRefresh();
  updateActiveSpoof().catch(() => {});
});

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === PROXY_REFRESH_ALARM) {
    refreshProxyList({ silent: true });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleProxyMessage(message)
    .then(sendResponse)
    .catch(error => sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'Proxy action failed.',
    }));
  return true;
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (
    changes['newIdentity.current'] ||
    changes['newIdentity.proxy'] ||
    changes['newIdentity.settings']
  ) {
    updateActiveSpoof().catch(() => {});
  }
});

setupProxyRefresh();

async function setupProxyRefresh() {
  chrome.alarms.create(PROXY_REFRESH_ALARM, { periodInMinutes: REFRESH_PERIOD_MINUTES });
  updateActiveSpoof().catch(() => {});

  const state = await getProxyState();
  if (state.enabled && state.currentProxy) {
    setActiveProxyAuth(state.currentProxy);
    await updateBadge(state);
  }

  await refreshProxyList({ silent: true });
}

async function handleProxyMessage(message = {}) {
  switch (message.type) {
    case 'proxy:getState':
      return {
        ok: true,
        state: await getPublicProxyState(),
      };
    case 'proxy:refresh':
      return {
        ok: true,
        state: await getPublicProxyState(await refreshProxyList()),
      };
    case 'proxy:setCountry':
      return {
        ok: true,
        state: await getPublicProxyState(await setProxyCountry(message.country)),
      };
    case 'proxy:setAutoReconnect':
      return {
        ok: true,
        state: await getPublicProxyState(await setProxyAutoReconnect(message.enabled)),
      };
    case 'proxy:saveWebshareToken':
      return {
        ok: true,
        state: await getPublicProxyState(await saveWebshareToken(message.token)),
      };
    case 'proxy:clearWebshareToken':
      return {
        ok: true,
        state: await getPublicProxyState(await clearWebshareToken()),
      };
    case 'proxy:connectBest':
      return {
        ok: true,
        state: await getPublicProxyState(await connectBestProxy()),
      };
    case 'proxy:connectProxy':
      return {
        ok: true,
        state: await getPublicProxyState(await connectProxyById(message.proxyId)),
      };
    case 'proxy:disconnect':
      return {
        ok: true,
        state: await getPublicProxyState(await disconnectProxy()),
      };
    default:
      return {
        ok: false,
        error: 'Unknown proxy action.',
      };
  }
}

async function refreshProxyList({ silent = false } = {}) {
  const previous = await getProxyState();
  const country = normalizeCountryCode(previous.country) || DEFAULT_PROXY_COUNTRY;

  try {
    const proxies = await requestProxyList(country);
    let nextState = {
      ...previous,
      country,
      proxies,
      lastRefreshAt: new Date().toISOString(),
      error: proxies.length ? '' : `No working ${country} proxy is available right now.`,
    };

    if (nextState.enabled && nextState.currentProxy) {
      try {
        const verification = await verifyProxyTunnel(country);
        nextState = {
          ...nextState,
          connected: true,
          currentProxy: {
            ...nextState.currentProxy,
            ...verification,
          },
          error: '',
        };
      } catch {
        if (nextState.autoReconnect !== false) {
          nextState = await recoverProxyConnection(nextState, country);
        } else {
          await clearProxy().catch(() => {});
          nextState = {
            ...nextState,
            enabled: false,
            connected: false,
            currentProxy: null,
            error: `Active ${country} proxy failed. Browser proxy was turned off.`,
          };
        }
      }
    }

    await setProxyState(nextState);
    await updateBadge(nextState);
    return nextState;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to refresh proxy list.';
    const nextState = {
      ...previous,
      enabled: false,
      connected: false,
      currentProxy: null,
      error: previous.enabled || previous.connected
        ? `${errorMessage} Browser proxy was turned off.`
        : errorMessage,
    };
    if (previous.enabled || previous.connected) {
      await clearProxy().catch(() => {});
    }
    await setProxyState(nextState);
    await updateBadge(nextState);
    if (!silent) throw error;
    return nextState;
  }
}

async function connectBestProxy() {
  let state = await getProxyState();
  if (!state.proxies.length || isProxyListStale(state.lastRefreshAt)) {
    state = await refreshProxyList();
  }

  const proxy = state.proxies[0];
  if (!proxy) throw new Error(`No working ${state.country || DEFAULT_PROXY_COUNTRY} proxy is available right now.`);

  return connectFirstWorkingProxy(state.proxies, state);
}

async function connectProxyById(proxyId) {
  let state = await getProxyState();
  const proxy = state.proxies.find(item => item.id === proxyId);

  if (!proxy) {
    state = await refreshProxyList();
  }

  const freshProxy = state.proxies.find(item => item.id === proxyId) || state.proxies[0];
  if (!freshProxy) throw new Error(`No working ${state.country || DEFAULT_PROXY_COUNTRY} proxy is available right now.`);

  const candidates = uniqueProxies([
    freshProxy,
    ...state.proxies.filter(item => item.id !== freshProxy.id),
  ]);
  return connectFirstWorkingProxy(candidates, state);
}

async function recoverProxyConnection(state, country) {
  const currentId = state.currentProxy?.id || '';
  const candidates = uniqueProxies((state.proxies || []).filter(proxy => proxy.id !== currentId));

  for (const proxy of candidates.slice(0, MAX_CONNECT_ATTEMPTS)) {
    try {
      const recovered = await connectProxy(proxy, state, { statusMessage: 'Active proxy failed. Switched to a fresh route.' });
      return {
        ...recovered,
        proxies: state.proxies,
        lastRefreshAt: state.lastRefreshAt,
      };
    } catch {
      // Keep searching for a route that can still tunnel browser traffic.
    }
  }

  await clearProxy().catch(() => {});
  return {
    ...state,
    enabled: false,
    connected: false,
    currentProxy: null,
    error: `Active ${country} proxy failed. No fallback route connected, so browser proxy was turned off.`,
  };
}

async function connectFirstWorkingProxy(candidates, state) {
  const country = normalizeCountryCode(state.country) || DEFAULT_PROXY_COUNTRY;

  for (const proxy of candidates.slice(0, MAX_CONNECT_ATTEMPTS)) {
    try {
      return await connectProxy(proxy, state);
    } catch {
      // Try the next fresh route. Failed candidates are cleared inside connectProxy().
    }
  }

  await clearProxy().catch(() => {});
  const nextState = {
    ...state,
    enabled: false,
    connected: false,
    currentProxy: null,
    error: `No tested ${country} proxy could connect. Browser proxy is off.`,
  };
  await setProxyState(nextState);
  await updateBadge(nextState);

  throw new Error(nextState.error);
}

async function connectProxy(proxy, state = DEFAULT_PROXY_STATE, options = {}) {
  const country = normalizeCountryCode(state.country) || DEFAULT_PROXY_COUNTRY;
  await applyProxy(proxy);
  let verification;
  try {
    verification = await verifyProxyTunnel(country);
  } catch (error) {
    await clearProxy().catch(() => {});
    throw new Error(`${formatProxyAddress(proxy)} failed the tunnel test.`);
  }

  const verifiedProxy = {
    ...proxy,
    ...verification,
    country: verification.verifiedCountry || proxy.country,
    city: verification.verifiedCity || proxy.city,
    region: verification.verifiedRegion || proxy.region,
  };
  const nextState = {
    ...state,
    country,
    enabled: true,
    connected: true,
    currentProxy: verifiedProxy,
    error: options.statusMessage || '',
  };
  await setProxyState(nextState);
  await updateBadge(nextState);
  return nextState;
}

async function disconnectProxy() {
  const state = await getProxyState();
  await clearProxy();
  const nextState = {
    ...state,
    enabled: false,
    connected: false,
    currentProxy: null,
    error: '',
  };
  await setProxyState(nextState);
  await updateBadge(nextState);
  return nextState;
}

async function saveWebshareToken(token) {
  const webshareToken = String(token || '').trim();
  if (!webshareToken) throw new Error('Paste a Webshare API token first.');

  const secrets = await getProxySecrets();
  await setProxySecrets({
    ...secrets,
    webshareToken,
  });

  const state = await getProxyState();
  await setProxyState({
    ...state,
    proxies: [],
    lastRefreshAt: '',
    error: 'Webshare free source saved. Refreshing stable routes.',
  });

  return refreshProxyList();
}

async function clearWebshareToken() {
  const state = await getProxyState();
  const wasUsingWebshare = state.currentProxy?.provider === WEBSHARE_PROVIDER;

  await setProxySecrets({
    ...(await getProxySecrets()),
    webshareToken: '',
  });

  if (wasUsingWebshare) {
    await clearProxy().catch(() => {});
  }

  const publicProxies = (state.proxies || []).filter(proxy => proxy.provider !== WEBSHARE_PROVIDER);
  const nextState = {
    ...state,
    enabled: wasUsingWebshare ? false : state.enabled,
    connected: wasUsingWebshare ? false : state.connected,
    currentProxy: wasUsingWebshare ? null : state.currentProxy,
    proxies: publicProxies,
    lastRefreshAt: '',
    error: '',
  };
  await setProxyState(nextState);
  await updateBadge(nextState);

  return refreshProxyList({ silent: true });
}

async function setProxyAutoReconnect(enabled) {
  const state = await getProxyState();
  const nextState = {
    ...state,
    autoReconnect: Boolean(enabled),
    error: '',
  };
  await setProxyState(nextState);
  return nextState;
}

async function setProxyCountry(country) {
  const nextCountry = normalizeCountryCode(country) || DEFAULT_PROXY_COUNTRY;
  const state = await getProxyState();

  if (state.enabled || state.connected) {
    await clearProxy().catch(() => {});
  }

  await setProxyState({
    ...state,
    country: nextCountry,
    enabled: false,
    connected: false,
    currentProxy: null,
    proxies: [],
    lastRefreshAt: '',
    error: '',
  });
  await updateBadge({ connected: false, country: nextCountry });

  return refreshProxyList();
}

async function requestProxyList(country) {
  const secrets = await getProxySecrets();
  const results = await Promise.allSettled(getProxySources(country, secrets).map(source => fetchProxySource(source, country)));
  const proxies = uniqueProxies(results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value))
    .sort(compareProxies)
    .slice(0, MAX_PROXIES);

  if (proxies.length) return proxies;

  const error = results.find(result => result.status === 'rejected')?.reason;
  throw error instanceof Error
    ? error
    : new Error(`No proxy provider returned a working ${country} route list.`);
}

function getProxySources(country, secrets = DEFAULT_PROXY_SECRETS) {
  const encodedCountry = encodeURIComponent(country);
  return [
    ...(secrets.webshareToken ? [{
      name: WEBSHARE_PROVIDER,
      url: `${WEBSHARE_API_BASE_URL}&country_code__in=${encodedCountry}`,
      parser: 'webshare-api',
      headers: {
        authorization: `Token ${secrets.webshareToken}`,
      },
    }] : []),
    {
      name: 'Proxifly API',
      url: `${PROXIFLY_API_BASE_URL}&country=${encodedCountry}`,
      parser: 'proxifly-api',
    },
    {
      name: 'ProxyScrape',
      url: `${PROXYSCRAPE_BASE_URL}&country=${encodedCountry}`,
      parser: 'url-list',
    },
    {
      name: 'Proxifly',
      url: `${PROXIFLY_COUNTRY_BASE_URL}/${encodedCountry}/data.txt`,
      parser: 'url-list',
    },
    {
      name: 'Geonode',
      url: `${GEONODE_BASE_URL}&country=${encodedCountry}`,
      parser: 'geonode',
    },
  ];
}

async function fetchProxySource(source, country) {
  const response = await fetch(source.url, {
    method: 'GET',
    headers: {
      accept: ['geonode', 'proxifly-api', 'webshare-api'].includes(source.parser) ? 'application/json' : 'text/plain',
      ...(source.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${source.name} proxy request failed with status ${response.status}.`);

  if (source.parser === 'webshare-api') {
    return parseWebsharePayload(safeJson(text), source.name, country);
  }

  if (source.parser === 'proxifly-api') {
    return parseProxiflyPayload(safeJson(text), source.name, country);
  }

  if (source.parser === 'geonode') {
    const payload = safeJson(text) || {};
    return (payload.data || [])
      .map(proxy => normalizeGeonodeProxy(proxy, source.name, country))
      .filter(Boolean);
  }

  return parseProxyUrlList(text)
    .map((proxyUrl, index) => normalizeProxyUrl(proxyUrl, source.name, index, country))
    .filter(Boolean);
}

function parseWebsharePayload(payload, provider, country) {
  const proxies = Array.isArray(payload?.results) ? payload.results : [];
  return proxies
    .map((proxy, index) => normalizeWebshareProxy(proxy, provider, index, country))
    .filter(Boolean);
}

function normalizeWebshareProxy(proxy, provider, sourceIndex, targetCountry) {
  if (!proxy || proxy.valid === false) return null;

  const country = normalizeCountryCode(proxy.country_code || proxy.country);
  if (country && country !== targetCountry) return null;

  const host = String(proxy.proxy_address || proxy.host || '').trim();
  const port = Number(proxy.port);
  const username = String(proxy.username || '').trim();
  const password = String(proxy.password || '').trim();

  if (!host || !Number.isInteger(port) || port <= 0 || port > 65535) return null;
  if (!username || !password) return null;

  return {
    id: `${provider}:http:${host}:${port}`,
    host,
    port,
    protocol: 'http',
    country: targetCountry,
    city: String(proxy.city_name || proxy.city || ''),
    region: '',
    anonymityLevel: 'authenticated',
    responseTime: 0,
    latency: 0,
    uptime: proxy.valid === true ? 100 : 0,
    lastChecked: normalizeLastChecked('', proxy.last_verification || proxy.updated_at || proxy.created_at),
    provider,
    sourceIndex,
    authenticated: true,
    username,
    password,
  };
}

function parseProxiflyPayload(payload, provider, country) {
  const proxies = [
    Array.isArray(payload) ? payload : null,
    Array.isArray(payload?.proxies) ? payload.proxies : null,
    Array.isArray(payload?.data) ? payload.data : null,
    payload?.proxy ? [payload] : null,
  ].find(Boolean) || [];

  return proxies
    .map((proxy, index) => normalizeStructuredProxy(proxy, provider, index, country))
    .filter(Boolean);
}

function normalizeStructuredProxy(proxy, provider, sourceIndex, targetCountry) {
  if (typeof proxy === 'string') return normalizeProxyUrl(proxy, provider, sourceIndex, targetCountry);

  const proxyUrl = proxy?.proxy || proxy?.url || proxy?.address;
  if (proxyUrl) {
    const normalized = normalizeProxyUrl(proxyUrl, provider, sourceIndex, targetCountry);
    if (!normalized) return null;
    return {
      ...normalized,
      city: String(proxy.geolocation?.city || proxy.city || ''),
      region: String(proxy.geolocation?.region || proxy.region || ''),
      anonymityLevel: String(proxy.anonymity || proxy.anonymityLevel || ''),
      responseTime: finiteNumber(proxy.responseTime || proxy.latency),
      uptime: finiteNumber(proxy.score || proxy.uptime),
    };
  }

  const country = normalizeCountryCode(proxy?.country || proxy?.countryCode || proxy?.geolocation?.country);
  if (country && country !== targetCountry) return null;

  const protocol = String(proxy?.protocol || 'http').toLowerCase();
  if (!SUPPORTED_PROTOCOLS.includes(protocol)) return null;

  const host = String(proxy?.ip || proxy?.host || '').trim();
  const port = Number(proxy?.port);
  if (!host || !Number.isInteger(port) || port <= 0 || port > 65535) return null;

  return {
    id: `${provider}:${protocol}:${host}:${port}`,
    host,
    port,
    protocol,
    country: targetCountry,
    city: String(proxy.geolocation?.city || proxy.city || ''),
    region: String(proxy.geolocation?.region || proxy.region || ''),
    anonymityLevel: String(proxy.anonymity || proxy.anonymityLevel || ''),
    responseTime: finiteNumber(proxy.responseTime || proxy.latency),
    latency: finiteNumber(proxy.latency),
    uptime: finiteNumber(proxy.score || proxy.uptime),
    lastChecked: new Date().toISOString(),
    provider,
    sourceIndex,
  };
}

function normalizeGeonodeProxy(proxy, provider, targetCountry) {
  const country = normalizeCountryCode(proxy?.country);
  if (country !== targetCountry) return null;
  if (!proxy?.ip || !proxy?.port) return null;
  if (!looksWorking(proxy)) return null;

  const protocols = Array.isArray(proxy.protocols)
    ? proxy.protocols.map(protocol => String(protocol).toLowerCase())
    : [];
  const protocol = SUPPORTED_PROTOCOLS.find(candidate => protocols.includes(candidate));
  if (!protocol) return null;

  const port = Number(proxy.port);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) return null;

  const responseTime = finiteNumber(proxy.responseTime);
  const latency = finiteNumber(proxy.latency);
  const uptime = finiteNumber(proxy.upTime);
  const lastChecked = normalizeLastChecked(proxy.lastChecked, proxy.updated_at);
  const id = String(proxy._id || `${protocol}:${proxy.ip}:${port}`);

  return {
    id,
    host: String(proxy.ip),
    port,
    protocol,
    country: targetCountry,
    city: String(proxy.city || ''),
    region: String(proxy.region || ''),
    anonymityLevel: String(proxy.anonymityLevel || ''),
    responseTime,
    latency,
    uptime,
    lastChecked,
    provider,
    sourceIndex: 0,
  };
}

function normalizeProxyUrl(proxyUrl, provider, sourceIndex, targetCountry) {
  const match = String(proxyUrl || '').trim().match(/^(https?|socks4|socks5):\/\/([^:/\s]+):(\d{1,5})$/i);
  if (!match) return null;

  const protocol = match[1].toLowerCase();
  if (!SUPPORTED_PROTOCOLS.includes(protocol)) return null;
  const host = match[2];
  if (!host) return null;

  const port = Number(match[3]);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) return null;

  return {
    id: `${provider}:${protocol}:${host}:${port}`,
    host,
    port,
    protocol,
    country: targetCountry,
    city: '',
    region: '',
    anonymityLevel: '',
    responseTime: 0,
    latency: 0,
    uptime: 0,
    lastChecked: new Date().toISOString(),
    provider,
    sourceIndex,
  };
}

function parseProxyUrlList(text) {
  return [...new Set(String(text || '').match(/\b(?:https?|socks4|socks5):\/\/[^\s,"']+/gi) || [])];
}

function looksWorking(proxy) {
  if (proxy?.working === false) return false;

  const tryCount = finiteNumber(proxy?.upTimeTryCount);
  const successCount = finiteNumber(proxy?.upTimeSuccessCount);
  if (tryCount > 0 && successCount === 0) return false;

  return successCount > 0 || finiteNumber(proxy?.responseTime) > 0 || finiteNumber(proxy?.latency) > 0;
}

function compareProxies(left, right) {
  const sourceScore = (SOURCE_PRIORITY[left.provider] ?? 99) - (SOURCE_PRIORITY[right.provider] ?? 99);
  if (sourceScore !== 0) return sourceScore;

  const protocolScore = PROTOCOL_PRIORITY[left.protocol] - PROTOCOL_PRIORITY[right.protocol];
  if (protocolScore !== 0) return protocolScore;

  const leftSpeed = left.responseTime || left.latency || Number.MAX_SAFE_INTEGER;
  const rightSpeed = right.responseTime || right.latency || Number.MAX_SAFE_INTEGER;
  if (leftSpeed !== rightSpeed) return leftSpeed - rightSpeed;

  const uptimeScore = (right.uptime || 0) - (left.uptime || 0);
  if (uptimeScore !== 0) return uptimeScore;

  return (left.sourceIndex || 0) - (right.sourceIndex || 0);
}

function normalizeLastChecked(lastChecked, fallback) {
  if (typeof lastChecked === 'number' && Number.isFinite(lastChecked)) {
    const milliseconds = lastChecked > 10_000_000_000 ? lastChecked : lastChecked * 1000;
    return new Date(milliseconds).toISOString();
  }

  const date = new Date(fallback || '');
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeCountryCode(value) {
  const country = String(value || '').trim().toUpperCase();
  if (!country) return '';
  if (['US', 'USA', 'UNITED STATES', 'UNITED STATES OF AMERICA'].includes(country)) return DEFAULT_PROXY_COUNTRY;
  return country.slice(0, 2);
}

function isProxyListStale(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return true;
  return Date.now() - date.getTime() > REFRESH_PERIOD_MINUTES * 60 * 1000;
}

function applyProxy(proxy) {
  setActiveProxyAuth(proxy);
  return proxySettingsSet({
    mode: 'fixed_servers',
    rules: {
      singleProxy: {
        scheme: chromeProxyScheme(proxy.protocol),
        host: proxy.host,
        port: proxy.port,
      },
      bypassList: ['<local>', 'localhost', '127.0.0.1'],
    },
  });
}

function clearProxy() {
  activeProxyAuth = null;
  return proxySettingsClear();
}

function chromeProxyScheme(protocol) {
  return protocol === 'https' ? 'http' : protocol;
}

function setActiveProxyAuth(proxy) {
  if (!proxy?.username || !proxy?.password) {
    activeProxyAuth = null;
    return;
  }

  activeProxyAuth = {
    host: proxy.host,
    port: proxy.port,
    username: proxy.username,
    password: proxy.password,
  };
}

function handleProxyAuthRequired(details) {
  if (!details?.isProxy || !activeProxyAuth) return {};

  const challengerHost = String(details.challenger?.host || '');
  const challengerPort = Number(details.challenger?.port || 0);
  if (challengerHost && challengerHost !== activeProxyAuth.host) return {};
  if (challengerPort && challengerPort !== activeProxyAuth.port) return {};

  return {
    authCredentials: {
      username: activeProxyAuth.username,
      password: activeProxyAuth.password,
    },
  };
}

async function verifyProxyTunnel(targetCountry) {
  let lastError;

  for (const url of PROXY_VERIFY_URLS) {
    try {
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          accept: 'application/json',
          'cache-control': 'no-cache',
        },
      }, PROXY_TEST_TIMEOUT_MS);
      const text = await response.text();
      const data = safeJson(text);
      if (!response.ok || !data) throw new Error(`Verification failed with status ${response.status}.`);
      if (data.success === false) throw new Error(String(data.message || 'IP verification rejected the request.'));

      const country = normalizeCountryCode(data.country_code || data.countryCode || data.country);
      if (!country) {
        throw new Error('IP verification did not return a country.');
      }
      if (country !== targetCountry) {
        throw new Error(`Verified route is ${country}, not ${targetCountry}.`);
      }

      const timezone = data.timezone?.id || data.location?.time_zone || '';
      const latitude = Number(data.latitude ?? data.location?.latitude ?? 0);
      const longitude = Number(data.longitude ?? data.location?.longitude ?? 0);

      return {
        verifiedAt: new Date().toISOString(),
        verifiedCountry: country,
        verifiedIp: String(data.ip || data.ipAddress || ''),
        verifiedCity: String(data.city || ''),
        verifiedRegion: String(data.region || data.regionName || ''),
        verifiedTimezone: timezone,
        verifiedLatitude: latitude,
        verifiedLongitude: longitude,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Proxy verification failed.');
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getProxyState() {
  const stored = await storageGet(PROXY_STATE_KEY);
  return {
    ...DEFAULT_PROXY_STATE,
    ...(stored[PROXY_STATE_KEY] || {}),
  };
}

function setProxyState(state) {
  return storageSet({ [PROXY_STATE_KEY]: state });
}

async function getProxySecrets() {
  const stored = await storageGet(PROXY_SECRET_KEY);
  return {
    ...DEFAULT_PROXY_SECRETS,
    ...(stored[PROXY_SECRET_KEY] || {}),
  };
}

function setProxySecrets(secrets) {
  return storageSet({ [PROXY_SECRET_KEY]: secrets });
}

async function getPublicProxyState(state = null) {
  const proxyState = state || await getProxyState();
  const secrets = await getProxySecrets();
  const proxies = Array.isArray(proxyState.proxies) ? proxyState.proxies : [];
  return {
    ...proxyState,
    proxies: proxies.map(sanitizeProxyForPopup),
    currentProxy: sanitizeProxyForPopup(proxyState.currentProxy),
    webshareConfigured: Boolean(secrets.webshareToken),
    webshareRouteCount: proxies.filter(proxy => proxy.provider === WEBSHARE_PROVIDER).length,
  };
}

function sanitizeProxyForPopup(proxy) {
  if (!proxy) return null;
  const { username, password, ...safeProxy } = proxy;
  return {
    ...safeProxy,
    authenticated: Boolean(proxy.authenticated || (username && password)),
  };
}

async function updateBadge(state = null) {
  const proxyState = state || await getProxyState();
  await actionSetBadgeText(proxyState.connected ? (proxyState.country || DEFAULT_PROXY_COUNTRY).slice(0, 4) : '');
  if (proxyState.connected) {
    await actionSetBadgeBackgroundColor('#22d3ee');
  }
}

function storageGet(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

function storageSet(items) {
  return new Promise(resolve => chrome.storage.local.set(items, resolve));
}

function proxySettingsSet(value) {
  return new Promise((resolve, reject) => {
    chrome.proxy.settings.set({ value, scope: 'regular' }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });
}

function proxySettingsClear() {
  return new Promise((resolve, reject) => {
    chrome.proxy.settings.clear({ scope: 'regular' }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });
}

function actionSetBadgeText(text) {
  return new Promise(resolve => chrome.action.setBadgeText({ text }, resolve));
}

function actionSetBadgeBackgroundColor(color) {
  return new Promise(resolve => chrome.action.setBadgeBackgroundColor({ color }, resolve));
}

function uniqueProxies(proxies) {
  const seen = new Set();
  return proxies.filter(proxy => {
    const key = proxy ? `${proxy.protocol}:${proxy.host}:${proxy.port}` : '';
    if (!proxy || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatProxyAddress(proxy) {
  return `${proxy.protocol.toUpperCase()} ${proxy.host}:${proxy.port}`;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const REGION_GEODATA_BG = {
  Africa: { timezone: 'Africa/Johannesburg', locale: 'en-ZA', latitude: -26.2041, longitude: 28.0473 },
  Americas: { timezone: 'America/New_York', locale: 'en-US', latitude: 40.7128, longitude: -74.0060 },
  Asia: { timezone: 'Asia/Singapore', locale: 'en-SG', latitude: 1.3521, longitude: 103.8198 },
  Europe: { timezone: 'Europe/London', locale: 'en-GB', latitude: 51.5074, longitude: -0.1278 },
  Oceania: { timezone: 'Australia/Sydney', locale: 'en-AU', latitude: -33.8688, longitude: 151.2093 },
  Antarctic: { timezone: 'Antarctica/McMurdo', locale: 'en-US', latitude: -77.8460, longitude: 166.6660 },
  World: { timezone: 'UTC', locale: 'en-US', latitude: 0, longitude: 0 },
};

const COUNTRY_GEODATA_OVERRIDES_BG = {
  US: { timezone: 'America/New_York', locale: 'en-US', latitude: 40.7128, longitude: -74.0060 },
  IN: { timezone: 'Asia/Kolkata', locale: 'en-IN', latitude: 19.0760, longitude: 72.8777 },
  GB: { timezone: 'Europe/London', locale: 'en-GB', latitude: 51.5074, longitude: -0.1278 },
  CA: { timezone: 'America/Toronto', locale: 'en-CA', latitude: 43.6532, longitude: -79.3832 },
  AU: { timezone: 'Australia/Sydney', locale: 'en-AU', latitude: -33.8688, longitude: 151.2093 },
  DE: { timezone: 'Europe/Berlin', locale: 'de-DE', latitude: 52.5200, longitude: 13.4050 },
  FR: { timezone: 'Europe/Paris', locale: 'fr-FR', latitude: 48.8566, longitude: 2.3522 },
  JP: { timezone: 'Asia/Tokyo', locale: 'ja-JP', latitude: 35.6762, longitude: 139.6503 },
  CN: { timezone: 'Asia/Shanghai', locale: 'zh-CN', latitude: 31.2304, longitude: 121.4737 },
  BR: { timezone: 'America/Sao_Paulo', locale: 'pt-BR', latitude: -23.5505, longitude: -46.6333 },
  ZA: { timezone: 'Africa/Johannesburg', locale: 'en-ZA', latitude: -26.2041, longitude: 28.0473 },
  RU: { timezone: 'Europe/Moscow', locale: 'ru-RU', latitude: 55.7558, longitude: 37.6173 },
  MX: { timezone: 'America/Mexico_City', locale: 'es-MX', latitude: 19.4326, longitude: -99.1332 },
  NZ: { timezone: 'Pacific/Auckland', locale: 'en-NZ', latitude: -36.8485, longitude: 174.7633 },
  SG: { timezone: 'Asia/Singapore', locale: 'en-SG', latitude: 1.3521, longitude: 103.8198 },
  AE: { timezone: 'Asia/Dubai', locale: 'en-AE', latitude: 25.2048, longitude: 55.2708 },
};

function getCountryDefaultGeoBackground(countryCode) {
  const code = String(countryCode || '').trim().toUpperCase();
  if (COUNTRY_GEODATA_OVERRIDES_BG[code]) {
    return COUNTRY_GEODATA_OVERRIDES_BG[code];
  }
  return REGION_GEODATA_BG.Americas;
}

async function updateActiveSpoof() {
  const stored = await storageGet(['newIdentity.current', 'newIdentity.proxy', 'newIdentity.settings']);
  const identity = stored['newIdentity.current'] || null;
  const proxy = stored['newIdentity.proxy'] || null;
  const settings = stored['newIdentity.settings'] || {};

  let timezone = '';
  let locale = '';
  let latitude = null;
  let longitude = null;

  if (settings.antiFingerprint !== false) {
    if (proxy && proxy.enabled && proxy.connected && proxy.currentProxy) {
      const p = proxy.currentProxy;
      timezone = p.verifiedTimezone || '';
      latitude = p.verifiedLatitude !== undefined ? p.verifiedLatitude : null;
      longitude = p.verifiedLongitude !== undefined ? p.verifiedLongitude : null;
      
      const country = p.verifiedCountry || proxy.country || 'US';
      const fallbackGeo = getCountryDefaultGeoBackground(country);
      
      timezone = timezone || fallbackGeo.timezone;
      latitude = latitude !== null ? latitude : fallbackGeo.latitude;
      longitude = longitude !== null ? longitude : fallbackGeo.longitude;
      
      if (identity && identity.countryCode === country) {
        locale = identity.locale;
      } else {
        locale = fallbackGeo.locale;
      }
    } else if (identity) {
      timezone = identity.timezone;
      locale = identity.locale;
      latitude = identity.latitude;
      longitude = identity.longitude;
    }
  }

  if (timezone || locale || latitude !== null) {
    await storageSet({
      'newIdentity.activeSpoof': {
        timezone: timezone || 'UTC',
        locale: locale || 'en-US',
        latitude: latitude !== null ? latitude : 0,
        longitude: longitude !== null ? longitude : 0,
      }
    });
  } else {
    await storageSet({ 'newIdentity.activeSpoof': null });
  }
}
