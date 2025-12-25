import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const API_URL = 'http://192.168.1.123:3000/api';

let onTokenExpired: (() => void) | null = null;

export const setTokenExpiredHandler = (handler: () => void) => {
  onTokenExpired = handler;
};

// Fonction pour stocker le token de manière sécurisée
export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync('auth_token', token);
};

// Fonction pour récupérer le token de manière sécurisée
export const getToken = async () => {
  return await SecureStore.getItemAsync('auth_token');
};

// Fonction pour stocker les données utilisateur de manière sécurisée
export const saveUser = async (user: any) => {
  await SecureStore.setItemAsync('user_data', JSON.stringify(user));
};

// Fonction pour récupérer les données utilisateur
export const getUser = async () => {
  const userData = await SecureStore.getItemAsync('user_data');
  return userData ? JSON.parse(userData) : null;
};

// Fonction pour supprimer toutes les données sécurisées
export const clearSecureData = async () => {
  await SecureStore.deleteItemAsync('auth_token');
  await SecureStore.deleteItemAsync('user_data');
};

const getHeaders = async () => {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleApiResponse = async (response: Response) => {
  const data = await response.json();

  if (response.status === 403 && (data.message === 'Token expiré' || data.message === 'Token invalide')) {
    console.warn('Token expired');

    await clearSecureData();

    Alert.alert(
      'Session expirée',
      'Votre session a expiré. Veuillez vous reconnecter.',
      [{ text: 'OK' }]
    );

    if (onTokenExpired) {
      onTokenExpired();
    }

    throw new Error('Session expirée');
  }

  return data;
};

export const login = async (email: string, password: string) => {
  try {
    console.log('[API] POST /auth/login - Email:', email);
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await handleApiResponse(response);
    console.log('[API] Login response:', data.success ? 'Success' : 'Failed');
    return data;
  } catch (error) {
    console.error('[API] Login error:', error);
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de se connecter au serveur');
  }
};

export const register = async (data: {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  user_type: 'client' | 'vendeur' | 'association';
  nom_commerce?: string;
  adresse_commerce?: string;
  latitude?: string;
  longitude?: string;
  nom_association?: string;
}) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de se connecter au serveur');
  }
};

export const verifyToken = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Token invalide');
  }
};

export const getProfile = async () => {
  try {
    const response = await fetch(`${API_URL}/profile`, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de récupérer le profil');
  }
};

export const updateProfile = async (data: {
  prenom: string;
  nom: string;
  email: string;
  phone?: string;
  nom_commerce?: string;
  nom_association?: string;
}) => {
  try {
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de mettre à jour le profil');
  }
};

export const uploadProfileImage = async (imageBase64: string) => {
  try {
    const response = await fetch(`${API_URL}/profile/upload-image`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ imageBase64 }),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible d\'uploader l\'image');
  }
};

export const getProducts = async (
  category?: string,
  minPrice?: number,
  maxPrice?: number,
  maxDlcDate?: string,
  maxDistance?: number,
  latitude?: number,
  longitude?: number
) => {
  try {
    const params = new URLSearchParams();

    if (latitude !== undefined && longitude !== undefined) {
      params.append('latitude', latitude.toString());
      params.append('longitude', longitude.toString());
    }

    if (category) {
      params.append('category', category);
    }

    if (minPrice !== undefined) {
      params.append('minPrice', minPrice.toString());
    }

    if (maxPrice !== undefined) {
      params.append('maxPrice', maxPrice.toString());
    }

    if (maxDlcDate) {
      params.append('maxDlcDate', maxDlcDate);
    }

    if (maxDistance !== undefined) {
      params.append('maxDistance', maxDistance.toString());
    }

    const url = `${API_URL}/products${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de récupérer les produits');
  }
};

export const searchProducts = async (query: string, latitude?: number, longitude?: number) => {
  try {
    let url = `${API_URL}/products/search?query=${encodeURIComponent(query)}`;
    if (latitude !== undefined && longitude !== undefined) {
      url += `&latitude=${latitude}&longitude=${longitude}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de rechercher les produits');
  }
};

