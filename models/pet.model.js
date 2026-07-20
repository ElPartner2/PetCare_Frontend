export class Pet {
  constructor(params = {}) {
    this.id = params.id ?? null;
    this.name = params.name ?? '';
    this.species = params.species ?? '';
    this.breed = params.breed ?? '';
    this.birthDate = params.birth_date ?? '';
    this.status = params.status ?? 'active';
  }

  toApi() {
    return { name: this.name, species: this.species, breed: this.breed, birth_date: this.birthDate, status: this.status };
  }
}
