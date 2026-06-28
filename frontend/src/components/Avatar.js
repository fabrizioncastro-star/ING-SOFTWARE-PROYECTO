import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { mediaUrl } from '../api/client';
import { colors } from '../theme';

function getInitials(nombre) {
  if (!nombre) return '?';
  const parts = nombre.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0].toUpperCase());
  return initials.join('');
}

export default function Avatar({ nombre, foto, size = 40 }) {
  const uri = mediaUrl(foto);
  const style = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={style} />;
  }

  return (
    <View style={[style, styles.placeholder]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{getInitials(nombre)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
