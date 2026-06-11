

**FitTrack**

Cahier des Charges Technique

*Application web de suivi d’exercice physique individuel*

*avec calcul de calories et module IA nutrition*

Version 1.0  —  11 juin 2026

Stack : Next.js · FastAPI · PostgreSQL · Docker

# **1\. Contexte & Objectifs**

## **1.1 Présentation du projet**

FitTrack est une application web permettant à un individu pratiquant des exercices physiques à domicile de planifier, enregistrer et suivre ses séances d’entraînement. L’objectif est de centraliser l’historique sportif, calculer les calories dépensées (formule MET), visualiser la progression et recevoir des recommandations nutritionnelles localisées via IA.

## **1.2 Objectifs principaux**

* Permettre à l’utilisateur de créer et gérer ses exercices personnalisés

* Enregistrer chaque série individuellement (répétitions réelles \+ poids)

* Calculer automatiquement les calories dépensées (MET × poids × durée)

* Visualiser la progression via un dashboard interactif

* Proposer une alimentation de récupération localisée via module IA (Claude API)

* Fixer et suivre des objectifs personnels (fréquence, performance, poids)

## **1.3 Utilisateurs cibles**

| Rôle | Description | Accès |
| :---- | :---- | :---- |
| user | Sportif pratiquant à domicile | Accès complet à ses propres données |
| admin | Administrateur plateforme | Accès total — gestion comptes & monitoring |

## **1.4 Périmètre MVP**

### **Inclus dans le MVP**

* Inscription / connexion sécurisée \+ onboarding biométrique

* Bibliothèque d’exercices (prédéfinis \+ custom) avec valeurs MET

* Saisie détaillée par série (répétitions \+ poids par ligne)

* Calcul automatique des calories dépensées (formule MET)

* Dashboard de progression avec graphiques

* Module IA nutrition post-séance (aliments locaux \+ plan de repas)

* Gestion des objectifs personnels

### **Hors périmètre (v2+)**

* Application mobile native

* Intégration wearables (montre, capteurs)

* Mode coach / suivi multi-utilisateurs

* Plans d’entraînement générés par IA

# **2\. Stack Technique**

## **2.1 Frontend**

| Technologie | Usage |
| :---- | :---- |
| Next.js 14 (App Router) | Framework principal, SSR & routing |
| Tailwind CSS \+ shadcn/ui | Design system & composants UI |
| React Query (TanStack) | Gestion données serveur & cache |
| Recharts | Graphiques de progression |
| Zustand | État global léger (session utilisateur) |
| Zod | Validation des formulaires côté client |

## **2.2 Backend**

| Technologie | Usage |
| :---- | :---- |
| FastAPI | API REST principale |
| SQLAlchemy 2.0 | ORM & accès base de données |
| Alembic | Migrations de schéma |
| Pydantic v2 | Validation des données |
| python-jose | Génération & validation JWT |
| bcrypt | Hachage des mots de passe |
| slowapi | Rate limiting |
| Anthropic SDK | Module IA nutrition (Claude API) |

## **2.3 Base de données & DevOps**

| Technologie | Usage |
| :---- | :---- |
| PostgreSQL 16 | Données applicatives principales |
| Redis | Cache sessions & rate limiting |
| Docker \+ Docker Compose | Conteneurisation locale & prod |
| GitHub Actions | CI/CD automatisé |
| Nginx | Reverse proxy en production |

# **3\. Architecture Système**

## **3.1 Vue d’ensemble**

Architecture API-first découplée : le frontend Next.js consomme une API REST FastAPI. Les deux services sont conteneurisés séparément et communiquent via HTTP interne. Le module IA nutrition appelle l’API Anthropic (Claude) depuis le backend.

## **3.2 Diagramme de composants**

  NAVIGATEUR \[Next.js\]

       | HTTPS / REST \+ JWT

  API BACKEND \[FastAPI\]

  ├── Auth Router

  ├── Workouts Router

  ├── Exercises Router

  ├── Calories Router

  └── Nutrition Router → \[Claude API\]

       |                |

  \[PostgreSQL\]     \[Redis\]

## **3.3 Flux de données principal**

* L’utilisateur s’authentifie → Access Token JWT (15 min) \+ Refresh Token (7j)

* Le frontend envoie toutes les requêtes avec Authorization: Bearer \<token\>

* FastAPI valide le token via dépendance get\_current\_user

* La logique métier s’exécute, SQLAlchemy lit/écrit en PostgreSQL

* Post-séance : le Nutrition Router appelle Claude API avec calories \+ localisation

