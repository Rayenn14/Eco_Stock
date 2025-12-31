const db = require('./config/database');

async function checkProductIngredients() {
  try {
    console.log('=== Vérification des produits et leurs ingrédients ===\n');

    // Récupérer tous les produits disponibles
    const productsResult = await db.query(`
      SELECT
        p.id,
        p.nom,
        p.stock,
        p.is_disponible,
        STRING_AGG(DISTINCT i.name, ', ') as ingredient_nom,
        ARRAY_AGG(DISTINCT i.id) FILTER (WHERE i.id IS NOT NULL) as ingredient_ids
      FROM products p
      LEFT JOIN product_items pi ON p.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE p.is_disponible = true AND p.stock > 0
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    console.log(`Trouvé ${productsResult.rows.length} produits disponibles:\n`);

    for (const product of productsResult.rows) {
      console.log(`ID: ${product.id}`);
      console.log(`Nom: ${product.nom}`);
      console.log(`Stock: ${product.stock}`);
      console.log(`Ingrédients: ${product.ingredient_nom || 'AUCUN'}`);
      console.log(`IDs ingrédients: ${product.ingredient_ids || 'AUCUN'}`);
      console.log('---');
    }

    // Vérifier combien de produits n'ont PAS d'ingrédients
    const noIngredientsResult = await db.query(`
      SELECT COUNT(*) as count
      FROM products p
      LEFT JOIN product_items pi ON p.id = pi.product_id
      WHERE p.is_disponible = true
        AND p.stock > 0
        AND pi.id IS NULL
    `);

    console.log(`\nProduits SANS ingrédients: ${noIngredientsResult.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkProductIngredients();
