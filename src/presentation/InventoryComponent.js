import { errorMessage } from '../infrastructure/errors.js';
import { AddItemComponent } from './AddItemComponent.js';
import { ReturnRequest } from '../domain/ReturnRequest.js';
import { ICON_BRING, ICON_CALENDAR, ICON_DONE, ICON_HISTORY, ICON_PLUS, ICON_RETURN, ICON_TAKE, ICON_TRASH, choiceField, emptyState, escapeHtml, formatWhen, houseName, iconButton, pageHeading, returnNeed, statusBadge, visual } from './html.js';

const FILTERS = [
  ['ALL', 'Tout'],
  ['LIBRE', 'Libre'],
  ['PRIS', 'Pris'],
];

export class InventoryComponent {
  constructor(root, handlers) {
    this.root = root;
    this.handlers = handlers;
    this.query = '';
    this.status = 'ALL';
    this.root.addEventListener('input', (event) => {
      if (event.target.matches('[data-search]')) {
        this.query = event.target.value;
        this.paintList();
      }
    });
    this.root.addEventListener('change', (event) => {
      if (event.target.matches('[data-status]')) {
        this.status = event.target.value;
        this.paintList();
      }
    });
    this.root.addEventListener('click', (event) => this.onClick(event));
    this.root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeAdd();
    });
  }

  render(state) {
    this.state = state;
    const filters = choiceField(FILTERS.map(([value, label]) => ({ value, label })), {
      value: this.status,
      attrs: 'data-status',
      label: 'Filtrer par statut',
    });
    this.root.innerHTML = `
      ${pageHeading('Objets', 'Libre : on peut le prendre. Pris : une maison l’a, ou un créneau le réserve.')}
      <p class="-mt-2 mb-4 text-sm text-stone-600"><button type="button" class="underline decoration-stone-300 underline-offset-2" data-action="guide">Que veulent dire les pastilles et les boutons ?</button></p>
      <div class="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <input data-search class="field" value="${escapeHtml(this.query)}" placeholder="Rechercher un objet" aria-label="Recherche" />
          ${filters}
        </div>
        <button type="button" class="btn btn-primary w-full sm:w-auto" data-action="add" ${state.offline ? 'disabled' : ''}>${ICON_PLUS}Ajouter un objet</button>
      </div>
      <div data-notices></div>
      <div data-list></div>
      <div data-dialog class="fixed inset-0 z-40 hidden overflow-y-auto" hidden>
        <button type="button" class="absolute inset-0 bg-stone-900/40" data-close aria-label="Fermer"></button>
        <div class="relative z-10 mx-auto mb-6 mt-24 w-[min(100%-2rem,36rem)] sm:mt-10" role="dialog" aria-modal="true" aria-labelledby="add-item-title">
          <p data-dialog-error class="mb-3 hidden rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-800"></p>
          <div data-slot="item"></div>
        </div>
      </div>
    `;
    this.paintList();
  }

  openReturn(item) {
    return (this.state.returnRequests || []).find((request) => request.itemId === item.id && request.status === 'open');
  }

  itemBookings(item) {
    return (this.state.bookings || []).filter((booking) => booking.itemId === item.id);
  }

  paintNotices() {
    const box = this.root.querySelector('[data-notices]');
    if (!box) return;
    const notes = (this.state.returnRequests || [])
      .filter((request) => request.status === 'open' && request.holderHouseId === this.state.activeHouseId)
      .map((request) => {
        const item = this.state.items.find((entry) => entry.id === request.itemId);
        const home = houseName(this.state.houses, request.homeHouseId);
        const text = returnNeed(home, { itemName: item?.name || 'cet objet', created: request.created });
        return `<p class="mb-3 rounded-2xl bg-red-50 px-4 py-2 text-sm font-medium text-red-800">${escapeHtml(text)}</p>`;
      });
    box.innerHTML = notes.join('');
  }

  upcoming(item) {
    const now = Date.now();
    return this.state.bookings
      .filter((booking) => booking.itemId === item.id && new Date(booking.endDate).getTime() > now)
      .sort((left, right) => new Date(left.startDate) - new Date(right.startDate))[0];
  }

  visibleItems() {
    const needle = this.query.trim().toLowerCase();
    return this.state.items
      .map((item) => ({
        item,
        status: item.getStatus(this.state.activeHouseId, this.state.bookings.filter((booking) => booking.itemId === item.id)),
      }))
      .filter(({ item, status }) => {
        const simple = status === 'DISPONIBLE' ? 'LIBRE' : 'PRIS';
        const matchesStatus = this.status === 'ALL' || this.status === simple;
        const matchesQuery = !needle || `${item.name} ${item.description} ${item.instructions}`.toLowerCase().includes(needle);
        return matchesStatus && matchesQuery;
      })
      .sort((left, right) => left.item.name.localeCompare(right.item.name, 'fr'));
  }

  paintList() {
    const list = this.root.querySelector('[data-list]');
    const cards = this.visibleItems();
    if (!cards.length) {
      list.innerHTML = emptyState('Aucun objet pour cette recherche.');
      this.paintNotices();
      return;
    }
    list.innerHTML = `<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${cards.map(({ item, status }) => this.card(item, status)).join('')}</div>`;
    this.paintNotices();
  }

  card(item, status) {
    const home = houseName(this.state.houses, item.homeHouseId);
    const current = houseName(this.state.houses, item.currentHouseId);
    const next = this.upcoming(item);
    const slotHouse = next?.houseId ? houseName(this.state.houses, next.houseId) : '';
    const slot = next
      ? `<p class="text-xs text-stone-500">Prochain créneau : ${escapeHtml(formatWhen(next.startDate))}${slotHouse ? ` · ${escapeHtml(slotHouse)}` : ''}</p>`
      : '';
    const recall = this.openReturn(item);
    const ownsIt = item.homeHouseId && item.homeHouseId === this.state.activeHouseId;
    const awayFromHome = item.currentHouseId !== item.homeHouseId;
    const id = escapeHtml(item.id);
    const choice = this.handlers.offline ? '' : item.moveChoice(this.state.activeHouseId, this.itemBookings(item));
    const moveTo = choice === 'prendre' ? this.state.activeHouseId : item.homeHouseId;
    const move = {
      prendre: ['Prendre chez moi', ICON_TAKE],
      rapporter: ['Rapporter', ICON_BRING],
      rentrer: ['C’est rentré', ICON_DONE],
    }[choice];
    const action = move
      ? iconButton(move[0], move[1], `data-action="move" data-id="${id}" data-to="${escapeHtml(moveTo)}"`, 'icon-primary')
      : '';
    let recallNote = '';
    let askReturn = '';
    if (recall && ownsIt) {
      const when = formatWhen(recall.created);
      recallNote = `<p class="text-sm font-medium text-red-700">Retour demandé à ${escapeHtml(current)}${when ? ` depuis le ${escapeHtml(when)}` : ''}.</p>`;
    } else if (recall && item.currentHouseId === this.state.activeHouseId) {
      const text = returnNeed(home, { created: recall.created });
      recallNote = `<p class="text-sm font-medium text-red-700">${escapeHtml(text)}</p>`;
    } else if (ownsIt && awayFromHome && ReturnRequest.holderSlotOpen(item, this.itemBookings(item))) {
      recallNote = '<p class="text-sm text-stone-500">Le retour se demande après le créneau.</p>';
    } else if (!this.handlers.offline && ownsIt && awayFromHome) {
      askReturn = iconButton('Demander le retour', ICON_RETURN, `data-action="ask-return" data-id="${id}"`);
    }
    const remove = !this.handlers.offline && !item.removalRefusal(this.state.activeHouseId, this.itemBookings(item))
      ? iconButton('Retirer', ICON_TRASH, `data-action="remove" data-id="${id}"`, 'icon-danger')
      : '';
    return `
      <article class="panel flex flex-col gap-3 p-4">
        <div class="flex items-start gap-3">
          ${visual(item)}
          <div class="min-w-0">
            <h3 class="font-display text-xl leading-tight">${escapeHtml(item.name)}</h3>
            <p class="mt-1 text-xs text-stone-500">Rangement : ${escapeHtml(home)}</p>
            <p class="text-xs text-stone-500">Actuellement : ${escapeHtml(current)}</p>
          </div>
        </div>
        ${statusBadge(status)}
        ${slot}
        ${item.description ? `<p class="text-sm text-stone-600">${escapeHtml(item.description)}</p>` : ''}
        ${item.instructions ? `<p class="text-sm text-amber-950">Consigne : ${escapeHtml(item.instructions)}</p>` : ''}
        ${recallNote}
        <div class="mt-auto flex items-center justify-end gap-1">
          ${action}
          ${askReturn}
          ${iconButton('Calendrier', ICON_CALENDAR, `data-action="reserve" data-id="${id}"`)}
          ${iconButton('Parcours', ICON_HISTORY, `data-action="history" data-id="${id}"`)}
          ${remove}
        </div>
        <div class="hidden space-y-1 text-sm text-stone-600" data-history="${escapeHtml(item.id)}"></div>
      </article>
    `;
  }

  openAdd() {
    const dialog = this.root.querySelector('[data-dialog]');
    const error = dialog.querySelector('[data-dialog-error]');
    error.textContent = '';
    error.classList.add('hidden');
    dialog.classList.remove('hidden');
    dialog.hidden = false;
    const slot = dialog.querySelector('[data-slot="item"]');
    if (!this.addForm) {
      this.addForm = new AddItemComponent(slot, {
        onCreate: async (payload) => {
          try {
            await this.handlers.onAdd(payload);
          } catch (failure) {
            error.textContent = errorMessage(failure);
            error.classList.remove('hidden');
            throw failure;
          }
        },
      });
    }
    this.addForm.render({
      houses: this.state.houses,
      activeHouseId: this.state.activeHouseId,
      plain: false,
      close: true,
    });
    slot.querySelector('[name="name"]')?.focus();
  }

  closeAdd() {
    const dialog = this.root.querySelector('[data-dialog]');
    if (!dialog || dialog.hidden) return;
    dialog.classList.add('hidden');
    dialog.hidden = true;
  }

  async onClick(event) {
    if (event.target.closest('[data-close]')) {
      this.closeAdd();
      return;
    }
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    if (button.dataset.action === 'add') {
      this.openAdd();
      return;
    }
    if (button.dataset.action === 'guide') {
      this.handlers.onGuide?.();
      return;
    }
    const id = button.dataset.id;
    if (button.dataset.action === 'history') {
      await this.toggleHistory(id);
      return;
    }
    button.disabled = true;
    try {
      if (button.dataset.action === 'move') await this.handlers.onMove(id, button.dataset.to);
      if (button.dataset.action === 'reserve') await this.handlers.onReserve(id);
      if (button.dataset.action === 'ask-return') await this.handlers.onAskReturn(id);
      if (button.dataset.action === 'remove') await this.handlers.onRemove(id);
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }

  async toggleHistory(id) {
    const box = this.root.querySelector(`[data-history="${CSS.escape(id)}"]`);
    if (!box) return;
    if (box.dataset.loaded === '1') {
      box.hidden = !box.hidden;
      box.classList.toggle('hidden', box.hidden);
      return;
    }
    box.hidden = false;
    box.classList.remove('hidden');
    box.textContent = 'Chargement du fil…';
    try {
      const entries = await this.handlers.onHistory(id);
      box.dataset.loaded = '1';
      box.innerHTML = entries.length
        ? entries.map((entry) => `<p>${escapeHtml(entry.fromHouse)} → ${escapeHtml(entry.toHouse)} · ${escapeHtml(formatWhen(entry.created))} · ${escapeHtml(entry.by)}</p>`).join('')
        : '<p>Pas encore de déplacement.</p>';
    } catch (error) {
      box.textContent = errorMessage(error);
    }
  }
}
