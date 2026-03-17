// Core helper for subscribing a visitor to a restaurant's newsletter.
// UI components can call this function and pass in form data.

export type NewsletterSubscribePayload = {
  businessId: string
  email?: string
  phoneNumber?: string
  firstName?: string
  lastName?: string
  emailOptIn?: boolean
  smsOptIn?: boolean
  metadata?: Record<string, unknown>
}

export type NewsletterSubscribeResult = {
  success: boolean
  status?: string
  message?: string
  subscriberId?: string
  channels?: string[]
}

// Base URL for the public API. Hardcoded to dev environment for now.
// const API_BASE_URL = 'https://kora-agent.quseappdev.com/api'

function getApiBaseUrl(): string {
  // Prefer a dynamically injected base URL from the hosting environment, if present.
  if (typeof window !== 'undefined') {
    const maybeConfig = (window as any).KORA_CONFIG
    const configured = typeof maybeConfig?.apiBaseUrl === 'string' ? maybeConfig.apiBaseUrl.trim() : ''
    if (configured) {
      return configured.replace(/\/+$/, '')
    }
  }

  // Fallback to the default dev/staging backend host.
  // This should point at the correct environment-specific API gateway without the /api suffix.
  return 'https://kora-agent.quseappdev.com'
}

export async function subscribeToNewsletter(
  payload: NewsletterSubscribePayload,
): Promise<NewsletterSubscribeResult> {
  const { businessId, email, phoneNumber, ...rest } = payload

  if (!businessId) {
    return {
      success: false,
      status: 'invalid',
      message: 'Missing business identifier for newsletter subscription.',
    }
  }

  if (!email && !phoneNumber) {
    return {
      success: false,
      status: 'invalid',
      message: 'Please provide at least an email or phone number.',
    }
  }

  const body = {
    business_id: businessId,
    email: email ?? null,
    phone_number: phoneNumber ?? null,
    first_name: rest.firstName ?? null,
    last_name: rest.lastName ?? null,
    email_opt_in: rest.emailOptIn ?? Boolean(email),
    sms_opt_in: rest.smsOptIn ?? Boolean(phoneNumber),
    metadata: rest.metadata ?? {},
    source: 'dynamic_website_widget',
  }

  const apiBaseUrl = getApiBaseUrl()

  const resp = await fetch(`${apiBaseUrl}/api/v1/public/newsletter/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    return {
      success: false,
      status: 'error',
      message: 'Failed to subscribe to newsletter.',
    }
  }

  const json = (await resp.json()) as any

  return {
    success: true,
    status: json.status ?? 'subscribed',
    message: json.message ?? 'Subscribed to newsletter.',
    subscriberId: json.subscriber_id ?? json.id ?? undefined,
    channels: json.channels ?? undefined,
  }
}

