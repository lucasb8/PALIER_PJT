import { describe, expect, it } from 'vitest';
import { Residence } from '../Residence.js';

describe('Maison d un membre dans un voisinage', () => {
  it('accepte la première maison, existante ou créée', () => {
    const residence = Residence.claim({ groupId: 'parc', houseId: 'maison-12', userId: 'camille' });
    expect(residence.houseId).toBe('maison-12');
    expect(residence.groupId).toBe('parc');
  });

  it('refuse une deuxième maison dans le même voisinage', () => {
    const current = new Residence({ groupId: 'parc', houseId: 'maison-12', userId: 'camille' });
    expect(() => Residence.claim({
      groupId: 'parc',
      houseId: 'maison-14',
      userId: 'camille',
      current,
    })).toThrow(/déjà une maison/i);
  });

  it('accepte une maison dans un autre voisinage', () => {
    const current = new Residence({ groupId: 'parc', houseId: 'maison-12', userId: 'camille' });
    const other = Residence.claim({
      groupId: 'lilas',
      houseId: 'maison-a',
      userId: 'camille',
      current,
    });
    expect(other.groupId).toBe('lilas');
  });
});
