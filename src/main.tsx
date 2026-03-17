import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Read the business identifier injected into the root element.
// AI-generated components can rely on this value being present.
const rootEl = document.getElementById('root')
const BUSINESS_ID =
  rootEl?.getAttribute('data-kora-business-id') ?? '__KORA_BUSINESS_ID__'

declare global {
  interface Window {
    KORA_SITE?: {
      businessId: string
    }
    KORA_CONFIG?: {
      apiBaseUrl?: string
      // Other runtime configuration fields may be added by the backend.
      // This object is intended for environment-specific, non-secret public config.
    }
  }
}

// Expose stable globals for any runtime code that needs them.
// The backend is responsible for ensuring window.KORA_CONFIG.apiBaseUrl is set
// to the correct public API base URL when serving the site. If it is missing,
// fall back to a safe default.
window.KORA_SITE = {
  businessId: BUSINESS_ID,
}

createRoot(rootEl as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
