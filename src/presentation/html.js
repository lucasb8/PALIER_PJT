export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function formatWhen(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function returnNeed(home, { itemName = '', created = '' } = {}) {
  const when = formatWhen(created);
  const since = when ? ` depuis le ${when}` : '';
  if (itemName) return `${home} a besoin de « ${itemName} »${since}.`;
  return `${home} en a besoin${since}.`;
}

export function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value));
}

export function houseName(houses, id) {
  return houses.find((house) => house.id === id)?.name || 'une maison';
}

export function pageHeading(title, text) {
  return `<header class="mb-4"><h1 class="font-display text-3xl leading-none">${title}</h1><p class="mt-2 max-w-xl text-sm text-stone-600">${text}</p></header>`;
}

export function emptyState(text) {
  return `<p class="rounded-3xl border border-dashed border-stone-300 px-4 py-10 text-center text-sm text-stone-500">${text}</p>`;
}

export function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const MARK = `<svg viewBox="0 0 32 32" class="h-9 w-9 shrink-0" aria-hidden="true"><rect x="2" y="18" width="12" height="11" rx="2" fill="#1f6b4a"></rect><rect x="14" y="7" width="16" height="22" rx="2" fill="#c4512c"></rect></svg>`;

export function avatar(user) {
  if (user?.avatar) {
    return `<img src="${escapeHtml(user.avatar)}" alt="" class="h-8 w-8 rounded-full object-cover" />`;
  }
  const letter = escapeHtml((user?.name || '?').slice(0, 1).toUpperCase());
  return `<span class="grid h-8 w-8 place-items-center rounded-full bg-stone-900 text-sm text-white">${letter}</span>`;
}

export function statusBadge(status) {
  const free = status === 'DISPONIBLE';
  const tone = free ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-800';
  const label = free ? 'Libre' : 'Pris';
  return `<span class="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium ${tone}">${label}</span>`;
}

export function visual(item) {
  if (item.photoUrl) {
    return `<img src="${escapeHtml(item.photoUrl)}" alt="" class="item-photo" />`;
  }
  if (/^https?:\/\//i.test(item.imageUrl || '')) {
    return `<img src="${escapeHtml(item.imageUrl)}" alt="" class="item-photo" />`;
  }
  return `<span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-stone-100 text-xl" aria-hidden="true">${escapeHtml(item.imageUrl?.trim() || '📦')}</span>`;
}

