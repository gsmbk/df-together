import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AgendaProvider } from './src/contexts/AgendaContext';
import { AuthProvider } from './src/contexts/AuthContext';
import type { RootStackParamList, TabParamList } from './src/navigation';
import { AgendaScreen } from './src/screens/AgendaScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { BrowseScreen } from './src/screens/BrowseScreen';
import { FriendAgendaScreen } from './src/screens/FriendAgendaScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SessionDetailScreen } from './src/screens/SessionDetailScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const tabIcons: Record<
  keyof TabParamList,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Browse: { active: 'search', inactive: 'search-outline' },
  Agenda: { active: 'calendar', inactive: 'calendar-outline' },
  Friends: { active: 'people', inactive: 'people-outline' },
  Profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.blueBright,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          height: 82,
          paddingTop: 7,
          paddingBottom: 22,
          borderTopColor: colors.line,
          backgroundColor: colors.white,
        },
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons
            color={color}
            name={focused ? tabIcons[route.name].active : tabIcons[route.name].inactive}
            size={size}
          />
        ),
      })}
    >
      <Tabs.Screen component={BrowseScreen} name="Browse" />
      <Tabs.Screen component={AgendaScreen} name="Agenda" />
      <Tabs.Screen component={FriendsScreen} name="Friends" />
      <Tabs.Screen component={ProfileScreen} name="Profile" />
    </Tabs.Navigator>
  );
}

const lightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.blueBright,
    background: colors.canvas,
    card: colors.white,
    text: colors.ink,
    border: colors.line,
    notification: colors.purple,
  },
};

const darkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#6FB9FF',
    background: colors.canvas,
    card: colors.white,
    text: colors.ink,
    border: colors.line,
    notification: colors.purple,
  },
};

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AgendaProvider>
          <NavigationContainer theme={colorScheme === 'dark' ? darkTheme : lightTheme}>
            <StatusBar style="dark" />
            <Stack.Navigator
              screenOptions={{
                contentStyle: { backgroundColor: colors.canvas },
                headerBackButtonDisplayMode: 'minimal',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.canvas },
                headerTintColor: colors.blue,
                headerTitleStyle: { color: colors.ink, fontWeight: '800' },
              }}
            >
              <Stack.Screen component={MainTabs} name="Main" options={{ headerShown: false }} />
              <Stack.Screen
                component={SessionDetailScreen}
                name="SessionDetail"
                options={{ title: 'Session details' }}
              />
              <Stack.Screen
                component={FriendAgendaScreen}
                name="FriendAgenda"
                options={({ route }) => ({ title: `${route.params.friendName}’s agenda` })}
              />
              <Stack.Screen
                component={AuthScreen}
                name="Auth"
                options={{ presentation: 'modal', title: 'Sign in' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </AgendaProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
