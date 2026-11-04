import { ReturnRequest } from '../../domain/ReturnRequest.js';

export class MockReturnService {
  constructor(store, auth) {
    this.store = store;
    this.auth = auth;
  }

  async list(groupId) {
    return this.store.returnRequests.filter((request) => request.groupId === groupId);
  }

  async ask({ item, activeHouseId, existing = [], bookings = [] }) {
    const draft = ReturnRequest.ask({
      item,
      groupId: item.groupId,
      userId: this.auth.currentUser().id,
      activeHouseId,
      existing,
      bookings,
    });
    draft.id = this.store.nextId('return');
    draft.created = new Date().toISOString();
    this.store.returnRequests.push(draft);
    return draft;
  }

  async closeForItem(itemId) {
    this.store.returnRequests.forEach((request) => {
      if (request.itemId === itemId && request.status === 'open') request.status = 'done';
    });
  }
}
