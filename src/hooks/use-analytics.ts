import { useEffect, useRef } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export function useAnalytics() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const trackingId = import.meta.env.VITE_GA_TRACKING_ID;
    if (!trackingId || import.meta.env.DEV) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", trackingId);
  }, []);

  return {
    trackEvent: ({ action, category, label, value }: AnalyticsEvent) => {
      if (import.meta.env.DEV) {
        console.log("[Analytics]", { action, category, label, value });
        return;
      }

      window.gtag?.("event", action, {
        event_category: category,
        event_label: label,
        value,
      });
    },
    trackPageView: (path: string, title: string) => {
      if (import.meta.env.DEV) {
        console.log("[Analytics] Page View", { path, title });
        return;
      }

      window.gtag?.("config", import.meta.env.VITE_GA_TRACKING_ID as string, {
        page_path: path,
        page_title: title,
      });
    },
  };
}