import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import client, { mediaUrl, apiError } from '../api/client';
import Avatar from './Avatar';
import { colors, spacing, radius } from '../theme';

function PostVideo({ uri, style }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
  });

  return <VideoView style={style} player={player} allowsFullscreen nativeControls contentFit="contain" />;
}

export default function PostCard({ post, currentUserId, onEdit, onDelete, onOpenComments }) {
  const isOwner = post.usuario_id === currentUserId;
  const [liked, setLiked] = useState(!!post.le_gusta);
  const [likeCount, setLikeCount] = useState(post.total_reacciones || 0);
  const [reacting, setReacting] = useState(false);

  // Relación de aspecto real del archivo guardado en DB.
  // Si la publicación es anterior y no tiene dimensiones, fallback a 1:1 (cuadrado).
  // Se limita entre 4:5 (portrait) y 1.91:1 (landscape) — igual que Instagram.
  const mediaAspectRatio = (post.ancho && post.alto)
    ? Math.min(1.91, Math.max(0.8, post.ancho / post.alto))
    : 1;

  const confirmDelete = () => {
    Alert.alert('Eliminar publicación', '¿Seguro que deseas eliminar esta publicación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(post) },
    ]);
  };

  // CUS-004: reaccionar a la publicación
  const toggleLike = async () => {
    if (reacting) return;
    setReacting(true);
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => c + (nextLiked ? 1 : -1));
    try {
      await client.post(`/posts/${post.id}/reactions`);
    } catch (err) {
      setLiked(!nextLiked);
      setLikeCount((c) => c + (nextLiked ? -1 : 1));
      Alert.alert('Error', apiError(err));
    } finally {
      setReacting(false);
    }
  };

  const workoutLine = [
    post.ejercicio,
    post.peso_kg ? `${post.peso_kg}kg` : null,
    post.series && post.repeticiones ? `${post.series}x${post.repeticiones}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

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

      {!!workoutLine && (
        <View style={styles.workoutBadge}>
          <Ionicons name="barbell" size={14} color={colors.primary} />
          <Text style={styles.workoutText}>{workoutLine}</Text>
        </View>
      )}

      {post.tipo_archivo === 'video' ? (
        <PostVideo
          uri={mediaUrl(post.archivo_url)}
          style={[styles.media, { aspectRatio: mediaAspectRatio }]}
        />
      ) : (
        <Image
          source={{ uri: mediaUrl(post.archivo_url) }}
          style={[styles.media, { aspectRatio: mediaAspectRatio }]}
          resizeMode="cover"
        />
      )}

      {!!post.descripcion && <Text style={styles.description}>{post.descripcion}</Text>}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerAction} onPress={toggleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? colors.danger : colors.text}
          />
          <Text style={styles.footerCount}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerAction} onPress={() => onOpenComments?.(post)}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
          <Text style={styles.footerCount}>{post.total_comentarios || 0}</Text>
        </TouchableOpacity>
      </View>
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
  workoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  workoutText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  media: {
    width: '100%',
    backgroundColor: '#000',
  },
  description: {
    color: colors.text,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerCount: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
