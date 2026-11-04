import { House } from '../domain/House.js';
import { HouseJoinRequest } from '../domain/HouseJoinRequest.js';
import { Residence } from '../domain/Residence.js';
import { and, where } from '../infrastructure/pbFilter.js';

export class HouseService {
  constructor(pb, auth) {
    this.pb = pb;
    this.auth = auth;
  }

  async list(groupId) {
    const records = await this.pb.collection('houses').getFullList({
      filter: where('group', groupId),
      sort: 'name',
    });
    return records.map((record) => House.fromRecord(record));
  }

  async create(groupId, name) {
    const userId = this.auth.currentUser().id;
    const draft = House.create({ name, groupId, createdBy: userId });
    const record = await this.pb.collection('houses').create({
      name: draft.name,
      group: groupId,
      created_by: userId,
    });
    return House.fromRecord(record);
  }

  async residenceFor(groupId, userId = this.auth.currentUser().id) {
    const records = await this.pb.collection('house_residents').getFullList({
      filter: and(where('group', groupId), where('user', userId)),
    });
    return records[0] ? Residence.fromRecord(records[0]) : null;
  }

  async claim(groupId, houseId, userId = this.auth.currentUser().id) {
    const current = userId === this.auth.currentUser().id ? await this.residenceFor(groupId) : await this.residenceFor(groupId, userId);
    if (current) return current;
    Residence.claim({ groupId, houseId, userId, current: null });
    const record = await this.pb.collection('house_residents').create({
      group: groupId,
      house: houseId,
      user: userId,
    });
    return Residence.fromRecord(record);
  }

  async createAndClaim(groupId, name) {
    if (await this.residenceFor(groupId)) {
      throw new Error('Vous avez déjà une maison dans ce voisinage.');
    }
    const house = await this.create(groupId, name);
    await this.claim(groupId, house.id);
    await this.cancelOwnPending(groupId);
    return house;
  }

  async enter(groupId, houseId, userId = this.auth.currentUser().id) {
    const current = await this.residenceFor(groupId, userId);
    if (!current) return this.claim(groupId, houseId, userId);
    if (current.houseId === houseId) return current;
    const record = await this.pb.collection('house_residents').update(current.id, { house: houseId });
    return Residence.fromRecord(record);
  }

  async moveTo(groupId, houseId) {
    return this.ask(groupId, houseId);
  }

  async createAndLive(groupId, name) {
    const house = await this.create(groupId, name);
    await this.enter(groupId, house.id);
    await this.cancelOwnPending(groupId);
    return house;
  }

  async listJoins(groupId) {
    const records = await this.pb.collection('house_join_requests').getFullList({
      filter: where('group', groupId),
      sort: '-created',
    });
    return records.map((record) => HouseJoinRequest.fromRecord(record));
  }

  async pendingFor(groupId, userId = this.auth.currentUser()?.id) {
    if (!userId) return null;
    const records = await this.pb.collection('house_join_requests').getFullList({
      filter: and(where('group', groupId), where('user', userId), where('status', 'pending')),
    });
    return records[0] ? HouseJoinRequest.fromRecord(records[0]) : null;
  }

  async ask(groupId, houseId) {
    const user = this.auth.currentUser();
    const house = House.fromRecord(await this.pb.collection('houses').getOne(houseId));
    if (house.groupId !== groupId) throw new Error('Cette maison est introuvable.');
    const residence = await this.residenceFor(groupId);
    if (house.createdBy === user.id) {
      if (residence?.houseId === houseId) throw new Error('Vous habitez déjà cette maison.');
      const next = await this.enter(groupId, houseId);
      return { residence: next, request: null };
    }
    const pending = await this.pendingFor(groupId, user.id);
    const draft = HouseJoinRequest.ask({
      groupId,
      houseId,
      userId: user.id,
      userName: user.name,
      house,
      residence,
      pending,
    });
    if (draft.id) return { residence: null, request: draft };
    const record = await this.pb.collection('house_join_requests').create({
      group: groupId,
      house: houseId,
      user: user.id,
      user_name: draft.userName,
      status: 'pending',
      seen: false,
    });
    return { residence: null, request: HouseJoinRequest.fromRecord(record) };
  }

  async accept(requestId) {
    const request = await this.loadJoin(requestId);
    const house = House.fromRecord(await this.pb.collection('houses').getOne(request.houseId));
    request.accept(this.auth.currentUser().id, house);
    await this.enter(request.groupId, request.houseId, request.userId);
    const record = await this.pb.collection('house_join_requests').update(request.id, {
      status: 'accepted',
      seen: false,
    });
    return HouseJoinRequest.fromRecord(record);
  }

  async refuse(requestId) {
    const request = await this.loadJoin(requestId);
    const house = House.fromRecord(await this.pb.collection('houses').getOne(request.houseId));
    request.refuse(this.auth.currentUser().id, house);
    const record = await this.pb.collection('house_join_requests').update(request.id, { status: 'refused' });
    return HouseJoinRequest.fromRecord(record);
  }

  async acknowledge(requestId) {
    const request = await this.loadJoin(requestId);
    const house = House.fromRecord(await this.pb.collection('houses').getOne(request.houseId));
    request.acknowledge(this.auth.currentUser().id, house);
    const record = await this.pb.collection('house_join_requests').update(request.id, { seen: true });
    return HouseJoinRequest.fromRecord(record);
  }

  async cancel(requestId) {
    const request = await this.loadJoin(requestId);
    const userId = this.auth.currentUser().id;
    if (request.userId !== userId || (request.status !== 'pending' && request.status !== 'refused')) {
      throw new Error('Cette demande ne peut pas être retirée.');
    }
    await this.pb.collection('house_join_requests').delete(request.id);
  }

  async loadJoin(requestId) {
    const record = await this.pb.collection('house_join_requests').getOne(requestId);
    return HouseJoinRequest.fromRecord(record);
  }

  async cancelOwnPending(groupId) {
    const pending = await this.pendingFor(groupId);
    if (pending) await this.cancel(pending.id);
  }
}
