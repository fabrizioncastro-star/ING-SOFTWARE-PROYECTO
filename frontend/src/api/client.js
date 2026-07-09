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
  const status = err.response?.status;
  if (status === 413) return 'El archivo es demasiado grande para subirse.';
  if (status === 503) return 'El servidor tardó demasiado. Intenta con un video más corto.';
  if (status === 502 || status === 504) return 'El servidor no respondió. Intenta de nuevo en unos segundos.';
  if (err.code === 'ECONNABORTED') return 'La operación tardó demasiado. Intenta de nuevo.';
  if (err.code === 'ECONNRESET' || err.code === 'ERR_NETWORK') return 'Se perdió la conexión durante la subida. Intenta de nuevo.';
  return 'No se pudo conectar con el servidor. Verifica tu conexión.';
}

export default client;
