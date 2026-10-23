// Assembles src/pages/**/*.html with src/partials includes and i18n strings into dist/.
// Usage: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const PAGES = path.join(SRC, 'pages');
const DIST = path.join(ROOT, 'dist');
const I18N = JSON.parse(fs.readFileSync(path.join(SRC, 'i18n.json'), 'utf8'));

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), { recursive: true });
const PUBLIC = path.join(SRC, 'public');
if (fs.existsSync(PUBLIC)) fs.cpSync(PUBLIC, DIST, { recursive: true }); // robots.txt, llms.txt, humans.txt, LICENSE.txt at the site root

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
  });
}

// <!-- @include partials/x.html key=value key2=value2 --> ; params replace {{key}} inside that include only
function expandIncludes(html, seen = new Set()) {
  return html.replace(/<!--\s*@include\s+(\S+)([^>]*?)-->/g, (_, rel, params) => {
    const file = path.join(SRC, rel);
    if (seen.has(file)) throw new Error(`Circular include: ${rel}`);
    const next = new Set(seen).add(file);
    let inc = fs.readFileSync(file, 'utf8');
    for (const [, k, v] of params.matchAll(/([\w-]+)=("[^"]*"|\S+)/g)) inc = inc.replaceAll(`{{${k}}}`, v.replace(/^"|"$/g, ''));
    return expandIncludes(inc, next);
  });
}

const warnings = [];
for (const file of walk(PAGES)) {
  const rel = path.relative(PAGES, file);
  const depth = rel.split(path.sep).length - 1;
  const vars = { root: '../'.repeat(depth), lang: 'lv', alt: '', altlang: 'ru', page: '', head: '', n: '', theme: 'dark', theme_color: '', shop: '', shop_label: '', shop_aria: '' };
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<!--\s*@meta\s+([\w-]+)\s*:\s*([\s\S]*?)\s*-->\n?/g, (_, k, v) => {
    vars[k] = v.trim().replaceAll('{{root}}', vars.root);
    return '';
  });
  html = expandIncludes(html);
  const t = I18N[vars.lang] || I18N.lv;
  vars.theme_color ||= vars.theme === 'light' ? '#F4F6F8' : '#070A0D';
  vars.shop ||= vars.root + 'shop/index.html';
  vars.shop_label ||= t.shop;
  vars.shop_aria ||= t.shop_aria;
  html = html.replace(/\{\{t:([\w.-]+)\}\}/g, (_, k) => {
    if (!(k in t)) warnings.push(`${rel}: missing string ${k} (${vars.lang})`);
    return t[k] ?? I18N.lv[k] ?? k;
  });
  html = html.replace(/\{\{([\w-]+)\}\}/g, (_, k) => {
    if (!(k in vars)) warnings.push(`${rel}: missing var ${k}`);
    return vars[k] ?? '';
  });
  const out = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log('built', rel);
}
if (warnings.length) {
  console.warn('\nWarnings:\n' + warnings.join('\n'));
  process.exitCode = 1;
}
