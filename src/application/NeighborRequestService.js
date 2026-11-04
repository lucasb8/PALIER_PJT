import { where } from '../infrastructure/pbFilter.js';

export class NeighborRequestService {
  constructor(pb, auth, options) {
    this.pb = pb;
    this.auth = auth;
    this.options = options;
  }

  async list(groupId) {
    const records = await this.pb.collection(this.options.collection).getFullList({
      filter: where('group', groupId),
      sort: '-created',
    });
    return records.map((record) => this.options.Model.fromRecord(record));
  }

  async create({ title, description, groupId, houseId }) {
    const draft = this.options.Model.create({
      title,
      description,
      groupId,
      requestedByUserId: this.auth.currentUser().id,
      requestedByHouseId: houseId,
    });
    const record = await this.pb.collection(this.options.collection).create({
      title: draft.title,
      description: draft.description,
      group: groupId,
      requested_by_user: draft.requestedByUserId,
      requested_by_house: houseId,
      status: this.options.waiting,
    });
    return this.options.Model.fromRecord(record);
  }

  async answer(request, houseId) {
    const draft = new this.options.Model({ ...request });
    draft[this.options.claim](houseId);
    const record = await this.pb.collection(this.options.collection).update(request.id, {
      status: draft.status,
      [this.options.actorColumn]: draft[this.options.actorField],
    });
    return this.options.Model.fromRecord(record);
  }

  async remove(request, houseId) {
    request.withdraw(houseId);
    await this.pb.collection(this.options.collection).delete(request.id);
  }

  async release(request, houseId) {
    const draft = new this.options.Model({ ...request });
    draft.release(houseId);
    const record = await this.pb.collection(this.options.collection).update(request.id, {
      status: draft.status,
      [this.options.actorColumn]: '',
    });
    return this.options.Model.fromRecord(record);
  }
}
