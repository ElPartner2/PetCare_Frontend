export async function apiRequest(url, options = {}) {
  const token = sessionStorage.getItem('accessToken');
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (response.status === 401) {
    sessionStorage.clear();
    window.dispatchEvent(new CustomEvent('auth:expired'));
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
