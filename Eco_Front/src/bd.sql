-- ========================================
-- TABLE USERS
-- ========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('vendeur', 'client', 'association')),
  nom_commerce VARCHAR(255),
  nom_association VARCHAR(255),
  telephone VARCHAR(20),
  adresse TEXT,
  ville VARCHAR(100),
  code_postal VARCHAR(10),
  photo_profil TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_ville ON users(ville);

-- ========================================
-- TABLE INGREDIENTS
-- ========================================
CREATE TABLE ingredients (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingredients_name ON ingredients(name);

-- ========================================
-- TABLE CATEGORIES
-- ========================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLE PRODUCTS
-- ========================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendeur_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  prix DECIMAL(10, 2) NOT NULL,
  prix_original DECIMAL(10, 2),
  stock INT DEFAULT 0,
  image_url TEXT,
  dlc DATE,
  date_peremption DATE,
  is_bio BOOLEAN DEFAULT false,
  is_local BOOLEAN DEFAULT false,
  is_disponible BOOLEAN DEFAULT true,
  is_lot BOOLEAN DEFAULT false,
  reserved_for_associations BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_vendeur ON products(vendeur_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_prix ON products(prix);
CREATE INDEX idx_products_disponible ON products(is_disponible);
CREATE INDEX idx_products_reserved_associations ON products(reserved_for_associations);

-- ========================================
-- TABLE PRODUCT_ITEMS
-- ========================================
CREATE TABLE product_items (
  id SERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id INT REFERENCES ingredients(id) ON DELETE SET NULL,
  nom VARCHAR(255) NOT NULL,
  quantite INT NOT NULL DEFAULT 1,
  unite VARCHAR(20) DEFAULT 'unité',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_items_product ON product_items(product_id);
CREATE INDEX idx_product_items_ingredient ON product_items(ingredient_id);

-- ========================================
-- TABLE LOTS
-- ========================================
CREATE TABLE lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendeur_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  numero_lot VARCHAR(50) UNIQUE NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirmee', 'en_preparation', 'prete', 'livree', 'annulee')),
  mode_recuperation VARCHAR(50) CHECK (mode_recuperation IN ('sur_place', 'livraison')),
  adresse_livraison TEXT,
  date_recuperation TIMESTAMP,
  message_client TEXT,
  message_vendeur TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lots_client ON lots(client_id);
CREATE INDEX idx_lots_vendeur ON lots(vendeur_id);
CREATE INDEX idx_lots_statut ON lots(statut);
CREATE INDEX idx_lots_numero ON lots(numero_lot);
CREATE INDEX idx_lots_date ON lots(created_at);

-- ========================================
-- TABLE LOT_ITEMS
-- ========================================
CREATE TABLE lot_items (
  id SERIAL PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  prix_unitaire DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lot_items_lot ON lot_items(lot_id);
CREATE INDEX idx_lot_items_product ON lot_items(product_id);

-- ========================================
-- TABLE FAVORITES
-- ========================================
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_product ON favorites(product_id);

-- ========================================
-- TABLE REVIEWS
-- ========================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendeur_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note INT NOT NULL CHECK (note >= 1 AND note <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendeur_id, client_id)
);

CREATE INDEX idx_reviews_vendeur ON reviews(vendeur_id);
CREATE INDEX idx_reviews_client ON reviews(client_id);
CREATE INDEX idx_reviews_note ON reviews(note);

-- ========================================
-- TABLE PANIER
-- ========================================
CREATE TABLE panier (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_panier_user ON panier(user_id);
CREATE INDEX idx_panier_product ON panier(product_id);

-- ========================================
-- TABLE RECIPES
-- ========================================
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  instructions TEXT,
  image_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABLE RECIPE_INGREDIENTS
-- ========================================
CREATE TABLE recipe_ingredients (
  recipe_id INT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id INT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY(recipe_id, ingredient_id)
);

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);

-- ========================================
-- TRIGGERS
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lots_updated_at 
  BEFORE UPDATE ON lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FONCTION POUR GÉNÉRER NUMÉRO DE LOT
-- ========================================
CREATE OR REPLACE FUNCTION generate_numero_lot()
RETURNS TRIGGER AS $$
BEGIN
    NEW.numero_lot := 'LOT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('lots_sequence')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE SEQUENCE lots_sequence START 1;

CREATE TRIGGER generate_lots_numero 
  BEFORE INSERT ON lots
  FOR EACH ROW 
  WHEN (NEW.numero_lot IS NULL)
  EXECUTE FUNCTION generate_numero_lot();


INSERT INTO categories (nom, description) VALUES
('Fruits & Légumes', 'Fruits et légumes frais'),
('Boulangerie', 'Pain et viennoiseries'),
('Produits laitiers', 'Lait, fromage, yaourts'),
('Viande & Poisson', 'Viandes et poissons frais'),
('Épicerie', 'Produits secs et conserves'),
('Boissons', 'Boissons diverses'),
('Snacks', 'Gâteaux et collations'),
('Bio', 'Produits biologiques'),
('Surgelés', 'Produits surgelés'),
('Autres', 'Autres produits');
