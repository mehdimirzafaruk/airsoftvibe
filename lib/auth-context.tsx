import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  session: Session | null;
  user: any | null;
  isLoading: boolean;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  getUnconfirmedEmail: () => string | null;
  // Telefon numarası ile giriş/kayıt
  sendPhoneOTP: (phone: string, username?: string, fullName?: string) => Promise<void>;
  verifyPhoneOTP: (phone: string, otp: string) => Promise<void>;
  resendPhoneOTP: (phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            setUser({ ...session.user, profile });
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (mounted) {
          setSession(session);
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();
            setUser({ ...session.user, profile });
          } else {
            setUser(null);
          }
        }
      })();
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    try {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Geçerli bir e-posta adresi girin');
      }

      // Password validation
      if (password.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
      }

      // Username validation
      if (username.length < 3) {
        throw new Error('Kullanıcı adı en az 3 karakter olmalıdır');
      }

      const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            username,
            full_name: fullName || username,
          },
          emailRedirectTo: typeof window !== 'undefined' 
            ? `${window.location.origin}/auth/callback`
            : `${process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:8081'}/auth/callback`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
          throw new Error('Bu e-posta adresi zaten kayıtlı');
        } else if (signUpError.message.includes('rate limit') || signUpError.message.includes('429')) {
          throw new Error('Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin');
        } else if (signUpError.message.includes('password')) {
          throw new Error('Şifre çok zayıf. Daha güçlü bir şifre kullanın');
        } else if (signUpError.message.includes('email')) {
          throw new Error('Geçerli bir e-posta adresi girin');
        }
        throw signUpError;
      }

      if (authUser) {
        // Profile oluştur (trigger zaten yapıyor olabilir, ama yine de kontrol edelim)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            username,
            full_name: fullName || username,
            data_consent: true,
          })
          .select()
          .maybeSingle();

        // Profile zaten varsa (trigger oluşturmuşsa) hata verme
        if (profileError && !profileError.message.includes('duplicate') && !profileError.message.includes('already exists')) {
          console.error('Profile creation error:', profileError);
          // Profile oluşturma hatası kritik değil, auth başarılı oldu
        }
      }
    } catch (error: any) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Geçerli bir e-posta adresi girin');
      }

      if (!password || password.length < 1) {
        throw new Error('Şifre gerekli');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('Sign in error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid') || error.status === 400) {
          // Daha detaylı hata mesajı
          if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
            throw new Error('E-posta adresinizi doğrulamanız gerekiyor. E-postanızı kontrol edin');
          }
          throw new Error('E-posta veya şifre hatalı');
        } else if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          throw new Error('E-posta adresinizi doğrulamanız gerekiyor. E-postanızı kontrol edin');
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          throw new Error('Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin');
        } else if (error.status === 400) {
          throw new Error(`Giriş hatası: ${error.message || 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.'}`);
        }
        throw error;
      }
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setUser(null);
      // Navigation will be handled by RootLayoutNav useEffect
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.EXPO_PUBLIC_SUPABASE_URL || window.location.origin}/auth/callback`,
      });

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${process.env.EXPO_PUBLIC_SUPABASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      throw error;
    }
  };

  const updateEmail = async (newEmail: string) => {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        throw new Error('Geçerli bir e-posta adresi girin');
      }

      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim().toLowerCase(),
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          throw new Error('Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor');
        }
        throw error;
      }
    } catch (error: any) {
      throw error;
    }
  };

  const getUnconfirmedEmail = () => {
    // Session'dan veya user'dan doğrulanmamış email'i al
    if (user?.email && !user?.email_confirmed_at) {
      return user.email;
    }
    return null;
  };

  const sendPhoneOTP = async (phone: string, username?: string, fullName?: string) => {
    try {
      // Telefon numarası formatını düzelt (+90 ile başlamalı)
      let formattedPhone = phone.trim().replace(/\s/g, '');
      if (!formattedPhone.startsWith('+')) {
        // Türkiye için varsayılan ülke kodu ekle
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+90' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('90')) {
          formattedPhone = '+90' + formattedPhone;
        } else {
          formattedPhone = '+' + formattedPhone;
        }
      }

      // Telefon numarası validasyonu
      const phoneRegex = /^\+[1-9]\d{10,14}$/;
      if (!phoneRegex.test(formattedPhone)) {
        throw new Error('Geçerli bir telefon numarası girin (örn: +905551234567)');
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          data: username ? {
            username,
            full_name: fullName || username,
          } : undefined,
        },
      });

      if (error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          throw new Error('Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin');
        } else if (error.message.includes('invalid') || error.message.includes('phone')) {
          throw new Error('Geçerli bir telefon numarası girin');
        }
        throw error;
      }
    } catch (error: any) {
      throw error;
    }
  };

  const verifyPhoneOTP = async (phone: string, otp: string) => {
    try {
      // Telefon numarası formatını düzelt
      let formattedPhone = phone.trim().replace(/\s/g, '');
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+90' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('90')) {
          formattedPhone = '+90' + formattedPhone;
        } else {
          formattedPhone = '+' + formattedPhone;
        }
      }

      // OTP validasyonu
      if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
        throw new Error('Geçerli bir 6 haneli kod girin');
      }

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });

      if (error) {
        if (error.message.includes('invalid') || error.message.includes('expired')) {
          throw new Error('Geçersiz veya süresi dolmuş kod. Lütfen yeni bir kod isteyin');
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          throw new Error('Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin');
        }
        throw error;
      }

      // Session oluştuktan sonra profile kontrolü ve güncellemesi
      if (data?.user) {
        // Profile'ı kontrol et
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        // Eğer profile yoksa oluştur
        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username: data.user.user_metadata?.username || `user_${data.user.id.slice(0, 8)}`,
              full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.username || `User ${data.user.id.slice(0, 8)}`,
              phone: formattedPhone,
              data_consent: true,
            })
            .select()
            .maybeSingle();

          if (profileError && !profileError.message.includes('duplicate') && !profileError.message.includes('already exists')) {
            console.error('Profile creation error:', profileError);
          }
        } else if (!existingProfile.phone) {
          // Profile varsa ama telefon numarası yoksa güncelle
          await supabase
            .from('profiles')
            .update({ phone: formattedPhone })
            .eq('id', data.user.id);
        }
      }
    } catch (error: any) {
      throw error;
    }
  };

  const resendPhoneOTP = async (phone: string) => {
    try {
      // Telefon numarası formatını düzelt
      let formattedPhone = phone.trim().replace(/\s/g, '');
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+90' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('90')) {
          formattedPhone = '+90' + formattedPhone;
        } else {
          formattedPhone = '+' + formattedPhone;
        }
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          throw new Error('Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin');
        }
        throw error;
      }
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      isLoading, 
      signUp, 
      signIn, 
      signOut, 
      resetPassword, 
      resendConfirmationEmail, 
      updateEmail, 
      getUnconfirmedEmail,
      sendPhoneOTP,
      verifyPhoneOTP,
      resendPhoneOTP,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
