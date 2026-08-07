export const colors = {
  bg: "#0A0A0B",
  bgElevated: "#131316",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(244,197,66,0.12)",
  borderStrong: "rgba(244,197,66,0.28)",

  text: "#B8B4AD",
  textHigh: "#F5F0E6",
  textDim: "#6F6B64",

  accent: "#F4C542",
  accentDim: "#D4AF37",
  accentDeep: "#B8862B",
  accentBg: "rgba(244,197,66,0.12)",
  accentBorder: "rgba(244,197,66,0.35)",
  accentGlow: "rgba(244,197,66,0.25)",

  ember: "#FF7A45",
  emberBg: "rgba(255,122,69,0.14)",

  success: "#8FBF6E",
  successBg: "rgba(143,191,110,0.14)",
};

export const gradients = {
  accent: [colors.accent, colors.accentDeep] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, color: colors.textHigh },
  h2: { fontSize: 20, fontWeight: "600" as const, color: colors.textHigh },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 13, color: colors.textDim },
};
