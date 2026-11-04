export class HouseJoinRequest {
  constructor({
    id = null,
    groupId,
    houseId,
    userId,
    userName = '',
    status = 'pending',
    seen = false,
  }) {
    this.id = id;
    this.groupId = groupId;
    this.houseId = houseId;
    this.userId = userId;
    this.userName = userName;
    this.status = status;
    this.seen = seen;
  }

  static ask({ groupId, houseId, userId, userName = '', house, residence, pending }) {
    if (!groupId || !houseId || !userId) throw new Error('La demande est incomplète.');
    if (!house || house.groupId !== groupId) throw new Error('Cette maison est introuvable.');
    if (!house.createdBy) throw new Error('Cette maison n’a personne pour l’accepter.');
    if (house.createdBy === userId) throw new Error('Vous avez créé cette maison.');
    if (residence?.houseId === houseId) throw new Error('Vous habitez déjà cette maison.');
    if (pending?.status === 'pending' && pending.houseId === houseId) return pending;
    if (pending?.status === 'pending') throw new Error('Une demande est déjà en attente.');
    return new HouseJoinRequest({ groupId, houseId, userId, userName, status: 'pending', seen: false });
  }

  accept(actorId, house) {
    this.assertCreator(actorId, house);
    if (this.status !== 'pending') throw new Error('Cette demande n’est plus en attente.');
    this.status = 'accepted';
    this.seen = false;
  }

  refuse(actorId, house) {
    this.assertCreator(actorId, house);
    if (this.status !== 'pending') throw new Error('Cette demande n’est plus en attente.');
    this.status = 'refused';
  }

  acknowledge(actorId, house) {
    this.assertCreator(actorId, house);
    if (this.status !== 'accepted') throw new Error('Personne n’a encore rejoint cette maison.');
    this.seen = true;
  }

  assertCreator(actorId, house) {
    if (!house || house.id !== this.houseId || house.createdBy !== actorId) {
      throw new Error('Seul le créateur de la maison peut répondre.');
    }
  }

  static fromRecord(record) {
    return new HouseJoinRequest({
      id: record.id,
      groupId: record.group,
      houseId: record.house,
      userId: record.user,
      userName: record.user_name || record.userName || '',
      status: record.status || 'pending',
      seen: Boolean(record.seen),
    });
  }
}
