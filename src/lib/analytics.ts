import type { MarketingSeoSettings } from '../types/store';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

let initializedPixelId = '';
let initializedGaId = '';

export function syncSeoAndPixels(settings: MarketingSeoSettings): void {
  if (typeof document === 'undefined') return;

  if (settings.metaTitle) {
    document.title = settings.metaTitle;
  }

  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta && settings.metaDescription) {
    descMeta.setAttribute('content', settings.metaDescription);
  }

  const keywordsMeta = document.querySelector('meta[name="keywords"]');
  if (keywordsMeta && settings.metaKeywords) {
    keywordsMeta.setAttribute('content', settings.metaKeywords);
  }

  // Initialize Meta Pixel if configured and not already loaded
  const pixelId = settings.metaPixelId.trim();
  if (pixelId && pixelId !== initializedPixelId) {
    initializedPixelId = pixelId;
    if (!window.fbq) {
      const n: ((...args: unknown[]) => void) & {
        callMethod?: (...args: unknown[]) => void;
        queue?: unknown[][];
        push?: (...args: unknown[]) => void;
        loaded?: boolean;
        version?: string;
      } = function (...args: unknown[]) {
        if (n.callMethod) {
          n.callMethod(...args);
        } else {
          n.queue = n.queue || [];
          n.queue.push(args);
        }
      };
      n.queue = [];
      n.loaded = true;
      n.version = '2.0';
      window.fbq = n;
      window._fbq = n;

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    }
    window.fbq?.('init', pixelId);
    window.fbq?.('track', 'PageView');
  }

  // Initialize GA4 if configured
  const gaId = settings.googleAnalyticsId.trim();
  if (gaId && gaId !== initializedGaId) {
    initializedGaId = gaId;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(script);
    window.gtag('js', new Date());
    window.gtag('config', gaId);
  }
}

export function trackPixelEvent(
  eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'Purchase',
  payload?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.fbq && initializedPixelId) {
      window.fbq('track', eventName, payload || {});
    }
    if (window.gtag && initializedGaId) {
      window.gtag('event', eventName, payload || {});
    }
  } catch {
    // Non-blocking analytics
  }
}
