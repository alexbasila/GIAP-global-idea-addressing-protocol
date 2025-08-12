// ==UserScript==
// @name         GIAP Churchen (mobil-stabil, ohne Popup)
// @namespace    giap
// @version      0.6
// @description  Weißer "Churchen"-Button (oben rechts). Holt Text (Auswahl/Textarea/Editor) und öffnet GIAP im selben Tab.
// @match        https://chatgpt.com/*
// @match        https://www.chatgpt.com/*
// @match        https://chat.openai.com/*
// @run-at       document-end
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/<DEIN_USER>/<DEIN_REPO>/main/churchen.user.js
// @updateURL    https://raw.githubusercontent.com/<DEIN_USER>/<DEIN_REPO>/main/churchen.user.js
// ==/UserScript==

(function () {
  'use strict';
  const GIAP = 'https://alexbasila.github.io/GIAP-global-idea-addressing-protocol/';
  const DEBUG = false;
  const log = m => { if (DEBUG) alert(m); };

  function pickText() {
    const sel = (getSelection()?.toString() || '').trim();
    if (sel) return sel;
    const ta = document.querySelector('textarea');
    if (ta?.value?.trim()) return ta.value.trim();
    const ce = document.querySelector('[contenteditable="true"][role="textbox"], div[contenteditable="true"]');
    const t = (ce?.innerText || ce?.textContent || '').trim();
    return t || '';
  }

  function go() {
    let idea = pickText();
    if (!idea) idea = prompt('Kein Text gefunden. Bitte Idee eingeben:', '') || '';
    idea = (idea || '').trim();
    if (!idea) { log('Keine Idee. Abbruch.'); return; }
    const url = `${GIAP}?idea=${encodeURIComponent(idea)}&auto=1`;
    window.location.href = url; // im selben Tab
  }

  function ensureButton() {
    let b = document.getElementById('giap-fab');
    if (b) return;
    b = document.createElement('button');
    b.id = 'giap-fab';
    b.type = 'button';
    b.textContent = 'Churchen●';
    Object.assign(b.style, {
      position:'fixed', top:'12px', right:'12px', zIndex:2147483647,
      padding:'10px 14px', borderRadius:'12px', border:'1px solid #111',
      background:'#0ea5e9', color:'#fff',fontWeight:'700', fontSize:'14px',
      lineHeight:'1', cursor:'pointer', boxShadow:'0 8px 20px rgba(0,0,0,.28)',
      pointerEvents:'auto', touchAction:'manipulation'
    });
    const handler = (e)=>{ e.preventDefault(); e.stopPropagation(); go(); };
    b.addEventListener('click', handler, {passive:false});
    b.addEventListener('touchend', handler, {passive:false});
    b.addEventListener('keyup', (e)=>{ if(e.key==='Enter'||e.key===' ') handler(e); });
    document.body.appendChild(b);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureButton);
  } else {
    ensureButton();
  }
  new MutationObserver(ensureButton).observe(document.documentElement, {childList:true, subtree:true});
  window.addEventListener('resize', ensureButton, {passive:true});
  setInterval(ensureButton, 1500);
})();
