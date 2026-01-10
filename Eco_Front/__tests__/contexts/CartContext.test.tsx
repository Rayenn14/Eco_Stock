import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { CartProvider, useCart } from '../../src/contexts/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('Context: CartContext', () => {
  const mockProduct = {
    id: '1',
    nom: 'Test Product',
    description: 'Test description',
    prix: '5.99',
    prix_original: '9.99',
    image_url: null,
    dlc: '2026-12-31',
    nom_commerce: 'Test Shop',
    category_name: 'Test Category',
    stock: 10,
  };

  const mockProduct2 = {
    id: '2',
    nom: 'Test Product 2',
    description: 'Test description 2',
    prix: '3.50',
    prix_original: '5.00',
    image_url: null,
    dlc: '2026-12-31',
    nom_commerce: 'Test Shop',
    category_name: 'Test Category',
    stock: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CartProvider>{children}</CartProvider>
  );

  describe('Initial state', () => {
    it('should start with empty cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.cartItems).toEqual([]);
      expect(result.current.cartCount).toBe(0);
    });

    it('should load cart from AsyncStorage on mount', async () => {
      const savedCart = JSON.stringify([mockProduct]);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(savedCart);

      const { result } = renderHook(() => useCart(), { wrapper });

      // Wait for async loading
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@ecostock_cart');
    });
  });

  describe('addToCart', () => {
    it('should add product to cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
      });

      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0]).toEqual(mockProduct);
      expect(result.current.cartCount).toBe(1);
    });

    it('should not add duplicate product', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
        result.current.addToCart(mockProduct); // Try to add same product
      });

      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartCount).toBe(1);
    });

    it('should add multiple different products', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
        result.current.addToCart(mockProduct2);
      });

      expect(result.current.cartItems).toHaveLength(2);
      expect(result.current.cartCount).toBe(2);
    });

    it('should save to AsyncStorage when adding product', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        result.current.addToCart(mockProduct);
        // Wait for async save
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('removeFromCart', () => {
    it('should remove product from cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
        result.current.addToCart(mockProduct2);
      });

      expect(result.current.cartItems).toHaveLength(2);

      act(() => {
        result.current.removeFromCart('1');
      });

      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0].id).toBe('2');
      expect(result.current.cartCount).toBe(1);
    });

    it('should do nothing if product not in cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
      });

      const initialLength = result.current.cartItems.length;

      act(() => {
        result.current.removeFromCart('nonexistent-id');
      });

      expect(result.current.cartItems).toHaveLength(initialLength);
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
        result.current.addToCart(mockProduct2);
      });

      expect(result.current.cartItems).toHaveLength(2);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cartItems).toHaveLength(0);
      expect(result.current.cartCount).toBe(0);
    });
  });

  describe('isInCart', () => {
    it('should return true if product is in cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
      });

      expect(result.current.isInCart('1')).toBe(true);
    });

    it('should return false if product is not in cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.isInCart('1')).toBe(false);
    });
  });

  describe('getCartTotal', () => {
    it('should calculate correct total with single item', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
      });

      expect(result.current.getCartTotal()).toBe(5.99);
    });

    it('should calculate correct total with multiple items', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct); // 5.99
        result.current.addToCart(mockProduct2); // 3.50
      });

      expect(result.current.getCartTotal()).toBeCloseTo(9.49, 2);
    });

    it('should calculate correct total with quantities', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
        result.current.updateQuantity('1', 3); // 5.99 * 3 = 17.97
      });

      expect(result.current.getCartTotal()).toBeCloseTo(17.97, 2);
    });

    it('should return 0 for empty cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.getCartTotal()).toBe(0);
    });
  });

  describe('updateQuantity', () => {
    it('should update product quantity', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
        result.current.updateQuantity('1', 5);
      });

      expect(result.current.getProductQuantity('1')).toBe(5);
    });

    it('should not allow quantity less than 1', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
        result.current.updateQuantity('1', 0);
      });

      expect(result.current.getProductQuantity('1')).toBe(1);
    });

    it('should not allow quantity greater than stock', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct); // stock = 10
        result.current.updateQuantity('1', 15);
      });

      expect(result.current.getProductQuantity('1')).toBe(10);
    });

    it('should enforce min=1 and max=stock', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct); // stock = 10
      });

      // Try to set -5
      act(() => {
        result.current.updateQuantity('1', -5);
      });
      expect(result.current.getProductQuantity('1')).toBe(1);

      // Try to set 100
      act(() => {
        result.current.updateQuantity('1', 100);
      });
      expect(result.current.getProductQuantity('1')).toBe(10);
    });
  });

  describe('getProductQuantity', () => {
    it('should return quantity of product in cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
        result.current.updateQuantity('1', 3);
      });

      expect(result.current.getProductQuantity('1')).toBe(3);
    });

    it('should return 1 for product not in cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.getProductQuantity('nonexistent')).toBe(1);
    });
  });

  describe('removeUnavailableProducts', () => {
    it('should remove products by ID list', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
        result.current.addToCart(mockProduct2);
      });

      expect(result.current.cartItems).toHaveLength(2);

      act(() => {
        result.current.removeUnavailableProducts(['1']);
      });

      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0].id).toBe('2');
    });

    it('should remove multiple products at once', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
        result.current.addToCart(mockProduct2);
      });

      act(() => {
        result.current.removeUnavailableProducts(['1', '2']);
      });

      expect(result.current.cartItems).toHaveLength(0);
    });

    it('should do nothing if empty array provided', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addToCart(mockProduct);
      });

      const initialLength = result.current.cartItems.length;

      act(() => {
        result.current.removeUnavailableProducts([]);
      });

      expect(result.current.cartItems).toHaveLength(initialLength);
    });
  });

  describe('cartCount', () => {
    it('should return correct count', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.cartCount).toBe(0);

      act(() => {
        result.current.addToCart(mockProduct);
      });

      expect(result.current.cartCount).toBe(1);

      act(() => {
        result.current.addToCart(mockProduct2);
      });

      expect(result.current.cartCount).toBe(2);
    });
  });
});
