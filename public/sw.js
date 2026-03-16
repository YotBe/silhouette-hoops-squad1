const CACHE_VERSION = 'sg-v4';
const SHELL_CACHE   = `${CACHE_VERSION}-shell`;
const VIDEO_CACHE   = `${CACHE_VERSION}-video`;
const IMAGE_CACHE   = `${CACHE_VERSION}-image`;
const FONT_CACHE    = `${CACHE_VERSION}-font`;

// App shell — pre-cached on install (cache-first forever)
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon.svg',
];

// Local videos — pre-cached on install so they work offline
const VIDEO_ASSETS = [
  '/videos/curry.mp4',
  '/videos/kyrie.mp4',
  '/videos/lebron.mov',
  '/videos/durant.mov',
  '/videos/giannis.mp4',
  '/videos/harden.mp4',
  '/videos/sga.mp4',
  '/videos/deni.mp4',
];

// ── Install: pre-cache shell + videos ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_ASSETS)),
      caches.open(VIDEO_CACHE).then((c) =>
        Promise.allSettled(VIDEO_ASSETS.map((url) => c.add(url)))
      ),
    ])
  );
  self.skipWaiting();
});

// ── Activate: evict old caches ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const KEEP = new Set([SHELL_CACHE, VIDEO_CACHE, IMAGE_CACHE, FONT_CACHE]);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !KEEP.has(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch strategy ───────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin API calls (Supabase, Anthropic), chrome-ext
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;
  if (url.hostname.includes('supabase.co')) return;
  if (url.hostname.includes('anthropic.com')) return;

  // ── Local videos: cache-first (pre-cached on install) ───────────────────
  if (url.origin === self.location.origin && /\.(mp4|mov|webm)(\?|$)/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, VIDEO_CACHE));
    return;
  }

  // ── Google Fonts & other font files: cache-first ────────────────────────
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    /\.(woff2?|ttf|otf)(\?|$)/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // ── ESPN / CDN images: stale-while-revalidate ───────────────────────────
  if (
    url.hostname.includes('espncdn.com') ||
    url.hostname.includes('cdn.nba.com') ||
    /\.(png|jpg|jpeg|webp|svg|ico)(\?|$)/.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // ── JS / CSS / local assets: cache-first (Vite hashes = safe forever) ──
  if (/\.(js|css)(\?|$)/.test(url.pathname) && url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // ── HTML / navigation: network-first, fall back to app shell ────────────
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  // ── Everything else: network with cache fallback ─────────────────────────
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (e) {
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  // Always try to revalidate in background
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached ?? (await networkFetch) ?? new Response('Offline', { status: 503 });
}

async function networkFirstHTML(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? (await caches.match('/')) ?? new Response('Offline', { status: 503 });
  }
}
