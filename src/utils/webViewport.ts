// ─── Web Viewport Fix ─────────────────────────────────────────
// Forces the React Native Web root container to fill the full
// browser viewport. Called once at app startup on web only.
// This is more reliable than index.html since Expo Metro
// may regenerate the HTML during build.

import { Platform } from 'react-native';

export function fixWebViewport(): void {
  if (Platform.OS !== 'web') return;

  try {
    const style = document.createElement('style');
    style.textContent = `
      html, body {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: #0A1628 !important;
      }
      #root, [data-reactroot] {
        width: 100vw !important;
        height: 100vh !important;
        display: flex !important;
        overflow: hidden !important;
      }
      /* Target React Native Web's root div */
      body > div:first-child {
        width: 100vw !important;
        height: 100vh !important;
        display: flex !important;
      }
    `;
    document.head.appendChild(style);

    // Also set inline styles directly on the root div
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.width = '100vw';
      rootEl.style.height = '100vh';
      rootEl.style.display = 'flex';
      rootEl.style.overflow = 'hidden';
    }
  } catch (e) {
    // Silently fail if DOM not available
  }
}
