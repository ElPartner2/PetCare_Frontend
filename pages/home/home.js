import { AuthService } from '../../services/auth.service.js';
import { PetService } from '../../services/pet.service.js';
import { MedicalRecordService } from '../../services/medical_record.service.js';
import { Pet } from '../../models/pet.model.js';
import { MedicalRecord } from '../../models/medical-record.model.js';
import { displayPage, loginPage } from '../../scripts/navigation.js';

const pets = new PetService();
const records = new MedicalRecordService();
let selectedPet = null;

export function init() {
  document.getElementById('username-label').textContent = sessionStorage.getItem('username') || 'Usuario';
  document.getElementById('logoutBtn').addEventListener('click', () => {
    new AuthService().logout();
    displayPage(loginPage);
  });

  bindToggle('new-pet-btn', 'pet-form');
  bindToggle('cancel-pet-btn', 'pet-form');
  bindToggle('new-record-btn', 'record-form');
  bindToggle('cancel-record-btn', 'record-form');

  document.getElementById('pet-form').addEventListener('submit', createPet);
  document.getElementById('record-form').addEventListener('submit', createRecord);
  loadPets();
}

function bindToggle(buttonId, formId) {
  document.getElementById(buttonId).addEventListener('click', () =>
    document.getElementById(formId).classList.toggle('hidden')
  );
}

function showMessage(text, error = false) {
  const el = document.getElementById('home-message');
  el.textContent = text;
  el.className = `message ${error ? 'error' : 'success'}`;
  setTimeout(() => el.classList.add('hidden'), 3500);
}

async function loadPets() {
  const list = document.getElementById('pets-list');
  list.innerHTML = '<p>Cargando...</p>';

  try {
    const items = await pets.getAll();
    list.innerHTML = '';

    if (!items.length) {
      list.innerHTML = '<div class="empty-state">ðŸ¾<p>AÃºn no tienes mascotas registradas.</p></div>';
      return;
    }

    items.forEach(pet => {
      const card = document.createElement('article');
      card.className = `pet-card ${selectedPet?.id === pet.id ? 'selected' : ''}`;
      card.innerHTML = `<div class="pet-avatar">${pet.species.toLowerCase().includes('cat') ? 'ðŸˆ' : 'ðŸ•'}</div><div><h3>${escapeHtml(pet.name)}</h3><p>${escapeHtml(pet.species)} Â· ${escapeHtml(pet.breed || 'Sin raza')}</p><span class="status ${pet.status}">${pet.status === 'active' ? 'Activa' : 'Inactiva'}</span></div>`;
      card.addEventListener('click', () => selectPet(pet));
      list.appendChild(card);
    });
  } catch (e) {
    list.innerHTML = '';
    showMessage(e.message, true);
  }
}

async function createPet(event) {
  event.preventDefault();

  try {
    await pets.create(new Pet({
      name: value('pet-name'),
      species: value('pet-species'),
      breed: value('pet-breed'),
      birth_date: value('pet-birth-date')
    }));
    event.target.reset();
    event.target.classList.add('hidden');
    showMessage('Mascota registrada.');
    loadPets();
  } catch (e) {
    showMessage(e.message, true);
  }
}

async function selectPet(pet) {
  selectedPet = pet;
  document.getElementById('records-title').textContent = `Historial de ${pet.name}`;
  document.getElementById('new-record-btn').classList.remove('hidden');
  loadPets();
  loadRecords();
}

async function loadRecords() {
  const list = document.getElementById('records-list');
  list.innerHTML = '<p>Cargando...</p>';

  try {
    const items = await records.getByPet(selectedPet.id);
    list.innerHTML = '';

    if (!items.length) {
      list.innerHTML = '<div class="empty-state">ðŸ©º<p>No hay registros mÃ©dicos activos.</p></div>';
      return;
    }

    items.forEach(record => {
      const card = document.createElement('article');
      card.className = 'record-card';
      card.innerHTML = `<div><span class="record-type">${typeLabel(record.typeRecord)}</span><h3>${escapeHtml(record.description)}</h3><p>${new Date(record.applicationDate).toLocaleString('es-MX')}</p>${record.boosterDate ? `<small>Refuerzo: ${new Date(record.boosterDate).toLocaleString('es-MX')}</small>` : ''}</div><button class="danger-button">Archivar</button>`;
      card.querySelector('button').addEventListener('click', () => deleteRecord(record.id));
      list.appendChild(card);
    });
  } catch (e) {
    list.innerHTML = '';
    showMessage(e.message, true);
  }
}

async function createRecord(event) {
  event.preventDefault();

  try {
    await records.create(new MedicalRecord({
      pet: selectedPet.id,
      type_record: value('record-type'),
      description: value('record-description'),
      booster_date: value('record-booster') || null
    }));
    event.target.reset();
    event.target.classList.add('hidden');
    showMessage('Registro mÃ©dico guardado.');
    loadRecords();
  } catch (e) {
    showMessage(e.message, true);
  }
}

async function deleteRecord(id) {
  if (!confirm('Â¿Deseas archivar este registro?')) return;

  try {
    await records.delete(id);
    showMessage('Registro archivado.');
    loadRecords();
  } catch (e) {
    showMessage(e.message, true);
  }
}

function value(id) {
  return document.getElementById(id).value.trim();
}

function typeLabel(type) {
  return ({
    vaccination: 'VacunaciÃ³n',
    checkup: 'Consulta',
    surgery: 'CirugÃ­a',
    deworming: 'DesparasitaciÃ³n',
    sterilization: 'EsterilizaciÃ³n',
    other: 'Otro'
  })[type] || type;
}

function escapeHtml(value) {
  const el = document.createElement('span');
  el.textContent = value;
  return el.innerHTML;
}
