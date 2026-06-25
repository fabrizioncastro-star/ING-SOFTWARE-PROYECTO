import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import client, { apiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import { colors, spacing, radius } from '../theme';

const NIVEL_LABEL = {
  sin_experiencia: 'Sin experiencia',
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [stats, setStats] = useState({ total_publicaciones: 0, seguidores: 0, seguidos: 0 });
  const [posts, setPosts] = useState([]);
  const [logoutVisible, setLogoutVisible] = useState(false);

  const loadProfile = async () => {
    try {
      const { data } = await client.get('/users/me');
      setProfile(data.user);
      setStats({
        total_publicaciones: data.total_publicaciones,
        seguidores: data.seguidores,
        seguidos: data.seguidos,
      });
      setPosts(
        data.publicaciones.map((p) => ({
          ...p,
          autor_nombre: data.user.nombre,
          autor_foto: data.user.foto_perfil,
        }))
      );
    } catch (err) {
      Alert.alert('Error', apiError(err));
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  // CU-001: cierre de sesión con confirmación
  const confirmLogout = async () => {
    setLogoutVisible(false);
    await logout();
  };

  const handleDelete = async (post) => {
    try {
      await client.delete(`/posts/${post.id}`);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      Alert.alert('Error', apiError(err));
    }
  };

  const notImplemented = () => Alert.alert('Próximamente', 'Esta función estará disponible en una próxima versión.');

  const ubicacion = [NIVEL_LABEL[profile?.nivel_experiencia] || 'Sin experiencia', profile?.ciudad]
    .filter(Boolean)
    .join(' · ');

  const Header = (
    <View>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Mi Perfil</Text>
        <TouchableOpacity onPress={() => navigation.navigate('EditarPerfil')}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Avatar nombre={profile?.nombre} foto={profile?.foto_perfil} size={88} />
        <Text style={styles.name}>{profile?.nombre}</Text>
        <Text style={styles.level}>Nivel: {ubicacion}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total_publicaciones}</Text>
            <Text style={styles.statLabel}>Sesiones</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.seguidores}</Text>
            <Text style={styles.statLabel}>Seguidores</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.seguidos}</Text>
            <Text style={styles.statLabel}>Seguidos</Text>
          </View>
        </View>

        {!!profile?.biografia && <Text style={styles.bio}>{profile.biografia}</Text>}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditarPerfil')}
        >
          <Text style={styles.editButtonText}>Editar perfil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={notImplemented}>
          <Text style={styles.menuItemText}>Notificaciones</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={notImplemented}>
          <Text style={styles.menuItemText}>Ayuda</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={() => setLogoutVisible(true)}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Mis publicaciones</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={Header}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={user.id}
            onEdit={(post) => navigation.navigate('EditarPublicacion', { post })}
            onDelete={handleDelete}
            onOpenComments={(post) => navigation.navigate('Comentarios', { post })}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay publicaciones aún</Text>}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
      />

      <Modal visible={logoutVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Cerrar sesión?</Text>
            <Text style={styles.modalSubtitle}>
              Tendrás que iniciar sesión nuevamente para acceder a tu cuenta.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setLogoutVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={confirmLogout}
              >
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  topBarTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.md,
  },
  level: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  bio: {
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  editButton: {
    backgroundColor: colors.input,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  editButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  menu: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemText: {
    color: colors.text,
    fontSize: 15,
  },
  logoutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.text,
    fontWeight: '600',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: colors.input,
  },
  modalCancelText: {
    color: colors.text,
    fontWeight: '600',
  },
  modalConfirm: {
    backgroundColor: colors.primary,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
