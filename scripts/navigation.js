import { init as loginInit } from '../pages/login/login.js';
import { init as homeInit } from '../pages/home/home.js';

export const loginPage = 'login';
export const mainPage = 'home';

export async function displayPage(page) {
  const content = document.getElementById('content');

  try {
    const response = await fetch(`pages/${page}/${page}.html`);

    if (!response.ok) {
      throw new Error('No se pudo cargar la página.');
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = await response.text();

    const template = wrapper.querySelector('template');

    if (!template) {
      throw new Error('La página no contiene un template válido.');
    }

    document
      .querySelectorAll('link[data-page-style]')
      .forEach(link => link.remove());

    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = `pages/${page}/${page}.css`;
    style.dataset.pageStyle = page;

    document.head.appendChild(style);
    content.replaceChildren(template.content.cloneNode(true));
    page === loginPage ? loginInit() : homeInit();
  } catch (error) {
    content.innerHTML = `<p class="message error">${error.message}</p>`;
  }
}
