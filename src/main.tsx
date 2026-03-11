import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BUSINESS_ID } from './App.tsx';

const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error("Root element with id 'root' not found in the document.");
}

declare global {
  interface Window {
    KORA_SITE?: {
      businessId: string;
    };
  }
}

window.KORA_SITE = {
  businessId: BUSINESS_ID,
};

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);