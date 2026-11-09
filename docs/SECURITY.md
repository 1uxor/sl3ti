# Sécurité du prototype

Mots de passe Argon2id ; sessions aléatoires conservées côté serveur sous forme d'empreinte SHA-256 ; cookie HttpOnly, SameSite=Lax, option Secure par environnement. Le jeton CSRF est vérifié sur les requêtes authentifiées qui modifient des données. Les organisations sont sélectionnées par en-tête mais l'appartenance et le rôle sont vérifiés au serveur. Les requêtes d'objets filtrent sur l'organisation et les relations sont protégées par clés étrangères composites.

Les imports CSV sont limités à 1 Mo/1000 lignes, décodés en UTF-8 et validés avant insertion. Les exports préfixent les valeurs qui pourraient être interprétées comme formules par un tableur. Le corps HTTP annoncé est limité à 2 Mo. Les secrets restent dans les variables d'environnement. Aucune API de modification du journal des mouvements n'est exposée.

Avant production : revue de sécurité, tests PostgreSQL de concurrence, limitation distribuée des tentatives de connexion, journalisation/observabilité, sauvegardes et restauration, HTTPS et `COOKIE_SECURE=true`, gestion de sessions plus fine, politiques de conservation, tests d'intrusion et vérification de toutes les réponses d'erreur. Le prototype ne doit pas être exposé publiquement tel quel.

