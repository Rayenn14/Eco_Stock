import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    if (!email) {
      Alert.alert("Erreur", "Veuillez entrer votre adresse mail");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email valide");
      return;
    }

    Alert.alert("Succès", "Un lien de réinitialisation a été envoyé !");
    console.log("Réinitialisation du mot de passe pour:", email);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>

        <Text style={styles.title}>Mot de passe oublié ?</Text>
        <Text style={styles.subtitle}>
          Entrez votre adresse mail afin de recevoir un lien pour changer votre mot de passe.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Adresse mail</Text>
          <TextInput
            style={styles.input}
            placeholder="Entrer votre adresse mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Réinitialiser le mot de passe</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ForgotPasswordScreen;

// Styles → copie exactement ceux que tu as déjà


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  inner: { maxWidth: 400, alignSelf: "center", marginTop: 20 },
  backButton: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "700", color: "#065F46", marginBottom: 12, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#4B5563", marginBottom: 24, textAlign: "center" },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: "#FFFFFF" },
  submitBtn: { backgroundColor: "#065F46", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 12 },
  submitText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
});
