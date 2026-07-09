import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client, { apiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import ScreenHeader from '../components/ScreenHeader';
import { colors, spacing, radius } from '../theme';

export default function CommentsScreen({ route }) {
  const { post } = route.params;
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/posts/${post.id}/comments`);
      setComments(data.comentarios);
    } catch (err) {
      Alert.alert('Error', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  // CUS-004: comentar una publicación
  const handleSend = async () => {
    if (!texto.trim()) return;
    setSending(true);
    try {
      const { data } = await client.post(`/posts/${post.id}/comments`, { texto: texto.trim() });
      setComments((prev) => [...prev, data.comentario]);
      setTexto('');
    } catch (err) {
      Alert.alert('Error', apiError(err));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = (comment) => {
    Alert.alert('Eliminar comentario', '¿Seguro que deseas eliminar este comentario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/posts/${post.id}/comments/${comment.id}`);
            setComments((prev) => prev.filter((c) => c.id !== comment.id));
          } catch (err) {
            Alert.alert('Error', apiError(err));
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader title="Comentarios" />

      <FlatList
        data={comments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={comments.length === 0 ? styles.emptyContainer : { padding: spacing.lg }}
        refreshing={loading}
        onRefresh={loadComments}
        renderItem={({ item }) => (
          <View style={styles.commentRow}>
            <Avatar nombre={item.autor_nombre} foto={item.autor_foto} size={32} />
            <View style={styles.commentBubble}>
              <Text style={styles.commentAuthor}>{item.autor_nombre}</Text>
              <Text style={styles.commentText}>{item.texto}</Text>
            </View>
            {item.usuario_id === user.id && (
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Sé el primero en comentar</Text>}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un comentario..."
          placeholderTextColor={colors.textMuted}
          value={texto}
          onChangeText={setTexto}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending}>
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  commentAuthor: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 13,
  },
  commentText: {
    color: colors.text,
    marginTop: 2,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
