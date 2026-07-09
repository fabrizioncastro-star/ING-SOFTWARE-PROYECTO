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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import client, { apiError } from '../api/client';
import ScreenHeader from '../components/ScreenHeader';
import { colors, spacing, radius } from '../theme';

// Preview mudo del video seleccionado (muestra el primer fotograma)
function VideoPreview({ uri, style }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.loop = false;
  });
  return <VideoView style={style} player={player} nativeControls={false} contentFit="contain" />;
}

// Construye el objeto de archivo para FormData
// Acepta: JPG, PNG (fotos) y MP4, MOV (videos iPhone y Android)
function buildFilePart(asset) {
  const uri = asset.uri;
  const isVideo = asset.type === 'video';
  // mimeType lo provee expo-image-picker; si no, deducir por extensión
  const mime = asset.mimeType || '';
  const ext = uri.split('.').pop().toLowerCase().split('?')[0];

  if (isVideo) {
    if (mime === 'video/mp4' || ext === 'mp4')
      return { uri, name: 'video.mp4', type: 'video/mp4' };
    // iPhone graba .mov (QuickTime) — caso más frecuente en iOS
    if (mime === 'video/quicktime' || ext === 'mov' || mime === 'video/mov')
      return { uri, name: 'video.mov', type: 'video/quicktime' };
    // Fallback para cualquier otro video del dispositivo
    return { uri, name: 'video.mov', type: 'video/quicktime' };
  } else {
    if (ext === 'png' || mime === 'image/png')
      return { uri, name: 'foto.png', type: 'image/png' };
    // HEIC/HEIF de iPhone lo convierte automáticamente expo-image-picker a JPEG
    return { uri, name: 'foto.jpg', type: 'image/jpeg' };
  }
}

export default function CreatePostScreen({ navigation }) {
  const [asset, setAsset] = useState(null);
  const [ejercicio, setEjercicio] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [series, setSeries] = useState('');
  const [reps, setReps] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.7,
    });
    if (result.canceled) return;
    setAsset(result.assets[0]);
  };

  const resetForm = () => {
    setAsset(null);
    setEjercicio('');
    setPesoKg('');
    setSeries('');
    setReps('');
    setDescripcion('');
    setProgress(0);
  };

  const handlePublish = async () => {
    if (!asset) {
      Alert.alert('Falta archivo', 'Selecciona una foto o video para publicar.');
      return;
    }

    const filePart = buildFilePart(asset);
    const formData = new FormData();
    formData.append('archivo', filePart);
    formData.append('descripcion', descripcion);
    // Dimensiones para mostrar el contenido en la proporción correcta en el feed
    if (asset.width) formData.append('ancho', String(asset.width));
    if (asset.height) formData.append('alto', String(asset.height));
    if (ejercicio.trim()) formData.append('ejercicio', ejercicio.trim());
    if (pesoKg) formData.append('peso_kg', pesoKg);
    if (series) formData.append('series', series);
    if (reps) formData.append('repeticiones', reps);

    setLoading(true);
    setProgress(0);
    try {
      // maxTotal: evita que el progreso retroceda cuando React Native dispara
      // múltiples eventos de onUploadProgress con totales distintos (comportamiento
      // normal en multipart/form-data con archivos grandes).
      let maxTotal = 0;
      await client.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 minutos máximo — red de seguridad para videos grandes
        onUploadProgress: (event) => {
          if (event.total) maxTotal = Math.max(maxTotal, event.total);
          if (maxTotal > 0) {
            // Cap en 95: el 95→100 lo hacemos cuando el servidor confirma
            const pct = Math.min(95, Math.round((event.loaded / maxTotal) * 100));
            setProgress((prev) => Math.max(prev, pct));
          }
        },
      });
      setProgress(100);
      resetForm();
      navigation.navigate('Feed');
    } catch (err) {
      Alert.alert('Error al publicar', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Relación de aspecto del archivo seleccionado (igual que Instagram: entre 4:5 y 1.91:1)
  const previewAspectRatio = asset
    ? Math.min(1.91, Math.max(0.8, (asset.width || 1) / (asset.height || 1)))
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader
        title="Nueva sesión"
        actionLabel="Publicar"
        onAction={handlePublish}
        actionLoading={loading}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={[
            styles.mediaPicker,
            previewAspectRatio
              ? { aspectRatio: previewAspectRatio, height: undefined }
              : { height: 220 },
          ]}
          onPress={pickMedia}
          disabled={loading}
        >
          {asset ? (
            asset.type === 'video' ? (
              <VideoPreview uri={asset.uri} style={styles.mediaFill} />
            ) : (
              <Image source={{ uri: asset.uri }} style={styles.mediaFill} resizeMode="cover" />
            )
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.plusBadge}>
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.placeholderText}>Agregar foto o video</Text>
              <Text style={styles.formats}>Foto o video</Text>
            </View>
          )}
        </TouchableOpacity>

        {asset && (
          <TouchableOpacity style={styles.changeMedia} onPress={pickMedia} disabled={loading}>
            <Ionicons name="swap-horizontal" size={14} color={colors.textMuted} />
            <Text style={styles.changeMediaText}>Cambiar archivo</Text>
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.progressWrap}>
            <Text style={styles.progressLabel}>
              {progress >= 95 ? 'Procesando en servidor...' : `Subiendo... ${progress}%`}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
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
              placeholder="—"
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
              placeholder="—"
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
              placeholder="—"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={reps}
              onChangeText={setReps}
            />
          </View>
        </View>

        <Text style={styles.label}>Descripción y hashtags</Text>
        <TextInput
          style={[styles.input, styles.descInput]}
          placeholder="¿Cómo fue tu entrenamiento? #liftup"
          placeholderTextColor={colors.textMuted}
          multiline
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <TouchableOpacity style={styles.button} onPress={handlePublish} disabled={loading}>
          <Text style={styles.buttonText}>Publicar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  mediaFill: {
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
  changeMedia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  changeMediaText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  progressWrap: {
    marginBottom: spacing.md,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
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
