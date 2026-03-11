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

  const resp = await fetch(`https://kora-agent.quseappdev.com/api/v1/public/newsletter/subscribe`, {
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

