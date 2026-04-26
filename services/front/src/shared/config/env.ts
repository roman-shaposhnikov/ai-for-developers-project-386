const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

function defaultBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

export const env = {
  /**
   * Base URL of the backend that exposes the contract from `api/generated/openapi.yaml`.
   * Defaults to the current origin so the dev-server proxy (`/api` → backend) handles routing
   * without CORS. Set `VITE_API_BASE_URL` to point at a real backend in production.
   */
  apiBaseUrl: rawBaseUrl && rawBaseUrl.length > 0 ? rawBaseUrl.replace(/\/$/, '') : defaultBaseUrl(),
};
