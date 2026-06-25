import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión al abrir la app
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const { data } = await client.get('/auth/me');
          setUser(data.user);
        }
      } catch {
        await AsyncStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // CU-001: Inicio de sesión (timeout 5s según requisito)
  const login = async (correo, contrasena) => {
    const { data } = await client.post(
      '/auth/login',
      { correo, contrasena },
      { timeout: 5000 }
    );
    await AsyncStorage.setItem('token', data.token);
    setUser(data.user);
  };

  // CU-001: Registro (timeout 10s según requisito)
  const register = async (nombre, correo, contrasena) => {
    const { data } = await client.post('/auth/register', { nombre, correo, contrasena });
    await AsyncStorage.setItem('token', data.token);
    setUser(data.user);
  };

  // CU-001: Cierre de sesión (invalida el token en el servidor)
  const logout = async () => {
    try {
      await client.post('/auth/logout', {}, { timeout: 5000 });
    } catch {
      // Si el servidor no responde, igual cerramos sesión localmente
    }
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
