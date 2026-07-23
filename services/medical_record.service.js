import { environment } from '../environment.js';
import { apiRequest, getCollectionItems } from './api.service.js';
import { MedicalRecord } from '../models/medical-record.model.js';

export class MedicalRecordService {
  baseUrl = `${environment.apiUrl}/medical-records/`;

  async getByPet(petId) {
    const query = new URLSearchParams({ pet: petId });
    const data = await apiRequest(`${this.baseUrl}?${query}`);

    return getCollectionItems(data)
      .filter(item => item.pet === petId)
      .map(item => new MedicalRecord(item));
  }

  async create(record) {
    return new MedicalRecord(await apiRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify(record.toApi())
    }));
  }

  async delete(id) {
    return apiRequest(`${this.baseUrl}${id}/`, {
      method: 'DELETE'
    });
  }
}
