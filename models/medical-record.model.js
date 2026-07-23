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
    let boosterDate = null;

    if (this.boosterDate) {
      const parsedBoosterDate = new Date(this.boosterDate);

      if (Number.isNaN(parsedBoosterDate.getTime())) {
        throw new Error('La fecha de refuerzo no es válida. Revisa la fecha y la hora.');
      }

      boosterDate = parsedBoosterDate.toISOString();
    }

    return {
      pet: this.pet,
      type_record: this.typeRecord,
      description: this.description,
      booster_date: boosterDate
    };
  }
}
