import { ICON_CLOSE, iconButton } from './html.js';

export class AddItemComponent {
  constructor(root, handlers) {
    this.root = root;
    this.handlers = handlers;
    this.root.addEventListener('submit', (event) => this.onSubmit(event));
    this.root.addEventListener('change', (event) => {
      if (!event.target.matches('[data-photo]')) return;
      const file = event.target.files?.[0];
      const status = event.target.closest('.label')?.querySelector('[data-photo-name]');
      if (status) status.textContent = file?.name || 'Aucune photo';
    });
  }

  render({ activeHouseId, plain = false, close = false }) {
    this.activeHouseId = activeHouseId;
    const shell = plain ? 'grid gap-4' : 'panel panel-solid grid gap-4 p-5';
    this.root.innerHTML = `
      <form class="${shell} md:grid-cols-2">
        <div class="flex items-start justify-between gap-3 md:col-span-2">
          <div>
            <h2 id="add-item-title" class="font-display text-2xl">Nouvel objet</h2>
            <p class="mt-1 text-sm text-stone-600">Une photo, si vous en avez une. Il reste rangé chez vous : c’est votre maison qui pourra en demander le retour.</p>
          </div>
          ${close ? iconButton('Fermer', ICON_CLOSE, 'data-close', 'icon-cross') : ''}
        </div>
        <label class="label md:col-span-2">Nom
          <input class="field" name="name" required maxlength="120" placeholder="Plancha Tefal" />
        </label>
        <label class="label md:col-span-2">Description
          <textarea class="field" name="description" rows="2" placeholder="Avec la plaque et la bouteille de gaz."></textarea>
        </label>
        <label class="label md:col-span-2">Consigne d’utilisation
          <textarea class="field" name="instructions" rows="2" maxlength="280" placeholder="Ne jamais passer au lave-vaisselle."></textarea>
        </label>
        <div class="label md:col-span-2">Photo
          <div class="mt-1 flex flex-wrap items-center gap-3">
            <label class="btn btn-ghost">
              Choisir une photo
              <input class="file-native" name="photo" data-photo type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
            </label>
            <span data-photo-name class="text-sm font-normal text-stone-500">Aucune photo</span>
          </div>
        </div>
        <div class="md:col-span-2">
          <button class="btn btn-primary" type="submit">Déclarer l’objet</button>
        </div>
      </form>
    `;
  }

  async onSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    const photo = data.get('photo');
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await this.handlers.onCreate({
        name: data.get('name'),
        description: data.get('description'),
        instructions: data.get('instructions'),
        homeHouseId: this.activeHouseId,
        photoFile: photo instanceof File && photo.size ? photo : null,
      });
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }
}
