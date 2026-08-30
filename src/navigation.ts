import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Browse: undefined;
  Agenda: undefined;
  Friends: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  SessionDetail: { sessionId: string };
  FriendAgenda: { friendId: string; friendName: string };
  Auth: undefined;
};