* La suggestion IA est sauvegardée et retournée au frontend

# **4\. Modèle de Données**

## **4.1 Entité : User**

| Champ | Type | Contraintes | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Identifiant unique |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email de connexion |
| hashed\_password | VARCHAR | NOT NULL | Mot de passe haché (bcrypt) |
| full\_name | VARCHAR(100) | NOT NULL | Nom complet |
| weight\_kg | FLOAT | NULLABLE | Poids en kg |
| height\_cm | INTEGER | NULLABLE | Taille en cm |
| birth\_date | DATE | NULLABLE | Date de naissance |
| sex | ENUM | NULLABLE | male / female |
| country | VARCHAR(100) | NULLABLE | Pays (détecté ou saisi) |
| city | VARCHAR(100) | NULLABLE | Ville (détectée ou saisie) |
| role | ENUM | DEFAULT 'user' | user / admin |
| created\_at | TIMESTAMP | NOT NULL | Date d’inscription |

## **4.2 Entité : Exercise**

| Champ | Type | Contraintes | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Identifiant unique |
| name | VARCHAR(100) | NOT NULL | Nom de l’exercice |
| category | ENUM | NOT NULL | Musculation, Cardio, Stretching, HIIT |
| muscle\_groups | VARCHAR\[\] | NOT NULL | Groupes musculaires ciblés |
| met\_value | FLOAT | NOT NULL, DEFAULT 3.5 | Valeur MET (Metabolic Equivalent) |
| is\_default | BOOLEAN | DEFAULT false | Exercice global ou custom |
| created\_by | UUID | FK → User, NULLABLE | NULL si exercice global |

## **4.3 Entité : WorkoutSession**

| Champ | Type | Contraintes | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Identifiant unique |
| user\_id | UUID | FK → User, NOT NULL | Propriétaire de la séance |
| title | VARCHAR(100) | NOT NULL | Titre de la séance |
| date | DATE | NOT NULL | Date de la séance |
| duration\_minutes | INTEGER | NOT NULL | Durée totale (minutes) |
| total\_calories | FLOAT | NULLABLE | Calories totales calculées |
| notes | TEXT | NULLABLE | Notes libres |

## **4.4 Entité : WorkoutExercise**

| Champ | Type | Contraintes | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Identifiant unique |
| session\_id | UUID | FK → WorkoutSession | Séance parente |
| exercise\_id | UUID | FK → Exercise | Exercice effectué |
| order\_index | INTEGER | NOT NULL | Ordre dans la séance |
| rest\_seconds | INTEGER | NULLABLE | Repos entre séries |
| calories\_burned | FLOAT | NULLABLE | Calories pour cet exercice |

## **4.5 Entité : ExerciseSet (nouvelle)**

Stocke chaque série individuellement. Exemple : 4 séries de pompes → 4 lignes avec reps \= \[45, 30, 25, 20\].

| Champ | Type | Contraintes | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Identifiant unique |
| workout\_exercise\_id | UUID | FK → WorkoutExercise | Exercice parent |
| set\_number | INTEGER | NOT NULL | Numéro de la série (1, 2, 3...) |
| reps | INTEGER | NULLABLE | Répétitions réalisées |
| weight\_kg | FLOAT | NULLABLE | Charge utilisée sur cette série |
| duration\_seconds | INTEGER | NULLABLE | Durée (cardio ou isométrique) |
| completed | BOOLEAN | DEFAULT true | Série complétée ou abandonnée |

## **4.6 Entité : NutritionSuggestion (nouvelle)**

| Champ | Type | Contraintes | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Identifiant unique |
| session\_id | UUID | FK → WorkoutSession | Séance associée |
| calories\_burned | FLOAT | NOT NULL | Calories dépensées (input IA) |
| context | ENUM | NOT NULL | recovery / meal\_plan / both |
| country | VARCHAR | NOT NULL | Pays au moment de la génération |
| city | VARCHAR | NULLABLE | Ville au moment de la génération |
| suggestion\_json | JSONB | NOT NULL | Réponse IA complète (structurée) |
| generated\_at | TIMESTAMP | NOT NULL | Date de génération |

## **4.7 Relations**

