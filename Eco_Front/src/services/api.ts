import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ TROUVEZ VOTRE IP AVEC: ipconfig
// Cherchez "Adresse IPv4" (exemple: 192.168.1.45)
const API_URL = 'http://192.168.137.1:3000/api';

console.log('⚙️ API_URL configurée:', API_URL);

// Helper pour obtenir les headers avec le token JWT
const getHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ========================================
// API CONNEXION
// ========================================
export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return await response.json();
  } catch (error) {
    console.error('Erreur login:', error);
    throw new Error('Impossible de se connecter au serveur');
  }
};

// ========================================
// API INSCRIPTION
// ========================================
export const register = async (data: {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  user_type: 'client' | 'vendeur' | 'association';
  nom_commerce?: string;
  nom_association?: string;
}) => {
  try {
    console.log('🔵 === DÉBUT INSCRIPTION ===');
    console.log('🔵 URL:', `${API_URL}/auth/register`);
    console.log('🔵 Données:', JSON.stringify(data, null, 2));
    const fullUrl = `${API_URL}/auth/register`;
    console.log('🟢 API_URL brut:', API_URL);
    console.log('🟢 URL complète construite:', fullUrl);
    
    console.log('🔵 Données:', JSON.stringify(data, null, 2));
    const headers = await getHeaders();
    console.log('🔵 Headers:', headers);
    
    console.log('🔵 Envoi de la requête...');
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });
    
    console.log('🔵 Statut HTTP:', response.status);
    console.log('🔵 Status OK?', response.ok);
    
    const result = await response.json();
    console.log('🔵 Réponse reçue:', JSON.stringify(result, null, 2));
    console.log('🔵 === FIN INSCRIPTION ===');
    
    return result;
  } catch (error) {
    console.error('🔴 === ERREUR INSCRIPTION ===');
    console.error('🔴 Type:', error);
    console.error('🔴 Message:', error instanceof Error ? error.message : 'Erreur inconnue');
    console.error('🔴 Stack:', error instanceof Error ? error.stack : '');
    throw new Error('Impossible de se connecter au serveur');
  }
};

// ========================================
// API VÉRIFICATION TOKEN
// ========================================
export const verifyToken = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'GET',
      headers: await getHeaders(),
    });
    return await response.json();
  } catch (error) {
    console.error('Erreur verify:', error);
    throw new Error('Token invalide');
  }
};
