import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface SocialButtonProps {
  provider: 'facebook' | 'google' | 'apple';
  onPress: () => void;
}

export const SocialButton: React.FC<SocialButtonProps> = ({ provider, onPress }) => {
  const getColor = () => {
    switch (provider) {
      case 'facebook': return COLORS.facebook;
      case 'google': return COLORS.google;
      case 'apple': return COLORS.apple;
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={[styles.icon, { backgroundColor: getColor() }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});