(() => {
  if (window.__newIdentitySpoofLoaded) return;
  window.__newIdentitySpoofLoaded = true;

  chrome.storage.local.get(['newIdentity.activeSpoof', 'newIdentity.settings'], (data) => {
    const settings = data['newIdentity.settings'] || {};
    const activeSpoof = data['newIdentity.activeSpoof'] || null;

    if (!activeSpoof) return;

    const runTimezone = settings.antiFingerprint !== false;
    const runMasking = settings.fingerprintMasking !== false;

    if (!runTimezone && !runMasking) return;

    injectSpoofScript(activeSpoof, runTimezone, runMasking);
  });

  function injectSpoofScript(spoof, runTimezone, runMasking) {
    const {
      timezone, locale, latitude, longitude,
      hardwareConcurrency, deviceMemory, webglVendor, webglRenderer, canvasNoise
    } = spoof;

    const code = `
      (function() {
        const runTimezone = ${Boolean(runTimezone)};
        const runMasking = ${Boolean(runMasking)};

        if (runTimezone) {
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
            Intl.DateTimeFormat.prototype = OriginalDateTimeFormat.prototype;
            if (OriginalDateTimeFormat.supportedLocalesOf) {
              Intl.DateTimeFormat.supportedLocalesOf = OriginalDateTimeFormat.supportedLocalesOf;
            }
            
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

            const originalToString = Date.prototype.toString;
            Date.prototype.toString = function() {
              try {
                const formatter = new OriginalDateTimeFormat('en-US', {
                  timeZone: targetTimezone,
                  weekday: 'short',
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                });
                const parts = formatter.formatToParts(this);
                const getPart = name => parts.find(p => p.type === name).value;
                
                const weekday = getPart('weekday');
                const month = getPart('month');
                const day = getPart('day');
                const year = getPart('year');
                const hour = getPart('hour');
                const minute = getPart('minute');
                const second = getPart('second');
                
                const offsetVal = this.getTimezoneOffset();
                const sign = offsetVal > 0 ? '-' : '+';
                const absOffset = Math.abs(offsetVal);
                const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
                const minutes = String(absOffset % 60).padStart(2, '0');
                
                let tzName = '';
                try {
                  const nameParts = new OriginalDateTimeFormat('en-US', {
                    timeZone: targetTimezone,
                    timeZoneName: 'long'
                  }).formatToParts(this);
                  tzName = nameParts.find(p => p.type === 'timeZoneName')?.value || '';
                } catch (err) {}
                
                const tzSuffix = tzName ? (' (' + tzName + ')') : '';
                return weekday + ' ' + month + ' ' + day + ' ' + year + ' ' + hour + ':' + minute + ':' + second + ' GMT' + sign + hours + minutes + tzSuffix;
              } catch (e) {
                return originalToString.call(this);
              }
            };

            const originalToTimeString = Date.prototype.toTimeString;
            Date.prototype.toTimeString = function() {
              try {
                const str = this.toString();
                const parts = str.split(' ');
                return parts.slice(4).join(' ');
              } catch (e) {
                return originalToTimeString.call(this);
              }
            };

            const originalToLocaleString = Date.prototype.toLocaleString;
            Date.prototype.toLocaleString = function(locales, options) {
              try {
                const opts = options || {};
                opts.timeZone = opts.timeZone || targetTimezone;
                return originalToLocaleString.call(this, locales || targetLocale, opts);
              } catch (e) {
                return originalToLocaleString.call(this, locales, options);
              }
            };

            const originalToLocaleDateString = Date.prototype.toLocaleDateString;
            Date.prototype.toLocaleDateString = function(locales, options) {
              try {
                const opts = options || {};
                opts.timeZone = opts.timeZone || targetTimezone;
                return originalToLocaleDateString.call(this, locales || targetLocale, opts);
              } catch (e) {
                return originalToLocaleDateString.call(this, locales, options);
              }
            };

            const originalToLocaleTimeString = Date.prototype.toLocaleTimeString;
            Date.prototype.toLocaleTimeString = function(locales, options) {
              try {
                const opts = options || {};
                opts.timeZone = opts.timeZone || targetTimezone;
                return originalToLocaleTimeString.call(this, locales || targetLocale, opts);
              } catch (e) {
                return originalToLocaleTimeString.call(this, locales, options);
              }
            };
          } catch (e) {}

          try {
            Object.defineProperty(Navigator.prototype, 'language', { get: () => targetLocale, configurable: true });
            Object.defineProperty(Navigator.prototype, 'languages', { get: () => [targetLocale, 'en-US', 'en'], configurable: true });
          } catch (e) {}

          try {
            if (window.Geolocation) {
              Geolocation.prototype.getCurrentPosition = function(success, error, options) {
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
              
              Geolocation.prototype.watchPosition = function(success, error, options) {
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
        }

        if (runMasking) {
          const targetCores = ${Number(hardwareConcurrency)};
          const targetRam = ${Number(deviceMemory)};
          const targetVendor = ${JSON.stringify(webglVendor)};
          const targetRenderer = ${JSON.stringify(webglRenderer)};
          const targetCanvasNoise = ${Number(canvasNoise)};

          try {
            if (targetCores) {
              Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => targetCores, configurable: true });
            }
            if (targetRam) {
              Object.defineProperty(navigator, 'deviceMemory', { get: () => targetRam, configurable: true });
            }
          } catch (e) {}

          try {
            const overrideWebGL = (proto) => {
              if (!proto) return;
              const originalGetParameter = proto.getParameter;
              proto.getParameter = function(parameter) {
                if (parameter === 0x9245 && targetVendor) return targetVendor;
                if (parameter === 0x9246 && targetRenderer) return targetRenderer;
                return originalGetParameter.call(this, parameter);
              };
            };
            overrideWebGL(window.WebGLRenderingContext?.prototype);
            overrideWebGL(window.WebGL2RenderingContext?.prototype);
          } catch (e) {}

          try {
            const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
            HTMLCanvasElement.prototype.toDataURL = function(...args) {
              const ctx = this.getContext('2d');
              if (ctx && targetCanvasNoise) {
                try {
                  const imgData = ctx.getImageData(0, 0, 1, 1);
                  imgData.data[0] = (imgData.data[0] + targetCanvasNoise) % 256;
                  ctx.putImageData(imgData, 0, 0);
                } catch (e) {}
              }
              return originalToDataURL.apply(this, args);
            };

            const originalToBlob = HTMLCanvasElement.prototype.toBlob;
            HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
              const ctx = this.getContext('2d');
              if (ctx && targetCanvasNoise) {
                try {
                  const imgData = ctx.getImageData(0, 0, 1, 1);
                  imgData.data[0] = (imgData.data[0] + targetCanvasNoise) % 256;
                  ctx.putImageData(imgData, 0, 0);
                } catch (e) {}
              }
              return originalToBlob.apply(this, [callback, ...args]);
            };
          } catch (e) {}
        }
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
