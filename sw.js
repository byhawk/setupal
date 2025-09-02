const CACHE_NAME = 'liste-kontrol-v1.2.0';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';

const STATIC_FILES = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

const FALLBACK_PAGE = './offline.html';

// Install Event
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Cache installation failed:', error);
            })
    );
});

// Activate Event
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});

// Fetch Event
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other protocols
    if (!url.protocol.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Don't cache external APIs or large files
                        if (url.origin !== location.origin) {
                            return response;
                        }

                        // Clone response for caching
                        const responseClone = response.clone();
                        
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => {
                                cache.put(request, responseClone);
                            });

                        return response;
                    })
                    .catch(error => {
                        console.log('Fetch failed, serving offline content:', error);
                        
                        // Return offline page for navigation requests
                        if (request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                        
                        // Return empty response for other requests
                        return new Response('Offline', {
                            status: 200,
                            statusText: 'OK',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Background Sync (if supported)
self.addEventListener('sync', event => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Implement background sync logic here
            Promise.resolve()
        );
    }
});

// Push Notification (if supported)
self.addEventListener('push', event => {
    console.log('Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'Liste kontrol uygulaması bildirimi',
        icon: './icon-192x192.png',
        badge: './icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        },
        actions: [
            {
                action: 'explore',
                title: 'Uygulamayı Aç',
                icon: './icon-96x96.png'
            },
            {
                action: 'close',
                title: 'Kapat',
                icon: './icon-96x96.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Liste Kontrol', options)
    );
});

// Notification Click
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event.notification.data);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('./')
        );
    }
});

// Message from main thread
self.addEventListener('message', event => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Handle file sharing (if app is share target)
self.addEventListener('fetch', event => {
    if (event.request.method === 'POST' && event.request.url.includes('/?share-target')) {
        event.respondWith(Response.redirect('./'));
        
        event.waitUntil(
            event.request.formData().then(formData => {
                const file = formData.get('file');
                if (file) {
                    // Store file data for main app to process
                    return self.registration.showNotification('Dosya alındı', {
                        body: `${file.name} dosyası uygulamaya aktarıldı`,
                        icon: './icon-192x192.png'
                    });
                }
            }).catch(err => console.error('Share target error:', err))
        );
    }
});

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'content-sync') {
        event.waitUntil(
            // Implement periodic sync logic
            Promise.resolve()
        );
    }
});