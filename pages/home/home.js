import { AuthService } from '../../services/auth.service.js';
import { PetService } from '../../services/pet.service.js';
import { MedicalRecordService } from '../../services/medical_record.service.js';
import { Pet } from '../../models/pet.model.js';
import { MedicalRecord } from '../../models/medical-record.model.js';
import { displayPage, loginPage } from '../../scripts/navigation.js';

const pets = new PetService();
const records = new MedicalRecordService();
let selectedPet = null;
let recordsRequestId = 0;

export function init() {
  selectedPet = null;
  recordsRequestId++;

  const recordForm = document.getElementById('record-form');
  recordForm.reset();
  recordForm.classList.add('hidden');

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
      list.innerHTML = '<div class="empty-state">🐾<p>Aún no tienes mascotas registradas.</p></div>';
      return;
    }

    items.forEach(pet => {
      const card = document.createElement('article');
      const isSelected = selectedPet?.id === pet.id;
      card.className = `pet-card ${selectedPet?.id === pet.id ? 'selected' : ''}`;
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Seleccionar mascota ${pet.name}`);
      card.setAttribute('aria-pressed', String(isSelected));
      card.innerHTML = `<div class="pet-avatar">${pet.species.toLowerCase().includes('cat') ? '🐈' : '🐕'}</div><div><h3>${escapeHtml(pet.name)}</h3><p>${escapeHtml(pet.species)} · ${escapeHtml(pet.breed || 'Sin raza')}</p><span class="status ${pet.status}">${pet.status === 'active' ? 'Activa' : 'Inactiva'}</span></div>`;
      card.addEventListener('click', () => selectPet(pet));
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectPet(pet);
        }
      });
      list.appendChild(card);
    });
  } catch (e) {
    list.innerHTML = '';
    showMessage(e.message, true);
  }
}

async function createPet(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');

  try {
    await runWithPendingButton(submitButton, 'Guardando…', async () => {
      await pets.create(new Pet({
        name: value('pet-name'),
        species: value('pet-species'),
        breed: value('pet-breed'),
        birth_date: value('pet-birth-date')
      }));
      form.reset();
      form.classList.add('hidden');
      showMessage('Mascota registrada.');
      loadPets();
    });
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
  const requestId = ++recordsRequestId;
  const petId = selectedPet.id;
  const list = document.getElementById('records-list');
  list.innerHTML = '<p>Cargando...</p>';

  try {
    const items = await records.getByPet(petId);

    if (requestId !== recordsRequestId || selectedPet?.id !== petId) return;

    list.innerHTML = '';

    if (!items.length) {
      list.innerHTML = '<div class="empty-state">🩺<p>No hay registros médicos activos.</p></div>';
      return;
    }

    items.forEach(record => {
      const card = document.createElement('article');
      card.className = 'record-card';
      card.innerHTML = `<div><span class="record-type">${typeLabel(record.typeRecord)}</span><h3>${escapeHtml(record.description)}</h3><p>${new Date(record.applicationDate).toLocaleString('es-MX')}</p>${record.boosterDate ? `<small>Refuerzo: ${new Date(record.boosterDate).toLocaleString('es-MX')}</small>` : ''}</div><button class="danger-button">Archivar</button>`;
      const archiveButton = card.querySelector('button');
      archiveButton.addEventListener('click', () => deleteRecord(record.id, archiveButton));
      list.appendChild(card);
    });
  } catch (e) {
    if (requestId !== recordsRequestId || selectedPet?.id !== petId) return;

    list.innerHTML = '';
    showMessage(e.message, true);
  }
}

async function createRecord(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');

  if (!selectedPet) {
    showMessage('Selecciona una mascota antes de crear un registro médico.', true);
    return;
  }

  try {
    await runWithPendingButton(submitButton, 'Guardando…', async () => {
      await records.create(new MedicalRecord({
        pet: selectedPet.id,
        type_record: value('record-type'),
        description: value('record-description'),
        booster_date: value('record-booster') || null
      }));
      form.reset();
      form.classList.add('hidden');
      showMessage('Registro médico guardado.');
      loadRecords();
    });
  } catch (e) {
    showMessage(e.message, true);
  }
}

async function deleteRecord(id, button) {
  if (button.dataset.pending === 'true') return;
  if (!confirm('¿Deseas archivar este registro?')) return;

  try {
    await runWithPendingButton(button, 'Archivando…', async () => {
      await records.delete(id);
      showMessage('Registro archivado.');
      loadRecords();
    });
  } catch (e) {
    showMessage(e.message, true);
  }
}

async function runWithPendingButton(button, pendingText, request) {
  if (button.dataset.pending === 'true') return;

  const originalText = button.textContent;
  button.dataset.pending = 'true';
  button.disabled = true;
  button.textContent = pendingText;

  try {
    return await request();
  } finally {
    button.disabled = false;
    button.textContent = originalText;
    delete button.dataset.pending;
  }
}

function value(id) {
  return document.getElementById(id).value.trim();
}

function typeLabel(type) {
  return ({
    vaccination: 'Vacunación',
    checkup: 'Consulta',
    surgery: 'Cirugía',
    deworming: 'Desparasitación',
    sterilization: 'Esterilización',
    other: 'Otro'
  })[type] || type;
}

function escapeHtml(value) {
  const el = document.createElement('span');
  el.textContent = value;
  return el.innerHTML;
}
