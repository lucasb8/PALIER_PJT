import { Booking } from '../domain/Booking.js';
import { where } from '../infrastructure/pbFilter.js';

export class BookingService {
  constructor(pb, auth) {
    this.pb = pb;
    this.auth = auth;
  }

  async listForGroup(groupId) {
    const records = await this.pb.collection('bookings').getFullList({
      filter: where('item.group', groupId),
      sort: 'start_date',
    });
    return records.map((record) => Booking.fromRecord(record));
  }

  async create({ itemId, houseId, startDate, endDate, existing }) {
    const candidate = Booking.create({
      itemId,
      houseId,
      userId: this.auth.currentUser().id,
      startDate,
      endDate,
    });
    Booking.assertNoOverlap(candidate, existing.filter((booking) => booking.itemId === itemId));
    const record = await this.pb.collection('bookings').create({
      item: itemId,
      house: houseId,
      booked_by_user: candidate.userId,
      start_date: candidate.startDate,
      end_date: candidate.endDate,
    });
    return Booking.fromRecord(record);
  }

  async cancel(bookingId, houseId) {
    const record = await this.pb.collection('bookings').getOne(bookingId, { expand: 'item' });
    const booking = Booking.fromRecord(record);
    booking.assertCancellable(houseId, record.expand?.item?.home_house || '');
    await this.pb.collection('bookings').delete(bookingId);
  }
}
