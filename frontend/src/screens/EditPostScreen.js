import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client, { apiError, mediaUrl } from '../api/client';
import ScreenHeader from '../components/ScreenHeader';
import { colors, spacing, radius } from '../theme';

export default function EditPostScreen({ route, navigation }) {
  const { post } = route.params;
  const [descripcion, setDescripcion] = useState(post.descripcion || '');
  const [ejercicio, setEjercicio] = useState(post.ejercicio || '');
  const [pesoKg, setPesoKg] = useState(post.peso_kg ? String(post.peso_kg) : '');
  const [series, setSeries] = useState(post.series ? String(post.series) : '');
  const [reps, setReps] = useState(post.repeticiones ? String(post.repeticiones) : '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('descripcion', descripcion);
      formData.append('ejercicio', ejercicio);
      formData.append('peso_kg', pesoKg);
      formData.append('series', series);
      formData.append('repeticiones', reps);
      await client.put(`/posts/${post.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error al guardar', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader
        title="Editar publicación"
        actionLabel="Guardar"
        onAction={handleSave}
        actionLoading={loading}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        {post.tipo_archivo === 'video' ? (
          <View style={[styles.media, styles.videoBox]}>
            <Ionicons name="videocam" size={48} color={colors.primary} />
          </View>
        ) : (
          <Image source={{ uri: mediaUrl(post.archivo_url) }} style={styles.media} />
        )}

        <Text style={styles.label}>Ejercicio</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Press de banca"
          placeholderTextColor={colors.textMuted}
          value={ejercicio}
          onChangeText={setEjercicio}
        />

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={pesoKg}
              onChangeText={setPesoKg}
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Series</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={series}
              onChangeText={setSeries}
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>Reps</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={reps}
              onChangeText={setReps}
            />
          </View>
        </View>

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.descInput]}
          placeholderTextColor={colors.textMuted}
          multiline
          value={descripcion}
          onChangeText={setDescripcion}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.input,
  },
  videoBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
  },
  descInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
});
