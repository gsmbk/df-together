import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type LinkingOptions,
  type Theme,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { LogBox, Platform, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RemindersSync } from './src/components/RemindersSync';
import { AgendaProvider } from './src/contexts/AgendaContext';
import { AuthProvider } from './src/contexts/AuthContext';
import type {
  AgendaStackParamList,
  BrowseStackParamList,
  FriendsStackParamList,
  ProfileStackParamList,
  RootStackParamList,
  TabParamList,
} from './src/navigation';
import { AgendaScreen } from './src/screens/AgendaScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { BrowseScreen } from './src/screens/BrowseScreen';
import { ConflictResolverScreen } from './src/screens/ConflictResolverScreen';
import { FiltersScreen } from './src/screens/FiltersScreen';
import { FriendAgendaScreen } from './src/screens/FriendAgendaScreen';
import { FriendsScreen } from './src/screens/FriendsScreen';
import { InterestsScreen } from './src/screens/InterestsScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SalesforceSyncScreen } from './src/screens/SalesforceSyncScreen';
import { SessionDetailScreen } from './src/screens/SessionDetailScreen';
import { preferencesStore } from './src/state/preferences';
import { colors } from './src/theme';

// expo-notifications probes push-registration keychain state on import; the
// simulator has no keychain entry and logs a warning we do not act on (local
// reminders only).
LogBox.ignoreLogs(['[expo-notifications] Error reading persisted server registration info']);

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createNativeBottomTabNavigator<TabParamList>();
const BrowseStack = createNativeStackNavigator<BrowseStackParamList>();
const AgendaStack = createNativeStackNavigator<AgendaStackParamList>();
const FriendsStack = createNativeStackNavigator<FriendsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

/** Shared native-stack appearance: system navigation bar, grouped background. */
const stackScreenOptions: NativeStackNavigationOptions = {
  contentStyle: { backgroundColor: colors.groupedBackground },
  headerBackButtonDisplayMode: 'minimal',
  headerLargeTitleShadowVisible: false,
};

const largeTitleOptions: NativeStackNavigationOptions = {
  ...stackScreenOptions,
  headerLargeTitle: true,
};

function BrowseTab() {
  return (
    <BrowseStack.Navigator screenOptions={largeTitleOptions}>
      <BrowseStack.Screen component={BrowseScreen} name="BrowseHome" options={{ title: 'Browse' }} />
    </BrowseStack.Navigator>
  );
}

function AgendaTab() {
  return (
    <AgendaStack.Navigator screenOptions={largeTitleOptions}>
      <AgendaStack.Screen component={AgendaScreen} name="AgendaHome" options={{ title: 'Agenda' }} />
    </AgendaStack.Navigator>
  );
}

function FriendsTab() {
  return (
    <FriendsStack.Navigator screenOptions={largeTitleOptions}>
      <FriendsStack.Screen component={FriendsScreen} name="FriendsHome" options={{ title: 'Friends' }} />
    </FriendsStack.Navigator>
  );
}

function ProfileTab() {
  return (
    <ProfileStack.Navigator screenOptions={largeTitleOptions}>
      <ProfileStack.Screen component={ProfileScreen} name="ProfileHome" options={{ title: 'Profile' }} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      hapticFeedbackEnabled
      minimizeBehavior="onScrollDown"
      tabBarActiveTintColor={colors.tint}
      translucent
    >
      <Tabs.Screen
        component={BrowseTab}
        name="Browse"
        options={{ tabBarIcon: () => ({ sfSymbol: 'magnifyingglass' }), title: 'Browse' }}
      />
      <Tabs.Screen
        component={AgendaTab}
        name="Agenda"
        options={{ tabBarIcon: () => ({ sfSymbol: 'calendar' }), title: 'Agenda' }}
      />
      <Tabs.Screen
        component={FriendsTab}
        name="Friends"
        options={{ tabBarIcon: () => ({ sfSymbol: 'person.2' }), title: 'Friends' }}
      />
      <Tabs.Screen
        component={ProfileTab}
        name="Profile"
        options={{ tabBarIcon: () => ({ sfSymbol: 'person.crop.circle' }), title: 'Profile' }}
      />
    </Tabs.Navigator>
  );
}

const lightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0176D3',
    background: '#F2F2F7',
    card: '#F2F2F7',
  },
};

const darkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#5AB0FF',
    background: '#000000',
    card: '#000000',
  },
};

/** Public links: df-together.com/s/<id> and dftogether://s/<id> open a session. */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'https://df-together.com', 'https://www.df-together.com'],
  config: {
    screens: {
      SessionDetail: { path: 's/:sessionId' },
    },
  },
  // Auth callbacks and invites are handled by AuthContext, not by navigation.
  filter: (url) => !/auth\/(callback|confirm)|invite/i.test(url),
};

export default function App() {
  const colorScheme = useColorScheme();
  const [prefsReady, setPrefsReady] = useState(false);

  useEffect(() => {
    preferencesStore.ready.then(() => setPrefsReady(true));
  }, []);

  if (!prefsReady) return null;

  const showOnboarding = !preferencesStore.get().onboardingComplete;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AgendaProvider>
            <RemindersSync />
            <NavigationContainer linking={linking} theme={colorScheme === 'dark' ? darkTheme : lightTheme}>
              <StatusBar style="auto" />
              <RootStack.Navigator
                initialRouteName={showOnboarding ? 'Onboarding' : 'Main'}
                screenOptions={stackScreenOptions}
              >
                <RootStack.Screen component={MainTabs} name="Main" options={{ headerShown: false }} />
                <RootStack.Screen
                  component={SessionDetailScreen}
                  name="SessionDetail"
                  options={{ title: '', headerBackButtonDisplayMode: 'minimal' }}
                />
                <RootStack.Screen
                  component={FriendAgendaScreen}
                  name="FriendAgenda"
                  options={({ route }) => ({ title: route.params.friendName })}
                />
                <RootStack.Screen
                  component={FiltersScreen}
                  name="Filters"
                  options={{
                    title: 'Filters',
                    presentation: 'formSheet',
                    sheetAllowedDetents: [0.65, 1],
                    sheetGrabberVisible: true,
                    headerShown: true,
                  }}
                />
                <RootStack.Screen
                  component={ConflictResolverScreen}
                  name="ConflictResolver"
                  options={{
                    title: 'Resolve overlap',
                    presentation: 'formSheet',
                    sheetAllowedDetents: [0.7, 1],
                    sheetGrabberVisible: true,
                  }}
                />
                <RootStack.Screen
                  component={InterestsScreen}
                  name="Interests"
                  options={{ title: 'Interests' }}
                />
                <RootStack.Screen
                  component={SalesforceSyncScreen}
                  name="SalesforceSync"
                  options={{ title: 'Official agenda' }}
                />
                <RootStack.Screen
                  component={AuthScreen}
                  name="Auth"
                  options={{ presentation: 'modal', title: 'Sign In' }}
                />
                <RootStack.Screen
                  component={OnboardingScreen}
                  name="Onboarding"
                  options={{
                    headerShown: false,
                    presentation: Platform.OS === 'ios' ? 'fullScreenModal' : 'card',
                    gestureEnabled: false,
                  }}
                />
              </RootStack.Navigator>
            </NavigationContainer>
          </AgendaProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
