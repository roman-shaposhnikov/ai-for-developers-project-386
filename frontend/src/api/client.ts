import type { ErrorResponse } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export interface Credentials {
  username: string;
  password: string;
}

class ApiClient {
  private credentials: Credentials | null = null;
  private authCallbacks: ((credentials: Credentials | null) => void)[] = [];

  onAuthChange(callback: (credentials: Credentials | null) => void) {
    this.authCallbacks.push(callback);
    return () => {
      this.authCallbacks = this.authCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyAuthChange() {
    this.authCallbacks.forEach(cb => cb(this.credentials));
  }

  setCredentials(credentials: Credentials | null) {
    this.credentials = credentials;
    this.notifyAuthChange();
  }

  getCredentials(): Credentials | null {
    return this.credentials;
  }

  isAuthenticated(): boolean {
    return this.credentials !== null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth = false
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (requiresAuth && this.credentials) {
      const auth = btoa(`${this.credentials.username}:${this.credentials.password}`);
      headers['Authorization'] = `Basic ${auth}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.setCredentials(null);
        throw new ApiError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json().catch(() => ({
          error: { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' }
        }));
        throw new ApiError(
          errorData.error.message,
          response.status,
          errorData.error.code
        );
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  get<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, requiresAuth);
  }

  post<T>(endpoint: string, body: unknown, requiresAuth = false): Promise<T> {
    return this.request<T>(
      endpoint,
      { method: 'POST', body: JSON.stringify(body) },
      requiresAuth
    );
  }

  patch<T>(endpoint: string, body: unknown, requiresAuth = false): Promise<T> {
    return this.request<T>(
      endpoint,
      { method: 'PATCH', body: JSON.stringify(body) },
      requiresAuth
    );
  }

  put<T>(endpoint: string, body: unknown, requiresAuth = false): Promise<T> {
    return this.request<T>(
      endpoint,
      { method: 'PUT', body: JSON.stringify(body) },
      requiresAuth
    );
  }

  delete(endpoint: string, requiresAuth = false): Promise<void> {
    return this.request<void>(endpoint, { method: 'DELETE' }, requiresAuth);
  }
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const apiClient = new ApiClient();
