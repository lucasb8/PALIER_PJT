import { describe, expect, it } from 'vitest';
import { Proposal } from '../Proposal.js';

const base = { title: 'Aspirateur', groupId: 'groupe', createdByUserId: 'user-1' };

describe('Achat', () => {
  it('garde un lien https', () => {
    const proposal = Proposal.create({ ...base, url: 'example.com/fiche' });
    expect(proposal.url).toBe('https://example.com/fiche');
  });

  it('accepte une proposition sans lien', () => {
    expect(Proposal.create(base).url).toBe('');
  });

  it('refuse un lien qui n’est pas une adresse', () => {
    expect(() => Proposal.create({ ...base, url: 'pas un lien' })).toThrow(/invalide/);
  });

  it('laisse retirer seulement à la personne qui a proposé', () => {
    const proposal = Proposal.create(base);
    expect(() => proposal.assertRemovable('user-1')).not.toThrow();
    expect(() => proposal.assertRemovable('user-2')).toThrow(/proposé/);
  });

  it('compte une maison intéressée une seule fois', () => {
    const votes = [
      { houseId: 'maison-14', userId: 'nadia', isApproved: true },
      { houseId: 'maison-14', userId: 'sam', isApproved: true },
      { houseId: 'maison-18', userId: 'léo', isApproved: false },
    ];
    expect(Proposal.interested(votes).map((vote) => vote.houseId)).toEqual(['maison-14']);
  });
});
