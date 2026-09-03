import { createStore } from './store';
import type { Interests } from '../types';

export type Preferences = {
  onboardingComplete: boolean;
  interests: Interests;
  remindersEnabled: boolean;
  /** Minutes before a session to remind. */
  reminderLeadMinutes: 10 | 15 | 30;
  /** Whether Browse is showing the interests-based "For you" subset. */
  forYouEnabled: boolean;
};

export const defaultPreferences: Preferences = {
  onboardingComplete: false,
  interests: { products: [], roles: [] },
  remindersEnabled: false,
  reminderLeadMinutes: 15,
  forYouEnabled: false,
};

export const preferencesStore = createStore<Preferences>(defaultPreferences, {
  key: 'df-together.preferences.v1',
});

export const usePreferences = preferencesStore.use;

export function updatePreferences(patch: Partial<Preferences>) {
  preferencesStore.set((current) => ({ ...current, ...patch }));
}

export function hasInterests(interests: Interests) {
  return interests.products.length + interests.roles.length > 0;
}
