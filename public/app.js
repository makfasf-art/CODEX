(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const H = window.NCXHighlight;
const KEY = { projects: 'ncx.projects.v1', current: 'ncx.current.v1', api: 'ncx.apiBase.v1' };
const native = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const wide = window.matchMedia('(min-width:1000px)');

/* ---------- state ---------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
let projects = load(KEY.projects, []);
let project = projects.find((p) => p.id === localStorage.getItem(KEY.current)) || projects[0] || null;
if (!project) { project = newProject(); projects.push(project); }
let active = project.files[0]?.name || null;
let mode = project.files.length ? 'extend' : 'create';
let busy = false, ctl = null, status = null, retryTimer = null, raf = 0, saveT = 0;

function newProject() { return { id: uid(), name: '', files: [], messages: [], updated: Date.now() }; }
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    project.updated = Date.now();
    try {
      localStorage.setItem(KEY.projects, JSON.stringify(projects));
      localStorage.setItem(KEY.current, project.id);
    } catch { toast('Penyimpanan lokal penuh. Hapus project lama.'); }
  }, 250);
}
const apiBase = () => (localStorage.getItem(KEY.api) || window.NCX_API_BASE || '').trim().replace(/\/+$/, '');
const file = (n) => project.files.find((f) => f.name === n);

/* ---------- parsing respons AI ---------- */
const VALID = /^(?:[\w.\-]+\/)*[\w.\-]+$/;
function parse(text) {
  const parts = [], files = [];
  let buf = [], cur = null;
  const flush = () => { if (buf.length) { const t = buf.join('\n').trim(); if (t) parts.push({ t: 'text', text: t }); buf = []; } };
  const close = (complete) => {
    const code = cur.lines.join('\n');
    if (cur.name) { files.push({ name: cur.name, content: code + (complete && code ? '\n' : ''), done: complete }); parts.push({ t: 'file', name: cur.name, lines: cur.lines.length, done: complete }); }
    else parts.push({ t: 'snippet', lang: cur.lang, code });
    cur = null;
  };
  for (const line of text.split('\n')) {
    if (!cur) {
      const m = line.match(/^\s*`{3,}\s*([^\s`]*)\s*(.*)$/);
      if (m) {
        flush();
        const tt = m[2].match(/title\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/);
        let name = tt ? (tt[1] || tt[2] || tt[3] || '') : '';
        if (!name && VALID.test(m[2].trim()) && /\./.test(m[2])) name = m[2].trim();
        name = name.replace(/^\.?\/+/, '');
        if (!VALID.test(name) || name.split('/').includes('..')) name = '';
        cur = { lang: m[1], name, lines: [] };
      } else buf.push(line);
    } else if (/^\s*`{3,}\s*$/.test(line)) close(true);
    else cur.lines.push(line);
  }
  if (cur) close(false); else flush();
  return { parts, files };
}
const compact = (c) => parse(c).parts.map((p) => p.t === 'text' ? p.text : p.t === 'file' ? `[file ${p.name} disimpan di project]` : '```' + p.lang + '\n' + p.code + '\n```').join('\n');

/* ---------- render ---------- */
const el = {
  msgs: $('#messages'), prompt: $('#prompt'), send: $('#btnSend'), status: $('#status'), name: $('#projName'),
  tabs: $('#fileTabs'), code: $('#code'), hl: $('#hl'), empty: $('#codeEmpty'), info: $('#fileInfo'),
  banner: $('#banner'), err: $('#errorBox'), main: $('#main'), prev: $('#preview'),
};
const esc = H.esc;
const inline = (s) => esc(s).replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');

function renderMessages() {
  if (!project.messages.length) {
    el.msgs.innerHTML = '<div class="hello"><h2>Mau bikin apa?</h2><p>Jelaskan project-mu. AI menulis kodenya langsung dari instruksi.</p>' +
      ['Buat landing page toko kopi dengan HTML, CSS, dan JavaScript', 'Tulis skrip Python untuk mengganti nama banyak file sekaligus', 'Buat program kalkulator sederhana dengan C++']
        .map((t) => `<button class="btn" data-ex="${esc(t)}">${esc(t)}</button>`).join('') + '</div>';
    return;
  }
  const near = el.msgs.scrollHeight - el.msgs.scrollTop - el.msgs.clientHeight < 80;
  el.msgs.innerHTML = project.messages.map((m, i) => {
    if (m.role === 'user') return `<div class="msg user">${esc(m.content)}</div>`;
    const live = busy && i === project.messages.length - 1;
    const body = parse(m.content).parts.map((p) =>
      p.t === 'text' ? `<p>${inline(p.text)}</p>`
      : p.t === 'file' ? `<button class="fileref" data-open="${esc(p.name)}">${esc(p.name)} <span>${p.lines} baris${p.done ? '' : ' …'}</span></button>`
      : `<pre><code>${H.highlight(p.code, 'x.' + (p.lang || 'txt'))}</code></pre>`).join('');
    return `<div class="msg ai">${body}${live && !m.content ? '<span class="dots">Memproses</span>' : ''}${m.cut ? '<p><em>Output terpotong oleh batas token. Minta “lanjutkan”.</em></p>' : ''}</div>`;
  }).join('');
  if (near || busy) el.msgs.scrollTop = el.msgs.scrollHeight;
}
function renderTabs() {
  el.tabs.innerHTML = project.files.map((f) => `<button role="tab" class="${f.name === active ? 'on' : ''}" data-tab="${esc(f.name)}">${esc(f.name)}</button>`).join('');
}
function paint() {
  const f = file(active);
  el.hl.firstElementChild.innerHTML = H.highlight(el.code.value, active || '') + '\n';
  el.info.textContent = f ? `${el.code.value.split('\n').length} baris · ${el.code.value.length} karakter` : '';
}
function renderEditor() {
  const f = file(active);
  el.code.value = f ? f.content : '';
  el.code.disabled = !f || busy;
  el.empty.hidden = !!f;
  paint();
}
function renderAll() {
  el.name.value = project.name;
  renderTabs(); renderEditor(); renderMessages(); renderModes(); setStatus(status);
  el.send.textContent = busy ? 'Stop' : 'Kirim';
}
function schedule() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; renderMessages(); renderTabs(); if (busy) { const f = file(active); if (f && el.code.value !== f.content) { el.code.value = f.content; paint(); el.code.scrollTop = el.code.scrollHeight; el.hl.scrollTop = el.code.scrollTop; } } }); }
function renderModes() { document.querySelectorAll('#modes .chip').forEach((c) => { const on = c.dataset.mode === mode; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); }); }
function setStatus(s) { status = s; el.status.textContent = s || (srv.model ? `Model: ${srv.model} · batas ${srv.rate}/menit` : ''); }
let toastT; function toast(t) { const e = $('#toast'); e.textContent = t; e.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (e.hidden = true), 2200); }

/* ---------- editor ---------- */
el.code.addEventListener('input', () => { const f = file(active); if (f) { f.content = el.code.value; paint(); save(); } });
el.code.addEventListener('scroll', () => { el.hl.scrollTop = el.code.scrollTop; el.hl.scrollLeft = el.code.scrollLeft; });
el.code.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') { e.preventDefault(); const { selectionStart: s, selectionEnd: n } = el.code; el.code.setRangeText('  ', s, n, 'end'); el.code.dispatchEvent(new Event('input')); }
});
el.tabs.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { active = b.dataset.tab; renderTabs(); renderEditor(); } });
$('#btnAddFile').onclick = () => {
  const n = (prompt('Nama file (mis. main.py atau src/app.js):') || '').trim().replace(/^\.?\/+/, '');
  if (!n) return;
  if (!VALID.test(n) || n.split('/').includes('..')) return toast('Nama file tidak valid');
  if (!file(n)) project.files.push({ name: n, content: '' });
  active = n; save(); renderTabs(); renderEditor(); if (!wide.matches) pane('code');
};
$('#btnDelFile').onclick = () => {
  if (!active || !confirm(`Hapus ${active}?`)) return;
  project.files = project.files.filter((f) => f.name !== active);
  active = project.files[0]?.name || null; save(); renderTabs(); renderEditor();
};

/* ---------- unduh / salin ---------- */
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = -1; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function zip(files) {
  const enc = new TextEncoder(), out = [], cen = []; let off = 0;
  for (const f of files) {
    const nm = enc.encode(f.name), d = enc.encode(f.content), crc = crc32(d);
    const l = new DataView(new ArrayBuffer(30));
    l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x0800, true); l.setUint16(12, 33, true);
    l.setUint32(14, crc, true); l.setUint32(18, d.length, true); l.setUint32(22, d.length, true); l.setUint16(26, nm.length, true);
    out.push(new Uint8Array(l.buffer), nm, d);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(14, 33, true);
    c.setUint32(16, crc, true); c.setUint32(20, d.length, true); c.setUint32(24, d.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    cen.push(new Uint8Array(c.buffer), nm);
    off += 30 + nm.length + d.length;
  }
  const size = cen.reduce((a, b) => a + b.length, 0);
  const e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
  const all = [...out, ...cen, new Uint8Array(e.buffer)];
  const res = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let p = 0;
  for (const a of all) { res.set(a, p); p += a.length; }
  return res;
}
const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
async function saveAs(name, bytes, mime) {
  const P = window.Capacitor && window.Capacitor.Plugins;
  if (native && P && P.Filesystem && P.Share) {
    const r = await P.Filesystem.writeFile({ path: name.split('/').pop(), data: b64(bytes), directory: 'CACHE' });
    await P.Share.share({ title: name, url: r.uri, dialogTitle: 'Simpan atau bagikan' });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([bytes], { type: mime })); a.download = name.split('/').pop();
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
$('#btnDownload').onclick = async () => {
  try {
    if (project.files.length > 1) await saveAs(`${(project.name || 'project').replace(/[^\w.-]+/g, '_')}.zip`, zip(project.files), 'application/zip');
    else if (project.files[0]) await saveAs(project.files[0].name, new TextEncoder().encode(project.files[0].content), 'text/plain');
    else toast('Belum ada file');
  } catch (e) { toast('Gagal menyimpan: ' + (e.message || e)); }
};
$('#btnCopy').onclick = async () => {
  if (!file(active)) return toast('Belum ada file');
  try { await navigator.clipboard.writeText(el.code.value); }
  catch { el.code.disabled = false; el.code.select(); document.execCommand('copy'); }
  toast('Kode disalin');
};

/* ---------- preview ---------- */
function previewHtml() {
  const find = (p) => { p = p.replace(/^\.?\/+/, '').split(/[?#]/)[0]; return project.files.find((f) => f.name === p || f.name.endsWith('/' + p)); };
  const pg = [(f) => f.name === active && /\.(html?|svg)$/i.test(f.name), (f) => /(^|\/)index\.html?$/i.test(f.name), (f) => /\.html?$/i.test(f.name), (f) => /\.svg$/i.test(f.name)]
    .map((t) => project.files.find(t)).find(Boolean);
  if (!pg) return null;
  if (/\.svg$/i.test(pg.name)) return `<!doctype html><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#fff">${pg.content}</body>`;
  return pg.content
    .replace(/<link\b[^>]*>/gi, (m) => { const h = m.match(/href=["']([^"']+)["']/i); const f = h && /stylesheet/i.test(m) && find(h[1]); return f ? `<style>${f.content}</style>` : m; })
    .replace(/<script\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi, (m, a, s, b) => { const f = find(s); return f ? `<script${a}${b}>${f.content.replace(/<\/script/gi, '<\\/script')}</script>` : m; });
}
function refreshPreview() {
  const h = previewHtml();
  $('#previewEmpty').hidden = !!h; el.prev.hidden = !h;
  $('#previewInfo').textContent = h ? 'Preview langsung' : 'Preview';
  el.prev.srcdoc = h || '';
}
$('#btnReload').onclick = refreshPreview;

/* ---------- navigasi ---------- */
function pane(p) {
  el.main.dataset.pane = p;
  document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.pane === p));
  if (p === 'preview') refreshPreview();
  if (p === 'code') renderEditor();
}
$('#tabbar').onclick = (e) => { const b = e.target.closest('[data-pane]'); if (b) pane(b.dataset.pane); };
$('#modes').onclick = (e) => { const c = e.target.closest('[data-mode]'); if (c) { mode = c.dataset.mode; renderModes(); } };
el.msgs.addEventListener('click', (e) => {
  const o = e.target.closest('[data-open]'); const x = e.target.closest('[data-ex]');
  if (o) { active = o.dataset.open; renderTabs(); renderEditor(); if (!wide.matches) pane('code'); }
  if (x) { el.prompt.value = x.dataset.ex; el.prompt.focus(); autosize(); }
});
const autosize = () => { el.prompt.style.height = 'auto'; el.prompt.style.height = Math.min(el.prompt.scrollHeight, 150) + 'px'; };
el.prompt.addEventListener('input', autosize);
el.prompt.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onSend(); } });
el.name.addEventListener('input', () => { project.name = el.name.value; save(); });

