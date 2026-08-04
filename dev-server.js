// Yerel test sunucusu — siteyi ve /api/chat fonksiyonunu birlikte çalıştırır.
// Çalıştırmak için:  node --env-file=.env dev-server.js
// Sonra tarayıcıda:  http://localhost:3000
// (Vercel'de bu dosya kullanılmaz; orada api/chat.js otomatik olarak çalışır.)

const http = require('http');
const fs = require('fs');
const path = require('path');

const chatHandler = require('./api/chat.js');

const PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = http.createServer(async (req, res) => {
  // API isteği
  if (req.url === '/api/chat') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        req.body = {};
      }
      // Vercel'in res.status().json() arayüzünü taklit et
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (obj) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(obj));
      };
      chatHandler(req, res);
    });
    return;
  }

  // Statik dosyalar
  const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(__dirname, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));

  if (!filePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end('Bulunamadı');
      return;
    }
    res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream');
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Site hazır: http://localhost:${PORT}`);
});
