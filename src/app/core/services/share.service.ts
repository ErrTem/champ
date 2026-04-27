import { Injectable } from '@angular/core';

type SharePayload = { title?: string; text?: string; url: string };

@Injectable({ providedIn: 'root' })
export class ShareService {
  async shareOrCopy(payload: SharePayload): Promise<{ method: 'share' | 'copy'; ok: boolean }> {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: payload.title,
          text: payload.text,
          url: payload.url,
        });
        return { method: 'share', ok: true };
      } catch {
        // fall through to copy
      }
    }

    const ok = await this.copyText(payload.url);
    return { method: 'copy', ok };
  }

  private async copyText(text: string): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fall through to DOM fallback
    }

    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', 'true');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

