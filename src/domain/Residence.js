export class Residence {
  constructor({ id = null, groupId, houseId, userId }) {
    this.id = id;
    this.groupId = groupId;
    this.houseId = houseId;
    this.userId = userId;
  }

  static claim({ groupId, houseId, userId, current = null }) {
    if (!groupId || !houseId || !userId) throw new Error('La maison est incomplète.');
    if (current && current.groupId === groupId) {
      throw new Error('Vous avez déjà une maison dans ce voisinage.');
    }
    return new Residence({ groupId, houseId, userId });
  }

  static fromRecord(record) {
    return new Residence({
      id: record.id,
      groupId: record.group,
      houseId: record.house,
      userId: record.user,
    });
  }
}
