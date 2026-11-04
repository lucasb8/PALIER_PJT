import { describe, expect, it } from 'vitest';
import { ExpressRequest } from '../ExpressRequest.js';

function request() {
  return new ExpressRequest({
    id: 'expr-1',
    title: '3 œufs',
    groupId: 'groupe',
    requestedByUserId: 'user-leo',
    requestedByHouseId: 'maison-18',
    status: 'pending',
  });
}

describe('Demande express', () => {
  it('laisse la maison qui s’en occupe rouvrir', () => {
    const taken = request().fulfill('maison-12');
    const pending = taken.release('maison-12');
    expect(pending.status).toBe('pending');
    expect(pending.fulfilledByHouseId).toBe('');
  });

  it('refuse qu’une autre maison se désiste', () => {
    const taken = request().fulfill('maison-12');
    expect(() => taken.release('maison-14')).toThrow(/maison qui s’en occupe/);
  });

  it('refuse de rouvrir une demande déjà en attente', () => {
    expect(() => request().release('maison-12')).toThrow(/déjà en attente/);
  });

  it('laisse la maison qui a demandé la retirer', () => {
    expect(() => request().withdraw('maison-18')).not.toThrow();
  });

  it('refuse qu’une autre maison retire la demande', () => {
    expect(() => request().withdraw('maison-12')).toThrow(/maison qui a demandé/);
  });
});
