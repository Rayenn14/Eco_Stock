-- Script pour réinitialiser la base de données pour les tests
-- ATTENTION: Ce script supprime TOUTES les commandes et TOUS les produits
-- Les utilisateurs (clients, vendeurs, associations) ne sont PAS supprimés

-- 1. Supprimer toutes les commandes (cascade supprimera aussi commande_items automatiquement)
DELETE FROM commandes;

-- 2. Supprimer tous les items de produits (ingrédients liés aux produits)
DELETE FROM product_items;

-- 3. Supprimer tous les produits
DELETE FROM products;

-- 4. Optionnel: Réinitialiser les séquences pour que les IDs recommencent à 1
-- Décommentez si vous voulez réinitialiser les compteurs
-- ALTER SEQUENCE commandes_id_seq RESTART WITH 1;
-- ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- Vérification: afficher le nombre de lignes restantes
SELECT
  (SELECT COUNT(*) FROM commandes) as nb_commandes,
  (SELECT COUNT(*) FROM commande_items) as nb_commande_items,
  (SELECT COUNT(*) FROM product_items) as nb_product_items,
  (SELECT COUNT(*) FROM products) as nb_products;

-- Afficher les utilisateurs restants (ne sont pas supprimés)
SELECT id, email, user_type, prenom, nom
FROM users
ORDER BY created_at DESC;
