# Architecture

Le frontend Next.js fournit les écrans et relaie les appels `/api` vers FastAPI. Les données métier proviennent toutes de l'API. Le backend contient les règles d'authentification, d'accès et de stock. PostgreSQL est la source de vérité.

Chaque requête d'organisation utilise `X-Organization-ID`, mais le serveur recherche d'abord un membre correspondant à l'utilisateur de la session. Tous les accès aux objets utilisent ensuite `organization_id` dans les filtres. Les clés étrangères composites relient les objets d'une même organisation.

Le stock en vrac est représenté par `stock_balances` et un journal `stock_movements`. Chaque opération PostgreSQL verrouille la ligne de l'organisation, vérifie les propriétaires des objets, modifie les soldes et ajoute le mouvement dans une seule transaction. Cela évite les sorties concurrentes excessives, avec un coût de contention par organisation. Les actifs sérialisés restent distincts des soldes en vrac.

Les modèles métier sont des listes de modules activés sur l'organisation. Les routes des modules contrôlent également l'activation côté serveur. Les valeurs d'affichage du tableau de bord et des rapports sont calculées à partir des tables.

