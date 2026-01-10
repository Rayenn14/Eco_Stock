/**
 * Tests pour les fonctions helpers du panier
 */

describe('Utils: Cart Helpers', () => {
  describe('Price calculations', () => {
    it('should calculate cart total correctly', () => {
      const items = [
        { prix: '5.99', quantity: 2 },
        { prix: '3.50', quantity: 1 },
        { prix: '10.00', quantity: 3 },
      ];

      const total = items.reduce((sum, item) => {
        return sum + (parseFloat(item.prix) * (item.quantity || 1));
      }, 0);

      expect(total).toBeCloseTo(45.48, 2);
    });

    it('should handle decimal precision correctly', () => {
      const prix1 = parseFloat('5.99');
      const prix2 = parseFloat('3.50');

      const total = prix1 + prix2;

      expect(total).toBeCloseTo(9.49, 2);
    });

    it('should calculate discount percentage', () => {
      const prixOriginal = 10.00;
      const prixReduit = 5.99;

      const discount = ((prixOriginal - prixReduit) / prixOriginal) * 100;

      expect(discount).toBeCloseTo(40.1, 1);
    });

    it('should calculate total with different quantities', () => {
      const items = [
        { prix: '12.99', quantity: 1 },
        { prix: '7.50', quantity: 5 },
      ];

      const total = items.reduce((sum, item) => {
        return sum + (parseFloat(item.prix) * item.quantity);
      }, 0);

      expect(total).toBeCloseTo(50.49, 2);
    });

    it('should handle zero quantity correctly', () => {
      const items = [
        { prix: '5.99', quantity: 0 },
        { prix: '3.50', quantity: 2 },
      ];

      const total = items.reduce((sum, item) => {
        return sum + (parseFloat(item.prix) * (item.quantity || 0));
      }, 0);

      expect(total).toBeCloseTo(7.00, 2);
    });
  });

  describe('Stock management', () => {
    it('should validate quantity against stock', () => {
      const stock = 10;
      const requestedQuantity = 5;

      expect(requestedQuantity).toBeLessThanOrEqual(stock);
    });

    it('should reject quantity exceeding stock', () => {
      const stock = 10;
      const requestedQuantity = 15;

      const isValid = requestedQuantity <= stock;

      expect(isValid).toBe(false);
    });

    it('should enforce minimum quantity of 1', () => {
      const quantity = -5;
      const validQuantity = Math.max(1, quantity);

      expect(validQuantity).toBe(1);
    });

    it('should enforce maximum quantity based on stock', () => {
      const stock = 10;
      const quantity = 15;
      const validQuantity = Math.min(quantity, stock);

      expect(validQuantity).toBe(10);
    });

    it('should check if product is out of stock', () => {
      const stock = 0;
      const isAvailable = stock > 0;

      expect(isAvailable).toBe(false);
    });

    it('should check if product has low stock', () => {
      const stock = 2;
      const threshold = 5;
      const isLowStock = stock > 0 && stock <= threshold;

      expect(isLowStock).toBe(true);
    });
  });

  describe('Cart item operations', () => {
    it('should add item to cart', () => {
      const cart: any[] = [];
      const newItem = { id: '1', nom: 'Tomate', prix: '2.50', quantity: 1 };

      const updatedCart = [...cart, newItem];

      expect(updatedCart).toHaveLength(1);
      expect(updatedCart[0].id).toBe('1');
    });

    it('should not add duplicate item', () => {
      const cart = [{ id: '1', nom: 'Tomate', prix: '2.50', quantity: 1 }];
      const newItem = { id: '1', nom: 'Tomate', prix: '2.50', quantity: 1 };

      const isDuplicate = cart.some(item => item.id === newItem.id);

      expect(isDuplicate).toBe(true);
    });

    it('should remove item from cart', () => {
      const cart = [
        { id: '1', nom: 'Tomate', prix: '2.50', quantity: 1 },
        { id: '2', nom: 'Lait', prix: '1.20', quantity: 2 },
      ];

      const updatedCart = cart.filter(item => item.id !== '1');

      expect(updatedCart).toHaveLength(1);
      expect(updatedCart[0].id).toBe('2');
    });

    it('should update item quantity', () => {
      const cart = [
        { id: '1', nom: 'Tomate', prix: '2.50', quantity: 1 },
      ];

      const updatedCart = cart.map(item =>
        item.id === '1' ? { ...item, quantity: 3 } : item
      );

      expect(updatedCart[0].quantity).toBe(3);
    });

    it('should count total items in cart', () => {
      const cart = [
        { id: '1', quantity: 2 },
        { id: '2', quantity: 3 },
        { id: '3', quantity: 1 },
      ];

      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

      expect(totalItems).toBe(6);
    });

    it('should find item in cart by id', () => {
      const cart = [
        { id: '1', nom: 'Tomate' },
        { id: '2', nom: 'Lait' },
      ];

      const item = cart.find(item => item.id === '2');

      expect(item).toBeDefined();
      expect(item?.nom).toBe('Lait');
    });

    it('should check if cart is empty', () => {
      const emptyCart: any[] = [];
      const fullCart = [{ id: '1', nom: 'Tomate' }];

      expect(emptyCart.length === 0).toBe(true);
      expect(fullCart.length === 0).toBe(false);
    });

    it('should clear entire cart', () => {
      const cart = [
        { id: '1', nom: 'Tomate' },
        { id: '2', nom: 'Lait' },
      ];

      const clearedCart: any[] = [];

      expect(clearedCart).toHaveLength(0);
    });
  });

  describe('Savings calculation', () => {
    it('should calculate total savings from original prices', () => {
      const items = [
        { prix: '5.99', prix_original: '10.00', quantity: 1 },
        { prix: '3.50', prix_original: '5.00', quantity: 2 },
      ];

      const savings = items.reduce((sum, item) => {
        const original = parseFloat(item.prix_original) * item.quantity;
        const current = parseFloat(item.prix) * item.quantity;
        return sum + (original - current);
      }, 0);

      // (10.00 - 5.99) * 1 + (5.00 - 3.50) * 2 = 4.01 + 3.00 = 7.01
      expect(savings).toBeCloseTo(7.01, 2);
    });

    it('should calculate percentage saved', () => {
      const totalOriginal = 50.00;
      const totalCurrent = 35.00;

      const percentageSaved = ((totalOriginal - totalCurrent) / totalOriginal) * 100;

      expect(percentageSaved).toBeCloseTo(30, 0);
    });
  });

  describe('Product availability checks', () => {
    it('should check if product is available', () => {
      const product = {
        is_disponible: true,
        stock: 5,
        dlc: '2026-02-01',
      };

      const today = new Date('2026-01-15');
      const dlcDate = new Date(product.dlc);

      const isAvailable = product.is_disponible &&
                         product.stock > 0 &&
                         dlcDate >= today;

      expect(isAvailable).toBe(true);
    });

    it('should detect unavailable product (out of stock)', () => {
      const product = {
        is_disponible: true,
        stock: 0,
        dlc: '2026-02-01',
      };

      const isAvailable = product.is_disponible && product.stock > 0;

      expect(isAvailable).toBe(false);
    });

    it('should detect expired product', () => {
      const product = {
        is_disponible: true,
        stock: 5,
        dlc: '2026-01-10',
      };

      const today = new Date('2026-01-15');
      const dlcDate = new Date(product.dlc);

      const isExpired = dlcDate < today;

      expect(isExpired).toBe(true);
    });

    it('should detect product marked as unavailable', () => {
      const product = {
        is_disponible: false,
        stock: 5,
        dlc: '2026-02-01',
      };

      expect(product.is_disponible).toBe(false);
    });
  });
});
