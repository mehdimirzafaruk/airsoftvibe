import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { colors, typographyColors } from '@/lib/colors';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!email) {
      setError('E-posta gereklidir');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Şifre sıfırlama başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Şifremi Unuttum</Text>
          <Text style={styles.subtitle}>E-posta adresinize şifre sıfırlama linki göndereceğiz</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? (
          <View style={styles.successContainer}>
            <Text style={styles.success}>
              E-posta adresinize şifre sıfırlama linki gönderildi. Lütfen e-postanızı kontrol edin.
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Giriş Sayfasına Dön</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>E-posta</Text>
              <TextInput
                style={styles.input}
                placeholder="ornek@email.com"
                placeholderTextColor={colors.neutral[500]}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <TouchableOpacity
              style={[styles.resetButton, loading && styles.disabled]}
              onPress={handleReset}
              disabled={loading}
            >
              <Text style={styles.resetButtonText}>
                {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Linki Gönder'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backLink}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.accent[600],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: typographyColors.secondary,
    textAlign: 'center',
    marginTop: 10,
  },
  form: {
    width: '100%',
  },
  error: {
    backgroundColor: colors.status.error,
    color: colors.neutral[0],
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 14,
  },
  successContainer: {
    alignItems: 'center',
  },
  success: {
    backgroundColor: colors.status.success,
    color: colors.neutral[0],
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: typographyColors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.secondary[100],
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderRadius: 8,
    padding: 12,
    color: typographyColors.primary,
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: colors.accent[600],
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  resetButtonText: {
    color: colors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    color: colors.accent[600],
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
  backLink: {
    color: colors.accent[600],
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});
