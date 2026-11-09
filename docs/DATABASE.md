# Base de données

Tables : users, sessions, organizations, organization_members, categories, locations, items, contacts, assets, stock_balances, stock_movements, rentals, audit_logs. `contacts.kind` différencie clients et fournisseurs. Les quantités utilisent NUMERIC(14,3) et les prix NUMERIC(14,2). Les événements stockent des dates UTC.

Chaque table métier porte `organization_id`. Les relations articles/catégories, actifs/articles/emplacements, soldes/articles/emplacements, mouvements/articles/actifs/emplacements et locations/actifs/contacts utilisent des clés étrangères composites avec l'identifiant d'organisation. SKU, numéro de série, nom de catégorie et nom d'emplacement sont uniques par organisation. `stock_movements` possède une clé d'idempotence unique par organisation. Le solde a une clé primaire (organisation, article, emplacement) et une contrainte quantité positive.

Index : e-mail utilisateur, contacts par organisation/type, mouvements par organisation/date, locations par organisation/actif/statut. La migration initiale est `0001_initial.py`. Elle crée les tables de la métadonnée SQLAlchemy ; les migrations futures doivent utiliser des opérations Alembic explicites pour conserver un historique de schéma stable.

La base SQLite en mémoire sert aux tests API. PostgreSQL est la cible de déploiement et la seule cible où le verrouillage de ligne `FOR UPDATE` est garanti.

