import { getApiBaseUrl, BUSINESS_ID } from './utils/api';

export type PublicVoiceConfig = {
  business_id: string;
  enabled: boolean;
  provider: string;
  session_bootstrap_url: string;
};

/**
 * Fetches public voice configuration.
 * NOTE: This is for diagnostics only. Widget visibility should be controlled
 * by `window.KORA_CONFIG.features.voice.enabled`.
 */
export async function fetchVoiceConfig(): Promise<PublicVoiceConfig> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/api/v1/public/voice/config/${encodeURIComponent(BUSINESS_ID)}`,
    { method: 'GET' },
  );
  if (!response.ok) {
    throw new Error('Failed to fetch voice config');
  }
  return (await response.json()) as PublicVoiceConfig;
}

/**
 * Creates a new voice session with the backend.
 */
export async function createVoiceSession(
  locale?: string,
  page_context?: Record<string, unknown>
) {
  const apiBaseUrl = getApiBaseUrl();
  const payload = {
    business_id: BUSINESS_ID,
    locale,
    page_context,
  };
  const response = await fetch(`${apiBaseUrl}/api/v1/public/voice/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create voice session' }));
    throw new Error(errorData.message || 'Failed to create voice session');
  }
  return await response.json();
}