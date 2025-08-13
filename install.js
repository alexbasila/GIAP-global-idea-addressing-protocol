// /GIAP-global-idea-addressing-protocol/install.js  (v6)
(function () {
  const card   = document.getElementById('pwa-install-card');
  const btn    = document.getElementById('btn-pwa-install');
  const hintEl = document.getElementById('pwa-install-hint');
  if (!card || !btn || !hintEl) return;

  const ua = navigator.userAgent || '';
  const isFirefox = /Firefox/i.test(ua);
  const isChrome  = /Chrome/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua);

  // tiny helpers
  const show = (m) => { hintEl.textContent = m || ''; console.log('[PWA]', m); };
  const enable = () => { btn.disabled = false; btn.style.opacity = '1'; };
  const disable = () => { btn.disabled = true;  btn.style.opacity = '0.6'; };

  // already installed → don’t offer install
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                    || window.matchMedia('(display-mode: window-controls-overlay)').matches
                    || (window.navigator.standalone === true);
  if (isStandalone) {
    show('App ist bereits installiert (standalone).');
    disable();
    return;
  }

  // No SW support → no PWA
  if (!('serviceWorker' in navigator)) {
    show('Service Worker wird nicht unterstützt.');
    disable();
    return;
  }

  // Firefox hat kein beforeinstallprompt → Anweisung anzeigen
  if (isFirefox) {
    show('Firefox: Menü ⋮ → „Zum Startbildschirm hinzufügen“.');
    disable();
    return;
  }

  // Chrome-Flow
  let deferredPrompt = null;
  disable(); // bis wir das Event bekommen

  window.addEventListener('beforeinstallprompt', (ev) => {
    console.log('[PWA] beforeinstallprompt fired');
    ev.preventDefault();
    deferredPrompt = ev;
    enable();
    show('Bereit zur Installation.');
  });

  // Diagnose nach kurzer Zeit
  (async () => {
    // warten, bis (falls neu) der SW die Seite kontrolliert
    try { await navigator.serviceWorker.ready; } catch {}
    const controlled = !!navigator.serviceWorker.controller;
    console.log('[PWA] SW controlled:', controlled);

    // 1.5s warten, ob das Event kam
    setTimeout(() => {
      if (deferredPrompt) return;
      if (!controlled) {
        show('Service Worker neu – Seite einmal **neu laden**.');
        disable();
      } else if (isChrome) {
        // Chrome hat Heuristiken; manchmal kommt das Event erst nach Interaktion/Reload
        show('Tipp: Seite kurz benutzen/neu laden. Oder Menü ⋮ → „App installieren“.');
        disable();
      }
    }, 1500);
  })();

  btn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      // Button sollte eig. deaktiviert sein – safety net
      show('Noch nicht bereit. Bitte Seite neu laden oder das Menü ⋮ nutzen.');
      return;
    }
    btn.disabled = true;
    deferredPrompt.prompt();
    try {
      const choice = await deferredPrompt.userChoice;
      console.log('[PWA] userChoice:', choice && choice.outcome);
      if (choice && choice.outcome === 'accepted') {
        show('Installation gestartet.');
      } else {
        show('Installation abgebrochen. Du kannst später erneut versuchen.');
        // nach Dismissal ist dasselbe Event verbraucht
      }
    } finally {
      deferredPrompt = null;
    }
  });
})();
