import { ICON_BELL, ICON_CLOSE, ICON_GUIDE, ICON_SETTINGS, MARK, avatar, choiceField, escapeHtml, iconButton } from './html.js';

let popoverDismissBound = false;

function closePopovers(except) {
  document.querySelectorAll('.account.is-open, .notes.is-open').forEach((node) => {
    if (node === except) return;
    node.classList.remove('is-open');
    const menu = node.querySelector('.account-menu');
    if (menu) menu.hidden = true;
    node.querySelector('[aria-expanded="true"]')?.setAttribute('aria-expanded', 'false');
  });
}

function bindPopoverDismiss() {
  if (popoverDismissBound) return;
  popoverDismissBound = true;
  document.addEventListener('click', (event) => {
    if (event.target.closest('.account, .notes')) return;
    closePopovers();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePopovers();
  });
}

export class GroupHeaderSelector {
  constructor(root, handlers) {
    this.root = root;
    this.handlers = handlers;
    bindPopoverDismiss();
    this.root.addEventListener('change', (event) => {
      if (event.target.matches('[data-group]')) this.handlers.onGroup(event.target.value);
    });
    this.root.addEventListener('click', (event) => {
      if (event.target.closest('[data-close-notes]')) {
        closePopovers();
        return;
      }
      const notice = event.target.closest('[data-join]');
      if (notice) {
        this.handlers.onNotify?.(notice.dataset.join, notice.dataset.id);
        return;
      }
      if (event.target.closest('[data-logout]')) {
        this.handlers.onLogout();
        return;
      }
      const bell = event.target.closest('[data-bell]');
      if (bell) {
        this.togglePopover(bell, '.notes');
        return;
      }
      const account = event.target.closest('[data-account]');
      if (account) {
        this.togglePopover(account, '.account');
        return;
      }
      if (event.target.closest('[data-settings]')) this.handlers.onSettings();
      if (event.target.closest('[data-guide]')) this.handlers.onGuide();
    });
  }

  togglePopover(button, selector) {
    const popover = button.closest(selector);
    const menu = popover.querySelector('.account-menu');
    const open = menu.hidden;
    closePopovers();
    menu.hidden = !open;
    popover.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  render({ user, memberships, activeGroupId, houseLabel = '', settingsOpen = false, guideOpen = false, logoutLabel = 'Se déconnecter', notifications = '', notificationCount = 0, notesOpen = false }) {
    const groups = choiceField(memberships.map((entry) => ({ value: entry.group.id, label: entry.group.name })), {
      value: activeGroupId,
      attrs: 'data-group',
      faceClass: 'bar-select',
      className: 'picker-inline',
      label: 'Voisinage',
    });
    const mark = MARK.replace('h-9 w-9', 'h-6 w-6');
    const house = escapeHtml(houseLabel);
    this.root.innerHTML = `
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-2 px-4 py-2.5">
        <div class="flex shrink-0 items-center gap-2">
          ${mark}
          <span class="font-display text-lg leading-none">Palier</span>
        </div>
        ${groups}
        <span class="hidden min-w-0 truncate text-sm text-stone-500 sm:inline" title="Votre maison dans ce voisinage">${house}</span>
        <div class="flex w-full flex-wrap items-center gap-1 sm:ml-auto sm:w-auto">
          <span class="mr-auto min-w-0 flex-1 truncate text-sm text-stone-500 sm:hidden" title="Votre maison dans ce voisinage">${house}</span>
          ${iconButton('Mode d’emploi', ICON_GUIDE, `data-guide aria-pressed="${guideOpen ? 'true' : 'false'}"`, 'tip-below')}
          ${iconButton('Réglages', ICON_SETTINGS, `data-settings aria-pressed="${settingsOpen ? 'true' : 'false'}"`, 'tip-below')}
          <div class="notes${notesOpen ? ' is-open' : ''}">
            <button type="button" class="icon-btn tip-below" data-bell data-tip="Notifications" aria-label="Notifications" aria-haspopup="menu" aria-expanded="${notesOpen ? 'true' : 'false'}">${ICON_BELL}${notificationCount ? `<span class="bell-count">${notificationCount > 9 ? '9+' : notificationCount}</span>` : ''}</button>
            <div class="account-menu notes-menu" role="menu" ${notesOpen ? '' : 'hidden'}>
              <div class="note-head">${iconButton('Fermer', ICON_CLOSE, 'data-close-notes', 'icon-cross')}</div>
              ${notifications}
            </div>
          </div>
          <div class="account">
            <button type="button" class="icon-btn avatar-btn tip-below tip-end" data-account data-tip="${escapeHtml(user?.name || 'Compte')}" aria-label="${escapeHtml(user?.name || 'Compte')}" aria-haspopup="menu" aria-expanded="false">${avatar(user)}</button>
            <div class="account-menu" role="menu" hidden>
              <button type="button" class="account-choice" role="menuitem" data-logout>${escapeHtml(logoutLabel)}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
