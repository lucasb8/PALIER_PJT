import { assertWithdraw, claim, recordFields, releaseClaim, requireParties, requireTitle } from './neighborRequest.js';

const ACTOR = 'resolvedByHouseId';

export class AssistanceRequest {
  constructor({
    id = null,
    title,
    description = '',
    groupId,
    requestedByUserId,
    requestedByHouseId,
    status = 'open',
    resolvedByHouseId = '',
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.groupId = groupId;
    this.requestedByUserId = requestedByUserId;
    this.requestedByHouseId = requestedByHouseId;
    this.status = status;
    this.resolvedByHouseId = resolvedByHouseId;
  }

  static create({ title, description = '', groupId, requestedByUserId, requestedByHouseId }) {
    const trimmed = requireTitle(title, 'Décrivez le coup de main en quelques mots.');
    requireParties({ groupId, requestedByUserId, requestedByHouseId }, 'La demande d’entraide est incomplète.');
    return new AssistanceRequest({
      title: trimmed,
      description: String(description ?? '').trim(),
      groupId,
      requestedByUserId,
      requestedByHouseId,
      status: 'open',
    });
  }

  static fromRecord(record) {
    return new AssistanceRequest(recordFields(record, 'resolved_by_house', ACTOR));
  }

  resolve(houseId) {
    return claim(this, houseId, {
      done: 'resolved',
      actorField: ACTOR,
      already: 'Ce coup de main est déjà clos.',
      missing: 'La maison qui a aidé est requise.',
    });
  }

  withdraw(houseId) {
    assertWithdraw(this, houseId);
  }

  release(houseId) {
    return releaseClaim(this, houseId, {
      done: 'resolved',
      waiting: 'open',
      actorField: ACTOR,
      already: 'Ce coup de main est déjà ouvert.',
    });
  }
}