/* ---------- server & error ---------- */
const srv = { model: null, rate: 0, ok: false };
async function checkServer() {
  try {
    const r = await fetch(apiBase() + '/api/status', { cache: 'no-store' });
    const j = await r.json();
    srv.ok = true; srv.model = j.model; srv.rate = j.rateLimitPerMin;
    if (!j.configured) {
      showBanner(`<strong>Backend belum dikonfigurasi</strong> (kurang: ${j.missing.map((m) => `<code>${esc(m)}</code>`).join(', ')}).<ol>${j.setup.map((s) => `<li>${esc(s)}</li>`).join('')}</ol><button class="btn small" id="bnRecheck">Cek ulang</button>`);
    } else el.banner.hidden = true;
  } catch {
    srv.ok = false;
    showBanner(`<strong>Server tidak terjangkau</strong> di <code>${esc(apiBase() || location.origin)}</code>. Jalankan <code>npm start</code> atau atur alamat server.<div class="row" style="margin-top:8px"><button class="btn small" id="bnRecheck">Cek ulang</button><button class="btn small" id="bnSettings">Pengaturan</button></div>`);
  }
  setStatus(status);
}
function showBanner(h) { el.banner.innerHTML = h; el.banner.hidden = false; }
el.banner.addEventListener('click', (e) => { if (e.target.id === 'bnRecheck') checkServer(); if (e.target.id === 'bnSettings') openSettings(); });

