import { useEffect } from 'react';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth' || pathname?.startsWith('/auth');
    const currentPath = pathname || segments.join('/');
    
    // Callback sayfasını kontrol et (auth callback sayfasında kalmaya izin ver)
    const isCallbackPage = currentPath?.includes('/auth/callback') || pathname?.includes('/auth/callback');

    if (!session) {
      // Kullanıcı giriş yapmamış ve auth sayfasında değilse, login sayfasına yönlendir
      // Ancak callback sayfasındaysa yönlendirme yapma
      if (!inAuthGroup && currentPath !== '/auth/login' && !isCallbackPage) {
        router.replace('/auth/login');
      }
    } else {
      // Kullanıcı giriş yapmış ve auth sayfasındaysa, ana sayfaya yönlendir
      // Ancak callback sayfasındaysa yönlendirme yapma (callback kendi işlemini yapar)
      if (inAuthGroup && !isCallbackPage) {
        router.replace('/(tabs)');
      }
    }
  }, [session, isLoading, pathname, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
