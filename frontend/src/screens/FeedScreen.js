import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import client, { apiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import Logo from '../components/Logo';
import { colors, spacing } from '../theme';

export default function FeedScreen({ navigation }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // CU-004: refrescar en menos de 5 segundos
  const loadFeed = async () => {
    try {
      const { data } = await client.get('/posts/feed', { timeout: 5000 });
      setPosts(data.publicaciones);
    } catch (err) {
      Alert.alert('Error', apiError(err));
    }
  };

  // Recargar cada vez que la pestaña recibe el foco (p. ej. tras publicar)
  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const handleDelete = async (post) => {
    try {
      await client.delete(`/posts/${post.id}`);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      Alert.alert('Error', apiError(err));
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.topBar}>
        <Logo />
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={user.id}
            onEdit={(post) => navigation.navigate('EditarPublicacion', { post })}
            onDelete={handleDelete}
            onOpenComments={(post) => navigation.navigate('Comentarios', { post })}
          />
        )}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : { paddingVertical: spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay publicaciones aún</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
