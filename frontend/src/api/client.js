import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3000';

// Convierte rutas relativas del backend (/uploads/...) en URL absolutas
export function mediaUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_URL}${path}`;
}

const client = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000, // requisito: máx. 10s para registro/publicaciones
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function apiError(err) {
  if (err.response?.data?.error) return err.response.data.error;
  if (err.code === 'ECONNABORTED') return 'La operación tardó demasiado. Intenta de nuevo.';
  return 'No se pudo conectar con el servidor. Verifica tu conexión.';
}

export default client;
