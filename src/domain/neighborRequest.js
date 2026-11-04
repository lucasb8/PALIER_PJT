export function requireTitle(title, message) {
  const trimmed = String(title ?? '').trim();
  if (!trimmed) throw new Error(message);
  return trimmed;
}

export function requireParties({ groupId, requestedByUserId, requestedByHouseId }, message) {
  if (!groupId || !requestedByUserId || !requestedByHouseId) throw new Error(message);
}

export function recordFields(record, actorColumn, actorField) {
  return {
    id: record.id,
    title: record.title,
    description: record.description || '',
    groupId: record.group,
    requestedByUserId: record.requested_by_user,
    requestedByHouseId: record.requested_by_house,
    status: record.status,
    [actorField]: record[actorColumn] || '',
  };
}

export function claim(request, houseId, { done, actorField, already, missing }) {
  if (request.status === done) throw new Error(already);
  if (!houseId) throw new Error(missing);
  if (houseId === request.requestedByHouseId) {
    throw new Error('Une autre maison du voisinage doit répondre.');
  }
  request.status = done;
  request[actorField] = houseId;
  return request;
}

export function releaseClaim(request, houseId, { done, waiting, actorField, already }) {
  if (request.status !== done) throw new Error(already);
  if (!houseId || houseId !== request[actorField]) {
    throw new Error('Seule la maison qui s’en occupe peut se désister.');
  }
  request.status = waiting;
  request[actorField] = '';
  return request;
}

export function assertWithdraw(request, houseId) {
  if (!houseId || houseId !== request.requestedByHouseId) {
    throw new Error('Seule la maison qui a demandé peut la retirer.');
  }
}
