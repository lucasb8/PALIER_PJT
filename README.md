# Palier

Prêt d’objets et dépannage entre voisins. Le front statique vit dans `src/`, le schéma PocketBase dans `pocketbase/` — la même répartition que LionEliteDanceRepo.

Le détail produit est dans [documentation.md](documentation.md). L’import du schéma est décrit dans [pocketbase/README.md](pocketbase/README.md).

## Lancer

```bash
npm install
npm test
npm run dev
```

Copier `.env.example` vers `.env` si besoin. `PUBLIC_POCKETBASE_URL` pointe vers PocketBase (`http://127.0.0.1:8090` en local).

Sans PocketBase, **Parcourir avec des données d’exemple** ouvre l’application comme Camille Martin, dans deux voisinages déjà remplis (objets, dépannages, réservations, votes). Ces données restent dans le navigateur. Le code `TILLE8` permet de rejoindre un troisième voisinage. **Quitter l’exemple** revient à l’écran de connexion. Avec un serveur, l’entrée se fait par email et mot de passe. Le lien d’oubli part de la boîte réglée dans PocketBase.

```bash
npm run pb:schema
```

régénère `pocketbase/collections.json`.

## Front

Vite sert des modules JavaScript, Tailwind et les tests Vitest. Les règles métier (statuts, créneaux, code d’invitation) sont dans `src/domain`, sans appel réseau. PocketBase, le cache IndexedDB et la maison active (localStorage) sont dans `src/infrastructure`.

L’inventaire déjà chargé reste lisible hors réseau. Les actions (emprunt, réservation, vote) demandent une connexion.

## Déploiement

Le workflow `.github/workflows/deploy.yml` lance les tests, construit `dist/`, puis publie ce dossier sur GitHub Pages. Définir la variable de dépôt `PUBLIC_POCKETBASE_URL` (URL HTTPS de l’API) avant le premier déploiement : Vite l’inscrit dans le build.

Le nom de domaine du site se branche par un enregistrement DNS `CNAME` vers GitHub Pages. PocketBase reste une instance à part. Son URL d’application doit être celle du site, pour que le lien de mot de passe oublié s’y ouvre.
