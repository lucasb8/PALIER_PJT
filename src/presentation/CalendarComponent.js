import { Booking } from '../domain/Booking.js';
import { ICON_TRASH, emptyState, escapeHtml, formatWhen, houseName, iconButton, pageHeading, returnNeed } from './html.js';

const WEEKDAYS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];

function dateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function combine(day, time) {
  const [hours, minutes] = String(time || '00:00').split(':').map(Number);
  const date = new Date(day);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function spanKeys(from, to) {
  return from <= to ? [from, to] : [to, from];
}

function monthGrid(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function hitsDay(booking, day) {
  return hitsSpan(booking, day, day);
}

function hitsSpan(booking, from, to) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  return new Date(booking.startDate) <= end && new Date(booking.endDate) >= start;
}

export class CalendarComponent {
  constructor(root, handlers) {
    this.root = root;
    this.handlers = handlers;
    const today = new Date();
    const key = dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    this.cursor = new Date(today.getFullYear(), today.getMonth(), 1);
    this.rangeFrom = key;
    this.rangeTo = key;
    this.dragging = false;
    this.startTime = '14:00';
    this.endTime = '18:00';
    this.picked = new Set();
    this.seeded = false;
    this.restored = false;
    this.root.addEventListener('pointerdown', (event) => this.onPointerDown(event));
    this.root.addEventListener('pointermove', (event) => this.onPointerMove(event));
    this.root.addEventListener('pointerup', (event) => this.onPointerUp(event));
    this.root.addEventListener('pointercancel', (event) => this.onPointerUp(event));
    this.root.addEventListener('click', (event) => this.onClick(event));
    this.root.addEventListener('change', (event) => this.onChange(event));
    this.root.addEventListener('submit', (event) => this.onSubmit(event));
  }

  render(state) {
    this.state = state;
    if (!this.restored && state.view) {
      this.restored = true;
      this.cursor = new Date(state.view.cursorYear, state.view.cursorMonth, 1);
      this.rangeFrom = state.view.rangeFrom || state.view.selected;
      this.rangeTo = state.view.rangeTo || state.view.selected;
      this.startTime = state.view.startTime;
      this.endTime = state.view.endTime;
      this.picked = new Set(state.view.picked || []);
    }
    if (!this.seeded && state.selectedItemId) {
      this.picked.add(state.selectedItemId);
      this.seeded = true;
    }
    const title = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(this.cursor);
    const days = monthGrid(this.cursor);
    const slot = this.currentSlot();
    const [from, to] = this.orderedRange();
    const several = from.getTime() !== to.getTime();
    const dayBookings = state.bookings
      .filter((booking) => hitsSpan(booking, from, to))
      .sort((left, right) => new Date(left.startDate) - new Date(right.startDate));
    const laterBookings = state.bookings
      .filter((booking) => new Date(booking.endDate) > new Date() && !dayBookings.some((shown) => shown.id === booking.id))
      .sort((left, right) => new Date(left.startDate) - new Date(right.startDate));
    this.root.innerHTML = `
      ${pageHeading('Calendrier', 'Un ou plusieurs jours, et des heures, pour plus tard. Glissez sur le calendrier. Pour l’emprunter maintenant, ouvrez Objets.')}
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <section class="panel p-4 max-sm:order-1 lg:col-start-1 lg:row-start-1">
          <div class="mb-3 flex items-center justify-between gap-3">
            <button type="button" class="btn btn-ghost px-3 py-1" data-month="-1" aria-label="Mois précédent">‹</button>
            <h2 class="font-display text-2xl capitalize">${escapeHtml(title)}</h2>
            <button type="button" class="btn btn-ghost px-3 py-1" data-month="1" aria-label="Mois suivant">›</button>
          </div>
          <div class="cal-grid mb-1">
            ${WEEKDAYS.map((label) => `<span class="cal-weekday px-1 text-center text-xs uppercase tracking-wide text-stone-400">${label}</span>`).join('')}
          </div>
          <div class="cal-grid">
            ${days.map((day) => this.dayCell(day, state)).join('')}
          </div>
          <div class="cal-legend">
            <span><span class="cal-swatch is-mine" aria-hidden="true"></span> Vous concerne</span>
            <span><span class="cal-swatch" aria-hidden="true"></span> Une autre maison</span>
            <span>Glissez pour plusieurs jours.</span>
          </div>
        </section>
        <section class="panel p-4 max-sm:order-4 lg:col-start-2 lg:row-start-1">
          <h2 class="font-display text-2xl">${escapeHtml(this.rangeLabel(from, to))}</h2>
          <form class="mt-4 grid gap-3" data-form="slot">
            <div class="grid grid-cols-2 gap-2">
              <label class="label">Début
                <input class="field" type="time" data-time="startTime" value="${escapeHtml(this.startTime)}" required />
              </label>
              <label class="label">Fin
                <input class="field" type="time" data-time="endTime" value="${escapeHtml(this.endTime)}" required />
              </label>
            </div>
            <fieldset class="grid gap-2">
              <legend class="label">Objets pour ce créneau</legend>
              ${state.items.length ? state.items.map((item) => this.itemChoice(item, state, slot)).join('') : '<p class="text-sm text-stone-500">Aucun objet dans le voisinage.</p>'}
            </fieldset>
            <button class="btn btn-primary" type="submit" ${state.offline || !state.items.length ? 'disabled' : ''}>Réserver la sélection</button>
          </form>
        </section>
        <div class="grid gap-3 max-sm:order-2 lg:col-span-2">
          <h2 class="font-display text-2xl">${several ? 'Ces jours-là' : 'Ce jour-là'}</h2>
          ${dayBookings.length ? dayBookings.map((booking) => this.row(booking)).join('') : emptyState(several ? 'Rien de réservé ces jours.' : 'Rien de réservé ce jour.')}
        </div>
        ${laterBookings.length ? `
          <div class="grid gap-3 max-sm:order-3 lg:col-span-2">
            <h2 class="font-display text-2xl">Les autres créneaux</h2>
            ${laterBookings.map((booking) => this.row(booking)).join('')}
          </div>
        ` : ''}
      </div>
    `;
    this.handlers.onRemember?.(this.snapshot());
  }

  snapshot() {
    return {
      cursorYear: this.cursor.getFullYear(),
      cursorMonth: this.cursor.getMonth(),
      selected: this.rangeFrom,
      rangeFrom: this.rangeFrom,
      rangeTo: this.rangeTo,
      startTime: this.startTime,
      endTime: this.endTime,
      picked: [...this.picked],
    };
  }

  dayCell(day, state) {
    const outside = day.getMonth() !== this.cursor.getMonth();
    const [from, to] = spanKeys(this.rangeFrom, this.rangeTo);
    const key = dateKey(day);
    const selected = key >= from && key <= to;
    const marksData = state.bookings
      .filter((booking) => hitsDay(booking, day))
      .map((booking) => {
        const item = state.items.find((entry) => entry.id === booking.itemId);
        return { name: item?.name || 'Objet', mine: this.concernsUs(booking, item) };
      })
      .sort((left, right) => Number(right.mine) - Number(left.mine));
    const shown = marksData.slice(0, 2);
    const extra = marksData.length - shown.length;
    const marks = marksData.length
      ? `<span class="cal-marks">${shown.map((mark) => `<span class="cal-dot${mark.mine ? ' is-mine' : ''}">${escapeHtml(mark.name)}</span>`).join('')}${extra ? `<span class="cal-dot cal-more">+${extra}</span>` : ''}</span>`
      : '';
    return `
      <button type="button" class="cal-day" data-day="${key}" data-outside="${outside}" data-selected="${selected}">
        <span class="cal-num font-medium">${day.getDate()}</span>
        ${marks}
      </button>
    `;
  }

  itemChoice(item, state, slot) {
    const blocked = this.itemBlocked(item, state, slot);
    const checked = this.picked.has(item.id) && !blocked;
    if (blocked) this.picked.delete(item.id);
    const where = houseName(state.houses, item.currentHouseId);
    return `
      <label class="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-stone-50 px-3 py-2 text-sm">
        <span class="flex min-w-0 items-start gap-2">
          <input class="mt-1" type="checkbox" data-item="${escapeHtml(item.id)}" ${checked ? 'checked' : ''} ${blocked ? 'disabled' : ''} />
          <span>
            <span class="block">${escapeHtml(item.name)}</span>
            <span class="block text-xs text-stone-500">Actuellement : ${escapeHtml(where)}</span>
            ${item.instructions ? `<span class="block text-xs text-amber-950">Consigne : ${escapeHtml(item.instructions)}</span>` : ''}
            ${this.returnLine(item)}
          </span>
        </span>
        ${blocked ? '<span class="text-xs text-red-700">Déjà pris</span>' : ''}
      </label>
    `;
  }

  returnLine(item) {
    const request = (this.state.returnRequests || []).find((entry) => (
      entry.itemId === item.id && entry.status === 'open' && entry.holderHouseId === this.state.activeHouseId
    ));
    if (!request) return '';
    const home = houseName(this.state.houses, request.homeHouseId);
    return `<span class="block text-xs font-medium text-red-700">${escapeHtml(returnNeed(home, { created: request.created }))}</span>`;
  }

  itemBlocked(item, state, slot) {
    if (!slot) return false;
    const candidate = { startDate: slot.start, endDate: slot.end, itemId: item.id };
    return state.bookings.some((booking) => booking.itemId === item.id && Booking.overlaps(candidate, booking));
  }

  orderedRange() {
    const [from, to] = spanKeys(this.rangeFrom, this.rangeTo);
    return [parseKey(from), parseKey(to)];
  }

  rangeLabel(from, to) {
    const full = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (dateKey(from) === dateKey(to)) return full.format(from);
    if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
      return `Du ${from.getDate()} au ${full.format(to)}`;
    }
    return `Du ${full.format(from)} au ${full.format(to)}`;
  }

  currentSlot() {
    const [from, to] = this.orderedRange();
    const start = combine(from, this.startTime);
    const end = combine(to, this.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
    return { start, end };
  }

  concernsUs(booking, item) {
    const houseId = this.state.activeHouseId;
    return booking.houseId === houseId || item?.homeHouseId === houseId;
  }

  row(booking) {
    const item = this.state.items.find((entry) => entry.id === booking.itemId);
    const mine = this.concernsUs(booking, item);
    const canCancel = !this.state.offline && mine;
    return `
      <article class="panel cal-booking ${mine ? 'is-mine' : 'is-other'} flex flex-wrap items-center justify-between gap-3 p-4">
        <div class="min-w-0">
          <h3 class="font-display text-xl">${escapeHtml(item?.name || 'Objet')}</h3>
          <p class="cal-tag${mine ? ' is-mine' : ''}">${mine ? 'Vous concerne' : 'Une autre maison'}</p>
          <p class="text-sm text-stone-600">${escapeHtml(formatWhen(booking.startDate))} → ${escapeHtml(formatWhen(booking.endDate))}</p>
          <p class="mt-1 text-xs text-stone-500">${escapeHtml(houseName(this.state.houses, booking.houseId))}${item ? ` · Actuellement : ${escapeHtml(houseName(this.state.houses, item.currentHouseId))}` : ''}</p>
          ${item ? this.returnLine(item) : ''}
        </div>
        ${canCancel ? iconButton('Retirer', ICON_TRASH, `data-action="cancel" data-id="${escapeHtml(booking.id)}"`, 'icon-danger') : ''}
      </article>
    `;
  }

  onPointerDown(event) {
    const day = event.target.closest('[data-day]');
    if (!day || event.button !== 0) return;
    event.preventDefault();
    this.dragging = true;
    this.rangeFrom = day.dataset.day;
    this.rangeTo = day.dataset.day;
    this.paintRange();
    try {
      day.setPointerCapture(event.pointerId);
    } catch {
      /* Le glisser continue tant que le pointeur reste sur le calendrier. */
    }
  }

  onPointerMove(event) {
    if (!this.dragging) return;
    const day = this.dayAt(event.clientX, event.clientY);
    if (!day || day.dataset.day === this.rangeTo) return;
    this.rangeTo = day.dataset.day;
    this.paintRange();
  }

  dayAt(x, y) {
    const days = this.root.querySelectorAll('[data-day]');
    for (const day of days) {
      const box = day.getBoundingClientRect();
      if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return day;
    }
    return null;
  }

  onPointerUp() {
    if (!this.dragging) return;
    this.dragging = false;
    const [from, to] = spanKeys(this.rangeFrom, this.rangeTo);
    this.rangeFrom = from;
    this.rangeTo = to;
    if (from === to) {
      const day = parseKey(from);
      if (day.getMonth() !== this.cursor.getMonth() || day.getFullYear() !== this.cursor.getFullYear()) {
        this.cursor = new Date(day.getFullYear(), day.getMonth(), 1);
      }
    }
    this.render(this.state);
  }

  paintRange() {
    const [from, to] = spanKeys(this.rangeFrom, this.rangeTo);
    this.root.querySelectorAll('[data-day]').forEach((button) => {
      const key = button.dataset.day;
      button.dataset.selected = key >= from && key <= to ? 'true' : 'false';
    });
  }

  onClick(event) {
    if (event.target.closest('[data-day]')) return;
    const month = event.target.closest('[data-month]');
    if (month) {
      this.cursor = new Date(this.cursor.getFullYear(), this.cursor.getMonth() + Number(month.dataset.month), 1);
      this.render(this.state);
      return;
    }
    const cancel = event.target.closest('[data-action="cancel"]');
    if (!cancel || cancel.disabled) return;
    cancel.disabled = true;
    this.handlers.onCancel(cancel.dataset.id);
  }

  onChange(event) {
    const time = event.target.dataset.time;
    if (time) {
      this[time] = event.target.value;
      this.render(this.state);
      return;
    }
    const itemId = event.target.dataset.item;
    if (!itemId) return;
    if (event.target.checked) this.picked.add(itemId);
    else this.picked.delete(itemId);
  }

  async onSubmit(event) {
    event.preventDefault();
    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const [from, to] = this.orderedRange();
      const start = combine(from, this.startTime);
      const end = combine(to, this.endTime);
      await this.handlers.onCreateMany({
        itemIds: [...this.picked],
        startDate: start,
        endDate: end,
      });
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }
}
