import { ReturnRequest } from './ReturnRequest.js';

export const ITEM_STATUS = {
  DISPONIBLE: 'DISPONIBLE',
  CHEZ_VOUS: 'CHEZ_VOUS',
  EMPRUNTE: 'EMPRUNTE',
  RESERVE: 'RESERVE',
  INDISPONIBLE: 'INDISPONIBLE',
};

function bookingEnd(booking) {
  return new Date(booking.endDate || booking.end_date || booking.end);
}

function bookingStart(booking) {
  return new Date(booking.startDate || booking.start_date || booking.start || 0);
}

function bookingHouse(booking) {
  return booking?.houseId || booking?.house || '';
}

export class Item {
  constructor({
    id = null,
    name,
    description = '',
    instructions = '',
    imageUrl = '',
    photoUrl = '',
    photo = '',
    groupId = null,
    homeHouseId = null,
    currentHouseId = null,
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.instructions = instructions;
    this.imageUrl = imageUrl;
    this.photoUrl = photoUrl;
    this.photo = photo;
    this.groupId = groupId;
    this.homeHouseId = homeHouseId;
    this.currentHouseId = currentHouseId;
  }

  static create({ name, description = '', instructions = '', imageUrl = '', groupId, homeHouseId }) {
    const trimmed = String(name ?? '').trim();
    if (!trimmed) throw new Error('Le nom de l’objet est requis.');
    if (!groupId || !homeHouseId) throw new Error('L’objet doit avoir un voisinage et une maison d’origine.');
    return new Item({
      name: trimmed,
      description: String(description ?? '').trim(),
      instructions: String(instructions ?? '').trim(),
      imageUrl: String(imageUrl ?? '').trim(),
      groupId,
      homeHouseId,
      currentHouseId: homeHouseId,
    });
  }

  static fromRecord(record) {
    return new Item({
      id: record.id,
      name: record.name,
      description: record.description || '',
      instructions: record.instructions || '',
      imageUrl: record.image_url || '',
      photo: record.photo || '',
      groupId: record.group,
      homeHouseId: record.home_house,
      currentHouseId: record.current_house,
    });
  }

  /**
   * Sans maison d’origine, le test unitaire compare seulement la maison active.
   * Avec une maison d’origine : Disponible dans son rangement, Chez vous si l’objet
   * a été déplacé ici, Emprunté s’il est ailleurs, Réservé s’il est à sa place
   * mais qu’un créneau non terminé existe, Indisponible s’il est chez une maison
   * qui l’a aussi mis dans son calendrier.
   */
  getStatus(activeHouseId, bookings = [], now = new Date()) {
    const atActiveHouse = this.currentHouseId === activeHouseId;
    if (!this.homeHouseId) {
      return atActiveHouse ? ITEM_STATUS.CHEZ_VOUS : ITEM_STATUS.EMPRUNTE;
    }

    const atHome = this.currentHouseId === this.homeHouseId;
    if (!atHome && heldOnCalendar(bookings, this.currentHouseId, now)) return ITEM_STATUS.INDISPONIBLE;
    if (!atHome && atActiveHouse) return ITEM_STATUS.CHEZ_VOUS;
    if (!atHome) return ITEM_STATUS.EMPRUNTE;
    if (hasOpenReservation(bookings, now)) return ITEM_STATUS.RESERVE;
    return ITEM_STATUS.DISPONIBLE;
  }

  planTransfer(toHouseId, userId) {
    if (!toHouseId) throw new Error('La maison de destination est requise.');
    if (toHouseId === this.currentHouseId) return null;
    return {
      itemId: this.id,
      fromHouseId: this.currentHouseId,
      toHouseId,
      movedByUserId: userId,
    };
  }

  removalRefusal(houseId, bookings = [], now = new Date()) {
    if (!this.homeHouseId || this.homeHouseId !== houseId) {
      return 'Seule la maison de rangement peut retirer cet objet.';
    }
    if (this.currentHouseId !== this.homeHouseId) return 'Il est encore sorti. Ramenez-le d’abord.';
    if (this.openHold(bookings, now)) return 'Une maison a encore un créneau.';
    return '';
  }

  assertRemovable(houseId, bookings = [], now = new Date()) {
    const reason = this.removalRefusal(houseId, bookings, now);
    if (reason) throw new Error(reason);
  }

  /**
   * Premier créneau non terminé. C’est cette maison qui peut emporter l’objet.
   */
  openHold(bookings = [], now = new Date()) {
    return bookings
      .filter((booking) => {
        if (booking.itemId && this.id && booking.itemId !== this.id) return false;
        const end = bookingEnd(booking);
        return !Number.isNaN(end.getTime()) && end > now;
      })
      .sort((left, right) => bookingStart(left) - bookingStart(right))[0] || null;
  }

  /**
   * prendre : une autre maison emprunte, et le prochain créneau est le sien ou il n’y en a pas.
   * rentrer : la maison de rangement note que l’objet est revenu, une fois le créneau du détenteur fini.
   * rapporter : la maison qui l’a le ramène.
   */
  moveChoice(activeHouseId, bookings = [], now = new Date()) {
    const away = Boolean(this.homeHouseId) && this.currentHouseId !== this.homeHouseId;
    const here = this.currentHouseId === activeHouseId;
    if (here && away) return 'rapporter';
    const reservedBy = bookingHouse(this.openHold(bookings, now));
    const lockedOut = Boolean(reservedBy) && reservedBy !== activeHouseId;
    const holderLocked = away && ReturnRequest.holderSlotOpen(this, bookings, now);
    if (this.homeHouseId && this.homeHouseId === activeHouseId && away && !holderLocked && !lockedOut) return 'rentrer';
    if (!here && !lockedOut && this.homeHouseId !== activeHouseId) return 'prendre';
    return '';
  }
}

function hasOpenReservation(bookings, now) {
  return bookings.some((booking) => {
    const end = bookingEnd(booking);
    return !Number.isNaN(end.getTime()) && end > now;
  });
}

function heldOnCalendar(bookings, houseId, now) {
  return bookings.some((booking) => {
    const house = booking.houseId || booking.house;
    if (!houseId || house !== houseId) return false;
    const end = bookingEnd(booking);
    return !Number.isNaN(end.getTime()) && end > now;
  });
}
