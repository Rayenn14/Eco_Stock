import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface EcoTipProps {
  message: string;
}

export const EcoTip: React.FC<EcoTipProps> = ({ message }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  text: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
});
