export class MedicalRecord {
  constructor(params = {}) {
    this.id = params.id ?? null;
    this.pet = params.pet ?? '';
    this.typeRecord = params.type_record ?? '';
    this.applicationDate = params.application_date ?? '';
    this.description = params.description ?? '';
    this.boosterDate = params.booster_date ?? null;
  }

  toApi() {
    return { pet: this.pet, type_record: this.typeRecord, description: this.description, booster_date: this.boosterDate || null };
  }
}
