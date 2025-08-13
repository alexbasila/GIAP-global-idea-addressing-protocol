// /GIAP-global-idea-addressing-protocol/install.js
let deferredPrompt = null;
const wrap = document.getElementById('install-wrap');
const btn  = document.getElementById('installBtn');

// Wird gefeuert, wenn die PWA die Install-Kriterien erfüllt (HTTPS, Manifest, SW, nicht schon installiert)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();            // Browser-Banner unterdrücken
  deferredPrompt = e;            // Event merken
  wrap.style.display = 'block';  // eigenen Button zeigen
});

// Klick auf unseren Button => Prompt anzeigen
btn?.addEventListener('click', async () => {
  wrap.style.display = 'none';
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  try { await deferredPrompt.userChoice; } finally { deferredPrompt = null; }
});

// Optional: Wenn bereits installiert, Button ausblenden
window.matchMedia('(display-mode: standalone)').addEventListener('change', (ev) => {
  if (ev.matches) wrap.style.display = 'none';
});
if (window.matchMedia('(display-mode: standalone)').matches) {
  wrap.style.display = 'none';
}
