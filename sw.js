// Stale-while-revalidate: abre rápido do cache e se atualiza sozinho em segundo plano.
const V = 'qualleva-v2';
const ARQ = [
    './',
    'index.html',
    'style.css',
    'script.js',
    'manifest.webmanifest',
    'icons/i192.png',
    'icons/i512.png'
];

self.addEventListener('install', e =>
    e.waitUntil(caches.open(V).then(c => c.addAll(ARQ)).then(() => self.skipWaiting())));

self.addEventListener('activate', e =>
    e.waitUntil(
        caches.keys()
            .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    )
);

self.addEventListener('fetch', e => {
    const r = e.request;

    if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;

    e.respondWith(caches.open(V).then(async c => {
        const hit = await c.match(r, { ignoreSearch: true });
        const rede = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => hit);
        return hit || rede;
    }));
});