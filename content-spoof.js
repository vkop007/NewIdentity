(() => {
  if (window.__newIdentitySpoofLoaded) return;
  window.__newIdentitySpoofLoaded = true;

  chrome.storage.local.get(['newIdentity.activeSpoof', 'newIdentity.settings'], (data) => {
    const settings = data['newIdentity.settings'] || {};
    const activeSpoof = data['newIdentity.activeSpoof'] || null;

    if (settings.antiFingerprint === false || !activeSpoof) return;

    const { timezone, locale, latitude, longitude } = activeSpoof;

    injectSpoofScript(timezone, locale, latitude, longitude);
  });

  function injectSpoofScript(timezone, locale, latitude, longitude) {
    const code = `
      (function() {
        const targetTimezone = ${JSON.stringify(timezone)};
        const targetLocale = ${JSON.stringify(locale)};
        const targetLat = ${Number(latitude)};
        const targetLng = ${Number(longitude)};

        try {
          const OriginalDateTimeFormat = Intl.DateTimeFormat;
          Intl.DateTimeFormat = function(locales, options) {
            const opts = options || {};
            opts.timeZone = opts.timeZone || targetTimezone;
            return new OriginalDateTimeFormat(locales || targetLocale, opts);
          };
          
          const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
          Date.prototype.getTimezoneOffset = function() {
            try {
              const formatter = new OriginalDateTimeFormat('en-US', {
                timeZone: targetTimezone,
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric',
                hour12: false
              });
              const parts = formatter.formatToParts(this);
              const partVal = name => parts.find(p => p.type === name).value;
              const targetUtc = Date.UTC(
                Number(partVal('year')), Number(partVal('month')) - 1, Number(partVal('day')),
                partVal('hour') === '24' ? 0 : Number(partVal('hour')), Number(partVal('minute')), Number(partVal('second'))
              );
              return Math.round((this.getTime() - targetUtc) / 60000);
            } catch (e) {
              return originalGetTimezoneOffset.call(this);
            }
          };
        } catch (e) {}

        try {
          Object.defineProperty(navigator, 'language', { get: () => targetLocale, configurable: true });
          Object.defineProperty(navigator, 'languages', { get: () => [targetLocale, 'en-US', 'en'], configurable: true });
        } catch (e) {}

        try {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition = function(success, error, options) {
              setTimeout(() => {
                success({
                  coords: {
                    latitude: targetLat,
                    longitude: targetLng,
                    accuracy: 15,
                    altitude: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null
                  },
                  timestamp: Date.now()
                });
              }, 0);
            };
            
            navigator.geolocation.watchPosition = function(success, error, options) {
              const watchId = Math.floor(Math.random() * 10000);
              setTimeout(() => {
                success({
                  coords: {
                    latitude: targetLat,
                    longitude: targetLng,
                    accuracy: 15,
                    altitude: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null
                  },
                  timestamp: Date.now()
                });
              }, 0);
              return watchId;
            };
          }
        } catch (e) {}
      })();
    `;

    try {
      const script = document.createElement('script');
      script.textContent = code;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
    } catch (e) {
      console.error('New Identity: Failed to inject anti-fingerprint script:', e);
    }
  }
})();
