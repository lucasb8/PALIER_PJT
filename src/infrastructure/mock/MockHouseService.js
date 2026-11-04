import { House } from '../../domain/House.js';
import { HouseJoinRequest } from '../../domain/HouseJoinRequest.js';
import { Residence } from '../../domain/Residence.js';

export class MockHouseService {
  constructor(store, auth) {
    this.store = store;
    this.auth = auth;
  }

  async list(groupId) {
    return this.store.houses
      .filter((house) => house.groupId === groupId)
      .sort((left, right) => left.name.localeCompare(right.name, 'fr'));
  }

  async create(groupId, name) {
    const draft = House.create({ name, groupId, createdBy: this.auth.currentUser().id });
    draft.id = this.store.nextId('house');
    this.store.houses.push(draft);
    return draft;
  }

  async residenceFor(groupId, userId = this.auth.currentUser().id) {
    return this.store.residences.find((entry) => entry.groupId === groupId && entry.userId === userId) || null;
  }

  async claim(groupId, houseId, userId = this.auth.currentUser().id) {
    const current = await this.residenceFor(groupId, userId);
    if (current) return current;
    const residence = Residence.claim({ groupId, houseId, userId, current: null });
    residence.id = this.store.nextId('res');
    this.store.residences.push(residence);
    return residence;
  }

  async createAndClaim(groupId, name) {
    if (await this.residenceFor(groupId)) throw new Error('Vous avez déjà une maison dans ce voisinage.');
    const house = await this.create(groupId, name);
    await this.claim(groupId, house.id);
    await this.cancelOwnPending(groupId);
    return house;
  }

  async enter(groupId, houseId, userId = this.auth.currentUser().id) {
    const current = await this.residenceFor(groupId, userId);
    if (!current) return this.claim(groupId, houseId, userId);
    if (current.houseId === houseId) return current;
    current.houseId = houseId;
    return current;
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

  houseIn(groupId, houseId) {
    return this.store.houses.find((house) => house.id === houseId && house.groupId === groupId) || null;
  }

  async listJoins(groupId) {
    const userId = this.auth.currentUser().id;
    return this.store.joinRequests.filter((request) => {
      if (request.groupId !== groupId) return false;
      const house = this.store.houses.find((entry) => entry.id === request.houseId);
      return request.userId === userId || house?.createdBy === userId;
    });
  }

  async pendingFor(groupId, userId = this.auth.currentUser()?.id) {
    if (!userId) return null;
    return this.store.joinRequests.find((request) => (
      request.groupId === groupId && request.userId === userId && request.status === 'pending'
    )) || null;
  }

  async ask(groupId, houseId) {
    const user = this.auth.currentUser();
    const house = this.houseIn(groupId, houseId);
    if (!house) throw new Error('Cette maison est introuvable.');
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
    draft.id = this.store.nextId('join');
    this.store.joinRequests.push(draft);
    return { residence: null, request: draft };
  }

  async accept(requestId) {
    const request = this.store.joinRequests.find((entry) => entry.id === requestId);
    const house = this.store.houses.find((entry) => entry.id === request?.houseId);
    request.accept(this.auth.currentUser().id, house);
    await this.enter(request.groupId, request.houseId, request.userId);
    return request;
  }

  async refuse(requestId) {
    const request = this.store.joinRequests.find((entry) => entry.id === requestId);
    const house = this.store.houses.find((entry) => entry.id === request?.houseId);
    request.refuse(this.auth.currentUser().id, house);
    return request;
  }

  async acknowledge(requestId) {
    const request = this.store.joinRequests.find((entry) => entry.id === requestId);
    const house = this.store.houses.find((entry) => entry.id === request?.houseId);
    request.acknowledge(this.auth.currentUser().id, house);
    return request;
  }

  async cancel(requestId) {
    const request = this.store.joinRequests.find((entry) => entry.id === requestId);
    const userId = this.auth.currentUser().id;
    if (!request || request.userId !== userId || (request.status !== 'pending' && request.status !== 'refused')) {
      throw new Error('Cette demande ne peut pas être retirée.');
    }
    this.store.joinRequests = this.store.joinRequests.filter((entry) => entry.id !== requestId);
  }

  async cancelOwnPending(groupId) {
    const pending = await this.pendingFor(groupId);
    if (pending) await this.cancel(pending.id);
  }
}
