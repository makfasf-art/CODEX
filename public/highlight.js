/* Syntax highlighter ringan, tanpa dependensi (bekerja offline di APK). */
(function () {
  const KW = new Set(
    (
      'abstract as async await break case catch class const constructor continue def default defer del delete do elif else enum except ' +
      'export extends extern false final finally fn for foreach from func function go goto if impl implements import in include init interface ' +
      'is lambda let match mod module namespace new nil none None not null of or override package pass private protected pub public raise ' +
      'readonly require return self static struct super switch template this throw throws trait true True False try type typedef typeof union ' +
      'unsafe use using val var virtual void volatile where while with yield int float double char bool boolean string long short byte ' +
      'auto unsigned signed String Integer Object Array Map List Set'
    ).split(/\s+/)
  );
  const HASH = new Set(['py', 'sh', 'bash', 'zsh', 'rb', 'yml', 'yaml', 'toml', 'r', 'pl', 'ps1', 'dockerfile', 'env', 'ini']);
  const MARKUP = new Set(['html', 'htm', 'xml', 'svg', 'vue']);
  const CSS = new Set(['css', 'scss', 'less']);

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const span = (c, s) => `<span class="tk-${c}">${esc(s)}</span>`;

  function ext(name) {
    const base = String(name || '').split('/').pop().toLowerCase();
    if (base === 'dockerfile') return 'dockerfile';
    const i = base.lastIndexOf('.');
    return i >= 0 ? base.slice(i + 1) : base;
  }

  function build(kind) {
    const parts = [];
    // 1 komentar
    const cm = ['\\/\\*[\\s\\S]*?(?:\\*\\/|$)'];
    if (kind === 'markup') cm.push('<!--[\\s\\S]*?(?:-->|$)');
    if (kind === 'hash') cm.push('#[^\\n]*');
    else if (kind !== 'css' || true) cm.push('\\/\\/[^\\n]*');
    parts.push('(' + cm.join('|') + ')');
    // 2 string
    parts.push('("""[\\s\\S]*?(?:"""|$)|\'\'\'[\\s\\S]*?(?:\'\'\'|$)|"(?:\\\\.|[^"\\\\\\n])*"?|\'(?:\\\\.|[^\'\\\\\\n])*\'?|`(?:\\\\.|[^`\\\\])*`?)');
    // 3 angka
    parts.push('(\\b\\d+(?:\\.\\d+)?\\b)');
    // 4 tag markup
    parts.push('(<\\/?[A-Za-z][\\w:-]*)');
    // 5 identifier
    parts.push('([A-Za-z_$][\\w$-]*)');
    return new RegExp(parts.join('|'), 'g');
  }

  const cache = {};

  function highlight(code, filename) {
    const e = ext(filename);
    const kind = MARKUP.has(e) ? 'markup' : CSS.has(e) ? 'css' : HASH.has(e) ? 'hash' : 'code';
    const re = cache[kind] || (cache[kind] = build(kind));
    re.lastIndex = 0;
    let out = '';
    let last = 0;
    let m;
    while ((m = re.exec(code))) {
      if (m.index > last) out += esc(code.slice(last, m.index));
      const [tok, cmt, str, num, tag, id] = m;
      if (cmt) out += span('c', tok);
      else if (str) out += span('s', tok);
      else if (num) out += kind === 'markup' ? esc(tok) : span('n', tok);
      else if (tag) out += span('t', tok);
      else if (id) {
        const rest = code.slice(re.lastIndex, re.lastIndex + 40);
        const next = rest.match(/^\s*(.)/);
        const nc = next ? next[1] : '';
        if (kind === 'markup') out += nc === '=' ? span('a', tok) : esc(tok);
        else if (kind === 'css') out += nc === ':' && !/^\s*::?/.test(rest) ? span('a', tok) : esc(tok);
        else if (KW.has(tok)) out += span('k', tok);
        else if (nc === '(') out += span('f', tok);
        else out += esc(tok);
      } else out += esc(tok);
      last = re.lastIndex;
      if (tok.length === 0) re.lastIndex++;
    }
    if (last < code.length) out += esc(code.slice(last));
    return out;
  }

  window.NCXHighlight = { highlight, esc, ext };
})();
