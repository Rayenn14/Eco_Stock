import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { Eye, EyeOff, ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [name, setName] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = () => {
    if (!name || !prenom || !email || !password || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email valide");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    Alert.alert("Succès", "Compte créé avec succès !");
    console.log("Inscription:", { name, prenom, email, password });
    navigation.navigate("Login");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => navigation.navigate("AccueilConnexion")} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>

        <Text style={styles.title}>Créer un compte</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom</Text>
          <TextInput style={styles.input} placeholder="Entrez votre nom" value={name} onChangeText={setName} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prénom</Text>
          <TextInput style={styles.input} placeholder="Entrez votre prénom" value={prenom} onChangeText={setPrenom} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Adresse mail</Text>
          <TextInput
            style={styles.input}
            placeholder="exemple@mail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, { paddingRight: 40 }]}
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirmer votre mot de passe</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, { paddingRight: 40 }]}
              placeholder="Répétez votre mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.registerBtn} onPress={handleSubmit}>
          <Text style={styles.registerText}>Créer votre compte</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
};

export default RegisterScreen;

// Styles → copie exactement ceux que tu as déjà


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  inner: { maxWidth: 400, alignSelf: "center", marginTop: 20 },
  backButton: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "700", color: "#065F46", marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: "#FFFFFF" },
  passwordWrapper: { position: "relative", justifyContent: "center" },
  eyeButton: { position: "absolute", right: 12, top: "35%" },
  registerBtn: { backgroundColor: "#065F46", paddingVertical: 14, borderRadius: 10, marginTop: 12, alignItems: "center" },
  registerText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
});
