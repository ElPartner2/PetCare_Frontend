import { environment } from '../environment.js';

let refreshRequest = null;

function sendRequest(url, options, token) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
}

function expireSession() {
  sessionStorage.clear();
  window.dispatchEvent(new CustomEvent('auth:expired'));
}

async function refreshAccessToken() {
  if (refreshRequest) return refreshRequest;

  refreshRequest = (async () => {
    const refreshToken = sessionStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No hay un token de renovación disponible.');
    }

    const response = await fetch(`${environment.apiUrl}/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh: refreshToken })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.access) {
      throw new Error(data.detail || 'No fue posible renovar la sesión.');
    }

    sessionStorage.setItem('accessToken', data.access);
    if (data.refresh) {
      sessionStorage.setItem('refreshToken', data.refresh);
    }
    return data.access;
  })();

  try {
    return await refreshRequest;
  } finally {
    refreshRequest = null;
  }
}

export async function apiRequest(url, options = {}) {
  let response = await sendRequest(
    url,
    options,
    sessionStorage.getItem('accessToken')
  );

  if (response.status === 401) {
    try {
      const newAccessToken = await refreshAccessToken();
      response = await sendRequest(url, options, newAccessToken);
    } catch (error) {
      expireSession();
      throw new Error('Tu sesión ha expirado. Inicia sesión nuevamente.');
    }

    if (response.status === 401) {
      expireSession();
    }
  }

  const data = response.status === 204 ? null : await response.json().catch(() => ({}));

  if (!response.ok) {
    const firstError = Object.values(data)[0];
    throw new Error(
      data.detail
      || (Array.isArray(firstError) ? firstError[0] : firstError)
      || 'No fue posible completar la solicitud.'
    );
  }

  return data;
}
