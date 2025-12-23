import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_URL = 'http://192.168.137.1:3000/api';

let onTokenExpired: (() => void) | null = null;

export const setTokenExpiredHandler = (handler: () => void) => {
  onTokenExpired = handler;
};

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleApiResponse = async (response: Response) => {
  const data = await response.json();

  if (response.status === 403 && (data.message === 'Token expiré' || data.message === 'Token invalide')) {
    console.warn('Token expired');

    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');

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
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return await handleApiResponse(response);
  } catch (error) {
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