| Relation | Type | Description |
| :---- | :---- | :---- |
| User → WorkoutSession | One-to-Many | Un user a plusieurs séances |
| WorkoutSession → WorkoutExercise | One-to-Many | Une séance contient plusieurs exercices |
| WorkoutExercise → ExerciseSet | One-to-Many | Un exercice contient N séries individuelles |
| Exercise → WorkoutExercise | One-to-Many | Un exercice apparaît dans plusieurs séances |
| User → Exercise | One-to-Many | Un user crée des exercices custom |
| User → Goal | One-to-Many | Un user a plusieurs objectifs |
| WorkoutSession → NutritionSuggestion | One-to-One | Une séance génère une suggestion nutrition |

# **5\. Endpoints API**

## **5.1 Authentification**

| Méthode | Route | Description | Auth |
| :---- | :---- | :---- | :---- |
| POST | /api/auth/register | Inscription | Non |
| POST | /api/auth/login | Connexion (retourne JWT) | Non |
| POST | /api/auth/refresh | Renouveler l’access token | Non (cookie) |
| POST | /api/auth/logout | Invalidation du refresh token | Oui |
| GET | /api/auth/me | Profil de l’utilisateur courant | Oui |
| PUT | /api/auth/me | Modifier son profil \+ biométrie | Oui |

## **5.2 Exercices**

| Méthode | Route | Description | Auth |
| :---- | :---- | :---- | :---- |
| GET | /api/exercises | Liste (globaux \+ custom user) | Oui |
| GET | /api/exercises/:id | Détail d’un exercice | Oui |
| POST | /api/exercises | Créer un exercice custom | Oui |
| PUT | /api/exercises/:id | Modifier un exercice custom | Oui (owner) |
| DELETE | /api/exercises/:id | Supprimer un exercice custom | Oui (owner) |

## **5.3 Séances d’entraînement**

| Méthode | Route | Description | Auth |
| :---- | :---- | :---- | :---- |
| GET | /api/workouts | Historique des séances (paginé) | Oui |
| GET | /api/workouts/:id | Détail d’une séance \+ séries | Oui (owner) |
| POST | /api/workouts | Créer une séance avec séries détaillées | Oui |
| PUT | /api/workouts/:id | Modifier une séance | Oui (owner) |
| DELETE | /api/workouts/:id | Supprimer une séance | Oui (owner) |
| GET | /api/workouts/:id/calories | Détail calcul calories | Oui |

## **5.4 Calories**

| Méthode | Route | Description | Auth |
| :---- | :---- | :---- | :---- |
| GET | /api/calories/session/:id | Calories totales d’une séance | Oui |
| GET | /api/calories/history | Historique des calories brûlées | Oui |

## **5.5 Module IA Nutrition**

| Méthode | Route | Description | Auth |
| :---- | :---- | :---- | :---- |
| POST | /api/nutrition/suggest | Générer une suggestion post-séance | Oui |
| GET | /api/nutrition/history | Historique des suggestions | Oui |

## **5.6 Statistiques & Dashboard**

| Méthode | Route | Description | Auth |
| :---- | :---- | :---- | :---- |
| GET | /api/stats/overview | Total séances, heures, streak, calories | Oui |
| GET | /api/stats/workouts-per-week | Séances par semaine (graphique) | Oui |
| GET | /api/stats/volume-by-muscle | Volume par groupe musculaire | Oui |
| GET | /api/stats/progress/:exercise\_id | Progression sur un exercice | Oui |
| GET | /api/stats/calories-history | Calories brûlées dans le temps | Oui |

## **5.7 Logique de calcul des calories**

Formule utilisée (formule MET standard) :

Calories \= MET x poids\_kg x duree\_heures

Durée d’un exercice estimée :

  (total\_reps / cadence\_moy) \+ (nb\_series x rest\_seconds)

  cadence\_moy : constante par catégorie (pompes \= 20 reps/min)

Exemple : 4 séries pompes (45+30+25+20 \= 120 reps)

  Durée \= (120/20) \+ (4 x 60s) \= 6min \+ 4min \= 10min \= 0.167h

  Calories \= 3.8 x 75kg x 0.167h \= 47.6 kcal

*⚠️  La durée totale de séance (duration\_minutes) sert de plafond de cohérence pour valider le calcul.*

# **6\. Pages & Composants UI**

## **6.1 Arborescence des pages**

/                          → Landing page (hero \+ CTA)

/login                     → Connexion

/register                  → Inscription

/onboarding                → Formulaire biométrique post-inscription

/dashboard                 → Dashboard principal (stats globales)

/workouts                  → Historique des séances

/workouts/new              → Créer une nouvelle séance

/workouts/:id              → Détail, édition, calories & suggestion IA

/exercises                 → Bibliothèque d’exercices

/goals                     → Mes objectifs

/stats                     → Statistiques & progression détaillée