function showError(err) {
  clearInterval(retryTimer);
  $('#errorMsg').textContent = err.message;
  $('#btnErrSettings').hidden = !['NETWORK', 'HTTP'].includes(err.code);
  const rb = $('#btnRetry'); el.err.hidden = false;
  const fatal = ['NO_API_KEY', 'AUTH', 'MODEL', 'QUOTA'].includes(err.code);
  let left = Number(err.retryAfter) || 0;
  const tick = () => { rb.disabled = left > 0; rb.textContent = left > 0 ? `Coba lagi (${left}d)` : 'Coba lagi'; };
  tick();
  if (left > 0) retryTimer = setInterval(() => { left--; tick(); if (left <= 0) clearInterval(retryTimer); }, 1000);
  if (fatal) { rb.textContent = 'Coba lagi'; }
}
const hideError = () => { clearInterval(retryTimer); el.err.hidden = true; };
$('#btnRetry').onclick = () => { if (!busy) generate(); };
$('#btnErrSettings').onclick = openSettings;

/* ---------- generate (streaming) ---------- */
function onSend() {
  if (busy) { ctl && ctl.abort(); return; }
  const text = el.prompt.value.trim();
  if (!text) return;
  project.messages.push({ role: 'user', content: text });
  if (!project.name) project.name = text.slice(0, 40);
  el.prompt.value = ''; autosize(); save();
  generate();
}
el.send.onclick = onSend;

