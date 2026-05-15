import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global handlers to capture and log unhandled errors/rejections (helps diagnosing browser/extension issues)
window.addEventListener('unhandledrejection', (event) => {
  console.warn('[global] Unhandled promise rejection:', event.reason, event);
});

window.addEventListener('error', (event) => {
  console.error('[global] Uncaught error:', event.error || event.message, event);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
