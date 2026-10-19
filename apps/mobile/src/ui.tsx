import {
  Text,
  View,
  TextInput,
  Pressable,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import type { ReactNode } from "react";
export const palette = {
  ink: "#14382d",
  green: "#235e46",
  lime: "#d7ef88",
  paper: "#f5f6f0",
  muted: "#6b796e",
  line: "#dce3d9",
};
export function Button({
  children,
  onPress,
  quiet = false,
  disabled = false,
}: {
  children: ReactNode;
  onPress: () => void;
  quiet?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[s.button, quiet && s.quiet, disabled && { opacity: 0.45 }]}
    >
      <Text
        style={{
          color: quiet ? palette.ink : "#fff",
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#879286"
        style={s.input}
        {...props}
      />
    </View>
  );
}
export function Card({ children }: { children: ReactNode }) {
  return <View style={s.card}>{children}</View>;
}
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper },
  body: {
    padding: 22,
    gap: 18,
    width: "100%",
    maxWidth: 800,
    alignSelf: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: palette.ink,
    letterSpacing: -1.3,
  },
  h2: { fontSize: 22, fontWeight: "700", color: palette.ink },
  text: { fontSize: 15, color: palette.muted, lineHeight: 23 },
  label: { fontSize: 13, fontWeight: "600", color: palette.ink },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: palette.ink,
  },
  button: { backgroundColor: palette.green, padding: 16, borderRadius: 12 },
  quiet: { backgroundColor: "#e9eedf" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.line,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: "#e8efdf",
  },
  error: { color: "#9c352c", fontSize: 14, lineHeight: 21 },
});
