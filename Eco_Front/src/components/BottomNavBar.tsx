import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { ChefHatIcon } from './SocialIcons';

type Screen = 'home' | 'search' | 'cart' | 'recipes' | 'profile';

interface BottomNavBarProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeScreen, onNavigate }) => {
  return (
    <View style={styles.container}>
      {/* Home */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onNavigate('home')}
      >
        <View style={[styles.iconContainer, activeScreen === 'home' && styles.iconActive]}>
          <HomeIcon active={activeScreen === 'home'} />
        </View>
      </TouchableOpacity>

      {/* Search */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onNavigate('search')}
      >
        <View style={[styles.iconContainer, activeScreen === 'search' && styles.iconActive]}>
          <SearchIcon active={activeScreen === 'search'} />
        </View>
      </TouchableOpacity>

      {/* Cart */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onNavigate('cart')}
      >
        <View style={[styles.iconContainer, activeScreen === 'cart' && styles.iconActive]}>
          <CartIcon active={activeScreen === 'cart'} />
        </View>
      </TouchableOpacity>

      {/* Recipes */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onNavigate('recipes')}
      >
        <View style={[styles.iconContainer, activeScreen === 'recipes' && styles.iconActive]}>
          <ChefHatIcon size={24} color={activeScreen === 'recipes' ? '#166534' : '#9CA3AF'} />
        </View>
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => onNavigate('profile')}
      >
        <View style={[styles.iconContainer, activeScreen === 'profile' && styles.iconActive]}>
          <ProfileIcon active={activeScreen === 'profile'} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Icône Home (maison) - SVG: house
const HomeIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <View style={styles.icon}>
    {/* Toit de la maison */}
    <View style={[styles.homeRoof, active && styles.homeRoofActive]} />
    {/* Corps de la maison avec porte */}
    <View style={[styles.homeBody, active && styles.homeBodyActive]}>
      <View style={[styles.homeDoor, active && styles.homeDoorActive]} />
    </View>
  </View>
);

// Icône Search (loupe)
const SearchIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <View style={styles.icon}>
    <View style={[styles.searchCircle, active && styles.searchCircleActive]} />
    <View style={[styles.searchHandle, active && styles.searchHandleActive]} />
  </View>
);

// Icône Cart (sac) - SVG: handbag
const CartIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <View style={styles.icon}>
    {/* Anses du sac */}
    <View style={styles.bagHandles}>
      <View style={[styles.bagHandle, active && styles.bagHandleActive]} />
      <View style={[styles.bagHandle, active && styles.bagHandleActive]} />
    </View>
    {/* Corps du sac */}
    <View style={[styles.bagBody, active && styles.bagBodyActive]} />
  </View>
);

// Icône Profile (personne)
const ProfileIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <View style={styles.icon}>
    <View style={[styles.profileHead, active && styles.profileHeadActive]} />
    <View style={[styles.profileBody, active && styles.profileBodyActive]} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 20,
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  iconActive: {
    backgroundColor: '#F0FDF4',
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Home Icon (maison)
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 8,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#9CA3AF',
    position: 'absolute',
    top: 1,
  },
  homeRoofActive: {
    borderBottomColor: '#166534',
  },
  homeBody: {
    width: 16,
    height: 12,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    position: 'absolute',
    bottom: 2,
  },
  homeBodyActive: {
    borderColor: '#166534',
  },
  homeDoor: {
    width: 5,
    height: 7,
    backgroundColor: '#9CA3AF',
    position: 'absolute',
    bottom: 0,
    left: 5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  homeDoorActive: {
    backgroundColor: '#166534',
  },

  // Search Icon
  searchCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    position: 'absolute',
    top: 2,
    left: 2,
  },
  searchCircleActive: {
    borderColor: '#166534',
  },
  searchHandle: {
    width: 8,
    height: 2,
    backgroundColor: '#9CA3AF',
    position: 'absolute',
    bottom: 2,
    right: 2,
    transform: [{ rotate: '45deg' }],
    borderRadius: 1,
  },
  searchHandleActive: {
    backgroundColor: '#166534',
  },

  // Bag/Handbag Icon (cart)
  bagHandles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 16,
    position: 'absolute',
    top: 2,
  },
  bagHandle: {
    width: 5,
    height: 6,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderBottomWidth: 0,
  },
  bagHandleActive: {
    borderColor: '#166534',
  },
  bagBody: {
    width: 18,
    height: 14,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    borderRadius: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    position: 'absolute',
    bottom: 2,
  },
  bagBodyActive: {
    borderColor: '#166534',
  },

  // Profile Icon
  profileHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    position: 'absolute',
    top: 2,
  },
  profileHeadActive: {
    backgroundColor: '#166534',
  },
  profileBody: {
    width: 16,
    height: 10,
    backgroundColor: '#9CA3AF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    position: 'absolute',
    bottom: 2,
  },
  profileBodyActive: {
    backgroundColor: '#166534',
  },
});
