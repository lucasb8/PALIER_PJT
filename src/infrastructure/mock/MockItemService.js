import { Item } from '../../domain/Item.js';

export class MockItemService {
  constructor(store, auth) {
    this.store = store;
    this.auth = auth;
  }

  async list(groupId) {
    return this.store.items
      .filter((item) => item.groupId === groupId)
      .sort((left, right) => left.name.localeCompare(right.name, 'fr'));
  }

  async create({ name, description, instructions, imageUrl, homeHouseId, groupId, photoFile }) {
    const draft = Item.create({ name, description, instructions, imageUrl, groupId, homeHouseId });
    draft.id = this.store.nextId('item');
    if (photoFile) draft.photoUrl = URL.createObjectURL(photoFile);
    this.store.items.push(draft);
    return draft;
  }

  async move(item, toHouseId) {
    const stored = this.store.items.find((entry) => entry.id === item.id);
    const transfer = stored.planTransfer(toHouseId, this.auth.currentUser().id);
    if (!transfer) return stored;
    this.store.history.push({
      id: this.store.nextId('hist'),
      itemId: stored.id,
      created: new Date().toISOString(),
      fromHouse: this.store.houseName(transfer.fromHouseId),
      toHouse: this.store.houseName(transfer.toHouseId),
      by: this.auth.currentUser().name,
    });
    stored.currentHouseId = transfer.toHouseId;
    return stored;
  }

  async remove(item, houseId) {
    const stored = this.store.items.find((entry) => entry.id === item.id);
    const bookings = this.store.bookings.filter((booking) => booking.itemId === stored.id);
    stored.assertRemovable(houseId, bookings);
    this.store.bookings = this.store.bookings.filter((booking) => booking.itemId !== stored.id);
    this.store.returnRequests = this.store.returnRequests.filter((request) => request.itemId !== stored.id);
    this.store.history = this.store.history.filter((entry) => entry.itemId !== stored.id);
    this.store.items = this.store.items.filter((entry) => entry.id !== stored.id);
  }

  async history(itemId) {
    return this.store.history
      .filter((entry) => entry.itemId === itemId)
      .sort((left, right) => new Date(left.created) - new Date(right.created));
  }
}
