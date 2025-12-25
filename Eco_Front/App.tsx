import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { CartProvider } from './src/contexts/CartContext';

export default function App() {
  console.log('[App] Starting application with React Navigation');

  return (
    <CartProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </CartProvider>
  );
}
