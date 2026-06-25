import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mediaUrl } from '../api/client';
import Avatar from './Avatar';
import { colors, spacing, radius } from '../theme';

export default function PostCard({ post, currentUserId, onEdit, onDelete }) {
  const isOwner = post.usuario_id === currentUserId;

  const confirmDelete = () => {
    Alert.alert('Eliminar publicación', '¿Seguro que deseas eliminar esta publicación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(post) },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar nombre={post.autor_nombre} foto={post.autor_foto} size={40} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.author}>{post.autor_nombre}</Text>
          <Text style={styles.date}>{new Date(post.fecha || post.created_at).toLocaleString()}</Text>
        </View>
        {isOwner && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit(post)} style={styles.actionBtn}>
              <Ionicons name="pencil" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDelete} style={styles.actionBtn}>
              <Ionicons name="trash" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Image source={{ uri: mediaUrl(post.archivo_url) }} style={styles.media} />

      {!!post.descripcion && <Text style={styles.description}>{post.descripcion}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  author: {
    color: colors.text,
    fontWeight: 'bold',
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    marginLeft: spacing.md,
  },
  media: {
    width: '100%',
    height: 320,
    backgroundColor: colors.input,
  },
  description: {
    color: colors.text,
    padding: spacing.md,
  },
});