/settings                  → Paramètres du profil

/admin                     → Panel admin (role: admin uniquement)

## **6.2 Composants principaux**

| Composant | Description | Pages |
| :---- | :---- | :---- |
| \<Navbar /\> | Barre de navigation avec avatar & menu | Toutes |
| \<Sidebar /\> | Navigation latérale du dashboard | Pages protégées |
| \<SetLogger /\> | Saisie série par série : reps \+ poids par ligne, estimation calories temps réel | /workouts/new |
| \<ExerciseSelector /\> | Sélecteur d’exercice avec recherche & filtres | /workouts/new |
| \<WorkoutCard /\> | Résumé d’une séance (date, durée, calories) | /workouts |
| \<CalorieSummary /\> | Résumé calories brûlées avec détail par exercice | /workouts/:id |
| \<NutritionCard /\> | Carte suggestion IA : aliments locaux \+ plan de repas | /workouts/:id |
| \<ProgressChart /\> | Graphique linéaire de progression | /stats, /dashboard |
| \<GoalCard /\> | Carte objectif avec barre de progression | /goals |
| \<StatCard /\> | Carte de statistique clé (nombre, icône) | /dashboard |
| \<StreakBadge /\> | Badge série de jours consécutifs | /dashboard |
| \<OnboardingForm /\> | Formulaire post-inscription : poids, taille, âge, sexe, localisation | /onboarding |
| \<EmptyState /\> | État vide avec CTA (première séance) | Pages liste |

## **6.3 Dashboard — Widgets**

| Widget | Données affichées |
| :---- | :---- |
| Séances ce mois | Nombre total de séances du mois en cours |
| Calories brûlées | Total calories de la semaine en cours |
| Temps total | Heures d’entraînement cumulées |
| Streak actuel | Nombre de jours consécutifs d’activité |
| Objectifs actifs | Progression des objectifs en cours |
| Séances / semaine | Graphique barres sur les 8 dernières semaines |
| Dernière séance | Résumé avec calories & suggestion nutrition |

# **7\. Sécurité & Authentification**

## **7.1 Stratégie d’authentification**

| Paramètre | Valeur |
| :---- | :---- |
| Mécanisme | JWT — Access Token \+ Refresh Token |
| Durée Access Token | 15 minutes |
| Durée Refresh Token | 7 jours |
| Stockage Access Token | Mémoire JS (non persisté) |
| Stockage Refresh Token | Cookie HttpOnly ; SameSite=Strict |

## **7.2 Gestion des rôles (RBAC)**

| Rôle | Permissions |
| :---- | :---- |
| user | CRUD sur ses propres séances, exercices custom, objectifs |
| admin | Accès total — gestion des comptes, exercices globaux, monitoring |

## **7.3 Mesures de sécurité**

| Mesure | Implémentation |
| :---- | :---- |
| HTTPS | SSL obligatoire en production (Let’s Encrypt) |
| CORS | Whitelist stricte (FRONTEND\_URL uniquement) |
| Rate limiting | 60 req/min par IP via slowapi |
| Validation des entrées | Pydantic v2 (backend) \+ Zod (frontend) |
| Hachage des mots de passe | bcrypt, cost factor 12 |
| Isolation des données | Chaque requête filtre par user\_id du token JWT |
| Logs d’accès | Journalisation des connexions et erreurs 401/403 |
| Sécurité API IA | Clé Anthropic stockée côté serveur uniquement, jamais exposée au client |

# **8\. Déploiement & Infrastructure**

## **8.1 Environnements**

| Environnement | Usage | URL |
| :---- | :---- | :---- |
| development | Dév local (Docker Compose) | localhost:3000 / :8000 |
| staging | Tests & recette | staging.fittrack.app |
| production | Production | fittrack.app |

## **8.2 Variables d’environnement**

| Variable | Description |
| :---- | :---- |
| DATABASE\_URL | postgresql://user:pass@postgres/fittrack |
| REDIS\_URL | redis://redis:6379 |
| JWT\_SECRET | Clé secrète JWT (64 caractères min.) |
| JWT\_REFRESH\_SECRET | Clé séparée pour les refresh tokens |
| FRONTEND\_URL | URL du frontend (CORS whitelist) |
| ANTHROPIC\_API\_KEY | Clé API Claude pour le module nutrition IA |
| CLAUDE\_MODEL | claude-sonnet-4-20250514 |
| ENVIRONMENT | development / staging / production |

## **8.3 Pipeline CI/CD (GitHub Actions)**

