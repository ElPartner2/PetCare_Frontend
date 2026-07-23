import { environment } from '../environment.js';

let refreshRequest = null;
let sessionExpirationNotified = false;
const authStorageKeys = ['accessToken', 'refreshToken', 'username'];

class ConnectionError extends Error {}
class AuthenticationError extends Error {}

async function fetchResponse(url, options) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ConnectionError(
        'No fue posible conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.',
        { cause: error }
      );
    }

    throw error;
  }
}

function sendRequest(url, options, token) {
  return fetchResponse(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
}

export function clearAuthSession() {
  authStorageKeys.forEach(key => sessionStorage.removeItem(key));
}

export function resetSessionExpiration() {
  sessionExpirationNotified = false;
}

export function getCollectionItems(data) {
  if (Array.isArray(data)) return data;

  if (data && Array.isArray(data.results)) {
    return data.results;
  }

  throw new Error('La API devolvió un formato de lista no válido.');
}

async function readResponseData(response) {
  if (response.status === 204) return null;

  const body = await response.text();
  if (!body) return {};

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error('El servidor devolvió una respuesta con un formato no válido.', {
      cause: error
    });
  }
}

function findErrorMessage(value) {
  if (typeof value === 'string' && value.trim()) return value;

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = findErrorMessage(item);
      if (message) return message;
    }
  }

  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      const message = findErrorMessage(item);
      if (message) return message;
    }
  }

  return null;
}

function responseErrorMessage(data, status, fallbackMessage) {
  if (fallbackMessage) return fallbackMessage;

  const apiMessage = findErrorMessage(data);
  if (apiMessage) return apiMessage;

  if (status === 400 || status === 422) {
    return 'Los datos enviados no son válidos. Revisa la información e inténtalo nuevamente.';
  }
  if (status === 401) return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
  if (status === 403) return 'No tienes permiso para realizar esta operación.';
  if (status === 404) return 'No se encontró el recurso solicitado.';
  if (status >= 500) return 'El servidor no pudo completar la solicitud. Inténtalo más tarde.';

  return 'No fue posible completar la solicitud.';
}

export async function publicApiRequest(url, options = {}, statusMessages = {}) {
  const response = await fetchResponse(url, options);
  const data = await readResponseData(response);

  if (!response.ok) {
    throw new Error(
      responseErrorMessage(data, response.status, statusMessages[response.status])
    );
  }

  return data;
}

function expireSession(expectedAccessToken) {
  if (sessionStorage.getItem('accessToken') !== expectedAccessToken) return;

  clearAuthSession();

  if (sessionExpirationNotified) return;

  sessionExpirationNotified = true;
  window.dispatchEvent(new CustomEvent('auth:expired'));
}

async function refreshAccessToken() {
  if (refreshRequest) return refreshRequest;

  refreshRequest = (async () => {
    const refreshToken = sessionStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new AuthenticationError('No hay un token de renovación disponible.');
    }

    const response = await fetchResponse(`${environment.apiUrl}/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh: refreshToken })
    });

    const data = await readResponseData(response);

    if (!response.ok || !data.access) {
      throw new AuthenticationError(responseErrorMessage(data, response.status));
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
  const accessToken = sessionStorage.getItem('accessToken');
  let response = await sendRequest(
    url,
    options,
    accessToken
  );

  if (response.status === 401) {
    let newAccessToken;

    try {
      newAccessToken = await refreshAccessToken();
    } catch (error) {
      if (!(error instanceof AuthenticationError)) throw error;

      expireSession(accessToken);
      throw new Error('Tu sesión ha expirado. Inicia sesión nuevamente.');
    }

    response = await sendRequest(url, options, newAccessToken);

    if (response.status === 401) {
      expireSession(newAccessToken);
      throw new Error('Tu sesión ha expirado. Inicia sesión nuevamente.');
    }
  }

  const data = await readResponseData(response);

  if (!response.ok) {
    throw new Error(responseErrorMessage(data, response.status));
  }

  return data;
}