function applyFiles(text) {
  for (const f of parse(text).files) {
    const ex = file(f.name);
    if (ex) ex.content = f.content; else project.files.push({ name: f.name, content: f.content });
    active = f.name;
  }
}
async function generate() {
  hideError();
  const msgs = project.messages;
  while (msgs.length && msgs[msgs.length - 1].role === 'assistant') {
    if (msgs[msgs.length - 1].content && !msgs[msgs.length - 1].failed) break;
    msgs.pop();
  }
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return;
  const idx = msgs.length - 1;
  const body = {
    mode, prompt: msgs[idx].content,
    files: project.files.map((f) => ({ name: f.name, content: f.content })),
    history: msgs.slice(0, idx).filter((m) => m.content).map((m) => ({ role: m.role, content: m.role === 'assistant' ? compact(m.content) : m.content })),
  };
  const ai = { role: 'assistant', content: '' };
  msgs.push(ai);
  busy = true; ctl = new AbortController(); el.send.textContent = 'Stop'; el.code.disabled = true;
  setStatus('Menghubungi model…'); renderMessages();
  try {
    let res;
    try {
      res = await fetch(apiBase() + '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      throw { code: 'NETWORK', message: `Tidak bisa terhubung ke server (${apiBase() || location.origin}). Periksa koneksi atau alamat server di Pengaturan.` };
    }
    const rem = res.headers.get('ratelimit-remaining');
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      throw j && j.error ? j.error : { code: 'HTTP', message: `Server membalas ${res.status}. Periksa alamat server di Pengaturan.` };
    }
    const rd = res.body.getReader(), dec = new TextDecoder(); let buf = '', first = true;
    for (;;) {
      const { done, value } = await rd.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
        if (!line.startsWith('data:')) continue;
        const ev = JSON.parse(line.slice(5));
        if (ev.error) throw ev.error;
        if (ev.delta) { if (first) { first = false; setStatus('Menulis kode…'); } ai.content += ev.delta; applyFiles(ai.content); schedule(); }
        if (ev.done) {
          if (ev.finish === 'length') ai.cut = true;
          const u = ev.usage; setStatus(u ? `Selesai · token ${u.prompt_tokens} masuk / ${u.completion_tokens} keluar${rem ? ` · sisa ${rem} permintaan/menit` : ''}` : 'Selesai');
        }
      }
    }
    if (project.files.length && mode === 'create') mode = 'extend';
  } catch (e) {
    if (e && e.name === 'AbortError') { setStatus('Dihentikan'); }
    else { ai.failed = true; setStatus('Gagal'); showError(e && e.message ? e : { code: 'SERVER', message: 'Terjadi kesalahan tak terduga.' }); }
  } finally {
    if (!ai.content) msgs.splice(msgs.indexOf(ai), 1);
    busy = false; ctl = null; el.send.textContent = 'Kirim';
    save(); renderAll(); refreshPreview();
  }
}

