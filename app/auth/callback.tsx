import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, Modal, TextInput, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { colors, typographyColors } from '@/lib/colors';
import { X, Mail } from 'lucide-react-native';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { resendConfirmationEmail, updateEmail } = useAuth();
  const [resending, setResending] = useState(false);
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);

  useEffect(() => {
    // URL'deki hash fragment'ini kontrol et
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash) {
        // Hash'ten access_token, refresh_token vs. çıkar
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        const errorCode = hashParams.get('error_code');

        if (error) {
          // Hata varsa, işleme devam et (kullanıcıya gösterilecek)
          console.error('Auth callback error:', { error, errorCode, errorDescription });
          return;
        }

        if (accessToken && refreshToken) {
          // Session'ı set et
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          }).then(() => {
            // Başarılı olursa ana sayfaya yönlendir
            router.replace('/(tabs)');
          }).catch((err) => {
            console.error('Error setting session:', err);
          });
        }
      }
    }

    // Query parametrelerini kontrol et (error parametreleri)
    if (params.error) {
      // Hata zaten var, kullanıcıya gösterilecek
      return;
    }

    // Hiçbir şey yoksa 3 saniye sonra login'e yönlendir
    const timer = setTimeout(() => {
      router.replace('/auth/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [params, router]);

  const getErrorMessage = () => {
    const error = params.error as string;
    const errorCode = params.error_code as string;
    const errorDescription = params.error_description as string;

    if (errorCode === 'otp_expired' || error?.includes('expired')) {
      return {
        title: 'Link Süresi Dolmuş',
        message: 'Email doğrulama linkinin süresi dolmuş. Lütfen yeni bir doğrulama linki isteyin.',
      };
    }

    if (error === 'access_denied') {
      return {
        title: 'Erişim Reddedildi',
        message: errorDescription || 'Email doğrulama işlemi tamamlanamadı.',
      };
    }

    return {
      title: 'Doğrulama Hatası',
      message: errorDescription || 'Email doğrulama sırasında bir hata oluştu.',
    };
  };

  const error = params.error;
  const errorInfo = error ? getErrorMessage() : null;

  return (
    <View style={styles.container}>
      {errorInfo ? (
        <>
          <Text style={styles.title}>{errorInfo.title}</Text>
          <Text style={styles.message}>{errorInfo.message}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.primaryActionButton]}
              onPress={async () => {
                if (resending) return;
                
                // Email'i URL'den veya query parametrelerinden al
                const email = params.email as string;
                if (email) {
                  setResending(true);
                  try {
                    await resendConfirmationEmail(email);
                    Alert.alert('Başarılı', 'Yeni doğrulama email\'i gönderildi. Lütfen email\'inizi kontrol edin.');
                  } catch (err: any) {
                    Alert.alert('Hata', err.message || 'Email gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
                  } finally {
                    setResending(false);
                  }
                } else {
                  // Email yoksa login sayfasına yönlendir
                  router.replace('/auth/login');
                }
              }}
              disabled={resending}
            >
              <Text style={styles.buttonText}>
                {resending ? 'Gönderiliyor...' : 'Yeni Doğrulama Email\'i Gönder'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                router.replace({
                  pathname: '/auth/login',
                  params: { email: params.email as string || '' },
                });
              }}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Giriş Sayfasına Dön
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.tertiaryButton]}
              onPress={() => {
                const email = params.email as string;
                if (email) {
                  setNewEmail(email);
                }
                setShowEmailChangeModal(true);
              }}
            >
              <Text style={[styles.buttonText, styles.tertiaryButtonText]}>
                E-posta Adresini Değiştir
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>Doğrulanıyor...</Text>
          <Text style={styles.message}>Email adresiniz doğrulanıyor, lütfen bekleyin.</Text>
        </>
      )}

      {/* Email Değiştirme Modal */}
      <Modal
        visible={showEmailChangeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowEmailChangeModal(false);
          setNewEmail('');
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Mail color={colors.primary[500]} size={32} />
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowEmailChangeModal(false);
                  setNewEmail('');
                }}
              >
                <X color={typographyColors.secondary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>E-posta Adresini Değiştir</Text>
            <Text style={styles.modalMessage}>
              Yeni e-posta adresinizi girin. Bu adrese doğrulama e-postası gönderilecektir.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Yeni E-posta Adresi"
              placeholderTextColor={colors.neutral[400]}
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryModalButton, (changingEmail || !newEmail) && styles.disabledButton]}
                onPress={async () => {
                  if (!newEmail) {
                    Alert.alert('Hata', 'Lütfen yeni e-posta adresini girin');
                    return;
                  }

                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(newEmail)) {
                    Alert.alert('Hata', 'Geçerli bir e-posta adresi girin');
                    return;
                  }

                  try {
                    setChangingEmail(true);
                    await updateEmail(newEmail);
                    Alert.alert(
                      'Başarılı',
                      `E-posta adresiniz ${newEmail} olarak güncellendi. Yeni e-posta adresinize gönderilen doğrulama linkine tıklayarak hesabınızı aktifleştirin.`,
                      [
                        {
                          text: 'Tamam',
                          onPress: () => {
                            setShowEmailChangeModal(false);
                            setNewEmail('');
                            router.replace({
                              pathname: '/auth/login',
                              params: { email: newEmail },
                            });
                          },
                        },
                      ]
                    );
                  } catch (err: any) {
                    Alert.alert('Hata', err.message || 'E-posta adresi değiştirilemedi');
                  } finally {
                    setChangingEmail(false);
                  }
                }}
                disabled={changingEmail || !newEmail}
              >
                {changingEmail ? (
                  <ActivityIndicator color={colors.neutral[0]} />
                ) : (
                  <Text style={styles.modalButtonText}>E-posta Adresini Değiştir</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.tertiaryModalButton]}
                onPress={() => {
                  setShowEmailChangeModal(false);
                  setNewEmail('');
                }}
              >
                <Text style={[styles.modalButtonText, styles.tertiaryModalButtonText]}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background.light,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: typographyColors.primary,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: Platform.select({
      web: '"Space Grotesk", sans-serif',
      default: 'System',
    }),
  },
  message: {
    fontSize: 16,
    color: typographyColors.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
  },
  primaryActionButton: {
    backgroundColor: colors.primary[500],
  },
  buttonText: {
    color: colors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  secondaryButtonText: {
    color: colors.primary[500],
  },
  disabledButton: {
    opacity: 0.6,
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.secondary[200],
  },
  tertiaryButtonText: {
    color: typographyColors.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card.light,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary[500]}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: typographyColors.primary,
    marginBottom: 12,
    fontFamily: Platform.select({
      web: '"Space Grotesk", sans-serif',
      default: 'System',
    }),
  },
  modalMessage: {
    fontSize: 15,
    color: typographyColors.secondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: typographyColors.primary,
    marginBottom: 20,
  },
  modalActions: {
    gap: 12,
  },
  modalButton: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryModalButton: {
    backgroundColor: colors.primary[500],
  },
  tertiaryModalButton: {
    backgroundColor: 'transparent',
  },
  modalButtonText: {
    color: colors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryModalButtonText: {
    color: typographyColors.secondary,
  },
});
