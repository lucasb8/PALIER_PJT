export class ReturnRequest {
  constructor({
    id = null,
    itemId,
    groupId,
    homeHouseId,
    holderHouseId,
    requestedByUserId,
    status = 'open',
    created = '',
  }) {
    this.id = id;
    this.itemId = itemId;
    this.groupId = groupId;
    this.homeHouseId = homeHouseId;
    this.holderHouseId = holderHouseId;
    this.requestedByUserId = requestedByUserId;
    this.status = status;
    this.created = created;
  }

  static holderSlotOpen(item, bookings = [], now = new Date()) {
    return bookings.some((booking) => {
      const house = booking.houseId || booking.house;
      if (!item?.currentHouseId || house !== item.currentHouseId) return false;
      const end = new Date(booking.endDate || booking.end_date || booking.end);
      return !Number.isNaN(end.getTime()) && end > now;
    });
  }

  static ask({ item, groupId, userId, activeHouseId, existing = [], bookings = [], now = new Date() }) {
    if (!item?.id || !item.homeHouseId || !item.currentHouseId || !groupId || !userId) {
      throw new Error('La demande de retour est incomplète.');
    }
    if (activeHouseId !== item.homeHouseId) {
      throw new Error('Seule la maison de rangement peut demander le retour.');
    }
    if (item.currentHouseId === item.homeHouseId) {
      throw new Error('Cet objet est déjà dans son rangement.');
    }
    if (ReturnRequest.holderSlotOpen(item, bookings, now)) {
      throw new Error('Le retour se demande une fois le créneau terminé.');
    }
    const pending = existing.some((request) => request.itemId === item.id && request.status === 'open');
    if (pending) throw new Error('Un retour est déjà demandé pour cet objet.');
    return new ReturnRequest({
      itemId: item.id,
      groupId,
      homeHouseId: item.homeHouseId,
      holderHouseId: item.currentHouseId,
      requestedByUserId: userId,
      status: 'open',
    });
  }

  static fromRecord(record) {
    return new ReturnRequest({
      id: record.id,
      itemId: record.item,
      groupId: record.group,
      homeHouseId: record.home_house,
      holderHouseId: record.holder_house,
      requestedByUserId: record.requested_by_user,
      status: record.status,
      created: record.created || '',
    });
  }
}