function glyph(body, width = '1.8') {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export const ICON_TAKE = glyph('<path d="M12 3v10"/><path d="M3.5 9.8 12 17.8 20.5 9.8"/><path d="M4 21.2h16"/>', '2');
export const ICON_BRING = glyph('<path d="M12 19.6V10.5"/><path d="M3.5 13.5 12 4.5 20.5 13.5"/><path d="M4 21.4h16"/>', '2');
export const ICON_DONE = glyph('<circle cx="12" cy="12" r="8.5"/><path d="m8.2 12.2 2.6 2.6 5-5.2"/>', '2');
export const ICON_CALENDAR = glyph('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3.5v3M16 3.5v3"/>');
export const ICON_HISTORY = glyph('<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>');
export const ICON_RETURN = glyph('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 1 1 0 12h-3"/>');
export const ICON_TRASH = glyph('<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/>');
export const ICON_CLOSE = glyph('<path d="M6 6l12 12M18 6 6 18"/>');
export const ICON_PLUS = glyph('<path d="M12 5v14M5 12h14"/>', '2');
export const ICON_THUMB = glyph('<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>');
export const ICON_BELL = glyph('<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>');
export const ICON_GUIDE = glyph('<path d="M12 7v13"/><path d="M12 7c-1.5-2-4-3-7.5-3H4v13h.5c3.5 0 6 1 7.5 3"/><path d="M12 7c1.5-2 4-3 7.5-3H20v13h-.5c-3.5 0-6 1-7.5 3"/>');
export const ICON_SETTINGS = glyph('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>');

export function iconButton(label, icon, attrs = '', extraClass = '') {
  const name = escapeHtml(label);
  return `<button type="button" class="icon-btn ${extraClass}" data-tip="${name}" aria-label="${name}" title="${name}" ${attrs}>${icon}</button>`;
}

const CHEVRON = '<svg class="picker-chevron" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

export function choiceField(options, { value = '', name = '', attrs = '', faceClass = 'field', className = '', label = '' } = {}) {
  const current = options.find((option) => option.value === value) || options[0] || { value: '', label: '' };
  const native = options.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === current.value ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('');
  const menu = options.map((option) => {
    const on = option.value === current.value;
    return `<button type="button" class="picker-option${on ? ' is-current' : ''}" role="option" aria-selected="${on}" data-value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</button>`;
  }).join('');
  const named = name ? `name="${escapeHtml(name)}"` : '';
  const labelled = label ? `aria-label="${escapeHtml(label)}"` : '';
  return `
    <div class="picker ${className}">
      <button type="button" class="picker-face ${faceClass}" aria-haspopup="listbox" aria-expanded="false" ${labelled}>
        <span class="picker-value min-w-0 truncate">${escapeHtml(current.label)}</span>
        ${CHEVRON}
      </button>
      <div class="picker-menu" role="listbox" hidden>${menu}</div>
      <select class="picker-native" tabindex="-1" aria-hidden="true" ${named} ${attrs}>${native}</select>
    </div>
  `;
}

function syncPicker(picker) {
  const select = picker.querySelector('select');
  const current = select.options[select.selectedIndex];
  const label = picker.querySelector('.picker-value');
  if (label && current) label.textContent = current.textContent;
  picker.querySelectorAll('.picker-option').forEach((button) => {
    const on = button.dataset.value === select.value;
    button.classList.toggle('is-current', on);
    button.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}

function closePicker(picker) {
  picker.classList.remove('is-open');
  const menu = picker.querySelector('.picker-menu');
  if (menu) menu.hidden = true;
  picker.querySelector('.picker-face')?.setAttribute('aria-expanded', 'false');
}

function closePickers(except) {
  document.querySelectorAll('.picker.is-open').forEach((picker) => {
    if (picker !== except) closePicker(picker);
  });
}

let pickersBound = false;

function bindTips(root) {
  const touch = window.matchMedia('(hover: none), (pointer: coarse)');
  let timer = 0;
  const clearTips = () => {
    root.querySelectorAll('.icon-btn.is-tipped').forEach((node) => node.classList.remove('is-tipped'));
  };
  root.addEventListener('pointerdown', (event) => {
    const button = event.target.closest?.('.icon-btn');
    clearTimeout(timer);
    clearTips();
    if (!button || !touch.matches) return;
    button.classList.add('is-tipped');
  });
  root.addEventListener('pointerup', () => {
    clearTimeout(timer);
    timer = setTimeout(clearTips, 1200);
  });
  root.addEventListener('pointercancel', () => {
    clearTimeout(timer);
    clearTips();
  });
}

export function bindPickers(root = document) {
  if (pickersBound) return;
  pickersBound = true;
  bindTips(root);
  root.addEventListener('click', (event) => {
    const option = event.target.closest('.picker-option');
    if (option) {
      const picker = option.closest('.picker');
      const select = picker.querySelector('select');
      select.value = option.dataset.value;
      syncPicker(picker);
      closePicker(picker);
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    const face = event.target.closest('.picker-face');
    if (face) {
      const picker = face.closest('.picker');
      const willOpen = !picker.classList.contains('is-open');
      closePickers(picker);
      if (!willOpen) {
        closePicker(picker);
        return;
      }
      picker.classList.add('is-open');
      picker.querySelector('.picker-menu').hidden = false;
      face.setAttribute('aria-expanded', 'true');
      return;
    }
    if (!event.target.closest('.picker')) closePickers();
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePickers();
  });
}
