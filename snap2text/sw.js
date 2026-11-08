/* 截圖轉文字：離線快取，以及接收 Android「分享」進來的圖片 */
var SHELL_CACHE = 'snap2text-shell-v1';
var CDN_CACHE = 'snap2text-cdn-v1';
var SHARED_CACHE = 'snap2text-shared';
var SHELL = ['./', './index.html', './app.js', './stitch.js', './textproc.js',
             './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL_CACHE).then(function (c) { return c.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  var keep = [SHELL_CACHE, CDN_CACHE, SHARED_CACHE];
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return keep.indexOf(k) < 0; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method === 'POST' && url.pathname.endsWith('/share-target')) {
    e.respondWith(receiveShare(req));
    return;
  }
  if (req.method !== 'GET') return;
  if (url.hostname === 'cdn.jsdelivr.net') {
    // 函式庫網址有固定版本號：先用快取，沒有才下載
    e.respondWith(caches.open(CDN_CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          if (res.ok) c.put(req, res.clone());
          return res;
        });
      });
    }));
    return;
  }
  if (url.origin === location.origin) {
    // 自己的檔案：有網路就拿最新版，離線時用快取
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok) {
        var copy = res.clone();
        caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true });
    }));
  }
});

// 把分享進來的圖片暫存起來，再轉到首頁讀取
async function receiveShare(req) {
  var form = await req.formData();
  var files = form.getAll('images').filter(function (f) { return f && f.size; });
  var cache = await caches.open(SHARED_CACHE);
  var old = await cache.keys();
  await Promise.all(old.map(function (k) { return cache.delete(k); }));
  await Promise.all(files.map(function (f, i) {
    return cache.put('./shared/' + i, new Response(f, { headers: {
      'content-type': f.type || 'image/png',
      'x-name': encodeURIComponent(f.name || ('shared-' + i + '.png')),
      'x-modified': String(f.lastModified || Date.now())
    } }));
  }));
  return Response.redirect('./?shared=' + files.length, 303);
}
