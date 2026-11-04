import { AssistanceRequest } from '../../domain/AssistanceRequest.js';
import { Booking } from '../../domain/Booking.js';
import { ExpressRequest } from '../../domain/ExpressRequest.js';
import { Group } from '../../domain/Group.js';
import { House } from '../../domain/House.js';
import { HouseJoinRequest } from '../../domain/HouseJoinRequest.js';
import { Residence } from '../../domain/Residence.js';
import { Item } from '../../domain/Item.js';
import { Proposal, Vote } from '../../domain/Proposal.js';
import { ReturnRequest } from '../../domain/ReturnRequest.js';
import { User } from '../../domain/User.js';
import { shiftDays } from './dates.js';

export class MockStore {
  constructor() {
    this.seq = 100;
    this.user = new User({
      id: 'user-camille',
      name: 'Camille Martin',
      email: 'camille.martin@example.com',
    });
    this.groups = [
      new Group({ id: 'group-parc', name: 'Les voisins du parc', inviteCode: 'PARC24', createdBy: 'user-camille' }),
      new Group({ id: 'group-lilas', name: 'Impasse des lilas', inviteCode: 'LILAS8', createdBy: 'user-camille' }),
      new Group({ id: 'group-tilleuls', name: 'Cour des tilleuls', inviteCode: 'TILLE8', createdBy: 'user-nadia' }),
    ];
    this.members = [
      { id: 'member-1', groupId: 'group-parc', userId: 'user-camille' },
      { id: 'member-2', groupId: 'group-lilas', userId: 'user-camille' },
    ];
    this.residences = [
      new Residence({ id: 'res-parc', groupId: 'group-parc', houseId: 'house-12', userId: 'user-camille' }),
      new Residence({ id: 'res-nadia', groupId: 'group-parc', houseId: 'house-12', userId: 'user-nadia' }),
      new Residence({ id: 'res-lilas', groupId: 'group-lilas', houseId: 'house-a', userId: 'user-camille' }),
    ];
    this.houses = [
      new House({ id: 'house-12', name: 'Maison 12', groupId: 'group-parc', createdBy: 'user-camille' }),
      new House({ id: 'house-14', name: 'Maison 14', groupId: 'group-parc', createdBy: 'user-nadia' }),
      new House({ id: 'house-18', name: 'Maison 18', groupId: 'group-parc', createdBy: 'user-nadia' }),
      new House({ id: 'house-a', name: 'Maison A', groupId: 'group-lilas', createdBy: 'user-camille' }),
      new House({ id: 'house-b', name: 'Maison B', groupId: 'group-lilas', createdBy: 'user-nadia' }),
      new House({ id: 'house-tilleuls', name: 'Maison du fond', groupId: 'group-tilleuls', createdBy: 'user-nadia' }),
    ];
    this.joinRequests = [
      new HouseJoinRequest({
        id: 'join-nadia',
        groupId: 'group-parc',
        houseId: 'house-12',
        userId: 'user-nadia',
        userName: 'Nadia Cherif',
        status: 'accepted',
        seen: false,
      }),
      new HouseJoinRequest({
        id: 'join-karim',
        groupId: 'group-parc',
        houseId: 'house-12',
        userId: 'user-karim',
        userName: 'Karim Bernard',
        status: 'pending',
        seen: false,
      }),
    ];
    this.items = [
      new Item({
        id: 'item-plancha',
        name: 'Plancha',
        description: 'Plaque et bouteille de gaz dans le coffre bleu.',
        photoUrl: '/mock/plancha.jpg',
        groupId: 'group-parc',
        homeHouseId: 'house-12',
        currentHouseId: 'house-12',
      }),
      new Item({
        id: 'item-perceuse',
        name: 'Perceuse',
        description: 'Mèches dans la mallette.',
        photoUrl: '/mock/perceuse.jpg',
        groupId: 'group-parc',
        homeHouseId: 'house-14',
        currentHouseId: 'house-12',
      }),
      new Item({
        id: 'item-crepiere',
        name: 'Crêpière',
        description: 'Se rince à l’eau chaude.',
        instructions: 'Ne jamais passer au lave-vaisselle.',
        photoUrl: '/mock/crepiere.jpg',
        groupId: 'group-parc',
        homeHouseId: 'house-12',
        currentHouseId: 'house-18',
      }),
      new Item({
        id: 'item-ponceuse',
        name: 'Ponceuse',
        description: 'Papier de verre dans le sac.',
        photoUrl: '/mock/ponceuse.jpg',
        groupId: 'group-parc',
        homeHouseId: 'house-14',
        currentHouseId: 'house-14',
      }),
      new Item({
        id: 'item-gaufrier',
        name: 'Gaufrier',
        description: 'Deux plaques, se démonte.',
        photoUrl: '/mock/gaufrier.jpg',
        groupId: 'group-parc',
        homeHouseId: 'house-18',
        currentHouseId: 'house-18',
      }),
      new Item({
        id: 'item-fer',
        name: 'Fer à souder',
        description: 'Pour les petits fils seulement.',
        photoUrl: '/mock/fer.jpg',
        groupId: 'group-parc',
        homeHouseId: 'house-12',
        currentHouseId: 'house-14',
      }),
      new Item({
        id: 'item-echelle',
        name: 'Échelle',
        description: 'Cinq marches, dans le local vélos.',
        photoUrl: '/mock/echelle.jpg',
        groupId: 'group-lilas',
        homeHouseId: 'house-a',
        currentHouseId: 'house-b',
      }),
    ];
    this.history = [
      {
        id: 'hist-1',
        itemId: 'item-perceuse',
        created: shiftDays(-2, 11),
        fromHouse: 'Maison 14',
        toHouse: 'Maison 12',
        by: 'Camille Martin',
      },
      {
        id: 'hist-2',
        itemId: 'item-crepiere',
        created: shiftDays(-5, 9),
        fromHouse: 'Maison 12',
        toHouse: 'Maison 18',
        by: 'Nadia Benali',
      },
      {
        id: 'hist-3',
        itemId: 'item-echelle',
        created: shiftDays(-1, 16),
        fromHouse: 'Maison A',
        toHouse: 'Maison B',
        by: 'Camille Martin',
      },
      {
        id: 'hist-4',
        itemId: 'item-fer',
        created: shiftDays(-2, 14),
        fromHouse: 'Maison 12',
        toHouse: 'Maison 14',
        by: 'Nadia Cherif',
      },
    ];
    this.express = [
      new ExpressRequest({
        id: 'expr-oeufs',
        title: '3 œufs',
        description: 'Pour ce soir, si vous en avez.',
        groupId: 'group-parc',
        requestedByUserId: 'user-camille',
        requestedByHouseId: 'house-12',
        status: 'pending',
      }),
      new ExpressRequest({
        id: 'expr-farine',
        title: 'Farine',
        description: 'Un bol, type 55.',
        groupId: 'group-parc',
        requestedByUserId: 'user-nadia',
        requestedByHouseId: 'house-14',
        status: 'pending',
      }),
      new ExpressRequest({
        id: 'expr-carton',
        title: 'Petit carton',
        description: 'Point relais, demain.',
        groupId: 'group-parc',
        requestedByUserId: 'user-leo',
        requestedByHouseId: 'house-18',
        status: 'fulfilled',
        fulfilledByHouseId: 'house-12',
      }),
    ];
    this.assistance = [
      new AssistanceRequest({
        id: 'help-colis',
        title: 'Réceptionner un colis',
        description: 'Entre 14 h et 18 h, je ne suis pas là.',
        groupId: 'group-parc',
        requestedByUserId: 'user-nadia',
        requestedByHouseId: 'house-14',
        status: 'open',
      }),
      new AssistanceRequest({
        id: 'help-meuble',
        title: 'Aider à déplacer un meuble',
        description: 'Buffet en place, merci.',
        groupId: 'group-parc',
        requestedByUserId: 'user-camille',
        requestedByHouseId: 'house-12',
        status: 'resolved',
        resolvedByHouseId: 'house-14',
      }),
      new AssistanceRequest({
        id: 'help-arrosage',
        title: 'Arroser les jardinières',
        description: 'Vendredi, si la maison est vide.',
        groupId: 'group-lilas',
        requestedByUserId: 'user-camille',
        requestedByHouseId: 'house-a',
        status: 'open',
      }),
    ];
    this.returnRequests = [
      new ReturnRequest({
        id: 'return-perceuse',
        itemId: 'item-perceuse',
        groupId: 'group-parc',
        homeHouseId: 'house-14',
        holderHouseId: 'house-12',
        requestedByUserId: 'user-nadia',
        status: 'open',
        created: shiftDays(0, 8),
      }),
    ];
    this.bookings = [
      new Booking({
        id: 'book-ponceuse',
        itemId: 'item-ponceuse',
        houseId: 'house-18',
        userId: 'user-leo',
        startDate: shiftDays(1, 14),
        endDate: shiftDays(1, 18),
      }),
      new Booking({
        id: 'book-crepiere',
        itemId: 'item-crepiere',
        houseId: 'house-18',
        userId: 'user-leo',
        startDate: shiftDays(0, 9),
        endDate: shiftDays(2, 18),
      }),
      new Booking({
        id: 'book-fer',
        itemId: 'item-fer',
        houseId: 'house-14',
        userId: 'user-nadia',
        startDate: shiftDays(-2, 14),
        endDate: shiftDays(-1, 18),
      }),
    ];
    this.proposals = [
      new Proposal({
        id: 'prop-aspi',
        title: 'Aspirateur vapeur',
        description: 'Pour les parties communes, à tour de rôle.',
        url: 'https://example.com/aspirateur-vapeur',
        estimatedCost: 180,
        groupId: 'group-parc',
        createdByUserId: 'user-nadia',
      }),
      new Proposal({
        id: 'prop-broyeur',
        title: 'Broyeur de végétaux',
        description: 'Une fois par saison, dans le local.',
        estimatedCost: 240,
        groupId: 'group-parc',
        createdByUserId: 'user-camille',
      }),
    ];
    this.votes = [
      new Vote({ id: 'vote-1', proposalId: 'prop-aspi', houseId: 'house-14', userId: 'user-nadia', isApproved: true }),
      new Vote({ id: 'vote-1b', proposalId: 'prop-aspi', houseId: 'house-14', userId: 'user-sam', isApproved: true }),
    ];
  }

  nextId(prefix) {
    this.seq += 1;
    return `${prefix}-${this.seq}`;
  }

  houseName(id) {
    return this.houses.find((house) => house.id === id)?.name || 'Maison';
  }
}
