import { errorMessage } from '../infrastructure/errors.js';
import { ICON_CLOSE, MARK, choiceField, escapeHtml, iconButton } from './html.js';

export class OnboardingModal {
  constructor(root, handlers) {
    this.root = root;
    this.handlers = handlers;
    this.root.addEventListener('submit', (event) => this.onSubmit(event));
    this.root.addEventListener('click', (event) => {
      if (event.target.closest('[data-close]')) this.handlers.onClose();
      const cancel = event.target.closest('[data-cancel-join]');
      if (cancel) this.handlers.onCancelJoin(cancel.dataset.id);
    });
  }

  render({ step, houses = [], groupName = '', canClose = false, pending = null }) {
    this.step = step;
    const close = canClose
      ? iconButton('Fermer', ICON_CLOSE, 'data-close', 'icon-cross')
      : '';
    const body = step === 'house' ? this.houseStep(houses, groupName, pending) : this.groupStep();
    this.root.innerHTML = `
      <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          ${MARK}
          <div>
            <p class="font-display text-3xl leading-none">Palier</p>
            <p class="mt-1 text-sm text-stone-600">Un voisinage, puis une seule maison.</p>
          </div>
        </div>
        ${close}
      </div>
      <p data-error class="mb-4 hidden rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-800"></p>
      ${body}
    `;
  }

  groupStep() {
    return `
      <div class="grid gap-4 md:grid-cols-2">
        <form data-form="create-group" class="panel p-5">
          <h2 class="font-display text-2xl">Créer un voisinage</h2>
          <p class="mt-2 text-sm text-stone-600">Un code est généré pour inviter les maisons d’à côté.</p>
          <label class="label mt-5">Nom du voisinage
            <input class="field" name="name" required maxlength="80" placeholder="Les voisins du parc" />
          </label>
          <button class="btn btn-primary mt-5" type="submit">Créer</button>
        </form>
        <form data-form="join-group" class="panel p-5">
          <h2 class="font-display text-2xl">Rejoindre</h2>
          <p class="mt-2 text-sm text-stone-600">Saisissez le code reçu d’un voisin.</p>
          <label class="label mt-5">Code d’invitation
            <input class="field uppercase tracking-widest" name="code" required minlength="6" maxlength="8" placeholder="AB23CD" />
          </label>
          <button class="btn btn-primary mt-5" type="submit">Rejoindre</button>
        </form>
      </div>
    `;
  }

  houseStep(houses, groupName, pending) {
    const waiting = pending
      ? `<section class="panel p-5">
          <h2 class="font-display text-2xl">Demande envoyée</h2>
          <p class="mt-2 text-sm text-stone-600">Vous attendez l’accord pour ${escapeHtml(houses.find((house) => house.id === pending.houseId)?.name || 'cette maison')}. La personne qui l’a créée doit accepter.</p>
          <button type="button" class="btn btn-ghost mt-5" data-cancel-join data-id="${escapeHtml(pending.id)}">Annuler la demande</button>
        </section>`
      : '';
    const options = choiceField(houses.map((house) => ({ value: house.id, label: house.name })), {
      name: 'houseId',
      attrs: 'required',
    });
    const picker = !pending && houses.length
      ? `<form data-form="select-house" class="panel p-5">
          <h2 class="font-display text-2xl">Maison existante</h2>
          <p class="mt-2 text-sm text-stone-600">Dans ${escapeHtml(groupName)}, vous n’habitez qu’une maison. Son créateur doit accepter.</p>
          <label class="label mt-5">Maison existante
            ${options}
          </label>
          <button class="btn btn-primary mt-5" type="submit">Demander à rejoindre</button>
        </form>`
      : '';
    return `
      <div class="grid gap-4 md:grid-cols-2">
        ${waiting || picker}
        <form data-form="create-house" class="panel p-5">
          <h2 class="font-display text-2xl">Créer la mienne</h2>
          <p class="mt-2 text-sm text-stone-600">Elle devient votre seule maison dans ${escapeHtml(groupName || 'ce voisinage')}.</p>
          <label class="label mt-5">Nom
            <input class="field" name="name" required maxlength="80" placeholder="Maison 12" />
          </label>
          <button class="btn btn-primary mt-5" type="submit">Créer la maison</button>
        </form>
      </div>
    `;
  }

  showError(message) {
    const node = this.root.querySelector('[data-error]');
    if (!node) return;
    node.hidden = false;
    node.classList.remove('hidden');
    node.textContent = message;
  }

  async onSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      if (form.dataset.form === 'create-group') await this.handlers.onCreateGroup(form.elements.name.value);
      if (form.dataset.form === 'join-group') await this.handlers.onJoinGroup(form.elements.code.value);
      if (form.dataset.form === 'create-house') await this.handlers.onCreateHouse(form.elements.name.value);
      if (form.dataset.form === 'select-house') await this.handlers.onSelectHouse(form.elements.houseId.value);
    } catch (error) {
      this.showError(errorMessage(error));
      if (button.isConnected) button.disabled = false;
    }
  }
}
