import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import client, { apiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import ScreenHeader from '../components/ScreenHeader';
import { colors, spacing, radius } from '../theme';

const NIVELES = [
  { value: 'sin_experiencia', label: 'Sin experiencia' },
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];

export default function EditProfileScreen({ navigation }) {
  const { user, setUser } = useAuth();
  const [nombre, setNombre] = useState(user.nombre);
  const [biografia, setBiografia] = useState(user.biografia || '');
  const [nivel, setNivel] = useState(user.nivel_experiencia || 'sin_experiencia');
  const [newPhoto, setNewPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);

  // CU-002: foto de perfil solo JPG o PNG
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      Alert.alert('Formato no permitido', 'La foto de perfil debe ser JPG o PNG.');
      return;
    }
    setNewPhoto(asset);
  };

  const handleSave = async () => {
    setError('');
    if (!nombre.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('nombre', nombre.trim());
      formData.append('nivel_experiencia', nivel);
      formData.append('biografia', biografia);
      if (newPhoto) {
        const ext = newPhoto.uri.split('.').pop().toLowerCase();
        formData.append('foto_perfil', {
          uri: newPhoto.uri,
          name: `perfil.${ext}`,
          type: ext === 'png' ? 'image/png' : 'image/jpeg',
        });
      }

      // Requisito: máx. 10s para guardar cambios (timeout por defecto)
      const { data } = await client.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(data.user);
      navigation.goBack();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const nivelLabel = NIVELES.find((n) => n.value === nivel)?.label || 'Sin experiencia';

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Editar perfil"
        actionLabel="Guardar"
        onAction={handleSave}
        actionLoading={loading}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto}>
          {newPhoto ? (
            <Image source={{ uri: newPhoto.uri }} style={styles.avatarPreview} />
          ) : (
            <Avatar nombre={user.nombre} foto={user.foto_perfil} size={96} />
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <View style={{ marginTop: spacing.xl }}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Tu nombre completo"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Biografía</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={biografia}
            onChangeText={setBiografia}
            placeholder="Apasionado del fitness..."
            placeholderTextColor={colors.textMuted}
            multiline
          />

          <Text style={styles.label}>Nivel de experiencia</Text>
          <TouchableOpacity style={styles.select} onPress={() => setPickerVisible(true)}>
            <Text style={styles.selectText}>{nivelLabel}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={pickerVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.modalSheet}>
            <FlatList
              data={NIVELES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setNivel(item.value);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item.label}</Text>
                  {item.value === nivel && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  photoPicker: {
    alignSelf: 'center',
  },
  avatarPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
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
  bioInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  select: {
    backgroundColor: colors.input,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    color: colors.text,
    fontSize: 15,
  },
  errorBox: {
    backgroundColor: '#FDECEA',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xl,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalOptionText: {
    color: colors.text,
    fontSize: 16,
  },
});
