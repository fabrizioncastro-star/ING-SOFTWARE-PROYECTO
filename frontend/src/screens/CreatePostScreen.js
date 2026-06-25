import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import client, { apiError } from '../api/client';
import ScreenHeader from '../components/ScreenHeader';
import { colors, spacing, radius } from '../theme';

// Tipos permitidos según CU-003: JPG, PNG, MP4
function buildFilePart(asset) {
  const uri = asset.uri;
  const isVideo = asset.type === 'video';
  const ext = uri.split('.').pop().toLowerCase();

  let mime;
  if (isVideo) {
    if (ext !== 'mp4') return null;
    mime = 'video/mp4';
  } else if (ext === 'jpg' || ext === 'jpeg') {
    mime = 'image/jpeg';
  } else if (ext === 'png') {
    mime = 'image/png';
  } else {
    return null;
  }

  return { uri, name: `archivo.${ext}`, type: mime };
}

export default function CreatePostScreen({ navigation }) {
  const [asset, setAsset] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (result.canceled) return;

    const selected = result.assets[0];
    if (!buildFilePart(selected)) {
      Alert.alert('Formato no permitido', 'Solo se aceptan archivos JPG, PNG o MP4.');
      return;
    }
    setAsset(selected);
  };

  const handlePublish = async () => {
    if (!asset) {
      Alert.alert('Falta archivo', 'Selecciona una foto o video para publicar.');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', buildFilePart(asset));
    formData.append('descripcion', descripcion);

    setLoading(true);
    try {
      // Requisito: máx. 10s para publicar
      await client.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAsset(null);
      setDescripcion('');
      navigation.navigate('Feed');
    } catch (err) {
      Alert.alert('Error al publicar', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Nueva sesión"
        actionLabel="Publicar"
        onAction={handlePublish}
        actionLoading={loading}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <TouchableOpacity style={styles.mediaPicker} onPress={pickMedia} disabled={loading}>
          {asset ? (
            asset.type === 'video' ? (
              <View style={styles.videoSelected}>
                <Ionicons name="videocam" size={48} color={colors.primary} />
                <Text style={styles.videoText}>Video seleccionado</Text>
              </View>
            ) : (
              <Image source={{ uri: asset.uri }} style={styles.preview} />
            )
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.plusBadge}>
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.placeholderText}>Agregar foto o video</Text>
              <Text style={styles.formats}>JPG, PNG o MP4</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.descInput]}
          placeholder="¿Cómo fue tu entrenamiento?"
          placeholderTextColor={colors.textMuted}
          multiline
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <TouchableOpacity style={styles.button} onPress={handlePublish} disabled={loading}>
          <Text style={styles.buttonText}>Publicar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mediaPicker: {
    backgroundColor: colors.input,
    borderRadius: radius.lg,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
  },
  plusBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  placeholderText: {
    color: colors.text,
    fontWeight: '600',
  },
  formats: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  videoSelected: {
    alignItems: 'center',
  },
  videoText: {
    color: colors.text,
    marginTop: spacing.sm,
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
