import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email valide");
      return;
    }

    Alert.alert("Succès", "Connexion réussie !");
    console.log("Connexion:", { email, password });
    // Ici tu peux sauvegarder le token et naviguer vers l'accueil
    // navigation.replace("Accueil");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
      <View style={styles.inner}>
        <Text style={styles.title}>Connexion</Text>

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
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginBtn} onPress={handleSubmit}>
          <Text style={styles.loginText}>Se connecter</Text>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Vous n'avez pas encore de compte ?</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerLink}> Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default LoginScreen;

// Styles → copie exactement ceux que tu as déjà


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  inner: { maxWidth: 400, alignSelf: "center", marginTop: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#065F46", marginBottom: 24, textAlign: "center" },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, backgroundColor: "#FFFFFF" },
  passwordWrapper: { position: "relative", justifyContent: "center" },
  eyeButton: { position: "absolute", right: 12, top: "35%" },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 12 },
  forgotText: { fontSize: 14, color: "#065F46" },
  loginBtn: { backgroundColor: "#065F46", paddingVertical: 14, borderRadius: 10, marginTop: 12, alignItems: "center" },
  loginText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
  registerContainer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  registerText: { fontSize: 14, color: "#4B5563" },
  registerLink: { fontSize: 14, color: "#065F46", fontWeight: "600" },
});
