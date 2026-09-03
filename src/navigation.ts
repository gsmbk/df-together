import type { NativeBottomTabScreenProps } from '@bottom-tabs/react-navigation';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type BrowseStackParamList = { BrowseHome: undefined };
export type AgendaStackParamList = { AgendaHome: undefined };
export type FriendsStackParamList = { FriendsHome: undefined };
export type ProfileStackParamList = { ProfileHome: undefined };

export type TabParamList = {
  Browse: NavigatorScreenParams<BrowseStackParamList>;
  Agenda: NavigatorScreenParams<AgendaStackParamList>;
  Friends: NavigatorScreenParams<FriendsStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  SessionDetail: { sessionId: string; sessionTimeId?: string };
  FriendAgenda: { friendId: string; friendName: string };
  ConflictResolver: { sessionTimeId: string };
  Filters: undefined;
  Interests: undefined;
  Auth: undefined;
  Onboarding: undefined;
};

export type RootScreenProps<Route extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Route
>;

type TabScreenProps<Tab extends keyof TabParamList> = CompositeScreenProps<
  NativeBottomTabScreenProps<TabParamList, Tab>,
  NativeStackScreenProps<RootStackParamList>
>;

export type BrowseScreenProps = CompositeScreenProps<
  NativeStackScreenProps<BrowseStackParamList, 'BrowseHome'>,
  TabScreenProps<'Browse'>
>;

export type AgendaScreenProps = CompositeScreenProps<
  NativeStackScreenProps<AgendaStackParamList, 'AgendaHome'>,
  TabScreenProps<'Agenda'>
>;

export type FriendsScreenProps = CompositeScreenProps<
  NativeStackScreenProps<FriendsStackParamList, 'FriendsHome'>,
  TabScreenProps<'Friends'>
>;

export type ProfileScreenProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>,
  TabScreenProps<'Profile'>
>;
