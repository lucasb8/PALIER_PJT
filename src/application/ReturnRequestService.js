import { ReturnRequest } from '../domain/ReturnRequest.js';
import { and, where } from '../infrastructure/pbFilter.js';

export class ReturnRequestService {
  constructor(pb, auth) {
    this.pb = pb;
    this.auth = auth;
  }

  async list(groupId) {
    const records = await this.pb.collection('return_requests').getFullList({
      filter: where('group', groupId),
      sort: '-created',
    });
    return records.map((record) => ReturnRequest.fromRecord(record));
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
    const record = await this.pb.collection('return_requests').create({
      item: draft.itemId,
      group: draft.groupId,
      home_house: draft.homeHouseId,
      holder_house: draft.holderHouseId,
      requested_by_user: draft.requestedByUserId,
      status: 'open',
    });
    return ReturnRequest.fromRecord(record);
  }

  async closeForItem(itemId) {
    const records = await this.pb.collection('return_requests').getFullList({
      filter: and(where('item', itemId), where('status', 'open')),
    });
    await Promise.all(records.map((record) => this.pb.collection('return_requests').update(record.id, { status: 'done' })));
  }
}
