import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBox: {
    width: 120,
    height: 120,
    backgroundColor: colors.white,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 60,
  },
  logoText: {
    fontSize: typography.fontSize.giant,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  slogan: {
    fontSize: typography.fontSize.md,
    color: colors.white,
    fontStyle: 'italic',
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: spacing.huge,
  },
  loadingContainer: {
    marginTop: spacing.huge,
  },
});
