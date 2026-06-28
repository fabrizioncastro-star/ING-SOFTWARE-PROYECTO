import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../theme';

export default function ScreenHeader({ title, actionLabel, onAction, actionLoading, actionDisabled }) {
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.side}>
        {navigation.canGoBack() && (
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        )}
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity
        onPress={onAction}
        disabled={!onAction || actionDisabled}
        style={[styles.side, styles.actionSide]}
      >
        {actionLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          !!actionLabel && (
            <Text style={[styles.action, actionDisabled && styles.actionDisabled]}>{actionLabel}</Text>
          )
        )}
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  side: {
    minWidth: 60,
  },
  actionSide: {
    alignItems: 'flex-end',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: 'bold',
  },
  action: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  actionDisabled: {
    color: colors.textMuted,
  },
});
