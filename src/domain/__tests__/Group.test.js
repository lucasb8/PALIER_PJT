import { describe, expect, it } from 'vitest';
import { Group, normalizeInviteCode } from '../Group.js';

describe('Groupe de voisinage', () => {
  it('refuse un voisinage sans nom', () => {
    expect(() => Group.create({ name: '   ', createdBy: 'u1' })).toThrow(/nom/i);
  });

  it('génère un code d invitation de 6 ou 8 caractères', () => {
    const group = Group.create({ name: 'Les Voisins du Parc', createdBy: 'u1' });
    expect(group.name).toBe('Les Voisins du Parc');
    expect(group.inviteCode).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    const longer = Group.create({ name: 'Impasse des Lilas', createdBy: 'u1', codeLength: 8 });
    expect(longer.inviteCode).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
  });

  it('normalise le code saisi par un voisin', () => {
    expect(normalizeInviteCode(' ab23cd ')).toBe('AB23CD');
  });
});