Push sur main / PR

  └── Lint (ESLint \+ Ruff)

        └── Tests (Pytest \+ Jest)

              └── Build Docker images

                    └── Push registry (GHCR)

                          └── Deploy staging

                                └── (Manuel) Deploy production

# **9\. Planning & Phases de Développement**

## **Phase 1 — Fondations (Semaine 1-2)**

* ☐ Init repos (frontend \+ backend), Docker Compose local

* ☐ Modèle de données & migrations Alembic

* ☐ Auth complète (register, login, JWT, refresh)

* ☐ Layout Next.js (Navbar, Sidebar, routing protégé)

* ☐ Formulaire onboarding biométrique (poids, taille, âge, sexe, localisation)

* ☐ CI/CD de base (lint \+ tests)

## **Phase 2 — Core CRUD (Semaine 3-4)**

* ☐ CRUD Exercices (globaux seed avec valeurs MET \+ custom user)

* ☐ CRUD Séances d’entraînement

* ☐ SetLogger : saisie série par série (reps \+ poids par ligne)

* ☐ ExerciseSelector avec recherche & filtres par catégorie

* ☐ Historique des séances avec pagination

## **Phase 3 — Calories, Dashboard & IA (Semaine 5-6)**

* ☐ Calcul des calories par série et par séance (formule MET)

* ☐ Estimation calories en temps réel dans SetLogger (côté client)

* ☐ Endpoints /api/calories/\* \+ affichage CalorieSummary

* ☐ Intégration Claude API pour le module nutrition

* ☐ Composant NutritionCard avec aliments locaux \+ plan de repas

* ☐ Endpoints statistiques /api/stats/\*

* ☐ Dashboard avec widgets (StatCard, StreakBadge, graphiques Recharts)

* ☐ CRUD Objectifs avec GoalCard & barre de progression

## **Phase 4 — Finalisation (Semaine 7\)**

* ☐ Tests Pytest (auth, workouts, calories, nutrition)

* ☐ Tests Jest/Playwright (pages critiques)

* ☐ Gestion des erreurs & états vides

* ☐ Documentation API Swagger (auto-générée par FastAPI)

* ☐ Optimisations (pagination, React Query cache, index PostgreSQL)

## **Phase 5 — Déploiement (Semaine 8\)**

* ☐ Config staging \+ DNS

* ☐ Tests end-to-end sur staging

* ☐ Déploiement production

* ☐ Monitoring (logs, uptime)

# **Annexes**

## **A. Glossaire**

| Terme | Définition |
| :---- | :---- |
| Séance (Workout) | Session d’entraînement regroupant plusieurs exercices |
| Série (Set) | Ensemble de répétitions d’un exercice sans pause |
| MET | Metabolic Equivalent of Task — intensité métabolique d’un exercice |
| Streak | Nombre de jours consécutifs avec au moins une séance enregistrée |
| RBAC | Role-Based Access Control — gestion des droits par rôle |
| JWT | JSON Web Token — mécanisme d’authentification sans état serveur |

## **B. Valeurs MET de référence (seed data)**

| Exercice | Catégorie | MET |
| :---- | :---- | :---- |
| Pompes | Musculation | 3.8 |
| Squats | Musculation | 5.0 |
| Fentes | Musculation | 4.0 |
| Dips | Musculation | 3.8 |
| Gainage (planche) | Musculation | 3.5 |
| Tractions | Musculation | 8.0 |
| Burpees | HIIT | 8.0 |
| Jumping Jacks | Cardio | 7.7 |
| Course sur place | Cardio | 8.0 |
| Étirement ischio-jamb. | Stretching | 2.3 |

## **C. Exemple de réponse IA nutrition (Antananarivo)**

Pour un utilisateur à Antananarivo ayant brûlé 300 kcal :

recovery\_foods:

  \- Ravitoto (feuilles de manioc) → riche en fer & protéines

  \- Banane Fokontsoa → glucides rapides \+ potassium

  \- Laoka vary → combo protéines/glucides idéal post-effort

meal\_plan:

  Timing : Dans les 30-60 min post-séance

  Snack   : Banane \+ eau de coco (\~120 kcal)

  Repas   : Riz \+ Ravitoto \+ 2 oeufs (\~450 kcal)

hydration\_tip : Boire 500ml d'eau dans l'heure.

  L'eau de coco locale est une excellente alternative isotonique.

*⚠️  Hypothèses prises : pas de mode multi-utilisateurs, pas d’app mobile native, pas d’intégration wearables. Ces fonctionnalités sont prévues en v2.*
