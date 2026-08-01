import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { User, Mail, Lock } from "lucide-react-native";
import api from "../lib/api";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import { colors, radius, spacing, typography } from "../theme";

export default function RegisterScreen({ navigation }: any) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async () => {
    setErrorMsg("");
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("Please fill all the fields.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/users/register", {
        full_name: fullName,
        email,
        password,
      });
      navigation.navigate("Login");
    } catch (error) {
      console.error(error);
      setErrorMsg("Registration failed. Email might already be taken.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Start building better wake-up habits</Text>

      <View style={styles.card}>
        <AuthInput
          icon={<User color={colors.textDim} size={18} />}
          placeholder="Full name"
          value={fullName}
          onChangeText={setFullName}
        />

        <AuthInput
          icon={<Mail color={colors.textDim} size={18} />}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <AuthInput
          icon={<Lock color={colors.textDim} size={18} />}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.accent, colors.accentDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.button, loading && { opacity: 0.7 }]}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0B" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            Already have an account?{" "}
            <Text style={styles.linkAccent}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, textAlign: "center", marginBottom: spacing.xs },
  subtitle: {
    ...typography.caption,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.xs,
  },
  buttonText: { color: "#0A0A0B", fontWeight: "700", fontSize: 15 },
  linkText: {
    color: colors.textDim,
    textAlign: "center",
    marginTop: spacing.lg,
    fontSize: 13,
  },
  linkAccent: { color: colors.accent, fontWeight: "600" },
  error: {
    color: colors.ember,
    backgroundColor: colors.emberBg,
    borderRadius: radius.sm,
    padding: 10,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
});
