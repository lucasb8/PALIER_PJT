export class Booking {
  constructor({ id = null, itemId, houseId, userId, startDate, endDate }) {
    this.id = id;
    this.itemId = itemId;
    this.houseId = houseId;
    this.userId = userId;
    this.startDate = startDate;
    this.endDate = endDate;
  }

  static create({ itemId, houseId, userId, startDate, endDate }) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!itemId || !houseId || !userId) throw new Error('La réservation est incomplète.');
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error('Les dates de réservation sont invalides.');
    }
    if (end <= start) throw new Error('La fin du créneau doit être postérieure au début.');
    return new Booking({
      itemId,
      houseId,
      userId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
  }

  static fromRecord(record) {
    return new Booking({
      id: record.id,
      itemId: record.item,
      houseId: record.house,
      userId: record.booked_by_user,
      startDate: record.start_date,
      endDate: record.end_date,
    });
  }

  assertCancellable(houseId, homeHouseId = '') {
    const reservedByHouse = Boolean(houseId) && this.houseId === houseId;
    const storedAtHouse = Boolean(houseId) && homeHouseId === houseId;
    if (!reservedByHouse && !storedAtHouse) {
      throw new Error('Cette réservation ne peut pas être annulée.');
    }
  }

  static overlaps(left, right) {
    const start = new Date(left.startDate);
    const end = new Date(left.endDate);
    const otherStart = new Date(right.startDate);
    const otherEnd = new Date(right.endDate);
    return start < otherEnd && otherStart < end;
  }

  static assertNoOverlap(candidate, existing = []) {
    const clash = existing.some((booking) => booking.itemId === candidate.itemId && Booking.overlaps(candidate, booking));
    if (clash) throw new Error('Ce créneau chevauche une réservation existante.');
  }
}
