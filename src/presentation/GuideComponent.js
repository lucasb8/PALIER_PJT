import {
  ICON_BELL,
  ICON_BRING,
  ICON_CALENDAR,
  ICON_CLOSE,
  ICON_DONE,
  ICON_HISTORY,
  ICON_RETURN,
  ICON_SETTINGS,
  ICON_TAKE,
  ICON_THUMB,
  ICON_TRASH,
  escapeHtml,
  pageHeading,
  statusBadge,
} from './html.js';

function mark(icon, tone = '', label = '') {
  const tip = label ? ` data-tip="${escapeHtml(label)}"` : '';
  return `<span class="icon-btn ${tone}"${tip} aria-hidden="true">${icon}</span>`;
}

function entry(icon, tone, title, text) {
  return `<div class="flex items-start gap-3">${mark(icon, tone, title)}<div><dt class="font-medium text-stone-900">${title}</dt><dd>${text}</dd></div></div>`;
}

export class GuideComponent {
  constructor(root, handlers) {
    this.root = root;
    this.handlers = handlers;
    this.root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-go]');
      if (!button) return;
      this.handlers.onOpen(button.dataset.go);
    });
  }

  render() {
    this.root.innerHTML = `
      ${pageHeading('Mode d’emploi', 'Prendre, c’est tout de suite. Réserver, c’est pour plus tard.')}
      <div class="grid gap-4">
        <section class="panel p-5">
          <h2 class="font-display text-2xl">Par où commencer</h2>
          <ol class="mt-3 grid gap-2 text-sm text-stone-700">
            <li class="flex items-start gap-3">${mark(ICON_BELL, '', 'Notifications')}<span>1. Le bandeau indique votre voisinage et votre maison. Une seule maison par voisinage. Rejoindre une maison déjà créée attend l’accord de son créateur. La cloche s’ouvre pour agir : Accepter ou Refuser une entrée, OK quand quelqu’un a rejoint, Annuler sa propre demande. Un objet à rendre y est seulement rappelé : le ramener se fait sur l’objet. Le portrait ouvre Se déconnecter.</span></li>
            <li>2. Dans Objets, regardez où il se trouve. Prenez-le, ou rapportez-le. Une demande de retour y reste écrite en rouge, avec la date.</li>
            <li>3. Ouvrez Calendrier, glissez sur un ou plusieurs jours, choisissez les heures, puis un ou plusieurs objets. Deux maisons peuvent se suivre le même jour si les heures ne se croisent pas.</li>
            <li>4. Un œuf, un colis ou un coup de main se demande dans Demander. Un achat commun se signale d’un pouce dans Achats.</li>
          </ol>
          <div class="mt-4 flex flex-wrap gap-2">
            <button type="button" class="btn btn-primary" data-go="inventory">Ouvrir Objets</button>
            <button type="button" class="btn btn-ghost" data-go="calendar">Ouvrir Calendrier</button>
          </div>
        </section>

        <section class="grid gap-4 md:grid-cols-2">
          <article class="panel p-5">
            <h2 class="font-display text-2xl">Objets</h2>
            <p class="mt-2 text-sm text-stone-700">C’est là qu’il se trouve vraiment. La ligne « Actuellement » dit dans quelle maison. Prendre le déplace tout de suite, sans horaire. Si le rangement réclame l’objet, une ligne rouge date la demande : Maison 14 a besoin de « Perceuse » depuis le 4 nov. 2026, 08:00.</p>
          </article>
          <article class="panel p-5">
            <h2 class="font-display text-2xl">Calendrier</h2>
            <p class="mt-2 text-sm text-stone-700">C’est un créneau à venir. Un clic prend un jour, un glisser en prend plusieurs : l’heure de début est celle du premier, l’heure de fin celle du dernier. Réserver ne déplace rien : l’objet reste où il est. Deux maisons peuvent réserver le même objet le même jour, le matin puis l’après-midi, tant que les heures ne se croisent pas. La maison de rangement peut aussi réserver le sien, pour dire qu’elle s’en sert. La case se grise si le même objet est déjà pris sur ces heures. Orange : le créneau concerne votre maison, parce qu’elle l’a réservé ou parce que l’objet y est rangé. Gris : il est entre d’autres maisons. Chaque ligne rappelle aussi où il est maintenant. La fin du créneau laisse l’objet où il est. Rapporter ou C’est rentré le ramène.</p>
            <p class="mt-3 flex items-start gap-3 text-sm text-stone-700">${mark(ICON_TRASH, 'icon-danger', 'Retirer')}<span>Retirer enlève le créneau. La maison qui l’a posé peut le faire, ainsi que la maison de rangement. L’objet reste où il est.</span></p>
          </article>
        </section>

        <section class="panel p-5">
          <h2 class="font-display text-2xl">Les pastilles</h2>
          <ul class="mt-3 grid gap-3 text-sm text-stone-700">
            <li class="flex flex-wrap items-center gap-2">${statusBadge('DISPONIBLE')} On peut le prendre. Il est dans son rangement, sans créneau.</li>
            <li class="flex flex-wrap items-center gap-2">${statusBadge('EMPRUNTE')} Une maison l’a, ou un créneau le réserve. Le nom et la date sont sous le titre.</li>
          </ul>
        </section>

        <section class="panel p-5">
          <h2 class="font-display text-2xl">Les boutons d’un objet</h2>
          <p class="mt-2 text-sm text-stone-600">Le nom de chaque icône apparaît au survol.</p>
          <dl class="mt-3 grid gap-4 text-sm text-stone-700">
            ${entry(ICON_TAKE, 'icon-primary', 'Prendre chez moi', 'Vous l’empruntez maintenant. L’icône est là si aucun créneau ne le réserve à une autre maison, ou si le prochain créneau est le vôtre.')}
            ${entry(ICON_BRING, 'icon-primary', 'Rapporter', 'Vous l’avez chez vous, et ce n’est pas son rangement. Vous le ramenez.')}
            ${entry(ICON_DONE, 'icon-primary', 'C’est rentré', 'Vous êtes la maison de rangement. Vous avez récupéré l’objet qui doit être chez vous. Pendant le créneau de la maison qui l’a, cette icône attend.')}
            ${entry(ICON_RETURN, '', 'Demander le retour', 'Vous êtes la maison de rangement, l’objet est sorti, et le créneau de la maison qui l’a est terminé. Vous lui demandez de le ramener. La demande s’écrit en rouge, avec la date, sur la fiche et dans la cloche. Le ramener se fait avec Rapporter, sur l’objet.')}
            ${entry(ICON_CALENDAR, '', 'Calendrier', 'Ouvre le jour avec l’objet déjà coché.')}
            ${entry(ICON_HISTORY, '', 'Parcours', 'Montre les déplacements, avec la date et la personne.')}
            ${entry(ICON_TRASH, 'icon-danger', 'Retirer', 'N’apparaît que dans son rangement, sans créneau à venir.')}
          </dl>
        </section>

        <section class="panel p-5">
          <h2 class="font-display text-2xl">Le reste du palier</h2>
          <ul class="mt-3 grid gap-2 text-sm text-stone-700">
            <li class="flex items-start gap-3"><span class="flex shrink-0 gap-2">${mark(ICON_CLOSE, 'icon-cross', 'Je ne peux plus')}${mark(ICON_TRASH, 'icon-danger', 'Retirer')}</span><span><span class="font-medium text-stone-900">Demander.</span> Un œuf, un colis ou un coup de main. Une autre maison clique Je m’en occupe. Si elle ne peut plus, la croix rouvre la demande. La maison qui a demandé peut Retirer : la demande disparaît, même si une maison avait répondu.</span></li>
            <li class="flex items-start gap-3"><span class="flex shrink-0 gap-2">${mark(ICON_THUMB, 'icon-primary', 'Intéressé')}${mark(ICON_TRASH, 'icon-danger', 'Retirer')}</span><span><span class="font-medium text-stone-900">Achats.</span> Le pouce dit que la maison est intéressée. Un second clic retire cet intérêt. Les maisons intéressées prennent contact pour décider comment procéder : la répartition, qui le garde. La personne qui a proposé peut Retirer : les réponses partent avec. Le lien ouvre la fiche du produit.</span></li>
            <li><span class="font-medium text-stone-900">Ajouter un objet.</span> Il est rangé dans votre maison. C’est elle qui pourra en demander le retour. La consigne dit comment s’en servir, par exemple ne jamais le passer au lave-vaisselle.</li>
            <li class="flex items-start gap-3">${mark(ICON_SETTINGS, '', 'Réglages')}<span><span class="font-medium text-stone-900">Réglages.</span> Créer sa maison est immédiat. Rejoindre une maison déjà créée envoie une demande à la personne qui l’a créée. Le bouton n’est là que si vous choisissez une autre maison que la vôtre. Le code d’invitation fait entrer une personne dans ce voisinage. Rejoindre une maison du voisinage reste une demande à part.</span></li>
            <li><span class="font-medium text-stone-900">Sans réseau.</span> Les listes restent lisibles. Les boutons qui modifient sont bloqués.</li>
          </ul>
        </section>
      </div>
    `;
  }
}
