import { usePortalAuthStore } from '@/stores/portal-auth-store';
import { resolveApiBase } from '@/lib/api-base';

export class PortalApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'PortalApiError';
  }
}

class PortalApiClient {
  private getToken(): string | null {
    return usePortalAuthStore.getState().token;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = this.getToken();
    const base = resolveApiBase();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    let res: Response;
    try {
      res = await fetch(`${base}/portal${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options?.headers,
        },
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new PortalApiError('La API no respondió a tiempo.', 0);
      }
      throw new PortalApiError('No se pudo conectar con el servidor.', 0);
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 401) {
      usePortalAuthStore.getState().logout();
      throw new PortalApiError('Sesión expirada', 401);
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      throw new PortalApiError(body.error ?? body.message ?? `HTTP ${res.status}`, res.status);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  get<T>(endpoint: string) { return this.request<T>(endpoint); }
  post<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data ?? {}) });
  }
}

export const portalApi = new PortalApiClient();
