import { Booking } from '../domain/Booking.js';
import { Item } from '../domain/Item.js';
import { where } from '../infrastructure/pbFilter.js';

export class ItemService {
  constructor(pb, auth) {
    this.pb = pb;
    this.auth = auth;
  }

  withPhoto(record) {
    const item = Item.fromRecord(record);
    if (record.photo) item.photoUrl = this.pb.files.getURL(record, record.photo, { thumb: '400x400' });
    return item;
  }

  async list(groupId) {
    const records = await this.pb.collection('items').getFullList({
      filter: where('group', groupId),
      sort: 'name',
    });
    return records.map((record) => this.withPhoto(record));
  }

  async create({ name, description, instructions, imageUrl, homeHouseId, groupId, photoFile }) {
    const draft = Item.create({ name, description, instructions, imageUrl, groupId, homeHouseId });
    const body = new FormData();
    body.set('name', draft.name);
    body.set('description', draft.description);
    body.set('instructions', draft.instructions);
    body.set('image_url', draft.imageUrl);
    body.set('group', groupId);
    body.set('home_house', homeHouseId);
    body.set('current_house', homeHouseId);
    if (photoFile) body.set('photo', photoFile);
    const record = await this.pb.collection('items').create(body);
    return this.withPhoto(record);
  }

  async move(item, toHouseId) {
    const transfer = item.planTransfer(toHouseId, this.auth.currentUser().id);
    if (!transfer) return item;
    await this.pb.collection('items').update(item.id, { current_house: transfer.toHouseId });
    await this.pb.collection('item_history').create({
      item: item.id,
      from_house: transfer.fromHouseId,
      to_house: transfer.toHouseId,
      moved_by_user: transfer.movedByUserId,
    });
    item.currentHouseId = transfer.toHouseId;
    return item;
  }

  async remove(item, houseId) {
    const bookingRecords = await this.pb.collection('bookings').getFullList({
      filter: where('item', item.id),
    });
    const bookings = bookingRecords.map((record) => Booking.fromRecord(record));
    item.assertRemovable(houseId, bookings);
    const [history, returns] = await Promise.all([
      this.pb.collection('item_history').getFullList({ filter: where('item', item.id) }),
      this.pb.collection('return_requests').getFullList({ filter: where('item', item.id) }),
    ]);
    await Promise.all(history.map((record) => this.pb.collection('item_history').delete(record.id)));
    await Promise.all(bookingRecords.map((record) => this.pb.collection('bookings').delete(record.id)));
    await Promise.all(returns.map((record) => this.pb.collection('return_requests').delete(record.id)));
    await this.pb.collection('items').delete(item.id);
  }

  async history(itemId) {
    const records = await this.pb.collection('item_history').getFullList({
      filter: where('item', itemId),
      sort: 'created',
      expand: 'from_house,to_house,moved_by_user',
    });
    return records.map((record) => ({
      id: record.id,
      created: record.created,
      fromHouse: record.expand?.from_house?.name || 'Maison',
      toHouse: record.expand?.to_house?.name || 'Maison',
      by: record.expand?.moved_by_user?.name || 'Un voisin',
    }));
  }
}
