// Mini-GIAP: reine Client-Seite. Vergibt eine IdeaID, speichert lokal, erzeugt Permalinks.
// Keine Serverkommunikation. Für Demo/Resonanztest.

const $ = (sel) => document.querySelector(sel);
const ideaEl = $('#idea');
const tagsEl = $('#tags');
const resultBox = $('#result');
const ideaIdEl = $('#ideaId');
const hashEl = $('#hash');
const tblBody = document.querySelector('#tbl tbody');

const storeKey = 'giap_local_registry_v1';

function loadRegistry() {
  try { return JSON.parse(localStorage.getItem(storeKey) || '[]'); }
  catch { return []; }
}
function saveRegistry(data) { localStorage.setItem(storeKey, JSON.stringify(data)); }

function toHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
function shortId(hex) { return hex.slice(0, 10); }

async function sha256(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return toHex(buf);
}

function renderTable() {
  const data = loadRegistry().sort((a,b)=> b.created - a.created);
  tblBody.innerHTML = '';
  for (const row of data) {
    const tr = document.createElement('tr');
    const preview = row.text.replace(/\s+/g,' ').slice(0, 60);
    tr.innerHTML = `
      <td class="mono">${row.id}</td>
      <td title="${row.text}">${preview}${row.text.length>60?'…':''}</td>
      <td>${new Date(row.created).toLocaleString()}</td>
      <td>
        <button data-id="${row.id}" class="btn-copy small">kopieren</button>
        <button data-id="${row.id}" class="btn-load small">laden</button>
        <button data-id="${row.id}" class="btn-del small">löschen</button>
      </td>`;
    tblBody.appendChild(tr);
  }
  tblBody.querySelectorAll('.btn-copy').forEach(b=>{
    b.onclick = ()=> navigator.clipboard.writeText(b.dataset.id);
  });
  tblBody.querySelectorAll('.btn-load').forEach(b=>{
    b.onclick = ()=>{
      const item = loadRegistry().find(x=>x.id===b.dataset.id);
      if (item){ ideaEl.value = item.text; tagsEl.value = (item.tags||[]).join(', '); showResult(item); }
    };
  });
  tblBody.querySelectorAll('.btn-del').forEach(b=>{
    b.onclick = ()=>{
      const data = loadRegistry().filter(x=>x.id!==b.dataset.id);
      saveRegistry(data); renderTable();
    };
  });
}

function makeIdeaID(ts, hash) {
  // Einfaches, lesbares Schema: giap:<YYYYMMDD>-<short-hash>
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2,'0');
  const day = String(d.getUTCDate()).padStart(2,'0');
  return `giap:${y}${m}${day}-${shortId(hash)}`;
}

function currentPermalink(id) {
  const u = new URL(window.location.href);
  u.searchParams.set('id', id);
  return u.toString();
}

function showResult(item) {
  ideaIdEl.value = item.id;
  hashEl.value = item.hash;
  resultBox.style.display = 'block';
}

$('#btn-churchen').onclick = async () => {
  const text = ideaEl.value.trim();
  if (!text) { alert('Bitte zuerst eine Idee eingeben.'); return; }
  const hash = await sha256(text);
  const created = Date.now();
  const id = makeIdeaID(created, hash);

  // Tags splitten
  const tags = (tagsEl.value || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const entry = { id, hash, text, tags, created };
  const data = loadRegistry();
  // Duplikate vermeiden (gleicher Hash)
  if (!data.some(x => x.hash === hash)) data.push(entry);
  saveRegistry(data);

  showResult(entry);
  renderTable();
  history.replaceState(null, '', currentPermalink(id)); // Permalink in URL setzen
};

$('#btn-clear').onclick = () => { ideaEl.value=''; };

$('#btn-copy').onclick = () => {
  const v = ideaIdEl.value;
  if (v) navigator.clipboard.writeText(v);
};
$('#btn-copy-url').onclick = () => {
  const url = currentPermalink(ideaIdEl.value);
  navigator.clipboard.writeText(url);
};

$('#btn-export').onclick = () => {
  const blob = new Blob([JSON.stringify(loadRegistry(), null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'giap_registry_export.json';
  a.click();
};

$('#file-import').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const imported = JSON.parse(text);
    if (!Array.isArray(imported)) throw new Error('Format');
    const existing = loadRegistry();
    const merged = [...existing];
    for (const item of imported) {
      if (!merged.some(x=>x.id===item.id)) merged.push(item);
    }
    saveRegistry(merged);
    renderTable();
    alert('Import erfolgreich.');
  } catch (err) {
    alert('Import fehlgeschlagen: ungültiges JSON.');
  }
};

// Beim Laden: falls ?id=… → hervorrufen (nur Anzeige)
(function initFromURL(){
  renderTable();
  const id = new URL(location.href).searchParams.get('id');
  if (!id) return;
  const item = loadRegistry().find(x=>x.id===id);
  if (item) {
    ideaEl.value = item.text;
    tagsEl.value = (item.tags||[]).join(', ');
    showResult(item);
  }
})();
