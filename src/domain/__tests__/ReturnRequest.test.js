import { describe, expect, it } from 'vitest';
import { Item } from '../Item.js';
import { ReturnRequest } from '../ReturnRequest.js';

const item = new Item({
  id: 'crepiere',
  name: 'Crêpière',
  homeHouseId: 'maison-12',
  currentHouseId: 'maison-18',
});

describe('Demande de retour', () => {
  it('autorise la maison de rangement à demander le retour', () => {
    const request = ReturnRequest.ask({
      item,
      groupId: 'parc',
      userId: 'camille',
      activeHouseId: 'maison-12',
    });
    expect(request.holderHouseId).toBe('maison-18');
    expect(request.status).toBe('open');
  });

  it('refuse une autre maison', () => {
    expect(() => ReturnRequest.ask({
      item,
      groupId: 'parc',
      userId: 'leo',
      activeHouseId: 'maison-18',
    })).toThrow(/maison de rangement/i);
  });

  it('refuse pendant le créneau de la maison qui a l objet', () => {
    const bookings = [{ houseId: 'maison-18', endDate: '2099-05-02T18:00:00.000Z' }];
    expect(() => ReturnRequest.ask({
      item,
      groupId: 'parc',
      userId: 'camille',
      activeHouseId: 'maison-12',
      bookings,
      now: new Date('2026-01-01T00:00:00.000Z'),
    })).toThrow(/créneau terminé/i);
  });

  it('autorise la maison de rangement une fois le créneau terminé', () => {
    const bookings = [{ houseId: 'maison-18', endDate: '2020-05-02T18:00:00.000Z' }];
    const request = ReturnRequest.ask({
      item,
      groupId: 'parc',
      userId: 'camille',
      activeHouseId: 'maison-12',
      bookings,
      now: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(request.holderHouseId).toBe('maison-18');
  });

  it('refuse si l objet est déjà rentré', () => {
    const home = new Item({ ...item, currentHouseId: 'maison-12' });
    expect(() => ReturnRequest.ask({
      item: home,
      groupId: 'parc',
      userId: 'camille',
      activeHouseId: 'maison-12',
    })).toThrow(/déjà dans son rangement/i);
  });
});
