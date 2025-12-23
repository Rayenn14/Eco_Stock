# Installation des Données de Test - EcoStock

Ce guide explique comment charger les données de test dans votre base de données EcoStock.

## Prérequis

1. PostgreSQL installé et en cours d'exécution
2. Base de données `ecostock_db` créée
3. Au moins un compte **vendeur** créé dans l'application

## Étapes d'Installation

### 1. Charger les Ingrédients (160+ ingrédients normalisés)

Ouvrez un terminal et exécutez:

```bash
psql -U postgres -d ecostock_db -f ecostock_backend/data/ingredients_seed.sql
```

**Résultat attendu:**
```
INSERT 0 160
✅ 160+ ingrédients normalisés insérés avec succès
```

### 2. Charger les Produits de Test (15 produits avec ingrédients)

```bash
psql -U postgres -d ecostock_db -f ecostock_backend/data/test_products_seed.sql
```

**Résultat attendu:**
```
NOTICE: Insertion des produits de test...
NOTICE: ✅ Insertion terminée: 15 produits de test créés avec leurs ingrédients associés
NOTICE: 📝 Les produits sont préfixés par [TEST] pour faciliter l'identification
NOTICE:
NOTICE: ========================================
NOTICE: STATISTIQUES
NOTICE: ========================================
NOTICE: Produits de test créés: 15
NOTICE: Produits avec ingrédients: 15
NOTICE: Total ingrédients en BD: 160+
NOTICE: ========================================
```

### 3. Vérifier l'Installation

```bash
# Vérifier les ingrédients
psql -U postgres -d ecostock_db -c "SELECT COUNT(*) as total_ingredients FROM ingredients;"

# Vérifier les produits de test
psql -U postgres -d ecostock_db -c "SELECT COUNT(*) as total_test_products FROM products WHERE nom LIKE '[TEST]%';"

# Voir quelques produits
psql -U postgres -d ecostock_db -c "SELECT nom, prix, stock FROM products WHERE nom LIKE '[TEST]%' LIMIT 5;"
```

## Produits de Test Créés

Les 15 produits suivants sont créés avec leurs ingrédients associés:

1. **Tomates cerises bio** - Ingrédient: tomate
2. **Pommes Golden** - Ingrédient: pomme
3. **Carottes bio du potager** - Ingrédient: carotte
4. **Lait entier bio 1L** - Ingrédient: lait
5. **Pain de campagne artisanal** - Ingrédient: farine
6. **Fromage de chèvre fermier** - Ingrédient: fromage
7. **Yaourts nature bio (x4)** - Ingrédient: lait
8. **Poulet fermier label rouge** - Ingrédient: poulet
9. **Pâtes complètes bio 500g** - Ingrédient: pâtes
10. **Riz basmati premium 1kg** - Ingrédient: riz
11. **Huile d'olive vierge extra bio** - Ingrédient: huile d'olive
12. **Confiture de fraises maison** - Ingrédient: fraise
13. **Miel de lavande 250g** - Ingrédient: miel
14. **Oeufs bio plein air (x6)** - Ingrédient: oeuf
15. **Bananes bio équitables** - Ingrédient: banane

## Tester le Fuzzy Matching

Une fois les données chargées, vous pouvez tester le fuzzy matching dans l'application:

### Tests recommandés:

1. **Match exact**: Tapez `tomate` → Devrait trouver "tomate" (100%)
2. **Faute de frappe**: Tapez `tomat` → Devrait trouver "tomate" (83%)
3. **Début de mot**: Tapez `pom` → Devrait trouver "pomme", "pomme de terre" (90%)
4. **Accent oublié**: Tapez `pate` → Devrait trouver "pates" (100%)
5. **Approximation**: Tapez `frzise` → Devrait trouver "fraise" (si > 50%)

## Nettoyer les Données de Test

Pour supprimer uniquement les produits de test (et garder les ingrédients):

```bash
psql -U postgres -d ecostock_db -c "DELETE FROM product_items WHERE product_id IN (SELECT id FROM products WHERE nom LIKE '[TEST]%');"

psql -U postgres -d ecostock_db -c "DELETE FROM products WHERE nom LIKE '[TEST]%';"
```

Pour tout supprimer (produits ET ingrédients):

```bash
psql -U postgres -d ecostock_db -c "TRUNCATE TABLE product_items CASCADE;"
psql -U postgres -d ecostock_db -c "TRUNCATE TABLE products CASCADE;"
psql -U postgres -d ecostock_db -c "TRUNCATE TABLE ingredients CASCADE;"
```

## Dépannage

### Erreur: "Aucun vendeur trouvé"

```
ERROR: Aucun vendeur trouvé dans la base de données. Veuillez créer au moins un compte vendeur avant d'exécuter ce script.
```

**Solution**: Créez un compte vendeur dans l'application avant de charger les produits de test.

### Erreur: "relation ingredients does not exist"

```
ERROR: relation "ingredients" does not exist
```

**Solution**: Chargez d'abord le fichier `ingredients_seed.sql` avant `test_products_seed.sql`.

### Les produits n'apparaissent pas dans l'application

**Vérifications**:

1. Vérifiez que le vendeur connecté possède bien les produits:
   ```bash
   psql -U postgres -d ecostock_db -c "SELECT p.nom, u.prenom, u.nom FROM products p JOIN users u ON p.vendeur_id = u.id WHERE p.nom LIKE '[TEST]%';"
   ```

2. Vérifiez que les produits sont disponibles:
   ```bash
   psql -U postgres -d ecostock_db -c "SELECT nom, disponible, stock FROM products WHERE nom LIKE '[TEST]%';"
   ```

## Support

Pour plus d'informations sur le système d'ingrédients et le fuzzy matching, consultez:
- [INGREDIENTS_SYSTEM.md](../INGREDIENTS_SYSTEM.md)
- [CLEANUP_PRODUITS.md](../CLEANUP_PRODUITS.md)

---

**Date de création**: 2025-12-23
**Version**: 1.0.0
