// /GIAP-global-idea-addressing-protocol/install.js
(function () {
  const btn   = document.getElementById('btn-pwa-install');
  const hint  = document.getElementById('pwa-install-hint');

  if (!btn) return;
  btn.disabled = true;

  // Erkennen, ob bereits als App läuft
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator.standalone === true); // iOS Safari

  if (isStandalone) {
    btn.textContent = 'Bereits installiert';
    btn.disabled = true;
    if (hint) hint.textContent = '';
    return;
  }

  // Browser-Erkennung (für Hinweise)
  const ua = navigator.userAgent || '';
  const isFirefox = /Firefox/i.test(ua);
  const isChrome  = /Chrome/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isIOS     = /iPad|iPhone|iPod/.test(ua);

  // Chrome/Android: echtes beforeinstallprompt
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // WICHTIG: Standard blocken und Event merken
    e.preventDefault();
    deferredPrompt = e;
    btn.disabled = false;
    if (hint) hint.textContent = 'App kann installiert werden.';
  });

  btn.addEventListener('click', async () => {
    // Chrome/Android: offizieller Prompt
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          if (hint) hint.textContent = 'Installation gestartet…';
        } else {
          if (hint) hint.textContent = 'Installation abgebrochen.';
        }
      } catch (err) {
        if (hint) hint.textContent = 'Installationsdialog konnte nicht geöffnet werden.';
      }
      deferredPrompt = null;
      return;
    }

    // Firefox Android (kein beforeinstallprompt)
    if (isFirefox && isAndroid) {
      if (hint) hint.textContent = 'Firefox: Menü (⋮) → "Zum Startbildschirm hinzufügen".';
      return;
    }

    // iOS Safari
    if (isIOS) {
      if (hint) hint.textContent = 'iOS: Teilen-Menü → "Zum Home-Bildschirm".';
      return;
    }

    // Desktop/Chrome ohne Event (Kriterien noch nicht erfüllt)
    if (isChrome) {
      if (hint) hint.textContent = 'Noch nicht installierbar. Seite 1–2× neu laden und kurz nutzen.';
      return;
    }

    // Allgemeiner Fallback
    if (hint) hint.textContent = 'Install-Option im Browser-Menü (Share/Mehr) suchen.';
  });

  // Debug/Status: zeigt an, ob ein SW registriert ist
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration('/GIAP-global-idea-addressing-protocol/')
      .then(reg => {
        if (!reg) {
          if (hint) hint.textContent = 'Service Worker fehlt. Seite hart neu laden.';
        }
      });
  }
})();
