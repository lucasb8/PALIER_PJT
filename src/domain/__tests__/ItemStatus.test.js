import { describe, it, expect } from 'vitest';
import { Item } from '../Item.js';

describe('Règles de statut d un objet (TDD)', () => {
  it('doit indiquer que l objet est "Chez vous" si la maison actuelle correspond à la maison active', () => {
    const item = new Item({ id: '1', name: 'Perceuse', currentHouseId: 'house-A' });
    expect(item.getStatus('house-A', [])).toBe('CHEZ_VOUS');
  });

  it('doit indiquer qu un objet est "Emprunté" si la maison actuelle diffère de la maison active', () => {
    const item = new Item({ id: '1', name: 'Perceuse', currentHouseId: 'house-B' });
    expect(item.getStatus('house-A', [])).toBe('EMPRUNTE');
  });

  it('indique Disponible quand l objet est dans son rangement, même vu depuis une autre maison', () => {
    const item = new Item({
      id: '1',
      name: 'Plancha',
      homeHouseId: 'house-A',
      currentHouseId: 'house-A',
    });
    expect(item.getStatus('house-B', [])).toBe('DISPONIBLE');
  });

  it('indique Chez vous quand l objet a quitté son rangement pour la maison active', () => {
    const item = new Item({
      id: '1',
      name: 'Plancha',
      homeHouseId: 'house-A',
      currentHouseId: 'house-B',
    });
    expect(item.getStatus('house-B', [])).toBe('CHEZ_VOUS');
  });

  it('indique Emprunté quand l objet est chez une autre maison', () => {
    const item = new Item({
      id: '1',
      name: 'Plancha',
      homeHouseId: 'house-A',
      currentHouseId: 'house-B',
    });
    expect(item.getStatus('house-C', [])).toBe('EMPRUNTE');
  });

  it('indique Indisponible quand la maison qui a l objet l a mis dans son calendrier', () => {
    const item = new Item({
      id: '1',
      name: 'Crêpière',
      homeHouseId: 'house-A',
      currentHouseId: 'house-B',
    });
    const bookings = [{ houseId: 'house-B', endDate: '2099-05-02T18:00:00.000Z' }];
    expect(item.getStatus('house-A', bookings, new Date('2026-01-01T00:00:00.000Z'))).toBe('INDISPONIBLE');
  });

  it('reste Emprunté si le créneau appartient à une autre maison', () => {
    const item = new Item({
      id: '1',
      name: 'Crêpière',
      homeHouseId: 'house-A',
      currentHouseId: 'house-B',
    });
    const bookings = [{ houseId: 'house-C', endDate: '2099-05-02T18:00:00.000Z' }];
    expect(item.getStatus('house-A', bookings, new Date('2026-01-01T00:00:00.000Z'))).toBe('EMPRUNTE');
  });

  it('indique Réservé quand l objet est à sa place mais qu un créneau n est pas terminé', () => {
    const item = new Item({
      id: '1',
      name: 'Plancha',
      homeHouseId: 'house-A',
      currentHouseId: 'house-A',
    });
    const bookings = [{ endDate: '2099-05-02T18:00:00.000Z' }];
    expect(item.getStatus('house-A', bookings, new Date('2026-01-01T00:00:00.000Z'))).toBe('RESERVE');
  });

  it('laisse prendre un objet réservé seulement à la maison du créneau', () => {
    const item = new Item({
      id: '1',
      name: 'Ponceuse',
      homeHouseId: 'house-A',
      currentHouseId: 'house-A',
    });
    const bookings = [{ houseId: 'house-C', endDate: '2099-05-02T18:00:00.000Z' }];
    const now = new Date('2026-01-01T00:00:00.000Z');
    expect(item.moveChoice('house-B', bookings, now)).toBe('');
    expect(item.moveChoice('house-C', bookings, now)).toBe('prendre');
    expect(item.moveChoice('house-A', bookings, now)).toBe('');
  });

  it('propose à la maison de rangement de noter le retour, et au détenteur de rapporter', () => {
    const item = new Item({
      id: '1',
      name: 'Perceuse',
      homeHouseId: 'house-A',
      currentHouseId: 'house-B',
    });
    expect(item.moveChoice('house-A', [])).toBe('rentrer');
    expect(item.moveChoice('house-B', [])).toBe('rapporter');
    expect(item.moveChoice('house-C', [])).toBe('prendre');
    const reserved = [{ houseId: 'house-C', endDate: '2099-05-02T18:00:00.000Z' }];
    expect(item.moveChoice('house-A', reserved, new Date('2026-01-01T00:00:00.000Z'))).toBe('');
    expect(item.moveChoice('house-C', reserved, new Date('2026-01-01T00:00:00.000Z'))).toBe('prendre');
  });

  it('retient le retour tant que le détenteur a un créneau ouvert', () => {
    const item = new Item({
      id: '1',
      name: 'Crêpière',
      homeHouseId: 'house-A',
      currentHouseId: 'house-B',
    });
    const bookings = [{ houseId: 'house-B', endDate: '2099-05-02T18:00:00.000Z' }];
    const now = new Date('2026-01-01T00:00:00.000Z');
    expect(item.moveChoice('house-A', bookings, now)).toBe('');
    expect(item.moveChoice('house-C', bookings, now)).toBe('');
    expect(item.moveChoice('house-B', bookings, now)).toBe('rapporter');
  });

  it('laisse retirer un objet rangé, sans créneau à venir', () => {
    const item = new Item({
      id: '1',
      name: 'Plancha',
      homeHouseId: 'house-A',
      currentHouseId: 'house-A',
    });
    const past = [{ itemId: '1', endDate: '2020-01-01T18:00:00.000Z' }];
    expect(item.removalRefusal('house-A', past, new Date('2026-01-01T00:00:00.000Z'))).toBe('');
  });

  it('refuse de retirer un objet sorti, réservé, ou vu depuis une autre maison', () => {
    const away = new Item({
      id: '1',
      name: 'Perceuse',
      homeHouseId: 'house-A',
      currentHouseId: 'house-B',
    });
    expect(away.removalRefusal('house-A', [])).toMatch(/sorti/);
    expect(away.removalRefusal('house-B', [])).toMatch(/rangement/);
    const reserved = new Item({
      id: '1',
      name: 'Fer',
      homeHouseId: 'house-A',
      currentHouseId: 'house-A',
    });
    const booking = [{ itemId: '1', endDate: '2099-01-01T18:00:00.000Z' }];
    expect(reserved.removalRefusal('house-A', booking, new Date('2026-01-01T00:00:00.000Z'))).toMatch(/créneau/);
  });
});
