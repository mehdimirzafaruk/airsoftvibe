import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, MessageCircle, ShoppingBag, Calendar, User, Shield } from 'lucide-react-native';
import { useAuth } from '../../lib/auth-context';
import { colors, typographyColors } from '../../lib/colors';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { user } = useAuth();
  const isAdmin = user?.profile?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Platform.select({
            ios: 'rgba(248, 247, 245, 0.8)',
            web: 'rgba(248, 247, 245, 0.8)',
            default: colors.background.light,
          }),
          borderTopColor: 'rgba(0, 0, 0, 0.1)',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12,
          paddingTop: 8,
          ...(Platform.OS === 'web' && {
            backdropFilter: 'blur(12px)',
          }),
        },
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: typographyColors.secondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
          fontFamily: Platform.select({
            web: '"Space Grotesk", sans-serif',
            default: 'System',
          }),
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Akış',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? { backgroundColor: `${colors.primary[500]}33`, borderRadius: 9999, paddingHorizontal: 24, paddingVertical: 4 } : {}}>
              <Home color={color} size={24} strokeWidth={focused ? 2.5 : 2} fill={focused ? color : 'transparent'} />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: 'bold',
            marginTop: 4,
          },
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Mağaza',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? { backgroundColor: `${colors.primary[500]}33`, borderRadius: 9999, paddingHorizontal: 24, paddingVertical: 4 } : {}}>
              <ShoppingBag color={color} size={24} strokeWidth={focused ? 2.5 : 2} fill={focused ? color : 'transparent'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Etkinlikler',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? { backgroundColor: `${colors.primary[500]}33`, borderRadius: 9999, paddingHorizontal: 24, paddingVertical: 4 } : {}}>
              <Calendar color={color} size={24} strokeWidth={focused ? 2.5 : 2} fill={focused ? color : 'transparent'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? { backgroundColor: `${colors.primary[500]}33`, borderRadius: 9999, paddingHorizontal: 24, paddingVertical: 4 } : {}}>
              <User color={color} size={24} strokeWidth={focused ? 2.5 : 2} fill={focused ? color : 'transparent'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdmin ? '/admin' : null,
          tabBarIcon: ({ color, size }) => (
            <Shield color={color} size={24} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
