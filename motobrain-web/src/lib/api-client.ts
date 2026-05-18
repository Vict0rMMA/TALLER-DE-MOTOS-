import { useAuthStore } from '@/stores/auth-store';
import { clearAuthCookie } from '@/lib/utils';
import { resolveApiBase } from '@/lib/api-base';

const REQUEST_TIMEOUT_MS = 12_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private getToken(): string | null {
    return useAuthStore.getState().token;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = this.getToken();
    const base = resolveApiBase();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(`${base}${endpoint}`, {
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
        throw new ApiError(
          `La API no respondió a tiempo (${base}). ¿Está corriendo "npm run dev" en la raíz del proyecto?`,
          0,
        );
      }
      throw new ApiError(
        `No se pudo conectar con la API (${base}). Revisa que el backend esté activo y la URL en .env.local.`,
        0,
      );
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 401) {
      clearAuthCookie();
      useAuthStore.getState().logout();
      throw new ApiError('Sesión expirada', 401);
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      const msg =
        body.error ??
        body.message ??
        (res.status === 500
          ? 'Error del servidor. ¿Está la API en marcha y la base de datos migrada?'
          : `HTTP ${res.status}`);
      throw new ApiError(msg, res.status);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }

  put<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  delete<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
  }

  async uploadForm<T>(endpoint: string, form: FormData): Promise<T> {
    const token = this.getToken();
    const base = resolveApiBase();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    let res: Response;
    try {
      res = await fetch(`${base}${endpoint}`, {
        method: 'POST',
        signal: controller.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
    } catch {
      throw new ApiError('No se pudo conectar con la API', 0);
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      throw new ApiError(body.error ?? body.message ?? `HTTP ${res.status}`, res.status);
    }
    return res.json() as Promise<T>;
  }
}

export const api = new ApiClient();
