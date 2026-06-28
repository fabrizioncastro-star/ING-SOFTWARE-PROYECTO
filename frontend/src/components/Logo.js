import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

export default function Logo() {
  return (
    <View style={styles.row}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>LU</Text>
      </View>
      <View>
        <Text style={styles.name}>LiftUp</Text>
        <Text style={styles.tagline}>Red Social Fitness</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  name: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