export const getProductById = async (productId: string, latitude?: number, longitude?: number) => {
  try {
    let url = `${API_URL}/products/${productId}`;
    if (latitude !== undefined && longitude !== undefined) {
      url += `?latitude=${latitude}&longitude=${longitude}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de récupérer le produit');
  }
};

// ===== SELLER API =====

export const getSellerProducts = async () => {
  try {
    const response = await fetch(`${API_URL}/seller/my-products`, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de récupérer vos produits');
  }
};

export const addProduct = async (productData: {
  nom: string;
  description?: string;
  prix: number;
  prix_original?: number;
  stock: number;
  image_url?: string;
  dlc: string;
  category_id?: number;
  is_bio?: boolean;
  is_local?: boolean;
  reserved_for_associations?: boolean;
  ingredient_id?: number;
}) => {
  try {
    console.log('[API] POST /seller/products - Product data:', JSON.stringify(productData, null, 2));
    const response = await fetch(`${API_URL}/seller/products`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(productData),
    });
    const data = await handleApiResponse(response);
    console.log('[API] Product added:', data.success ? 'Success' : 'Failed');
    return data;
  } catch (error) {
    console.error('[API] Add product error:', error);
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible d\'ajouter le produit');
  }
};

export const updateProduct = async (productId: string, productData: {
  nom?: string;
  description?: string;
  prix?: number;
  prix_original?: number;
  stock?: number;
  image_url?: string;
  dlc?: string;
  category_id?: number;
  is_bio?: boolean;
  is_local?: boolean;
  is_disponible?: boolean;
  reserved_for_associations?: boolean;
}) => {
  try {
    const response = await fetch(`${API_URL}/seller/products/${productId}`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify(productData),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de mettre à jour le produit');
  }
};

export const deleteProduct = async (productId: string) => {
  try {
    const response = await fetch(`${API_URL}/seller/products/${productId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de supprimer le produit');
  }
};

export const getCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/seller/categories`, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de récupérer les catégories');
  }
};

export const searchIngredients = async (query: string) => {
  try {
    console.log('[API] GET /seller/ingredients/search - Query:', query);
    const response = await fetch(`${API_URL}/seller/ingredients/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: await getHeaders(),
    });
    const data = await handleApiResponse(response);
    console.log('[API] Found', data.ingredients?.length || 0, 'ingredients');
    return data;
  } catch (error) {
    console.error('[API] Search ingredients error:', error);
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de rechercher les ingrédients');
  }
};

export const getSellerOrders = async () => {
  try {
    const response = await fetch(`${API_URL}/seller/orders`, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de récupérer les commandes');
  }
};

export const updateOrderStatus = async (orderId: string, statut: string, message_vendeur?: string) => {
  try {
    const response = await fetch(`${API_URL}/seller/orders/${orderId}/status`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify({ statut, message_vendeur }),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de mettre à jour le statut de la commande');
  }
};

// ==========================================
// RECIPES API
// ==========================================

export const getRecipes = async (limit: number = 6, offset: number = 0) => {
  try {
    const response = await fetch(`${API_URL}/recipes?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de récupérer les recettes');
  }
};

export const searchRecipes = async (query: string, category?: string) => {
  try {
    let url = `${API_URL}/recipes/search?query=${encodeURIComponent(query)}`;
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de rechercher les recettes');
  }
};

export const getRecipesByIngredients = async (ingredients: string[]) => {
  try {
    const ingredientsParam = ingredients.join(',');
    const response = await fetch(`${API_URL}/recipes/by-ingredients?ingredients=${encodeURIComponent(ingredientsParam)}`, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de trouver les recettes par ingrédients');
  }
};

export const searchRecipeIngredients = async (query: string) => {
  try {
    const response = await fetch(`${API_URL}/recipes/ingredients/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de rechercher les ingrédients');
  }
};

export const getRecipeById = async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/recipes/${id}`, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de récupérer la recette');
  }
};

export const getProductsByIngredient = async (ingredientName: string, latitude?: number, longitude?: number) => {
  try {
    let url = `${API_URL}/ingredients/products/${encodeURIComponent(ingredientName)}`;

    if (latitude && longitude) {
      url += `?latitude=${latitude}&longitude=${longitude}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'Session expirée') {
      throw error;
    }
    throw new Error('Impossible de trouver les produits');
  }
};
