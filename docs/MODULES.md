# Modules et modèles métier

Les modèles `commerce`, `equipment`, `rental` et `custom` déterminent les modules activés lors de la création d'une organisation. Ils ne créent pas de base de données ou de code distinct. Rental nécessite equipment.

Pour ajouter un modèle : ajouter sa configuration dans `backend/app/core.py`, les contrôles de module dans les routes, la navigation et les libellés dans le frontend, puis des tests d'accès et de comportement. Pour ajouter un module : créer ses modèles et migration, routes et permissions, tests, écrans et documentation. Les règles métier doivent rester dans le backend.

