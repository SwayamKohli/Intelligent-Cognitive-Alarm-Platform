import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlarmClock } from 'lucide-react-native';
import { colors, spacing } from '../theme';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(244,197,66,0.10)', 'rgba(10,10,11,0)']}
        style={styles.glowTop}
      />
      <LinearGradient
        colors={['rgba(184,134,43,0.08)', 'rgba(10,10,11,0)']}
        style={styles.glowBottom}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconWrap}>
            <AlarmClock color={colors.accent} size={34} strokeWidth={1.75} />
          </View>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    right: -60,
    width: 380,
    height: 380,
    borderRadius: 190,
  },
  iconWrap: {
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
});