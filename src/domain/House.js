export class House {
  constructor({ id = null, name, groupId, createdBy = '' }) {
    this.id = id;
    this.name = name;
    this.groupId = groupId;
    this.createdBy = createdBy;
  }

  static create({ name, groupId, createdBy }) {
    const trimmed = String(name ?? '').trim();
    if (!trimmed) throw new Error('Le nom de la maison est requis.');
    if (!groupId) throw new Error('La maison doit appartenir à un voisinage.');
    if (!createdBy) throw new Error('La maison doit avoir un créateur.');
    return new House({ name: trimmed, groupId, createdBy });
  }

  static fromRecord(record) {
    return new House({
      id: record.id,
      name: record.name,
      groupId: record.group,
      createdBy: record.created_by || record.createdBy || '',
    });
  }
}
