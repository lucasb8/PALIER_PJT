import { Proposal } from '../domain/Proposal.js';
import { ICON_THUMB, ICON_TRASH, emptyState, escapeHtml, formatMoney, houseName, iconButton, pageHeading } from './html.js';

function linkLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Voir le lien';
  }
}

export class ProposalsComponent {
  constructor(root, handlers) {
    this.root = root;
    this.handlers = handlers;
    this.root.addEventListener('submit', (event) => this.onSubmit(event));
    this.root.addEventListener('click', (event) => this.onClick(event));
  }

  render({ proposals, votes, houses, activeHouseId, currentUserId, offline }) {
    this.activeHouseId = activeHouseId;
    this.currentUserId = currentUserId;
    this.houses = houses;
    this.offline = offline;
    const cards = proposals.length
      ? proposals.map((proposal) => this.card(proposal, votes.filter((vote) => vote.proposalId === proposal.id))).join('')
      : emptyState('Aucune proposition d’achat en commun.');
    this.root.innerHTML = `
      ${pageHeading('Achats', 'Un pouce pour dire que la maison est intéressée. Les maisons intéressées prennent contact pour décider comment procéder : la répartition, qui le garde.')}
      <form class="row-form mb-6">
        <input class="field" name="title" required maxlength="120" placeholder="Aspirateur vapeur" aria-label="Proposition" />
        <input class="field" name="url" maxlength="2000" placeholder="Lien vers la fiche" aria-label="Lien" inputmode="url" />
        <input class="field field-narrow" name="estimatedCost" type="number" min="0" step="0.01" placeholder="€" aria-label="Coût estimé en euros" />
        <input class="field field-narrow" name="description" placeholder="Détail" aria-label="Détail" />
        <button class="btn btn-primary" type="submit" ${offline ? 'disabled' : ''}>Proposer</button>
      </form>
      <div class="grid gap-3">${cards}</div>
    `;
  }

  card(proposal, votes) {
    const interested = Proposal.interested(votes);
    const mine = interested.some((vote) => vote.houseId === this.activeHouseId);
    const cost = formatMoney(proposal.estimatedCost);
    const names = interested.map((vote) => escapeHtml(houseName(this.houses, vote.houseId)));
    const houses = names.length
      ? `<p class="text-sm text-stone-700"><span class="font-medium text-stone-900">Intéressées</span> · ${names.join(', ')}</p>`
      : '<p class="text-sm text-stone-500">Aucune maison n’a encore dit être intéressée.</p>';
    const remove = !this.offline && proposal.createdByUserId === this.currentUserId
      ? iconButton('Retirer', ICON_TRASH, `data-action="remove" data-id="${escapeHtml(proposal.id)}"`, 'icon-danger')
      : '';
    const thumb = iconButton(
      'Intéressé',
      ICON_THUMB,
      `data-action="interest" data-id="${escapeHtml(proposal.id)}" data-interested="${mine ? 'true' : 'false'}" ${this.offline ? 'disabled' : ''}`,
      mine ? 'icon-primary' : '',
    );
    return `
      <article class="panel p-4">
        <h3 class="font-display text-xl">${escapeHtml(proposal.title)}</h3>
        ${proposal.description ? `<p class="mt-1 text-sm text-stone-600">${escapeHtml(proposal.description)}</p>` : ''}
        ${proposal.url ? `<p class="mt-1 text-sm"><a class="text-stone-900 underline underline-offset-2" href="${escapeHtml(proposal.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkLabel(proposal.url))}</a></p>` : ''}
        ${cost ? `<p class="mt-1 text-sm text-stone-500">${escapeHtml(cost)}</p>` : ''}
        <div class="mt-3">${houses}</div>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          ${thumb}
          ${remove}
        </div>
      </article>
    `;
  }

  async onSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await this.handlers.onCreate({
        title: form.elements.title.value,
        description: form.elements.description.value,
        url: form.elements.url.value,
        estimatedCost: form.elements.estimatedCost.value,
      });
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }

  async onClick(event) {
    const button = event.target.closest('[data-action="interest"], [data-action="remove"]');
    if (!button || button.disabled) return;
    button.disabled = true;
    try {
      if (button.dataset.action === 'remove') await this.handlers.onRemove(button.dataset.id);
      else await this.handlers.onInterest(button.dataset.id, button.dataset.interested !== 'true');
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }
}
