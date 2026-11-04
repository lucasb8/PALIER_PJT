import { ICON_CLOSE, ICON_TRASH, emptyState, escapeHtml, houseName, iconButton, pageHeading } from './html.js';

function rowOf(request, kind, openStatus, actorField) {
  return {
    id: request.id,
    kind,
    title: request.title,
    description: request.description,
    houseId: request.requestedByHouseId,
    open: request.status === openStatus,
    answeredBy: request[actorField],
  };
}

export class AskComponent {
  constructor(root, handlers) {
    this.root = root;
    this.handlers = handlers;
    this.root.addEventListener('submit', (event) => this.onSubmit(event));
    this.root.addEventListener('click', (event) => this.onClick(event));
  }

  render({ expressRequests, assistanceRequests, houses, activeHouseId, offline }) {
    this.activeHouseId = activeHouseId;
    this.offline = offline;
    const rows = this.rows(expressRequests, assistanceRequests);
    const cards = rows.length
      ? rows.map((row) => this.card(row, houses)).join('')
      : emptyState('Aucune demande. Un œuf, un colis : une autre maison peut répondre.');
    this.root.innerHTML = `
      ${pageHeading('Demander', 'Un œuf, un colis, un coup de main. Une autre maison peut s’en charger.')}
      <form class="row-form mb-6">
        <input class="field" name="title" required maxlength="120" placeholder="3 œufs, réceptionner un colis" aria-label="Demande" />
        <button class="btn btn-primary" type="submit" ${offline ? 'disabled' : ''}>Demander</button>
      </form>
      <div class="grid gap-3">${cards}</div>
    `;
  }

  rows(expressRequests, assistanceRequests) {
    const express = (expressRequests || []).map((request) => rowOf(request, 'express', 'pending', 'fulfilledByHouseId'));
    const assistance = (assistanceRequests || []).map((request) => rowOf(request, 'assistance', 'open', 'resolvedByHouseId'));
    return [...express, ...assistance].sort((left, right) => Number(!left.open) - Number(!right.open) || left.title.localeCompare(right.title, 'fr'));
  }

  card(row, houses) {
    const mine = row.houseId === this.activeHouseId;
    const state = row.open
      ? 'En attente'
      : `Répondu par ${escapeHtml(houseName(houses, row.answeredBy))}`;
    const answer = row.open && !mine && !this.offline
      ? `<button type="button" class="btn btn-primary" data-action="answer" data-kind="${row.kind}" data-id="${escapeHtml(row.id)}">Je m’en occupe</button>`
      : '';
    const release = !row.open && row.answeredBy === this.activeHouseId && !this.offline
      ? iconButton('Je ne peux plus', ICON_CLOSE, `data-action="release" data-kind="${row.kind}" data-id="${escapeHtml(row.id)}"`, 'icon-cross')
      : '';
    const remove = mine && !this.offline
      ? iconButton('Retirer', ICON_TRASH, `data-action="remove" data-kind="${row.kind}" data-id="${escapeHtml(row.id)}"`, 'icon-danger')
      : '';
    return `
      <article class="panel flex flex-wrap items-center justify-between gap-3 p-4">
        <div class="min-w-0 flex-1">
          <h3 class="font-display text-xl">${escapeHtml(row.title)}</h3>
          ${row.description ? `<p class="text-sm text-stone-600">${escapeHtml(row.description)}</p>` : ''}
          <p class="mt-1 text-xs text-stone-500">${escapeHtml(houseName(houses, row.houseId))} · ${state}</p>
        </div>
        <div class="ml-auto flex items-center gap-1">${answer}${release}${remove}</div>
      </article>
    `;
  }

  async onSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await this.handlers.onCreate({ title: form.elements.title.value });
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }

  async onClick(event) {
    const button = event.target.closest('[data-action="answer"], [data-action="release"], [data-action="remove"]');
    if (!button || button.disabled) return;
    button.disabled = true;
    try {
      const run = {
        release: this.handlers.onRelease,
        remove: this.handlers.onRemove,
      }[button.dataset.action] || this.handlers.onAnswer;
      await run(button.dataset.kind, button.dataset.id);
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }
}
