import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from './FilterModal.styles';
import * as API from '../services/api';

interface FilterModalProps {
  visible: boolean;
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    maxDlcDate?: string;
    maxDistance?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'distance_asc' | 'distance_desc';
  };
  onApply: (filters: FilterModalProps['filters']) => void;
  onReset: () => void;
  onClose: () => void;
}

interface Category {
  id: string;
  nom: string;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  onApply,
  onReset,
  onClose,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(filters.category);
  const [minPrice, setMinPrice] = useState<string>(filters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState<string>(filters.maxPrice?.toString() || '');
  const [maxDlcDate, setMaxDlcDate] = useState<Date | undefined>(
    filters.maxDlcDate ? new Date(filters.maxDlcDate) : undefined
  );
  const [showDlcPicker, setShowDlcPicker] = useState(false);
  const [maxDistance, setMaxDistance] = useState<string>(filters.maxDistance?.toString() || '');
  const [sortBy, setSortBy] = useState<string | undefined>(filters.sortBy);

  useEffect(() => {
    if (visible) {
      loadCategories();
      // Reset local state to match filters prop
      setSelectedCategory(filters.category);
      setMinPrice(filters.minPrice?.toString() || '');
      setMaxPrice(filters.maxPrice?.toString() || '');
      setMaxDlcDate(filters.maxDlcDate ? new Date(filters.maxDlcDate) : undefined);
      setMaxDistance(filters.maxDistance?.toString() || '');
      setSortBy(filters.sortBy);
    }
  }, [visible, filters]);

  const loadCategories = async () => {
    try {
      const response = await API.getCategories();
      if (response.success) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  };

  const handleApply = () => {
    onApply({
      category: selectedCategory,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      maxDlcDate: maxDlcDate ? maxDlcDate.toISOString().split('T')[0] : undefined,
      maxDistance: maxDistance ? parseFloat(maxDistance) : undefined,
      sortBy: sortBy as any,
    });
  };

  const handleReset = () => {
    setSelectedCategory(undefined);
    setMinPrice('');
    setMaxPrice('');
    setMaxDlcDate(undefined);
    setMaxDistance('');
    setSortBy(undefined);
    onReset();
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDlcDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDlcPicker(false);
    }
    if (selectedDate) {
      setMaxDlcDate(selectedDate);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtres</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Catégorie */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Catégorie</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    !selectedCategory && styles.categoryChipSelected
                  ]}
                  onPress={() => setSelectedCategory(undefined)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    !selectedCategory && styles.categoryChipTextSelected
                  ]}>
                    Toutes
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id && styles.categoryChipSelected
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      selectedCategory === category.id && styles.categoryChipTextSelected
                    ]}>
                      {category.nom}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Prix */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Prix (€)</Text>
              <View style={styles.rangeContainer}>
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.rangeLabel}>Min</Text>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    value={minPrice}
                    onChangeText={setMinPrice}
                  />
                </View>
                <Text style={styles.rangeSeparator}>-</Text>
                <View style={styles.rangeInputContainer}>
                  <Text style={styles.rangeLabel}>Max</Text>
                  <TextInput
                    style={styles.rangeInput}
                    placeholder="∞"
                    keyboardType="decimal-pad"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                  />
                </View>
              </View>
            </View>

            {/* DLC */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date limite de consommation</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDlcPicker(true)}
              >
                <Text style={maxDlcDate ? styles.datePickerText : styles.datePickerPlaceholder}>
                  {maxDlcDate ? formatDate(maxDlcDate) : 'Sélectionner une date maximum'}
                </Text>
              </TouchableOpacity>
              {maxDlcDate && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={() => setMaxDlcDate(undefined)}
                >
                  <Text style={styles.clearDateText}>Effacer la date</Text>
                </TouchableOpacity>
              )}
              {showDlcPicker && (
                <DateTimePicker
                  value={maxDlcDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  onChange={handleDlcDateChange}
                  minimumDate={new Date()}
                  textColor="#000000"
                  accentColor="#166534"
                />
              )}
              {Platform.OS === 'ios' && showDlcPicker && (
                <TouchableOpacity
                  style={styles.closeDatePickerButton}
                  onPress={() => setShowDlcPicker(false)}
                >
                  <Text style={styles.closeDatePickerText}>Fermer</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Distance */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Distance maximale (km)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 5"
                keyboardType="decimal-pad"
                value={maxDistance}
                onChangeText={setMaxDistance}
              />
            </View>

            {/* Tri */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trier par</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    !sortBy && styles.categoryChipSelected
                  ]}
                  onPress={() => setSortBy(undefined)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    !sortBy && styles.categoryChipTextSelected
                  ]}>
                    Par défaut
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    sortBy === 'price_asc' && styles.categoryChipSelected
                  ]}
                  onPress={() => setSortBy('price_asc')}
                >
                  <Text style={[
                    styles.categoryChipText,
                    sortBy === 'price_asc' && styles.categoryChipTextSelected
                  ]}>
                    Prix croissant
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    sortBy === 'price_desc' && styles.categoryChipSelected
                  ]}
                  onPress={() => setSortBy('price_desc')}
                >
                  <Text style={[
                    styles.categoryChipText,
                    sortBy === 'price_desc' && styles.categoryChipTextSelected
                  ]}>
                    Prix décroissant
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    sortBy === 'distance_asc' && styles.categoryChipSelected
                  ]}
                  onPress={() => setSortBy('distance_asc')}
                >
                  <Text style={[
                    styles.categoryChipText,
                    sortBy === 'distance_asc' && styles.categoryChipTextSelected
                  ]}>
                    Plus proche
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    sortBy === 'distance_desc' && styles.categoryChipSelected
                  ]}
                  onPress={() => setSortBy('distance_desc')}
                >
                  <Text style={[
                    styles.categoryChipText,
                    sortBy === 'distance_desc' && styles.categoryChipTextSelected
                  ]}>
                    Plus loin
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
