ur le Documentation Spécifique et Technique : Palier
Ce document récapitule l'ensemble du projet Palier, une application de partage d'objets et de dépannage au quotidien entre voisins. Il définit le nom, les fonctionnalités retenues (et exclues), l'expérience utilisateur (UI/UX), le système d'authentification utilisateur, les groupes de voisinage, le contexte de maison active, la logique des statuts d'objets (emprunts spontanés vs réservations), l'architecture logicielle (DDD, SOLID, TDD), le schéma de données PocketBase ainsi que la stratégie de déploiement via GitHub Pages avec DNS personnalisé.

1. Présentation Générale
Nom de l'application : Palier (Fait référence à l'espace de rencontre immédiat entre voisins, symbolisant la proximité, l'accès direct et la convivialité du quartier).
Objectif : Faciliter le prêt d'équipements peu utilisés au quotidien (ex. plancha, crêpière, gaufrier, perceuse, fer à souder, ponceuse, etc.), les dépannages ponctuels de consommables (ex. 3 œufs, de la farine) et la solidarité de proximité au sein d'une communauté de maisons voisines regroupées dans un même voisinage.
Gestion des Utilisateurs & Authentification :
Connexion via un compte utilisateur (authentification Google OAuth2 gérée par PocketBase).
Les utilisateurs peuvent appartenir à un ou plusieurs Groupes de Voisinage.
Philosophie de Restitution : Pas de relances, d'alertes infantilisantes ou de reproches. La gestion est souple et basée sur la confiance : l'utilisateur ramène l'objet soit immédiatement après usage, soit lorsqu'une autre maison signale en avoir besoin via une réservation sur l'application.
Choix d'exclusion : L'application ne gèrera pas les transactions financières (pas de gestion d'argent), ni les échanges de messages (pas de mini-chat), ni les alertes/notifications de rappel de restitution.
2. Parcours d'Onboarding & Gestion des Voisinages
2.1 Authentification
Connexion obligatoire avec un compte utilisateur (OAuth Google via PocketBase).
À la connexion, l'application vérifie si l'utilisateur est déjà rattaché à au moins un Groupe de Voisinage.
2.2 Modalité de Première Connexion (Nouveau membre / Nouveau groupe)
Si l'utilisateur n'a aucun groupe de voisinage associé ou souhaite en ajouter un :

Étape 1 - Groupe de Voisinage :
Créer un groupe : L'utilisateur donne un nom au groupe. Un code unique de partage est automatiquement généré pour inviter d'autres voisins.
Rejoindre un groupe : L'utilisateur saisit le code d'invitation fourni par un voisin créateur.
Étape 2 - Sélection ou Création de Maison :
Une fois le groupe rejoint ou créé, l'utilisateur doit :
Choisir une maison existante dans ce groupe via un menu déroulant (<select>).
OU créer une nouvelle maison rattachée à ce groupe.
2.3 Persistance & Multi-Voisinage (Paramètres)
Stockage persistant & Offline-First : Le groupe actif et la maison active sélectionnés sont enregistrés dans le cache local du navigateur (localStorage / IndexedDB). L'inventaire reste consultable sans réseau (ex: dans la cave ou le garage).
Sélecteur dans le Header : Le header permet à tout moment de basculer entre les maisons du groupe ou de changer de groupe de voisinage si l'utilisateur en possède plusieurs.
Page Paramètres :
Visualisation du code d'invitation du groupe actif (avec bouton de copie en un clic) pour permettre à tout membre d'inviter facilement de nouveaux voisins.
Option pour ajouter un nouveau groupe de voisinage (via code ou création d'un nouveau groupe).
Gestion et basculement entre les appartenances aux différents voisinages.
Exportation / Sauvegarde : Export des données du groupe au format JSON/CSV.
3. Design, Statuts d'Objets et UX
3.1 UX & Direction Artistique
Moderne, épurée et soignée : Design visuel contemporain s'appuyant sur des cartes claires, des typographies lisibles et des espacements aérés (intégration Tailwind CSS).
Visuels d'objets : Prise en charge des illustrations d'objets via photos ou emojis dédiés pour une reconnaissance visuelle instantanée.
Recherche instantanée : Barre de recherche rapide et filtres par statut/nom pour retrouver un outil en 1 seconde.
Ultra-intuitive : Accès direct à l'inventaire, aux dépannages express et aux réservations en un minimum de clics.
3.2 Logique des Statuts d'Objets (Spontané vs Réservé)
Afin d'offrir une expérience sans friction, il n'est pas obligatoire d'indiquer une date de fin pour emprunter un objet :

Emprunt Spontané (Temps Réel) : L'utilisateur prend l'objet et modifie sa localisation vers sa maison d'un simple clic. Pas besoin de saisir d'horaire. L'objet reste rattaché à sa maison jusqu'à son retour ou jusqu'à ce qu'un autre voisin le demande/réserve.
Réservation Planifiée (Futur) : Permet d'indiquer un créneau précis (ex. samedi de 14h à 18h) pour bloquer un usage futur.
Les 4 Badges de Statut Visuels :
🟢 Disponible (Dans son rangement habituel, aucune réservation immédiate)
🔵 Chez vous (Déplacé / Actuellement chez la maison sélectionnée)
🔴 Emprunté par [Maison X] (Actuellement chez une autre maison)
📅 Réservé prochainement (Disponible actuellement mais réservé pour un créneau à venir)
4. Périmètre Fonctionnel
Authentification & Gestion des Groupes :
Connexion Google OAuth.
Création de groupe avec génération de code unique.
Jonction de groupe via le code.
Affichage du code d'invitation dans les paramètres pour inviter d'autres membres.
Multi-voisinage configurable dans les paramètres.
Gestion des Objets et Localisation en Temps Réel :
Répertoire clair des objets partagés au sein du groupe actif avec barre de recherche et photos/emojis.
Suivi instantané du statut (Disponible, Chez vous, Emprunté, Réservé).
Formulaire d'ajout d'objet : Déclaration d'un nouvel objet (nom, description, photo/emoji, maison d'origine).
Gestion des Maisons :
Ajout de nouvelles maisons au sein d'un groupe.
Association d'utilisateurs aux maisons.
Demandes de Dépannage Ponctuel (Consommables / Hors-liste) :
Publication de demandes temporaires (ex. "3 œufs", "Farine", "Petit carton").
Validation ou réponse favorable par un voisin d'une autre maison du groupe.
Tableau d'Entraide ("Coups de Main") :
Demandes de services ponctuels non-matériels (ex. "Réceptionner un colis cet après-midi", "Aide pour déplacer un meuble").
Historique des Déplacements d'Objets ("Fil d'Ariane") :
Traçabilité sous forme de fil d'Ariane clair (Maison A ➔ Maison B ➔ Maison C) indiquant l'historique des transferts avec dates et utilisateurs impliqués.
Calendrier et Réservations :
Réservation d'un objet de date/heure à date/heure pour une maison donnée.
Vérification stricte du non-chevauchement des créneaux.
Suggestions d'Achats en Commun avec Vote :
Proposition d'achat partagé (ex. un aspirateur à vapeur).
Système de vote binaire (Pour 👍 / Contre 👎) par utilisateur/maison.
Exportation des Données :
Export JSON/CSV des données du groupe depuis la page Paramètres.
5. Architecture Technique & Principes de Conception
Back-end / API : PocketBase (avec authentification Google OAuth2).
Front-end : HTML / JavaScript statique (Vanilla JS + ES Modules) mis en forme avec Tailwind CSS.
Mode Offline : Persistance locale (IndexedDB / LocalStorage) pour une utilisation même en zone hors-réseau.
DDD (Domain-Driven Design) : Séparation nette entre le domaine métier (règles pures), l'infrastructure (clients API & Cache Local) et la couche de présentation.
SOLID (notamment SRP - Single Responsibility Principle) : Chaque service et module gère une responsabilité précise.
TDD (Test-Driven Development) : Développement guidé par les tests automatisés (Vitest).
Organisation des fichiers du projet (/src)
/src
  ├── domain/          # Règles métiers pures (Agrégats, Entités, Valeurs)
  │     ├── User.js
  │     ├── Group.js
  │     ├── House.js
  │     ├── Booking.js
  │     ├── Item.js
  │     ├── ExpressRequest.js
  │     ├── AssistanceRequest.js
  │     ├── Proposal.js
  │     └── __tests__/
  │           ├── Group.test.js
  │           ├── ItemStatus.test.js
  │           └── Booking.test.js
  ├── infrastructure/  # Clients API PocketBase & LocalStorage / Offline Cache
  │     ├── PocketBaseClient.js
  │     ├── OfflineStorage.js
  │     ├── AuthService.js
  │     └── ContextRepository.js
  ├── application/     # Services applicatifs (Cas d'usage suivant SRP)
  │     ├── GroupService.js
  │     ├── HouseService.js
  │     ├── ItemService.js
  │     ├── ExpressRequestService.js
  │     ├── AssistanceService.js
  │     ├── BookingService.js
  │     ├── ProposalService.js
  │     └── ExportService.js
  └── presentation/    # Composants UI statiques & modales
        ├── OnboardingModal.js
        ├── GroupHeaderSelector.js
        ├── InventoryComponent.js
        ├── AddItemComponent.js
        ├── ExpressRequestComponent.js
        ├── AssistanceComponent.js
        ├── CalendarComponent.js
        └── SettingsComponent.js
6. Modèle de Données (Collections PocketBase)
Collection users (Système natif PocketBase)
id : Identifiant unique
email : Adresse email
name : Nom complet (récupéré via Google)
avatar : Photo de profil Google
Collection groups (Groupes de Voisinage)
id : Identifiant unique
name : Nom du voisinage (ex: "Les Voisins du Parc")
invite_code : Code unique à 6 ou 8 caractères généré aléatoirement
created_by : Relation \rightarrow users
Collection group_members (Table de jonction Utilisateurs <-> Groupes)
id : Identifiant unique
group : Relation \rightarrow groups
user : Relation \rightarrow users
Collection houses
id : Identifiant unique
name : Nom de la maison (ex: "Maison A", "Maison 12")
group : Relation \rightarrow groups
Collection items
id : Identifiant unique
name : Nom de l'objet (ex: "Plancha Tefal")
description : Description
image_url : URL ou code emoji de l'objet
group : Relation \rightarrow groups
home_house : Relation \rightarrow houses (Maison d'origine)
current_house : Relation \rightarrow houses (Localisation actuelle)
Collection express_requests (Dépannages temporaires)
id : Identifiant unique
title : Intitulé (ex: "3 œufs", "Farine")
description : Détails
group : Relation \rightarrow groups
requested_by_user : Relation \rightarrow users
requested_by_house : Relation \rightarrow houses
status : Texte (pending, fulfilled)
fulfilled_by_house : Relation optionnelle \rightarrow houses
Collection assistance_requests (Entraide & Coups de main)
id : Identifiant unique
title : Intitulé (ex: "Réceptionner un colis")
description : Détails / Créneau
group : Relation \rightarrow groups
requested_by_user : Relation \rightarrow users
requested_by_house : Relation \rightarrow houses
status : Texte (open, resolved)
Collection item_history
id : Identifiant unique
item : Relation \rightarrow items
from_house : Relation \rightarrow houses
to_house : Relation \rightarrow houses
moved_by_user : Relation \rightarrow users
created : Date et heure automatiques
Collection bookings
id : Identifiant unique
item : Relation \rightarrow items
house : Relation \rightarrow houses
booked_by_user : Relation \rightarrow users
start_date : DateTime
end_date : DateTime
Collection proposals
id : Identifiant unique
title : Intitulé (ex: "Aspirateur vapeur")
description : Détails
estimated_cost : Estimation du coût
group : Relation \rightarrow groups
created_by_user : Relation \rightarrow users
Collection votes
id : Identifiant unique
proposal : Relation \rightarrow proposals
house : Relation \rightarrow houses
voted_by_user : Relation \rightarrow users
is_approved : Booléen
7. Exemple d'Implémentation TDD (Domaine & Groupe)
Test Unitaire Métier (src/domain/__tests__/ItemStatus.test.js)
import { describe, it, expect } from 'vitest';
import { Item } from '../Item.js';

describe('Règles de statut d un objet (TDD)', () => {
  it('doit indiquer que l objet est "Chez vous" si la maison actuelle correspond à la maison active', () => {
    const item = new Item({ id: '1', name: 'Perceuse', currentHouseId: 'house-A' });
    expect(item.getStatus('house-A', [])).toBe('CHEZ_VOUS');
  });

  it('doit indiquer qu un objet est "Emprunté" si la maison actuelle diffère de la maison active', () => {
    const item = new Item({ id: '1', name: 'Perceuse', currentHouseId: 'house-B' });
    expect(item.getStatus('house-A', [])).toBe('EMPRUNTE');
  });
});
8. Stratégie de Déploiement (GitHub Pages + DNS + PocketBase)
Architecture d'hébergement
Front-end Statique : Hébergé sur GitHub Pages, accessible via nom de domaine personnalisé configuré par enregistrements DNS (CNAME).
Back-end PocketBase : Hébergé sur instance Cloud (ex: VPS, Fly.io, Render) fournissant une URL d'API HTTPS sécurisée (https://api.palier.app) avec la configuration Google OAuth2 active.
Workflow GitHub Actions (.github/workflows/deploy.yml)
name: Deploy Static Frontend to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./src