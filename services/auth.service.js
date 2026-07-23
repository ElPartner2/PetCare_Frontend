import { environment } from '../environment.js';
import {
  clearAuthSession,
  publicApiRequest,
  resetSessionExpiration
} from './api.service.js';

export class AuthService {
  async login(username, password) {
    const data = await publicApiRequest(
      `${environment.apiUrl}/token/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      },
      { 401: 'Usuario o contraseña incorrectos.' }
    );

    if (!data.access || !data.refresh) {
      throw new Error('El servidor no devolvió credenciales de sesión válidas.');
    }

    sessionStorage.setItem('accessToken', data.access);
    sessionStorage.setItem('refreshToken', data.refresh);
    sessionStorage.setItem('username', username);
    resetSessionExpiration();

    return data;
  }

  logout() {
    clearAuthSession();
  }

  isAuthenticated() {
    return Boolean(sessionStorage.getItem('accessToken'));
  }
}
