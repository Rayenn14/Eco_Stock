import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { CartProvider } from './src/contexts/CartContext';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51Sk4BD3AH8r0pLWdDLtL4kgx8Tv1ypwg8KA0mqFcEVKw1pyzDrxkhi99TewDCc9c7evqTLrrBFugbkcXyFSy1WRf00ICRCBPkN';

export default function App() {
  console.log('[App] Starting application with React Navigation and Stripe');

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <CartProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </CartProvider>
    </StripeProvider>
  );
}
