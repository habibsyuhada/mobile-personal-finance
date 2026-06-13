import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements as definePwaElements } from '@ionic/pwa-elements/loader';
import App from './app/App';

async function bootstrap() {
  // Komponen PWA untuk kamera/galeri saat berjalan di browser.
  definePwaElements(window);

  // Di web, daftarkan komponen jeep-sqlite (SQLite via wasm/IndexedDB).
  // Di native (Android), ini dilewati karena memakai SQLite asli.
  if (Capacitor.getPlatform() === 'web') {
    const { defineCustomElements } = await import('jeep-sqlite/loader');
    defineCustomElements(window);
    await customElements.whenDefined('jeep-sqlite');
    const jeepEl = document.createElement('jeep-sqlite');
    document.body.appendChild(jeepEl);
    await jeepEl.componentOnReady?.();
  }

  const container = document.getElementById('root');
  const root = createRoot(container!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

void bootstrap();
