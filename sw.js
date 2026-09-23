/* Il guardiano offline: tiene una copia dell'app e la serve anche senza rete. */
const VERSIONE = "coach-v2";
const ROBA = ["./", "./index.html", "./manifest.webmanifest",
              "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(ROBA)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== VERSIONE).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const url = new URL(r.url);
  if (url.origin !== location.origin) return;   // le chiamate a internet passano dirette

  if (r.mode === "navigate"){
    // la pagina: sempre dalla rete saltando ogni copia vecchia, poi la copia di scorta
    e.respondWith(
      fetch("./index.html", { cache: "reload" }).then(risposta => {
        const copia = risposta.clone();
        caches.open(VERSIONE).then(c => c.put("./index.html", copia));
        return risposta;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  e.respondWith(
    caches.match(r).then(trovato => trovato || fetch(r).then(risposta => {
      const copia = risposta.clone();
      caches.open(VERSIONE).then(c => c.put(r, copia));
      return risposta;
    }).catch(() => trovato))
  );
});
