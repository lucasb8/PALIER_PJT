import { describe, expect, it } from 'vitest';
import { House } from '../House.js';
import { HouseJoinRequest } from '../HouseJoinRequest.js';
import { Residence } from '../Residence.js';

const house = new House({ id: 'maison-12', name: 'Maison 12', groupId: 'parc', createdBy: 'camille' });

describe('Demande pour rejoindre une maison', () => {
  it('exige l’accord du créateur', () => {
    const request = HouseJoinRequest.ask({
      groupId: 'parc',
      houseId: 'maison-12',
      userId: 'karim',
      userName: 'Karim',
      house,
    });
    expect(request.status).toBe('pending');
    expect(() => request.accept('nadia', house)).toThrow(/créateur/);
    request.accept('camille', house);
    expect(request.status).toBe('accepted');
    expect(request.seen).toBe(false);
  });

  it('laisse le créateur noter que la personne a rejoint', () => {
    const request = new HouseJoinRequest({
      id: 'join-1',
      groupId: 'parc',
      houseId: 'maison-12',
      userId: 'nadia',
      userName: 'Nadia',
      status: 'accepted',
    });
    request.acknowledge('camille', house);
    expect(request.seen).toBe(true);
  });

  it('refuse une demande si la personne y habite déjà', () => {
    const residence = new Residence({ groupId: 'parc', houseId: 'maison-12', userId: 'karim' });
    expect(() => HouseJoinRequest.ask({
      groupId: 'parc',
      houseId: 'maison-12',
      userId: 'karim',
      house,
      residence,
    })).toThrow(/déjà/);
  });

  it('garde une seule demande en attente', () => {
    const pending = new HouseJoinRequest({
      id: 'join-1',
      groupId: 'parc',
      houseId: 'maison-14',
      userId: 'karim',
      status: 'pending',
    });
    expect(() => HouseJoinRequest.ask({
      groupId: 'parc',
      houseId: 'maison-12',
      userId: 'karim',
      house,
      pending,
    })).toThrow(/en attente/);
    expect(HouseJoinRequest.ask({
      groupId: 'parc',
      houseId: 'maison-12',
      userId: 'karim',
      house,
      pending: new HouseJoinRequest({ ...pending, houseId: 'maison-12' }),
    }).id).toBe('join-1');
  });

  it('exige un créateur à la création d’une maison', () => {
    expect(() => House.create({ name: 'Maison 16', groupId: 'parc' })).toThrow(/créateur/);
    expect(House.create({ name: 'Maison 16', groupId: 'parc', createdBy: 'camille' }).createdBy).toBe('camille');
  });
});
