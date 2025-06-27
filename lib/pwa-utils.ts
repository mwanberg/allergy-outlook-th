// PWA utility functions for service worker and offline functionality

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration)
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError)
        })
    })
  }
}

export function checkOnlineStatus(): boolean {
  return navigator.onLine
}

export function addToHomeScreen() {
  // This would be called when the beforeinstallprompt event is fired
  // Implementation depends on the specific PWA install prompt handling
}

export function enableNotifications() {
  if ("Notification" in window) {
    return Notification.requestPermission()
  }
  return Promise.resolve("denied")
}

export function showNotification(title: string, options?: NotificationOptions) {
  if ("serviceWorker" in navigator && "Notification" in window) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        ...options,
      })
    })
  }
}
