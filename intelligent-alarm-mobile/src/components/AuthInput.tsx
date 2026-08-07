import React from "react";
import { View, TextInput, StyleSheet, TextInputProps } from "react-native";
import { colors, radius, spacing } from "../theme";

type Props = TextInputProps & {
  icon: React.ReactNode;
};

export default function AuthInput({ icon, ...inputProps }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconSlot}>{icon}</View>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textDim}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.sm + 4,
    paddingHorizontal: spacing.sm + 4,
  },
  iconSlot: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textHigh,
    paddingVertical: 14,
    fontSize: 15,
  },
});
