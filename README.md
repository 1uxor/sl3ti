# Sl3ti — سلعتي

**Gérez vos biens, simplement.**

Sl3ti est un prototype SaaS de gestion de stock, d'équipements et de locations pour petites entreprises au Maroc. Chaque organisation possède ses propres articles, emplacements, contacts, mouvements et membres. Une même personne peut appartenir à plusieurs organisations.

## Fonctionnalités implémentées

- Inscription, connexion et déconnexion par session HttpOnly et mot de passe Argon2id.
- Création de plusieurs organisations, sélection d'espace et rôles owner/admin/manager/staff/viewer.
- Articles en vrac ou sérialisés, catégories, emplacements, clients, fournisseurs.
- Réceptions, sorties, transferts, ajustements sur quantité comptée et historique immuable.
- Contrôle du stock négatif, clé d'idempotence, verrouillage transactionnel de l'organisation sous PostgreSQL.
- Tableau de bord connecté aux données, alertes de seuil, rapport de stock et export CSV.
- Import/export CSV du catalogue avec limite de taille et validation.
- Équipements sérialisés : enregistrement, affectation, retour, maintenance et historique.
- Locations : réservation future, contrôle de chevauchement, activation, retour, annulation de réservation, indicateur de retard.
- Modules commerce, equipment et rental activables par owner/admin.

La valeur de stock affichée est **quantité actuelle × coût d'achat configuré**. Ce n'est pas une valorisation comptable.

## Aperçus

Captures à ajouter après lancement local : écran de connexion, tableau de bord, inventaire et équipements.

## Technologies

Frontend : Next.js App Router, React, TypeScript, Tailwind CSS, composants CSS réutilisables (shadcn/ui non intégré dans cette première version), Lucide, TanStack Query, Zod, Recharts. React Hook Form est déclaré comme dépendance mais n'est pas utilisé par les formulaires de ce prototype. Traductions français/anglais/arabe intégrées au frontend. Backend : FastAPI, SQLAlchemy 2, Pydantic 2, Alembic, PostgreSQL, Pytest. Infrastructure : Docker Compose.

## Architecture

Le navigateur appelle le frontend Next.js sur le port 3000. Next relaie `/api/v1/*` vers FastAPI sur le réseau Compose. FastAPI valide la session, le jeton CSRF, l'appartenance à l'organisation et les permissions avant la requête métier. PostgreSQL conserve les données. Voir [ARCHITECTURE.md](docs/ARCHITECTURE.md), [DATABASE.md](docs/DATABASE.md) et [SECURITY.md](docs/SECURITY.md).

## Prérequis

Windows, PowerShell, Docker Desktop **démarré**. Aucun PostgreSQL local requis. Les images et paquets doivent pouvoir être téléchargés lors du premier démarrage.

## Installation Windows

Depuis la racine du dépôt :

```powershell
Copy-Item .env.example .env
# Modifiez POSTGRES_PASSWORD dans .env : utilisez une longue valeur alphanumérique locale.
docker compose up --build -d
docker compose ps
```

Adresses : frontend http://localhost:3000, API http://localhost:8000, Swagger http://localhost:8000/docs. Le backend applique `alembic upgrade head` au démarrage et attend la santé de PostgreSQL.

Scripts PowerShell : `./scripts/start.ps1`, `./scripts/stop.ps1`, `./scripts/logs.ps1`, `./scripts/migrate.ps1`, `./scripts/test.ps1`.

## Variables d'environnement

`.env` : `POSTGRES_PASSWORD` obligatoire pour Compose. `DATABASE_URL` est injectée au backend par Compose. `COOKIE_SECURE=false` convient au développement HTTP local ; activez `true` derrière HTTPS. `BACKEND_URL` est utilisé par Next pour le relais API.

Ne publiez pas le fichier `.env`. Le mot de passe de démonstration n'a aucune valeur par défaut.

## Données de démonstration

Choisissez votre propre mot de passe, puis :

```powershell
$env:DEMO_PASSWORD = "ChoisissezUneLongueValeur123"
docker compose exec -e DEMO_PASSWORD=$env:DEMO_PASSWORD backend python seed.py
```

Compte : `demo@sl3ti.ma` avec le mot de passe choisi. Le script crée Atlas Commerce (20 produits, 2 emplacements), Atlas Equipment et Atlas Rental. L'exécution répétée évite les doublons principaux.

