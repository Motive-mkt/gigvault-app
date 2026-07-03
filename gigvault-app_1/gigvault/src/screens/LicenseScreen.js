import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/theme';
import { verifyLicenseKey } from '../services/whopLicense';

export default function LicenseScreen({ onVerified }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    if (!key.trim()) return;
    setLoading(true);
    setError(null);
    const result = await verifyLicenseKey(key.trim());
    setLoading(false);
    if (result.valid) {
      onVerified();
    } else {
      setError(result.reason || 'Invalid license key.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>GigVault</Text>
        <Text style={styles.subtitle}>Enter the license key from your Whop purchase</Text>

        <TextInput
          style={styles.input}
          value={key}
          onChangeText={setKey}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (!key.trim() || loading) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={!key.trim() || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Verify & continue</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          Your key was emailed to you by Whop after checkout. It&apos;s also visible in your Whop
          library under this product.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep, justifyContent: 'center' },
  content: { padding: spacing.xl },
  logo: {
    fontFamily: fonts.display, color: colors.textPrimary, fontSize: 24, textAlign: 'center', marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.body, color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.bgElevated, borderRadius: radius.card, borderWidth: 0.5,
    borderColor: colors.border, padding: spacing.lg, fontFamily: fonts.numeric,
    color: colors.textPrimary, fontSize: 16, textAlign: 'center', marginBottom: spacing.md,
    letterSpacing: 1,
  },
  error: {
    fontFamily: fonts.body, color: colors.danger, fontSize: 12, textAlign: 'center', marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.accent, borderRadius: radius.card, padding: spacing.md,
    alignItems: 'center', marginBottom: spacing.lg,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: fonts.label, color: '#FFFFFF', fontSize: 14 },
  helpText: {
    fontFamily: fonts.body, color: colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16,
  },
});
