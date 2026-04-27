import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

type UpsertPushSubscriptionBody = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
  deviceLabel?: string;
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  getPermissionState(): NotificationPermission {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  }

  async enablePush(): Promise<void> {
    if (!this.isSupported()) throw new Error('Push not supported');
    if (!environment.vapidPublicKey) throw new Error('Missing VAPID public key');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Push permission not granted');

    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) reg = await navigator.serviceWorker.register('combined-sw.js');

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(environment.vapidPublicKey) as unknown as BufferSource,
    });

    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error('Invalid subscription');

    const body: UpsertPushSubscriptionBody = {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      userAgent: navigator.userAgent,
    };

    await firstValueFrom(
      this.http.post(`${this.baseUrl}/push/subscriptions`, body, { withCredentials: true }),
    );
  }
}

