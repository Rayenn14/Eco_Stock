import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AccueilConnexion() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue sur EcoStock 👋</Text>
      <Text style={styles.text}>
        Découvrez les invendus près de chez vous et évitez le gaspillage 🌍
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#2e7d32", marginBottom: 10 },
  text: { fontSize: 16, color: "#444", textAlign: "center" },
});
