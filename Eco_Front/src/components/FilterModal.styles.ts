import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 32,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipSelected: {
    backgroundColor: '#166534',
    borderColor: '#166534',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangeInputContainer: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  rangeInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  rangeSeparator: {
    fontSize: 20,
    color: '#6B7280',
    marginHorizontal: 12,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#166534',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  datePickerButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  datePickerText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  datePickerPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  clearDateButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  clearDateText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  closeDatePickerButton: {
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: '#166534',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeDatePickerText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
