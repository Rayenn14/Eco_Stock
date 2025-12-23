-- =====================================================
-- SCRIPT DE TEST - PRODUITS AVEC INGREDIENTS
-- EcoStock - Test Data Generation
-- =====================================================
-- Ce fichier génère des produits de test avec leurs ingrédients associés
-- Prérequis: Le fichier ingredients_seed.sql doit être chargé en premier
-- =====================================================

-- Vérifier qu'il existe au moins un vendeur
DO $$
DECLARE
    vendeur_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO vendeur_count FROM users WHERE user_type = 'vendeur';
    IF vendeur_count = 0 THEN
        RAISE EXCEPTION 'Aucun vendeur trouvé dans la base de données. Veuillez créer au moins un compte vendeur avant d''exécuter ce script.';
    END IF;
END $$;

-- Nettoyer les données de test existantes (optionnel)
-- DELETE FROM product_items WHERE product_id IN (SELECT id FROM products WHERE nom LIKE '%[TEST]%');
-- DELETE FROM products WHERE nom LIKE '%[TEST]%';

-- Récupérer l'ID du premier vendeur disponible
DO $$
DECLARE
    test_vendeur_id UUID;
    test_category_id INTEGER;

    -- IDs des produits créés
    product_tomates_id UUID;
    product_pommes_id UUID;
    product_carottes_id UUID;
    product_lait_id UUID;
    product_pain_id UUID;
    product_fromage_id UUID;
    product_yaourt_id UUID;
    product_poulet_id UUID;
    product_pates_id UUID;
    product_riz_id UUID;
    product_huile_id UUID;
    product_confiture_id UUID;
    product_miel_id UUID;
    product_oeufs_id UUID;
    product_bananes_id UUID;

    -- IDs des ingrédients
    ing_tomate_id INTEGER;
    ing_pomme_id INTEGER;
    ing_carotte_id INTEGER;
    ing_lait_id INTEGER;
    ing_farine_id INTEGER;
    ing_fromage_id INTEGER;
    ing_poulet_id INTEGER;
    ing_pates_id INTEGER;
    ing_riz_id INTEGER;
    ing_huile_olive_id INTEGER;
    ing_fraise_id INTEGER;
    ing_miel_id INTEGER;
    ing_oeuf_id INTEGER;
    ing_banane_id INTEGER;
