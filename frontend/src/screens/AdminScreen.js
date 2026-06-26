import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client, { apiError } from '../api/client';
import { colors, spacing } from '../theme';

// Panel básico de administrador (Release 1)
export default function AdminScreen() {
  const [stats, setStats] = useState(null);
  const [usuarios, setUsuarios] = useState([]);

  const load = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        client.get('/admin/stats'),
        client.get('/admin/usuarios'),
      ]);
      setStats(statsRes.data);
      setUsuarios(usersRes.data.usuarios);
    } catch (err) {
      Alert.alert('Error', apiError(err));
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.totalUsuarios ?? '—'}</Text>
          <Text style={styles.statLabel}>Usuarios</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.totalPublicaciones ?? '—'}</Text>
          <Text style={styles.statLabel}>Publicaciones</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Usuarios registrados</Text>
      <FlatList
        data={usuarios}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{item.nombre}</Text>
              <Text style={styles.userEmail}>{item.correo}</Text>
            </View>
            <Text style={[styles.userRole, item.rol === 'admin' && { color: colors.primary }]}>
              {item.rol}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.textMuted,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  userName: {
    color: colors.text,
    fontWeight: '600',
  },
  userEmail: {
    color: colors.textMuted,
    fontSize: 12,
  },
  userRole: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
  },
});
