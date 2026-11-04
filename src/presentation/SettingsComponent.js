import { choiceField, escapeHtml, pageHeading } from './html.js';

export class SettingsComponent {
  constructor(root, handlers) {
    this.root = root;
    this.handlers = handlers;
    this.root.addEventListener('click', (event) => this.onClick(event));
    this.root.addEventListener('change', (event) => this.onHouseChange(event));
    this.root.addEventListener('submit', (event) => this.onSubmit(event));
  }

  render({ group, memberships, houses = [], activeHouseId, activeGroupId, logoutLabel }) {
    this.activeHouseId = activeHouseId;
    const selectedId = houses.some((house) => house.id === activeHouseId) ? activeHouseId : (houses[0]?.id || '');
    const list = memberships.map((entry) => `
      <li class="flex items-center justify-between gap-3 py-2">
        <span>${escapeHtml(entry.group.name)}</span>
        ${entry.group.id === activeGroupId
          ? '<span class="text-xs text-stone-500">Actif</span>'
          : `<button type="button" class="btn btn-ghost px-3 py-1 text-sm" data-action="switch" data-id="${escapeHtml(entry.group.id)}">Activer</button>`}
      </li>
    `).join('');
    this.root.innerHTML = `
      ${pageHeading('Réglages', 'La maison, l’invitation des voisins, et le compte.')}
      <div class="grid gap-4 lg:grid-cols-2">
        <section class="panel p-5">
          <h2 class="font-display text-2xl">Votre maison</h2>
          <p class="mt-1 text-sm text-stone-600">Une seule par voisinage. Rejoindre une maison existante attend l’accord de la personne qui l’a créée.</p>
          <form data-form="move-house" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label class="label flex-1">Maison existante
              ${choiceField(houses.map((house) => ({ value: house.id, label: house.name })), { value: activeHouseId, name: 'houseId' })}
            </label>
            <button class="btn btn-ghost" type="submit" data-move ${selectedId === activeHouseId ? 'hidden' : ''}>Demander à y habiter</button>
          </form>
          <form data-form="house" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label class="label flex-1">Ou créer la mienne
              <input class="field" name="name" required maxlength="80" placeholder="Maison 16" />
            </label>
            <button class="btn btn-primary" type="submit">Créer</button>
          </form>
        </section>
        <section class="panel p-5">
          <h2 class="font-display text-2xl">Code d’invitation</h2>
          <p class="mt-4 break-all font-mono text-2xl tracking-[0.2em] sm:text-3xl">${escapeHtml(group.inviteCode)}</p>
          <button type="button" class="btn btn-ghost mt-4" data-action="copy">Copier</button>
          <p data-copied class="mt-2 hidden text-sm text-emerald-800">Code copié.</p>
        </section>
        <section class="panel p-5 lg:col-span-2">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="font-display text-2xl">Voisinages</h2>
            <button type="button" class="btn btn-ghost" data-action="add">Ajouter un voisinage</button>
          </div>
          <ul class="mt-3 divide-y divide-stone-200">${list}</ul>
          <button type="button" class="btn btn-ghost mt-4" data-action="leave">Quitter ${escapeHtml(group.name)}</button>
        </section>
        <section class="panel p-5">
          <h2 class="font-display text-2xl">Sauvegarde</h2>
          <div class="mt-4 flex flex-wrap gap-2">
            <button type="button" class="btn btn-ghost" data-action="export" data-kind="json">Exporter JSON</button>
            <button type="button" class="btn btn-ghost" data-action="export" data-kind="csv">Exporter CSV</button>
          </div>
        </section>
        <section class="panel flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 class="font-display text-2xl">Compte</h2>
          <button type="button" class="btn btn-ghost" data-action="logout">${escapeHtml(logoutLabel)}</button>
        </section>
      </div>
    `;
  }

  async onSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.dataset.form !== 'house' && form.dataset.form !== 'move-house') return;
    event.preventDefault();
    if (form.dataset.form === 'move-house' && form.elements.houseId.value === this.activeHouseId) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      if (form.dataset.form === 'house') await this.handlers.onCreateHouse(form.elements.name.value);
      if (form.dataset.form === 'move-house') await this.handlers.onMoveHouse(form.elements.houseId.value);
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }

  onHouseChange(event) {
    const form = event.target.form;
    if (!form || form.dataset.form !== 'move-house' || event.target.name !== 'houseId') return;
    const button = form.querySelector('[data-move]');
    if (button) button.hidden = event.target.value === this.activeHouseId;
  }

  async onClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'copy') {
      const code = this.root.querySelector('.font-mono')?.textContent?.trim() || '';
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        window.prompt('Copiez le code :', code);
      }
      const note = this.root.querySelector('[data-copied]');
      note.hidden = false;
      note.classList.remove('hidden');
    }
    if (button.dataset.action === 'export') this.handlers.onExport(button.dataset.kind);
    if (button.dataset.action === 'add') this.handlers.onAddGroup();
    if (button.dataset.action === 'switch') this.handlers.onSwitch(button.dataset.id);
    if (button.dataset.action === 'leave' && window.confirm('Quitter ce voisinage sur ce compte ?')) {
      await this.handlers.onLeave();
    }
    if (button.dataset.action === 'logout') this.handlers.onLogout();
  }
}