BEGIN
    -- Récupérer l'ID du premier vendeur
    SELECT id INTO test_vendeur_id FROM users WHERE user_type = 'vendeur' LIMIT 1;

    -- Récupérer ou créer une catégorie de test
    SELECT id INTO test_category_id FROM categories WHERE nom = 'Fruits et Légumes' LIMIT 1;
    IF test_category_id IS NULL THEN
        INSERT INTO categories (nom) VALUES ('Test Category') RETURNING id INTO test_category_id;
    END IF;

    -- Récupérer les IDs des ingrédients
    SELECT id INTO ing_tomate_id FROM ingredients WHERE name = 'tomate' LIMIT 1;
    SELECT id INTO ing_pomme_id FROM ingredients WHERE name = 'pomme' LIMIT 1;
    SELECT id INTO ing_carotte_id FROM ingredients WHERE name = 'carotte' LIMIT 1;
    SELECT id INTO ing_lait_id FROM ingredients WHERE name = 'lait' LIMIT 1;
    SELECT id INTO ing_farine_id FROM ingredients WHERE name = 'farine' LIMIT 1;
    SELECT id INTO ing_fromage_id FROM ingredients WHERE name = 'fromage' LIMIT 1;
    SELECT id INTO ing_poulet_id FROM ingredients WHERE name = 'poulet' LIMIT 1;
    SELECT id INTO ing_pates_id FROM ingredients WHERE name = 'pates' LIMIT 1;
    SELECT id INTO ing_riz_id FROM ingredients WHERE name = 'riz' LIMIT 1;
    SELECT id INTO ing_huile_olive_id FROM ingredients WHERE name = 'huile olive' LIMIT 1;
    SELECT id INTO ing_fraise_id FROM ingredients WHERE name = 'fraise' LIMIT 1;
    SELECT id INTO ing_miel_id FROM ingredients WHERE name = 'miel' LIMIT 1;
    SELECT id INTO ing_oeuf_id FROM ingredients WHERE name = 'oeuf' LIMIT 1;
    SELECT id INTO ing_banane_id FROM ingredients WHERE name = 'banane' LIMIT 1;

    -- ============================================
    -- INSERTION DES PRODUITS DE TEST
    -- ============================================

    RAISE NOTICE 'Insertion des produits de test...';

    -- 1. Tomates cerises bio
    INSERT INTO products (vendeur_id, nom, description, prix, prix_original, stock, dlc, category_id, is_bio, is_local, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Tomates cerises bio',
        'Tomates cerises fraîches et bio de notre producteur local',
        3.50,
        4.50,
        25,
        CURRENT_DATE + INTERVAL '5 days',
        test_category_id,
        true,
        true,
        true
    ) RETURNING id INTO product_tomates_id;

    IF ing_tomate_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_tomates_id, ing_tomate_id, 'Tomates cerises', 1, 'barquette');
    END IF;

    -- 2. Pommes Golden
    INSERT INTO products (vendeur_id, nom, description, prix, prix_original, stock, dlc, category_id, is_bio, is_local, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Pommes Golden',
        'Pommes Golden croquantes et sucrées',
        2.80,
        3.50,
        40,
        CURRENT_DATE + INTERVAL '10 days',
        test_category_id,
        false,
        true,
        true
    ) RETURNING id INTO product_pommes_id;

    IF ing_pomme_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_pommes_id, ing_pomme_id, 'Pommes Golden', 1, 'kg');
    END IF;

    -- 3. Carottes bio
    INSERT INTO products (vendeur_id, nom, description, prix, stock, dlc, category_id, is_bio, is_local, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Carottes bio du potager',
        'Carottes fraîches cultivées sans pesticides',
        2.20,
        30,
        CURRENT_DATE + INTERVAL '7 days',
        test_category_id,
        true,
        true,
        true
    ) RETURNING id INTO product_carottes_id;

    IF ing_carotte_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_carottes_id, ing_carotte_id, 'Carottes', 1, 'botte');
    END IF;

    -- 4. Lait entier bio
    INSERT INTO products (vendeur_id, nom, description, prix, prix_original, stock, dlc, category_id, is_bio, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Lait entier bio 1L',
        'Lait entier pasteurisé de la ferme locale',
        1.80,
        2.20,
        20,
        CURRENT_DATE + INTERVAL '4 days',
        test_category_id,
        true,
        true
    ) RETURNING id INTO product_lait_id;

    IF ing_lait_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_lait_id, ing_lait_id, 'Lait entier', 1, 'litre');
    END IF;

    -- 5. Pain de campagne
    INSERT INTO products (vendeur_id, nom, description, prix, stock, dlc, category_id, is_bio, is_local, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Pain de campagne artisanal',
        'Pain traditionnel cuit au four à bois',
        3.20,
        15,
        CURRENT_DATE + INTERVAL '2 days',
        test_category_id,
        false,
        true,
        true
    ) RETURNING id INTO product_pain_id;

    IF ing_farine_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_pain_id, ing_farine_id, 'Farine', 1, 'unite');
    END IF;

    -- 6. Fromage de chèvre
    INSERT INTO products (vendeur_id, nom, description, prix, prix_original, stock, dlc, category_id, is_bio, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Fromage de chèvre fermier',
        'Fromage artisanal au lait cru',
        5.50,
        6.80,
        12,
        CURRENT_DATE + INTERVAL '8 days',
        test_category_id,
        true,
        true
    ) RETURNING id INTO product_fromage_id;

    IF ing_fromage_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_fromage_id, ing_fromage_id, 'Fromage de chèvre', 1, 'pièce');
    END IF;

    -- 7. Yaourts nature
    INSERT INTO products (vendeur_id, nom, description, prix, stock, dlc, category_id, is_bio, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Yaourts nature bio (x4)',
        'Yaourts au lait entier bio',
        2.40,
        25,
        CURRENT_DATE + INTERVAL '6 days',
        test_category_id,
        true,
        true
    ) RETURNING id INTO product_yaourt_id;

    IF ing_lait_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_yaourt_id, ing_lait_id, 'Lait', 4, 'pot');
    END IF;

    -- 8. Poulet fermier
    INSERT INTO products (vendeur_id, nom, description, prix, prix_original, stock, dlc, category_id, is_local, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Poulet fermier label rouge',
        'Poulet élevé en plein air, label rouge',
        12.50,
        15.00,
        8,
        CURRENT_DATE + INTERVAL '3 days',
        test_category_id,
        true,
        true
    ) RETURNING id INTO product_poulet_id;

    IF ing_poulet_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_poulet_id, ing_poulet_id, 'Poulet', 1, 'pièce');
    END IF;

    -- 9. Pâtes complètes bio
    INSERT INTO products (vendeur_id, nom, description, prix, stock, dlc, category_id, is_bio, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Pâtes complètes bio 500g',
        'Pâtes artisanales aux céréales complètes',
        3.80,
        18,
        CURRENT_DATE + INTERVAL '90 days',
        test_category_id,
        true,
        true
    ) RETURNING id INTO product_pates_id;

    IF ing_pates_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_pates_id, ing_pates_id, 'Pâtes', 500, 'g');
    END IF;

    -- 10. Riz basmati
    INSERT INTO products (vendeur_id, nom, description, prix, stock, dlc, category_id, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Riz basmati premium 1kg',
        'Riz basmati parfumé de qualité supérieure',
        4.20,
        22,
        CURRENT_DATE + INTERVAL '180 days',
        test_category_id,
        true
    ) RETURNING id INTO product_riz_id;

    IF ing_riz_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_riz_id, ing_riz_id, 'Riz basmati', 1, 'kg');
    END IF;

    -- 11. Huile d'olive bio
    INSERT INTO products (vendeur_id, nom, description, prix, prix_original, stock, dlc, category_id, is_bio, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Huile d''olive vierge extra bio',
        'Première pression à froid, origine France',
        8.90,
        10.50,
        15,
        CURRENT_DATE + INTERVAL '120 days',
        test_category_id,
        true,
        true
    ) RETURNING id INTO product_huile_id;

    IF ing_huile_olive_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_huile_id, ing_huile_olive_id, 'Huile d''olive', 500, 'ml');
    END IF;

    -- 12. Confiture de fraises
    INSERT INTO products (vendeur_id, nom, description, prix, stock, dlc, category_id, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Confiture de fraises maison',
        'Confiture artisanale 60% de fruits',
        4.50,
        20,
        CURRENT_DATE + INTERVAL '60 days',
        test_category_id,
        true
    ) RETURNING id INTO product_confiture_id;

    IF ing_fraise_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_confiture_id, ing_fraise_id, 'Fraises', 1, 'pot');
    END IF;

    -- 13. Miel de lavande
    INSERT INTO products (vendeur_id, nom, description, prix, prix_original, stock, dlc, category_id, is_local, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Miel de lavande 250g',
        'Miel récolté en Provence par notre apiculteur',
        6.80,
        8.00,
        10,
        CURRENT_DATE + INTERVAL '365 days',
        test_category_id,
        true,
        true
    ) RETURNING id INTO product_miel_id;

    IF ing_miel_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_miel_id, ing_miel_id, 'Miel', 250, 'g');
    END IF;

    -- 14. Oeufs bio plein air
    INSERT INTO products (vendeur_id, nom, description, prix, stock, dlc, category_id, is_bio, is_local, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Oeufs bio plein air (x6)',
        'Oeufs frais de poules élevées en plein air',
        3.20,
        30,
        CURRENT_DATE + INTERVAL '14 days',
        test_category_id,
        true,
        true,
        true
    ) RETURNING id INTO product_oeufs_id;

    IF ing_oeuf_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_oeufs_id, ing_oeuf_id, 'Oeufs', 6, 'unite');
    END IF;

    -- 15. Bananes bio
    INSERT INTO products (vendeur_id, nom, description, prix, stock, dlc, category_id, is_bio, disponible)
    VALUES (
        test_vendeur_id,
        '[TEST] Bananes bio équitables',
        'Bananes bio et commerce équitable',
        2.50,
        35,
        CURRENT_DATE + INTERVAL '5 days',
        test_category_id,
        true,
        true
    ) RETURNING id INTO product_bananes_id;

    IF ing_banane_id IS NOT NULL THEN
        INSERT INTO product_items (product_id, ingredient_id, nom, quantite, unite)
        VALUES (product_bananes_id, ing_banane_id, 'Bananes', 1, 'kg');
    END IF;

    RAISE NOTICE '✅ Insertion terminée: 15 produits de test créés avec leurs ingrédients associés';
    RAISE NOTICE '📝 Les produits sont préfixés par [TEST] pour faciliter l''identification';

END $$;

-- =====================================================
-- STATISTIQUES
-- =====================================================

DO $$
DECLARE
    total_products INTEGER;
    total_with_ingredients INTEGER;
    total_ingredients INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_products FROM products WHERE nom LIKE '[TEST]%';
    SELECT COUNT(DISTINCT product_id) INTO total_with_ingredients
    FROM product_items pi
    JOIN products p ON pi.product_id = p.id
    WHERE p.nom LIKE '[TEST]%';
    SELECT COUNT(*) INTO total_ingredients FROM ingredients;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STATISTIQUES';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Produits de test créés: %', total_products;
    RAISE NOTICE 'Produits avec ingrédients: %', total_with_ingredients;
    RAISE NOTICE 'Total ingrédients en BD: %', total_ingredients;
    RAISE NOTICE '========================================';
END $$;
