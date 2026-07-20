import { AuthService } from '../services/auth.service.js';
import { displayPage, loginPage, mainPage } from './navigation.js';

document.addEventListener('DOMContentLoaded', () => {
  const auth = new AuthService();
  displayPage(auth.isAuthenticated() ? mainPage : loginPage);
});

window.addEventListener('auth:expired', () => displayPage(loginPage));
