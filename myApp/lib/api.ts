import Constants from 'expo-constants';

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL;

function getDevHostIpFromExpo(): string | null {
  const expoConfigHostUri = (Constants.expoConfig as any)?.hostUri;
  const manifest2HostUri = (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
  const manifestDebuggerHost = (Constants as any)?.manifest?.debuggerHost;

  const hostUri: unknown = expoConfigHostUri ?? manifest2HostUri ?? manifestDebuggerHost;
  if (typeof hostUri !== 'string' || hostUri.trim().length === 0) return null;

  const hostPart = hostUri.split('/')[0];
  const ipOrHost = hostPart.split(':')[0];
  if (!ipOrHost || ipOrHost.trim().length === 0) return null;
  return ipOrHost.trim();
}

function resolveDefaultBaseUrl(): string {
  const ip = getDevHostIpFromExpo();
  return ip ? `http://${ip}:4000` : 'http://localhost:4000';
}

export const API_BASE_URL = (rawBaseUrl && rawBaseUrl.trim().length > 0 ? rawBaseUrl.trim() : resolveDefaultBaseUrl()).replace(
  /\/$/,
  ''
);

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  token?: string | null;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  const payload = isJson ? await res.json().catch(() => undefined) : await res.text().catch(() => undefined);

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload && typeof (payload as any).error === 'string'
        ? (payload as any).error
        : undefined) ||
      (payload && typeof payload === 'object' && 'message' in payload && typeof (payload as any).message === 'string'
        ? (payload as any).message
        : undefined) ||
      `HTTP ${res.status}`;

    const err: ApiError = {
      status: res.status,
      message,
      details: payload,
    };
    throw err;
  }

  return payload as T;
}
