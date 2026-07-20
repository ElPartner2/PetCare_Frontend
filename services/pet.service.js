import { environment } from '../styles/environment.js';
import { apiRequest } from './api.service.js';
import { Pet } from '../models/pet.model.js';

export class PetService {
  baseUrl = `${environment.apiUrl}/pets/`;
  async getAll() { return (await apiRequest(this.baseUrl)).map(item => new Pet(item)); }
  async create(pet) { return new Pet(await apiRequest(this.baseUrl, { method: 'POST', body: JSON.stringify(pet.toApi()) })); }
  async update(id, changes) { return new Pet(await apiRequest(`${this.baseUrl}${id}/`, { method: 'PATCH', body: JSON.stringify(changes) })); }
  async delete(id) { return apiRequest(`${this.baseUrl}${id}/`, { method: 'DELETE' }); }
}
