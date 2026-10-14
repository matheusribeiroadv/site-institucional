// Prévia local do site — serve a pasta public/ como a Netlify serve em produção.
// Uso:  npm run preview          (ou: node tools/preview.js [porta])
// Sem dependências: só Node.js.
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'public');
const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

// Regras do public/_redirects (só as de caminho, ex.: "/avaliar  https://...  302").
// A regra de domínio (www -> sem www) não se aplica à prévia local.
function loadRedirects() {
  try {
    return fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8').split(/\r?\n/)
      .map(l => l.trim()).filter(l => l.startsWith('/'))
      .map(l => { const [from, to, status] = l.split(/\s+/); return { from, to, status: Number(status) || 301 }; });
  } catch (e) { return []; }
}

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  const rule = loadRedirects().find(r => r.from === p);
  if (rule && rule.status === 200) p = rule.to;                       // reescrita (ex.: /favicon.ico)
  else if (rule) { res.writeHead(rule.status, { Location: rule.to }); return res.end(); }

  let file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) {                                                         // igual à Netlify: página 404 própria
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      return fs.createReadStream(path.join(ROOT, '404.html')).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Prévia em http://localhost:${PORT}`);
  // endereço para abrir no celular (mesma rede Wi-Fi)
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.')) console.log(`No celular (mesma rede): http://${a.address}:${PORT}`);
    }
  }
  console.log('Para encerrar: Ctrl+C');
});
