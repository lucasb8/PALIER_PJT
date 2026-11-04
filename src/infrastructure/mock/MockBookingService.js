import { Booking } from '../../domain/Booking.js';

export class MockBookingService {
  constructor(store, auth) {
    this.store = store;
    this.auth = auth;
  }

  async listForGroup(groupId) {
    const itemIds = new Set(this.store.items.filter((item) => item.groupId === groupId).map((item) => item.id));
    return this.store.bookings
      .filter((booking) => itemIds.has(booking.itemId))
      .sort((left, right) => new Date(left.startDate) - new Date(right.startDate));
  }

  async create({ itemId, houseId, startDate, endDate }) {
    const candidate = Booking.create({
      itemId,
      houseId,
      userId: this.auth.currentUser().id,
      startDate,
      endDate,
    });
    Booking.assertNoOverlap(candidate, this.store.bookings.filter((booking) => booking.itemId === itemId));
    candidate.id = this.store.nextId('book');
    this.store.bookings.push(candidate);
    return candidate;
  }

  async cancel(bookingId, houseId) {
    const booking = this.store.bookings.find((entry) => entry.id === bookingId);
    if (!booking) throw new Error('Cette réservation ne peut pas être annulée.');
    const item = this.store.items.find((entry) => entry.id === booking.itemId);
    booking.assertCancellable(houseId, item?.homeHouseId || '');
    this.store.bookings = this.store.bookings.filter((entry) => entry.id !== bookingId);
  }
}
