# API

Documentation interactive : `http://localhost:8000/docs`. Préfixe : `/api/v1`. Les erreurs utilisent le champ `detail`.

Authentification : `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`. Les cookies de session et CSRF sont renvoyés après connexion. Les écritures authentifiées exigent `X-CSRF-Token`.

Organisation : `GET/POST /organizations`, `PATCH /organizations/current/modules`, `GET/POST /members`. Les routes métier exigent `X-Organization-ID`.

Catalogue : `GET/POST /items`, `GET/PATCH /items/{id}`, `GET /items.csv`, `POST /items/import`, `GET/POST /categories`, `GET/POST /locations`, `GET/POST /contacts/{customer|supplier}`.

Stock : `GET /inventory/balances`, `POST /inventory/receipts, POST /inventory/returns`, `POST /inventory/issues`, `POST /inventory/transfers`, `POST /inventory/adjustments`, `GET /movements`. Les cinq routes d'écriture exigent `Idempotency-Key`. Les listes articles et mouvements prennent page et page_size.

Équipement : `GET/POST /assets`, `POST /assets/{id}/assign|return|maintenance|available`, `GET /assets/{id}/history`.

Location : `GET/POST /rentals`, `POST /rentals/{id}/activate|return|cancel`. Les dates doivent comprendre un fuseau horaire.

Analyses : `GET /dashboard/summary`, `GET /reports/stock`, `GET /reports/stock.csv`.

