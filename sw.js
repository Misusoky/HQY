/* 红墙引 · 离线缓存：首屏 HTML 走网络优先（保证 push 后能拿到新版），字体与图片走缓存优先。
   改了 assets 里的字体或图片，把 VERSION 加一：旧缓存会在下次激活时清掉，客户端随即换新。 */
const VERSION = 'hqy-5';
const ASSET_CACHE = VERSION + '·assets'; // 只有一本账：HTML、字体、图片、音频都存这里，VERSION 一加全部换新

/* 页面首次加载完会发 precache：这些是每次启动都要用到的，先存下，之后离线也能开 */
const ASSETS = [
  './index.html',
  './manifest.webmanifest',
  './assets/fonts/zhuque-fangsong-subset.woff2',
  './assets/cover.jpg',
  './assets/room.jpg',
  './assets/map.jpg',
  './assets/hall.jpg',
  './assets/icons/icon-32.png',
  './assets/icons/icon-180.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'precache') return;
  e.waitUntil((async () => {
    const c = await caches.open(ASSET_CACHE);
    await Promise.all(ASSETS.map(async u => {
      try { if (!(await c.match(u))) await c.add(u); } catch (err) {} // 单件失败不拖累其余
    }));
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 模型接口等跨域请求一律放行，不掺和
  if (req.mode === 'navigate') { e.respondWith(navigate(req)); return; }
  e.respondWith(asset(req));
});

async function navigate(req) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match('./index.html');
  try {
    const res = await withTimeout(fetch(req), 5000);
    if (res && res.ok) cache.put('./index.html', res.clone()); // 每次联网成功都刷新离线副本（与 precache 同一本账，不会留旧版）
    return res;
  } catch (err) {
    if (cached) return cached;
    return new Response('离线状态，且页面尚未缓存：请连网打开一次。', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function asset(req) {
  const cache = await caches.open(ASSET_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.status === 200 && res.type === 'basic') { // 206 分段响应（音频 Range）不能进 Cache
      cache.put(req, res.clone()).catch(() => {}); // 头像、住处、BGM 用过一次就留底
    }
    return res;
  } catch (err) {
    return new Response('', { status: 504 });
  }
}

function withTimeout(p, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, err => { clearTimeout(t); reject(err); });
  });
}
