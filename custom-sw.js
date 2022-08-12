// urlB64ToUint8Array is a magic function that will encode the base64 public key
// to Array buffer which is needed by the subscription option
const urlsToCache = ["index.html", "offline.html"]

const urlB64ToUint8Array = base64String => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    // opening the caches
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")

      return cache.addAll(urlsToCache)
    })
  )
})

// Listen for requests
self.addEventListener("fetch", (event) => {
  event.respondWith(
    // We match all the request that our page is saving
    caches.match(event.request).then(() => {
      return fetch(event.request).catch(() => caches.match("offline.html"))
    })
  )
})

// saveSubscription saves the subscription to the backend
const saveSubscription = async subscription => {
  const SERVER_URL = 'https://us-central1-driver-app-poc.cloudfunctions.net/app/save-subscription'
  const response = await fetch(SERVER_URL, {
      method: 'post',
      headers: {
      'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
  })
  return response.json()
}

self.addEventListener('activate', async () => {
  // This will be called only once when the service worker is activated.
  try {
      const applicationServerKey = urlB64ToUint8Array(
          'BOXauoK2B2R1t4jUv52gc4s_-koe1TcjaA6tZbE_SjCSe9skKU0SQP77pTZkC0WTHeHK75lIKKbluxJ52YVu5as'
      )
      const options = { applicationServerKey, userVisibleOnly: true }
      const subscription = await self.registration.pushManager.subscribe(options)
      const response = await saveSubscription(subscription)
      console.log(response)
  } catch (err) {
      console.log('Error', err)
  }
});

self.addEventListener('push', function(event) {
  if (event.data) {
      console.log('Push event!', event.data.text());

      showLocalNotification("You have a new ride!", event.data.text(), self.registration);
  } else {
      console.log('Push event but no data');
  }
});

const showLocalNotification = (title, body, swRegistration) => {
  const options = {
      body,
      // here you can add more properties like icon, image, vibrate, etc.
  }
  swRegistration.showNotification(title, options);
}

self.addEventListener('notificationclick', function(e) {
  event.notification.close();
  clients.openWindow("https://driver-app-pwa-dev.netlify.app/");
});