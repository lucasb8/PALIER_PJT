import { describe, expect, it } from 'vitest';
import { Booking } from '../Booking.js';

const slot = (itemId, startDate, endDate, houseId = 'h1') => new Booking({
  id: 'b1',
  itemId,
  houseId,
  userId: 'u1',
  startDate,
  endDate,
});

describe('Réservations', () => {
  it('refuse un créneau qui chevauche une réservation du même objet', () => {
    const existing = slot('item-1', '2026-05-02T14:00:00', '2026-05-02T18:00:00');
    const candidate = Booking.create({
      itemId: 'item-1',
      houseId: 'h2',
      userId: 'u2',
      startDate: '2026-05-02T16:00:00',
      endDate: '2026-05-02T19:00:00',
    });
    expect(() => Booking.assertNoOverlap(candidate, [existing])).toThrow(/chevauche/i);
  });

  it('accepte deux créneaux qui se suivent sans se chevaucher', () => {
    const existing = slot('item-1', '2026-05-02T14:00:00', '2026-05-02T18:00:00');
    const candidate = Booking.create({
      itemId: 'item-1',
      houseId: 'h2',
      userId: 'u2',
      startDate: '2026-05-02T18:00:00',
      endDate: '2026-05-02T20:00:00',
    });
    expect(() => Booking.assertNoOverlap(candidate, [existing])).not.toThrow();
  });

  it('ignore une réservation qui concerne un autre objet', () => {
    const existing = slot('item-2', '2026-05-02T14:00:00', '2026-05-02T18:00:00');
    const candidate = Booking.create({
      itemId: 'item-1',
      houseId: 'h2',
      userId: 'u2',
      startDate: '2026-05-02T15:00:00',
      endDate: '2026-05-02T17:00:00',
    });
    expect(() => Booking.assertNoOverlap(candidate, [existing])).not.toThrow();
  });

  it('laisse la maison du créneau ou la maison de rangement l’annuler', () => {
    const booking = slot('item-1', '2026-05-02T14:00:00', '2026-05-02T18:00:00', 'maison-18');
    expect(() => booking.assertCancellable('maison-18', 'maison-12')).not.toThrow();
    expect(() => booking.assertCancellable('maison-12', 'maison-12')).not.toThrow();
    expect(() => booking.assertCancellable('maison-14', 'maison-12')).toThrow(/annulée/);
  });

  it('refuse une fin antérieure ou égale au début', () => {
    expect(() => Booking.create({
      itemId: 'item-1',
      houseId: 'h1',
      userId: 'u1',
      startDate: '2026-05-02T18:00:00',
      endDate: '2026-05-02T14:00:00',
    })).toThrow(/postérieure/i);
  });
});
