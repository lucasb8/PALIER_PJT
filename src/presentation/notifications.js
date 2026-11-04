import { escapeHtml, houseName, returnNeed } from './html.js';

export function buildNotifications({ userId, houses = [], items = [], returnRequests = [], joinRequests = [], activeHouseId }) {
  const rows = [
    ...returnNotes({ returnRequests, items, houses, activeHouseId }),
    ...joinNotes({ joinRequests, houses, userId }),
  ];
  return {
    count: rows.length,
    html: rows.length ? rows.join('') : '<p class="note-line">Aucune notification.</p>',
  };
}

function returnNotes({ returnRequests, items, houses, activeHouseId }) {
  return returnRequests
    .filter((request) => request.status === 'open' && request.holderHouseId === activeHouseId)
    .map((request) => {
      const item = items.find((entry) => entry.id === request.itemId);
      const home = houseName(houses, request.homeHouseId);
      const text = returnNeed(home, { itemName: item?.name || 'cet objet', created: request.created });
      return `<p class="note-line note-alert">${escapeHtml(text)}</p>`;
    });
}

function joinNotes({ joinRequests, houses, userId }) {
  const nameOf = (houseId) => houseName(houses, houseId);
  const cards = [];
  const requests = [...joinRequests].sort((left, right) => (
    Number(right.status === 'pending') - Number(left.status === 'pending')
  ));
  for (const request of requests) {
    const house = houses.find((entry) => entry.id === request.houseId);
    const label = nameOf(request.houseId);
    const person = request.userName || 'Un voisin';
    if (house?.createdBy === userId && request.userId !== userId && request.status === 'pending') {
      cards.push(noteRow(
        `${person} souhaite rejoindre ${label}.`,
        `<button type="button" class="btn btn-primary px-3 py-1" data-join="accept" data-id="${escapeHtml(request.id)}">Accepter</button>
         <button type="button" class="btn btn-ghost px-3 py-1" data-join="refuse" data-id="${escapeHtml(request.id)}">Refuser</button>`,
        'note-wait',
      ));
    } else if (house?.createdBy === userId && request.userId !== userId && request.status === 'accepted' && !request.seen) {
      cards.push(noteRow(
        `${person} a rejoint ${label}.`,
        `<button type="button" class="btn btn-ghost px-3 py-1" data-join="dismiss" data-id="${escapeHtml(request.id)}">OK</button>`,
        'note-done',
      ));
    } else if (request.userId === userId && request.status === 'pending') {
      cards.push(noteRow(
        `Demande envoyée pour ${label}. Son créateur doit accepter.`,
        `<button type="button" class="btn btn-ghost px-3 py-1" data-join="cancel" data-id="${escapeHtml(request.id)}">Annuler</button>`,
        'note-wait',
      ));
    } else if (request.userId === userId && request.status === 'refused') {
      cards.push(noteRow(
        `${label} a refusé la demande.`,
        `<button type="button" class="btn btn-ghost px-3 py-1" data-join="cancel" data-id="${escapeHtml(request.id)}">OK</button>`,
        'note-wait',
      ));
    }
  }
  return cards;
}

function noteRow(text, actions, tone) {
  return `<div class="note-line ${tone}"><p>${escapeHtml(text)}</p><span class="mt-2 flex flex-wrap gap-2">${actions}</span></div>`;
}
