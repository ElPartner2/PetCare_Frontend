import { AuthService } from '../../services/auth.service.js';
import { displayPage, mainPage } from '../../scripts/navigation.js';

export function init() {
  document.getElementById('login-form')?.addEventListener('submit', login);
}

async function login(event) {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  const error = document.getElementById('login-error');
  button.disabled = true; error.classList.add('hidden');
  try {
    await new AuthService().login(document.getElementById('username').value.trim(), document.getElementById('password').value);
    await displayPage(mainPage);
  } catch (exception) {
    error.textContent = exception.message; error.classList.remove('hidden');
  } finally { button.disabled = false; }
}
