
export async function subscribeUser() {
  const reg = await navigator.serviceWorker.register('/service-worker.js');

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
  });

  await fetch('/api/webpush/subscribe', {
    method: 'POST',
    body: JSON.stringify(sub),
    headers: { 'Content-Type': 'application/json' }
  });
}
