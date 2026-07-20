import { environment } from '../styles/environment.js';

export class AuthService {
  async login(username, password) {
    const response = await fetch(`${environment.apiUrl}/token/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || 'Usuario o contraseña incorrectos.');
    sessionStorage.setItem('accessToken', data.access);
    sessionStorage.setItem('refreshToken', data.refresh);
    sessionStorage.setItem('username', username);
    return data;
  }

  logout() { sessionStorage.clear(); }
  isAuthenticated() { return Boolean(sessionStorage.getItem('accessToken')); }
}