/* ---------- project & pengaturan ---------- */
function openProjects() {
  $('#projectList').innerHTML = [...projects].sort((a, b) => b.updated - a.updated).map((p) =>
    `<div class="pitem"><button class="open ${p.id === project.id ? 'cur' : ''}" data-id="${p.id}">${esc(p.name || 'Project baru')}<small>${p.files.length} file · ${new Date(p.updated).toLocaleString('id-ID')}</small></button><button class="btn small" data-del="${p.id}" aria-label="Hapus">Hapus</button></div>`).join('');
  $('#dlgProjects').showModal();
}
function switchTo(p) {
  project = p; active = p.files[0]?.name || null; mode = p.files.length ? 'extend' : 'create';
  hideError(); status = null; save(); renderAll(); refreshPreview();
}
$('#btnProjects').onclick = openProjects;
$('#btnNewProject').onclick = () => { if (busy) return toast('Tunggu respons selesai'); const p = newProject(); projects.push(p); $('#dlgProjects').close(); switchTo(p); };
$('#projectList').onclick = (e) => {
  if (busy) return toast('Tunggu respons selesai');
  const o = e.target.closest('[data-id]'), d = e.target.closest('[data-del]');
  if (o) { $('#dlgProjects').close(); switchTo(projects.find((p) => p.id === o.dataset.id)); }
  if (d && confirm('Hapus project ini?')) {
    projects = projects.filter((p) => p.id !== d.dataset.del);
    if (!projects.length) projects.push(newProject());
    if (project.id === d.dataset.del) { $('#dlgProjects').close(); switchTo(projects[0]); } else { save(); openProjects(); }
  }
};
function openSettings() { $('#apiBase').value = localStorage.getItem(KEY.api) || ''; $('#testResult').textContent = ''; $('#dlgSettings').showModal(); }
$('#btnSettings').onclick = openSettings;
$('#btnSaveSettings').onclick = () => {
  const v = $('#apiBase').value.trim();
  if (v) localStorage.setItem(KEY.api, v); else localStorage.removeItem(KEY.api);
  $('#dlgSettings').close(); checkServer();
};
$('#btnTest').onclick = async () => {
  const base = $('#apiBase').value.trim().replace(/\/+$/, '') || window.NCX_API_BASE || '';
  $('#testResult').textContent = 'Menguji…';
  try {
    const j = await (await fetch(base + '/api/status', { cache: 'no-store' })).json();
    $('#testResult').textContent = j.configured ? `Terhubung. Model: ${j.model}` : `Terhubung, tapi backend belum lengkap: ${j.missing.join(', ')}`;
  } catch { $('#testResult').textContent = 'Gagal terhubung. Periksa alamat dan pastikan server berjalan.'; }
};
document.querySelectorAll('[data-close]').forEach((b) => (b.onclick = () => b.closest('dialog').close()));

/* ---------- init ---------- */
renderAll(); refreshPreview(); checkServer();
if (native && !apiBase()) openSettings();
})();
