export const BUSINESS_ID = "73602352-311b-411f-90f6-43ae046a2f29";

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.KORA_CONFIG?.apiBaseUrl) {
    const url = window.KORA_CONFIG.apiBaseUrl.trim();
    if (url) {
      return url.replace(/\/+$/, '');
    }
  }
  // The backbone provides this value, which should be injected into KORA_CONFIG.
  // As a last resort, we use the value from the last known backbone.
  return 'https://kora-agent.quseappdev.com';
}
