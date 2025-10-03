import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from "react-native";
import { Facebook, Github, Apple } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

const AccueilConnexion: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <Image
          source={require("../../assets/images/EcoStockLogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Titre */}
        <Text style={styles.title}>Bienvenue sur EcoStock</Text>

        {/* Boutons principaux */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.buttonText}>Se connecter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.buttonTextSecondary}>Créer un compte</Text>
        </TouchableOpacity>

        {/* Boutons sociaux */}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.socialTitle}>Se connecter avec</Text>
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialBtn}>
              <Facebook size={22} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Text style={[styles.socialText, { color: "#DB4437" }]}>G</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Github size={22} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Apple size={22} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Lien mot de passe oublié */}
        <TouchableOpacity
          onPress={() => navigation.navigate("ForgotPassword")}
          style={{ marginTop: 20 }}
        >
          <Text style={styles.link}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>Vous n'avez pas encore de compte ?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.linkBold}>Créer un compte</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AccueilConnexion;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  inner: {
    maxWidth: 400,
    alignSelf: "center",
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#065F46",
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#065F46",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: "#065F46",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextSecondary: {
    color: "#065F46",
    fontSize: 16,
    fontWeight: "600",
  },
  socialTitle: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 12,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  socialBtn: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
    marginVertical: 6,
  },
  socialText: {
    fontSize: 18,
    fontWeight: "700",
  },
  link: {
    color: "#065F46",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  linkBold: {
    color: "#065F46",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },
});