## Parcours de démonstration

1. Ouvrez http://localhost:3000, créez un compte et un espace « Commerce ».
2. Dans **Articles**, créez un article en mode quantité.
3. Dans **Inventaire**, cliquez **Réception** et choisissez l'article, la destination et la quantité.
4. Cliquez **Sortie** pour retirer une partie du stock.
5. Créez un second emplacement dans **Emplacements**, puis faites un **Transfert**.
6. Consultez les soldes dans **Inventaire**, le journal dans **Mouvements** et la valeur estimée dans **Rapports**.
7. Créez un second espace depuis la barre latérale et vérifiez la séparation des données.

## Tests

```powershell
docker compose exec backend pytest -vv -s
docker compose exec backend alembic current
cd frontend
npm.cmd install
npm.cmd run typecheck
npm.cmd run build
```

Les tests Python utilisent SQLite en mémoire et ne touchent pas la base de développement. Pour vérifier les verrous de concurrence PostgreSQL, lancer un test d'intégration dédié sur une base PostgreSQL de test reste nécessaire. Aucun test navigateur automatisé n'est inclus.

## API principale

`/api/v1/auth/register|login|logout|me`, `/api/v1/organizations`, `/api/v1/items`, `/api/v1/locations`, `/api/v1/inventory/receipts|issues|transfers|adjustments|balances`, `/api/v1/movements`, `/api/v1/dashboard/summary`, `/api/v1/reports/stock`, `/api/v1/assets`, `/api/v1/rentals`. Les routes détaillées sont dans Swagger et [API.md](docs/API.md).

Pour les requêtes authentifiées qui modifient des données, fournir `X-CSRF-Token` (cookie `sl3ti_csrf`). Pour une route d'organisation, fournir `X-Organization-ID`. Pour un mouvement, fournir une clé `Idempotency-Key` unique.

## Rôles et mouvements

Owner : tout. Admin : gestion des membres et opérations. Manager : articles, stock et rapports. Staff : lecture et opérations de stock. Viewer : lecture seule. Les permissions sont imposées au serveur.

Une sortie ne peut pas dépasser la quantité disponible. Un transfert décrémente la source et incrémente la destination dans la même transaction. Les corrections sont des ajustements avec raison ; les mouvements historiques n'ont pas de route de modification.

## Modèles métier

Commerce active le stock en vrac. Equipment active les actifs sérialisés. Rental active equipment et locations. Custom commence avec commerce. Un owner/admin peut activer les modules permis dans Paramètres. Voir [MODULES.md](docs/MODULES.md).

## Dépannage

- Docker inaccessible : démarrer Docker Desktop puis relancer `docker compose up --build -d`.
- Frontend indisponible : `docker compose logs frontend`.
- API indisponible : `docker compose logs backend db`; vérifier la variable `POSTGRES_PASSWORD`.
- Changement de mot de passe PostgreSQL après création du volume : le volume garde l'ancien mot de passe ; rétablir la valeur d'origine ou réinitialiser volontairement le volume.
- Une commande npm bloquée sous PowerShell : utiliser `npm.cmd`.

## Limites connues

Ce dépôt est un **prototype**, pas un service certifié pour la production. La limitation de tentatives de connexion est en mémoire par processus. Les opérations de stock sont sérialisées par verrou PostgreSQL au niveau de l'organisation, ce qui limite le débit d'une grosse organisation. Les tests de concurrence PostgreSQL, les tests de navigateur et la revue de sécurité restent à faire. L'interface de traduction arabe couvre la navigation mais pas tous les messages ni toutes les dates. Il n'y a pas de facturation, de paiement, d'alertes externes ni de PWA hors ligne. Les réservations futures nécessitent une activation manuelle au début de la location. Les illustrations sont des espaces réservés aux captures réelles.

Validation locale : 7 tests backend réussis, migration et seed exécutés, TypeScript et build Next.js réussis, et parcours HTTP via le relais Next.js réussi. Docker Desktop était arrêté ; le démarrage Compose/PostgreSQL reste à vérifier.

## Suite

Voir [ROADMAP.md](docs/ROADMAP.md) : codes QR, PWA mobile, facturation/POS, contrats de location, analyses avancées, intégrations, assistants IA optionnels, abonnements et internationalisation.

