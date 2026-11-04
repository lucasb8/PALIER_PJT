export class MockNeighborRequestService {
  constructor(store, auth, options) {
    this.store = store;
    this.auth = auth;
    this.options = options;
  }

  bucket() {
    return this.store[this.options.key];
  }

  async list(groupId) {
    return this.bucket().filter((request) => request.groupId === groupId);
  }

  async create({ title, description, groupId, houseId }) {
    const draft = this.options.Model.create({
      title,
      description,
      groupId,
      requestedByUserId: this.auth.currentUser().id,
      requestedByHouseId: houseId,
    });
    draft.id = this.store.nextId(this.options.prefix);
    this.bucket().push(draft);
    return draft;
  }

  async answer(request, houseId) {
    const stored = this.bucket().find((entry) => entry.id === request.id);
    stored[this.options.claim](houseId);
    return stored;
  }

  async release(request, houseId) {
    const stored = this.bucket().find((entry) => entry.id === request.id);
    stored.release(houseId);
    return stored;
  }

  async remove(request, houseId) {
    const stored = this.bucket().find((entry) => entry.id === request.id);
    stored.withdraw(houseId);
    this.store[this.options.key] = this.bucket().filter((entry) => entry.id !== stored.id);
  }
}
