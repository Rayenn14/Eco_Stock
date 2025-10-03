import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Splash from "./src/screens/Splash";
import AccueilConnexion from "./src/screens/AccueilConnexion";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="AccueilConnexion" component={AccueilConnexion} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
