/* sw.js — Sổ tay Luật Y tế: network-first (bản mới khi có mạng), cache khi ngoại tuyến */
const V = "lyt-v24";
const CORE = [
  "./", "index.html", "clinic.html", "site.css", "tokens.css", "base.css", "js/hospital.js", "tin_luat.html", "tham_chieu.html", "ly_thuyet.html", "404.html",
  "manifest.json", "icon.svg",
  "js/search.js", "js/avatar.js",
  "data/laws.json", "data/quiz.json", "data/tf.json", "data/factpairs.json",
  "data/quiz_his.json", "data/quiz_lythuyet.json", "data/quiz_nentang.json",
  "data/khoa_phong.json", "data/ly_thuyet.json", "data/tra_loi_nhanh.json", "data/tin_luat.json", "data/tham-chieu.json"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(r => {
      const cp = r.clone();
      caches.open(V).then(c => c.put(e.request, cp));
      return r;
    }).catch(() => caches.match(e.request).then(h => h || caches.match("./")))
  );
});
