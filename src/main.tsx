import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfill global for libraries that expect it
if (typeof (window as any).global === 'undefined') {
  (window as any).global = new Proxy(window, {
    set: (target, prop, value) => {
      if (prop === 'fetch') {
        console.warn('Something tried to overwrite fetch via global.fetch - blocking.');
        return true; // Pretend it succeeded
      }
      (target as any)[prop] = value;
      return true;
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
