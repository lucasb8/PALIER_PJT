import { assertWithdraw, claim, recordFields, releaseClaim, requireParties, requireTitle } from './neighborRequest.js';

const ACTOR = 'fulfilledByHouseId';

export class ExpressRequest {
  constructor({
    id = null,
    title,
    description = '',
    groupId,
    requestedByUserId,
    requestedByHouseId,
    status = 'pending',
    fulfilledByHouseId = '',
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.groupId = groupId;
    this.requestedByUserId = requestedByUserId;
    this.requestedByHouseId = requestedByHouseId;
    this.status = status;
    this.fulfilledByHouseId = fulfilledByHouseId;
  }

  static create({ title, description = '', groupId, requestedByUserId, requestedByHouseId }) {
    const trimmed = requireTitle(title, 'Indiquez ce qu’il vous manque.');
    requireParties({ groupId, requestedByUserId, requestedByHouseId }, 'La demande de dépannage est incomplète.');
    return new ExpressRequest({
      title: trimmed,
      description: String(description ?? '').trim(),
      groupId,
      requestedByUserId,
      requestedByHouseId,
      status: 'pending',
    });
  }

  static fromRecord(record) {
    return new ExpressRequest(recordFields(record, 'fulfilled_by_house', ACTOR));
  }

  fulfill(houseId) {
    return claim(this, houseId, {
      done: 'fulfilled',
      actorField: ACTOR,
      already: 'Cette demande est déjà pourvue.',
      missing: 'La maison qui dépanne est requise.',
    });
  }

  withdraw(houseId) {
    assertWithdraw(this, houseId);
  }

  release(houseId) {
    return releaseClaim(this, houseId, {
      done: 'fulfilled',
      waiting: 'pending',
      actorField: ACTOR,
      already: 'Cette demande est déjà en attente.',
    });
  }
}
