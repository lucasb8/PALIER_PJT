import { describe, expect, it } from 'vitest';
import { AssistanceRequest } from '../AssistanceRequest.js';

function request(status = 'open') {
  return new AssistanceRequest({
    id: 'help-1',
    title: 'Réceptionner un colis',
    groupId: 'groupe',
    requestedByUserId: 'user-nadia',
    requestedByHouseId: 'maison-14',
    status,
  });
}

describe('Coup de main', () => {
  it('enregistre la maison qui a aidé', () => {
    const done = request().resolve('maison-12');
    expect(done.status).toBe('resolved');
    expect(done.resolvedByHouseId).toBe('maison-12');
  });

  it('refuse que la maison demandeuse se réponde', () => {
    expect(() => request().resolve('maison-14')).toThrow(/autre maison/);
  });

  it('refuse de clore une demande déjà close', () => {
    expect(() => request('resolved').resolve('maison-12')).toThrow(/déjà clos/);
  });

  it('laisse la maison qui s’en occupe rouvrir', () => {
    const taken = request().resolve('maison-12');
    const open = taken.release('maison-12');
    expect(open.status).toBe('open');
    expect(open.resolvedByHouseId).toBe('');
  });

  it('refuse qu’une autre maison se désiste', () => {
    const taken = request().resolve('maison-12');
    expect(() => taken.release('maison-18')).toThrow(/maison qui s’en occupe/);
  });

  it('laisse la maison qui a demandé la retirer', () => {
    expect(() => request().withdraw('maison-14')).not.toThrow();
    expect(() => request().withdraw('maison-12')).toThrow(/maison qui a demandé/);
  });
});
