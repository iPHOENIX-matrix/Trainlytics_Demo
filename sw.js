const CACHE_NAME = "trainlytics-v5"; // bump version

const urlsToCache = [
  "/",
  "/index.html",
  "/calendar.html",
  "/progress.html",
  "/settings.html",
  "/workout.html",
  "/workout-plan.html",
  "/style.css",
  "/js/storage.js",
  "/js/prEngine.js",
  "/js/calendar.js",
  "/js/workout.js",
  "/js/workoutPlan.js",
  "/js/progress.js",
  "/js/settings.js",
  "/js/utils.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
