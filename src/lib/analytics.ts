type AnalyticsPayload = Record<string, string | number | boolean | null | undefined | string[]>;

declare global {
  interface Window {
    novus?: { track: (event: string, payload?: AnalyticsPayload) => void };
  }
}

export function track(event: string, payload?: AnalyticsPayload) {
  if (typeof window === "undefined") return;
  window.novus?.track(event, payload);
}
