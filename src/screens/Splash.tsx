import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any>;

export default function Splash({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("AccueilConnexion");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/images/EcoStockLogo.png")} style={styles.logo} />
      <Text style={styles.title}>ECO STOCK</Text>
      <Text style={styles.slogan}>Moins de gaspillage, plus d’économies</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  logo: { width: 120, height: 120, resizeMode: "contain", marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#2e7d32" },
  slogan: { fontSize: 14, color: "#666", marginTop: 10, textAlign: "center" },
});
