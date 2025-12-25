import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.massive,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: colors.gray[100],
  },
  lotImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lotTitle: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  lotSubtitle: {
    fontSize: typography.fontSize.xl,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    padding: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  productName: {
    flex: 1,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginRight: spacing.md,
  },
  discountBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  discountText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  badgeLot: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeLotText: {
    color: '#1E40AF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  price: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  originalPrice: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[400],
    textDecorationLine: 'line-through',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    lineHeight: 24,
  },
  shopName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  shopAddress: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  distance: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoItem: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: spacing.md,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
  },
  lotItem: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  lotItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  lotItemName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[900],
    flex: 1,
    marginRight: spacing.sm,
  },
  lotItemBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  smallBadge: {
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  smallBadgeText: {
    color: colors.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  lotItemDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  lotItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lotItemPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  lotItemDlc: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
  },
  addToCartButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  addToCartButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  addToCartText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    color: colors.gray[500],
  },
  mapContainer: {
    marginTop: spacing.md,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray[200],
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  mapText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  distanceContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
    padding: spacing.sm,
  },
  distanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  distanceIcon: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  distanceText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
    fontWeight: typography.fontWeight.medium,
  },
  distanceKm: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
});
