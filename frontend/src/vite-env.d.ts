/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Minimal typing for the Google Identity Services global, loaded via the
 * script tag in index.html rather than an npm package — GIS is intentionally
 * a vanilla script include, not a React wrapper library, to avoid pulling in
 * a third-party GIS React binding with its own version-lag risk.
 */
interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  prompt(): void;
}

interface Window {
  google?: {
    accounts: {
      id: GoogleAccountsId;
    };
  };
}