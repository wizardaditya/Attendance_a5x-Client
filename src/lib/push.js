import api from './api.js';

// Convert VAPID base64 key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// Register service worker + subscribe to push
export async function initPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported in this browser');
    return;
  }

  try {
    // Register SW
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Check existing permission
    if (Notification.permission === 'denied') return;

    // Get VAPID public key from server
    const { data } = await api.get('/push/vapid-public-key');
    if (!data?.publicKey) return;

    const applicationServerKey = urlBase64ToUint8Array(data.publicKey);

    // Check if already subscribed
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      // Ask for permission + subscribe
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey,
      });
    }

    // Save subscription to server
    await api.post('/push/subscribe', { subscription });
    console.log('🔔 Push notifications enabled');
  } catch (err) {
    console.error('Push init failed:', err.message);
  }
}

// Unsubscribe (call on logout)
export async function removePushSubscription() {
  try {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await api.post('/push/unsubscribe', { endpoint: subscription.endpoint });
      await subscription.unsubscribe();
    }
  } catch (err) {
    console.error('Push unsubscribe failed:', err.message);
  }
}
