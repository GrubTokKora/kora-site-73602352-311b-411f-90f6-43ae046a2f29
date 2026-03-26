/// <reference types="vite/client" />

declare global {
  interface Window {
    KORA_SITE?: {
      businessId: string;
    };
    KORA_CONFIG?: {
      apiBaseUrl?: string;
      recaptchaSiteKey?: string;
      features?: {
        voice?: {
          enabled?: boolean;
          provider?: string;
        };
      };
    };
    grecaptcha: any;
  }
}

export {};