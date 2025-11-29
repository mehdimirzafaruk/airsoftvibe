import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { colors, typographyColors } from '../../lib/colors';
import { Mail, X, Phone } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp, resetPassword, resendConfirmationEmail, updateEmail, sendPhoneOTP, verifyPhoneOTP, resendPhoneOTP } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email'); // Email veya Telefon seçimi
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  
  // Hata mesajları state'leri
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [generalError, setGeneralError] = useState('');
  
  // Email doğrulama butonu için state
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Telefon numarası formatlama fonksiyonu
  const formatPhoneNumber = (input: string): string => {
    if (!input) return '';
    
    // Sadece rakamları ve + işaretini al
    let cleaned = input.replace(/[^\d+]/g, '');
    
    // Eğer boşsa +90 döndür
    if (!cleaned || cleaned === '+') {
      return '+90';
    }
    
    // Eğer + ile başlamıyorsa ve 0 ile başlıyorsa, 0'ı kaldır
    if (!cleaned.startsWith('+') && cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Eğer +90 ile başlamıyorsa
    if (!cleaned.startsWith('+90')) {
      // +90 ekle
      if (cleaned.startsWith('+')) {
        // Eğer + ile başlıyorsa ama +90 değilse, +90'a çevir
        cleaned = '+90' + cleaned.substring(1);
      } else if (cleaned.startsWith('90')) {
        // 90 ile başlıyorsa + ekle
        cleaned = '+' + cleaned;
      } else {
        // Diğer durumlarda +90 ekle
        cleaned = '+90' + cleaned;
      }
    }
    
    // Görsel formatlama: +90 5xx xxx xx xx
    // Önce +90 kısmını al
    if (cleaned.startsWith('+90')) {
      const numberPart = cleaned.substring(3).replace(/\D/g, ''); // Sadece rakamları al
      
      // Maksimum 10 rakam (5xx xxx xx xx)
      const limitedNumber = numberPart.slice(0, 10);
      
      // Formatlama: +90 5xx xxx xx xx
      if (limitedNumber.length === 0) {
        return '+90';
      } else if (limitedNumber.length <= 3) {
        return `+90 ${limitedNumber}`;
      } else if (limitedNumber.length <= 6) {
        return `+90 ${limitedNumber.slice(0, 3)} ${limitedNumber.slice(3)}`;
      } else if (limitedNumber.length <= 8) {
        return `+90 ${limitedNumber.slice(0, 3)} ${limitedNumber.slice(3, 6)} ${limitedNumber.slice(6)}`;
      } else {
        return `+90 ${limitedNumber.slice(0, 3)} ${limitedNumber.slice(3, 6)} ${limitedNumber.slice(6, 8)} ${limitedNumber.slice(8)}`;
      }
    }
    
    return cleaned;
  };

  // Telefon numarasını temizle (formatlamayı kaldır, sadece +905xxxxxxxxx formatında)
  const cleanPhoneNumber = (formatted: string): string => {
    if (!formatted || !formatted.trim()) {
      return '';
    }
    
    // Boşlukları ve özel karakterleri kaldır, sadece rakamları ve + işaretini al
    let cleaned = formatted.replace(/[^\d+]/g, '');
    
    // Eğer boşsa +90 döndür
    if (!cleaned || cleaned === '+') {
      return '+90';
    }
    
    // Eğer +90 ile başlamıyorsa düzelt
    if (!cleaned.startsWith('+90')) {
      if (cleaned.startsWith('0')) {
        // 0 ile başlıyorsa 0'ı kaldır ve +90 ekle
        cleaned = '+90' + cleaned.substring(1);
      } else if (cleaned.startsWith('90')) {
        // 90 ile başlıyorsa + ekle
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('+')) {
        // + ile başlıyor ama +90 değil, +90'a çevir
        cleaned = '+90' + cleaned.substring(1);
      } else {
        // Diğer durumlarda +90 ekle
        cleaned = '+90' + cleaned;
      }
    }
    
    // +90'dan sonraki kısmı al (sadece rakamlar)
    const numberPart = cleaned.substring(3).replace(/\D/g, '');
    
    // Maksimum 10 rakam (Türkiye telefon numarası standardı)
    const limitedNumber = numberPart.slice(0, 10);
    
    // +90 + 10 rakam = 13 karakter
    return '+90' + limitedNumber;
  };

  const handleAuth = async () => {
    // Hata mesajlarını temizle
    setEmailError('');
    setPasswordError('');
    setUsernameError('');
    setGeneralError('');

    let hasError = false;

    // Email validasyonu
    if (!email || !email.trim()) {
      setEmailError('E-posta adresi gereklidir');
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('Geçerli bir e-posta adresi girin');
        hasError = true;
      }
    }

    // Şifre validasyonu
    if (!password || !password.trim()) {
      setPasswordError('Şifre gereklidir');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalıdır');
      hasError = true;
    }

    // Kullanıcı adı validasyonu (sadece kayıt için)
    if (isSignUp) {
      if (!username || !username.trim()) {
        setUsernameError('Kullanıcı adı gereklidir');
        hasError = true;
      } else if (username.trim().length < 3) {
        setUsernameError('Kullanıcı adı en az 3 karakter olmalıdır');
        hasError = true;
      }
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, username, fullName || username);
        // Kayıt başarılı, doğrulama email butonu göster
        setShowResendButton(true);
        setGeneralError('');
        Alert.alert(
          'Kayıt Başarılı!',
          `${email} adresine doğrulama e-postası gönderildi. Lütfen e-postanızı kontrol ederek hesabınızı aktifleştirin.`
        );
        // Sadece şifre ve kullanıcı adını temizle, email'i bırak
        setPassword('');
        setUsername('');
        setFullName('');
        setIsSignUp(false);
      } else {
        await signIn(email, password);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      // Better error handling
      console.error('Auth error:', error);
      let errorMessage = 'Bir hata oluştu';
      
      if (error?.message) {
        if (error.message.includes('Invalid login credentials') || error.message.includes('E-posta veya şifre hatalı')) {
          errorMessage = 'E-posta veya şifre hatalı';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'Bu e-posta adresi zaten kayıtlı';
        } else if (error.message.includes('Email rate limit') || error.message.includes('Çok fazla deneme')) {
          errorMessage = 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin';
        } else if (error.message.includes('Email not confirmed') || error.message.includes('e-posta adresinizi doğrulamanız')) {
          // Email doğrulanmamış - modal göster
          setEmailNotConfirmed(true);
          setUnconfirmedEmail(email);
          errorMessage = 'E-posta adresinizi doğrulamanız gerekiyor. E-postanızı kontrol edin';
        } else if (error.message.includes('email')) {
          errorMessage = 'Geçerli bir e-posta adresi girin';
        } else {
          errorMessage = error.message || 'Giriş yapılırken bir hata oluştu';
        }
      }
      
      setGeneralError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneOTP = async () => {
    // Hata mesajlarını temizle
    setPhoneError('');
    setUsernameError('');
    setGeneralError('');

    let hasError = false;

    // Telefon validasyonu
    if (!phone || !phone.trim()) {
      setPhoneError('Telefon numarası gereklidir');
      hasError = true;
    } else {
      const cleanPhone = cleanPhoneNumber(phone);
      console.log('Telefon validasyonu - Input:', phone, 'Temizlenmiş:', cleanPhone, 'Uzunluk:', cleanPhone.length);
      
      // Türkiye telefon numarası validasyonu: +90 ile başlamalı ve 13 karakter olmalı (+90 + 10 rakam)
      // Telefon numarası 5 ile başlamalı ve toplam 10 rakam olmalı
      if (cleanPhone.length < 13) {
        setPhoneError(`Telefon numarası eksik. ${13 - cleanPhone.length} rakam daha gerekli. (Örn: +90 552 796 47 29)`);
        hasError = true;
      } else if (cleanPhone.length > 13) {
        setPhoneError('Telefon numarası çok uzun. 10 haneli telefon numarası giriniz.');
        hasError = true;
      } else {
        const phoneRegex = /^\+90[5][0-9]{9}$/;
        if (!phoneRegex.test(cleanPhone)) {
          setPhoneError('Geçerli bir telefon numarası girin. Türkiye telefon numarası 5 ile başlamalı (Örn: +90 552 796 47 29)');
          hasError = true;
        }
      }
    }

    // Kullanıcı adı validasyonu (kayıt için)
    if (isSignUp) {
      if (!username || !username.trim()) {
        setUsernameError('Kullanıcı adı gereklidir');
        hasError = true;
      } else if (username.trim().length < 3) {
        setUsernameError('Kullanıcı adı en az 3 karakter olmalıdır');
        hasError = true;
      }
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    try {
      // Telefon numarasını temizle (formatlamayı kaldır)
      const cleanPhone = cleanPhoneNumber(phone);
      await sendPhoneOTP(cleanPhone, isSignUp ? username : undefined, isSignUp ? fullName : undefined);
      setOtpSent(true);
      setGeneralError('');
      Alert.alert('Başarılı', 'Doğrulama kodu telefon numaranıza gönderildi.');
    } catch (error: any) {
      setGeneralError(error.message || 'Kod gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    // Hata mesajlarını temizle
    setOtpError('');
    setGeneralError('');

    // OTP validasyonu
    if (!otp || otp.length !== 6) {
      setOtpError('6 haneli doğrulama kodunu girin');
      return;
    }

    setLoading(true);
    try {
      // Telefon numarasını temizle (formatlamayı kaldır)
      const cleanPhone = cleanPhoneNumber(phone);
      await verifyPhoneOTP(cleanPhone, otp);
      // Başarılı doğrulama sonrası ana sayfaya yönlendir
      router.replace('/(tabs)');
    } catch (error: any) {
      setOtpError(error.message || 'Doğrulama kodu geçersiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>AirsoftVibe</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}
          </Text>
        </View>

        {/* Auth Method Seçimi */}
        <View style={styles.authMethodSelector}>
          <TouchableOpacity
            style={[styles.authMethodTab, authMethod === 'email' && styles.authMethodTabActive]}
            onPress={() => {
              setAuthMethod('email');
              setPhoneError('');
              setOtpError('');
              setGeneralError('');
              setOtpSent(false);
              setOtp('');
            }}
          >
            <Mail size={18} color={authMethod === 'email' ? colors.primary[600] : typographyColors.secondary} />
            <Text style={[styles.authMethodTabText, authMethod === 'email' && styles.authMethodTabTextActive]}>
              E-posta
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.authMethodTab, authMethod === 'phone' && styles.authMethodTabActive]}
            onPress={() => {
              setAuthMethod('phone');
              setEmailError('');
              setPasswordError('');
              setGeneralError('');
              setOtpSent(false);
              setOtp('');
            }}
          >
            <Phone size={18} color={authMethod === 'phone' ? colors.primary[600] : typographyColors.secondary} />
            <Text style={[styles.authMethodTabText, authMethod === 'phone' && styles.authMethodTabTextActive]}>
              Telefon
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {authMethod === 'email' ? (
            <>
              <TextInput
                placeholder="E-posta"
                placeholderTextColor={colors.neutral[400]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, emailError && styles.inputError]}
              />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}

              {isSignUp && (
                <>
                  <TextInput
                    style={[styles.input, usernameError && styles.inputError]}
                    placeholder="Kullanıcı Adı"
                    placeholderTextColor={colors.neutral[400]}
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (usernameError) setUsernameError('');
                    }}
                    autoCapitalize="none"
                  />
                  {usernameError ? (
                    <Text style={styles.errorText}>{usernameError}</Text>
                  ) : null}

                  <TextInput
                    style={styles.input}
                    placeholder="İsim Soyisim (Opsiyonel)"
                    placeholderTextColor={colors.neutral[400]}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </>
              )}

              <TextInput
                style={[styles.input, passwordError && styles.inputError]}
                placeholder="Şifre"
                placeholderTextColor={colors.neutral[400]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                }}
                secureTextEntry
                autoCapitalize="none"
              />
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </>
          ) : (
            <>
              {/* Telefon ile giriş/kayıt */}
              <TextInput
                placeholder="Telefon Numarası (+90 5xx xxx xx xx)"
                placeholderTextColor={colors.neutral[400]}
                value={phone}
                onChangeText={(text) => {
                  const formatted = formatPhoneNumber(text);
                  setPhone(formatted);
                  if (phoneError) setPhoneError('');
                }}
                keyboardType="phone-pad"
                maxLength={17} // +90 5xx xxx xx xx maksimum uzunluk
                style={[styles.input, phoneError && styles.inputError]}
              />
              {phoneError ? (
                <Text style={styles.errorText}>{phoneError}</Text>
              ) : null}

              {isSignUp && !otpSent && (
                <>
                  <TextInput
                    style={[styles.input, usernameError && styles.inputError]}
                    placeholder="Kullanıcı Adı"
                    placeholderTextColor={colors.neutral[400]}
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (usernameError) setUsernameError('');
                    }}
                    autoCapitalize="none"
                  />
                  {usernameError ? (
                    <Text style={styles.errorText}>{usernameError}</Text>
                  ) : null}

                  <TextInput
                    style={styles.input}
                    placeholder="İsim Soyisim (Opsiyonel)"
                    placeholderTextColor={colors.neutral[400]}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </>
              )}

              {otpSent && (
                <>
                  <Text style={styles.otpInfoText}>
                    Telefon numaranıza gönderilen 6 haneli kodu girin
                  </Text>
                  <TextInput
                    placeholder="Doğrulama Kodu"
                    placeholderTextColor={colors.neutral[400]}
                    value={otp}
                    onChangeText={(text) => {
                      // Sadece rakamları kabul et, maksimum 6 karakter
                      const numbersOnly = text.replace(/[^0-9]/g, '').slice(0, 6);
                      setOtp(numbersOnly);
                      if (otpError) setOtpError('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={[styles.input, styles.otpInput, otpError && styles.inputError]}
                    autoFocus
                  />
                  {otpError ? (
                    <Text style={styles.errorText}>{otpError}</Text>
                  ) : null}
                </>
              )}
            </>
          )}

          {generalError ? (
            <View style={styles.generalErrorContainer}>
              <Text style={styles.generalErrorText}>{generalError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={authMethod === 'email' ? handleAuth : (otpSent ? handleVerifyOTP : handleSendPhoneOTP)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.neutral[50]} />
            ) : (
              <Text style={styles.buttonText}>
                {authMethod === 'phone' 
                  ? (otpSent ? 'Doğrula' : (isSignUp ? 'Kod Gönder' : 'Kod Gönder'))
                  : (isSignUp ? 'Kayıt Ol' : 'Giriş Yap')
                }
              </Text>
            )}
          </TouchableOpacity>

          {authMethod === 'email' && isSignUp && (
            <TouchableOpacity
              style={styles.resendEmailButton}
              onPress={async () => {
                if (!email || !email.trim()) {
                  setEmailError('Doğrulama e-postası göndermek için e-posta adresi gereklidir');
                  return;
                }
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email.trim())) {
                  setEmailError('Geçerli bir e-posta adresi girin');
                  return;
                }
                try {
                  setLoading(true);
                  setGeneralError('');
                  await resendConfirmationEmail(email);
                  Alert.alert('Başarılı', 'Doğrulama e-postası gönderildi. Lütfen e-postanızı kontrol edin.');
                } catch (error: any) {
                  if (error.message.includes('already confirmed')) {
                    setGeneralError('Bu e-posta adresi zaten doğrulanmış.');
                  } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
                    setGeneralError('Bu e-posta adresi ile kayıtlı bir hesap bulunamadı. Önce kayıt olun.');
                  } else {
                    setGeneralError(error.message || 'Doğrulama e-postası gönderilemedi');
                  }
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <Text style={styles.resendEmailText}>Doğrulama E-postasını Tekrar Gönder</Text>
            </TouchableOpacity>
          )}

          {authMethod === 'phone' && otpSent && (
            <TouchableOpacity
              style={styles.resendEmailButton}
              onPress={async () => {
                try {
                  setLoading(true);
                  setGeneralError('');
                  setOtpError('');
                  // Telefon numarasını temizle (formatlamayı kaldır)
                  const cleanPhone = cleanPhoneNumber(phone);
                  await resendPhoneOTP(cleanPhone);
                  Alert.alert('Başarılı', 'Yeni doğrulama kodu telefon numaranıza gönderildi.');
                } catch (error: any) {
                  setGeneralError(error.message || 'Kod gönderilemedi');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <Text style={styles.resendEmailText}>Kodu Tekrar Gönder</Text>
            </TouchableOpacity>
          )}

          {!isSignUp && (
            <>
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={async () => {
                  if (!email || !email.trim()) {
                    setEmailError('Şifre sıfırlama için e-posta adresi gereklidir');
                    return;
                  }
                  
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(email.trim())) {
                    setEmailError('Geçerli bir e-posta adresi girin');
                    return;
                  }
                  try {
                    setLoading(true);
                    setGeneralError('');
                    await resetPassword(email);
                    Alert.alert('Başarılı', 'Şifre sıfırlama linki e-posta adresinize gönderildi');
                  } catch (error: any) {
                    setGeneralError(error.message || 'Şifre sıfırlama isteği gönderilemedi');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendEmailButton}
                onPress={async () => {
                  if (!email || !email.trim()) {
                    setEmailError('Doğrulama e-postası göndermek için e-posta adresi gereklidir');
                    return;
                  }
                  
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(email.trim())) {
                    setEmailError('Geçerli bir e-posta adresi girin');
                    return;
                  }
                  try {
                    setLoading(true);
                    setGeneralError('');
                    await resendConfirmationEmail(email);
                    Alert.alert('Başarılı', 'Doğrulama e-postası tekrar gönderildi. Lütfen e-postanızı kontrol edin.');
                  } catch (error: any) {
                    if (error.message.includes('already confirmed')) {
                      setGeneralError('Bu e-posta adresi zaten doğrulanmış.');
                    } else {
                      setGeneralError(error.message || 'Doğrulama e-postası gönderilemedi');
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.resendEmailText}>Doğrulama E-postasını Tekrar Gönder</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUp(!isSignUp)}
            accessibilityLabel={isSignUp ? 'Giriş yap sayfasına geç' : 'Kayıt ol sayfasına geç'}
            accessibilityRole="button"
          >
            <Text style={styles.switchText}>
              {isSignUp
                ? 'Zaten hesabın var mı? Giriş Yap'
                : 'Hesabın yok mu? Kayıt Ol'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Email Doğrulanmamış Bilgilendirme Modal */}
      <Modal
        visible={emailNotConfirmed}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEmailNotConfirmed(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Mail color={colors.warning[500]} size={32} />
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setEmailNotConfirmed(false)}
              >
                <X color={typographyColors.secondary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>E-posta Doğrulanmamış</Text>
            <Text style={styles.modalMessage}>
              <Text style={styles.emailText}>{unconfirmedEmail}</Text> adresine gönderilen doğrulama linkine tıklayarak hesabınızı aktifleştirmeniz gerekiyor.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={async () => {
                  try {
                    setLoading(true);
                    await resendConfirmationEmail(unconfirmedEmail);
                    Alert.alert('Başarılı', 'Yeni doğrulama e-postası gönderildi. Lütfen e-postanızı kontrol edin.');
                    setEmailNotConfirmed(false);
                  } catch (err: any) {
                    Alert.alert('Hata', err.message || 'E-posta gönderilemedi');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>Yeni Doğrulama E-postası Gönder</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryModalButton]}
                onPress={() => {
                  setShowEmailChangeModal(true);
                  setEmailNotConfirmed(false);
                }}
              >
                <Text style={[styles.modalButtonText, styles.secondaryModalButtonText]}>E-posta Adresini Değiştir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.tertiaryButton]}
                onPress={() => setEmailNotConfirmed(false)}
              >
                <Text style={[styles.modalButtonText, styles.tertiaryButtonText]}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Değiştirme Modal */}
      <Modal
        visible={showEmailChangeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmailChangeModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>E-posta Adresini Değiştir</Text>
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

            <Text style={styles.modalMessage}>
              Yeni e-posta adresinizi girin. Bu adrese doğrulama e-postası gönderilecektir.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                changingEmail && !newEmail && styles.inputError,
              ]}
              placeholder="Yeni E-posta Adresi"
              placeholderTextColor={colors.neutral[400]}
              value={newEmail}
              onChangeText={(text) => {
                setNewEmail(text);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
            />
            {changingEmail && !newEmail && (
              <Text style={styles.errorText}>Yeni e-posta adresi gereklidir</Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton, (changingEmail || !newEmail) && styles.buttonDisabled]}
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
                            setEmail(newEmail);
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
                style={[styles.modalButton, styles.tertiaryButton]}
                onPress={() => {
                  setShowEmailChangeModal(false);
                  setNewEmail('');
                }}
              >
                <Text style={[styles.modalButtonText, styles.tertiaryButtonText]}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary[500],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: typographyColors.primary,
  },
  authMethodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.secondary[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  authMethodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  authMethodTabActive: {
    backgroundColor: colors.card.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  authMethodTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: typographyColors.secondary,
  },
  authMethodTabTextActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  form: {
    gap: 16,
  },
  otpInfoText: {
    fontSize: 14,
    color: typographyColors.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: colors.card.light,
    borderWidth: 1,
    borderColor: colors.secondary[200],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: typographyColors.primary,
  },
  inputError: {
    borderColor: colors.status.error,
    borderWidth: 2,
  },
  errorText: {
    color: colors.status.error,
    fontSize: 13,
    marginTop: -12,
    marginBottom: 4,
    marginLeft: 4,
  },
  generalErrorContainer: {
    backgroundColor: `${colors.status.error}15`,
    borderWidth: 1,
    borderColor: colors.status.error,
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  generalErrorText: {
    color: colors.status.error,
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.neutral[50],
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  switchText: {
    color: colors.primary[400],
    fontSize: 14,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: colors.primary[400],
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  resendEmailButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  resendEmailText: {
    color: colors.primary[600],
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: `${colors.warning[500]}20`,
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
  emailText: {
    fontWeight: '600',
    color: typographyColors.primary,
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
  primaryButton: {
    backgroundColor: colors.primary[500],
  },
  secondaryModalButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
  },
  modalButtonText: {
    color: colors.neutral[0],
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryModalButtonText: {
    color: colors.primary[500],
  },
  tertiaryButtonText: {
    color: typographyColors.secondary,
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
});
