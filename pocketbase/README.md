# Schéma PocketBase

Même répartition que le dépôt de référence : ce dossier est la source du back-end, le front vit dans `src/`.

| Fichier | Rôle |
|---|---|
| `schema.mjs` | Définition lisible des collections (source de vérité) |
| `collections.json` | Export à importer dans l’admin PocketBase |
| `pb_migrations/` | Ouvre la lecture des profils aux utilisateurs connectés (noms, avatars) |

```bash
node pocketbase/schema.mjs
```

## Démarrage local

1. Télécharger le binaire [PocketBase](https://pocketbase.io/docs/) et le lancer depuis la racine du dépôt :

```bash
pocketbase serve --dir pocketbase/pb_data --migrationsDir pocketbase/pb_migrations --hooksDir pocketbase/pb_hooks --http 127.0.0.1:8090
```

2. Créer le compte superutilisateur au premier lancement.
3. **Settings → Import collections** → `pocketbase/collections.json`.
4. **Settings → Application** : nom `Palier`, URL de l’application = l’origine du site (`http://127.0.0.1:5173` en local, l’origine GitHub Pages ou le domaine en production). Le lien du mot de passe oublié est `{APP_URL}/?reset={TOKEN}`.
5. **Settings → Mail settings** : serveur SMTP de la boîte (hôte, port, identifiant, mot de passe), nom et adresse de l’expéditeur, puis **Send test email**. Sans cette boîte, le lien d’oubli ne part pas. La vérification d’email à l’inscription reste coupée.
6. Vérifier que `users` autorise list/view pour `@request.auth.id != ""` (la migration le fait au premier démarrage ; sinon le coller à la main). L’interface n’affiche pas les e-mails des voisins. La migration du mot de passe écrit le message en français.

Les objets, maisons, demandes et votes ne sont lisibles que par les membres du groupe. La collection `groups` reste listable par tout compte connecté, afin de rejoindre un voisinage avec son code.

## Collections

```
users                 compte email et mot de passe (collection système)
groups                voisinage + code d’invitation
group_members         appartenance utilisateur ↔ groupe
houses                maisons du groupe
items                 objets, maison d’origine, maison actuelle, photo ou emoji
express_requests      dépannages (pending → fulfilled)
assistance_requests   coups de main (open → resolved)
item_history          fil d’Ariane des déplacements
bookings              créneaux réservés
proposals             achats en commun
votes                 pour / contre, un vote par maison
```

## Hébergement

Le front statique part sur GitHub Pages. PocketBase reste une instance HTTPS à part (`https://api.exemple.fr` sur un VPS, Fly.io ou Render). Renseigner cette URL dans `PUBLIC_POCKETBASE_URL` au moment du build. L’URL de l’application, dans PocketBase, reste celle du site : c’est elle que le message de mot de passe ouvre. Autoriser cette origine dans Settings → Application → Trusted.
