import type Ionicons from '@expo/vector-icons/Ionicons';
import type { SFSymbol } from 'expo-symbols';
import type { ComponentProps } from 'react';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type IconSpec = { sf: SFSymbol; ionicon: IoniconName };

/**
 * Semantic icon names mapped to SF Symbols on iOS with Ionicons fallbacks for
 * Android and web. Keep this the single place symbol names are chosen.
 */
export const icons = {
  add: { sf: 'plus.circle.fill', ionicon: 'add-circle' },
  added: { sf: 'checkmark.circle.fill', ionicon: 'checkmark-circle' },
  checkmark: { sf: 'checkmark', ionicon: 'checkmark' },
  close: { sf: 'xmark', ionicon: 'close' },
  closeCircle: { sf: 'xmark.circle.fill', ionicon: 'close-circle' },
  chevron: { sf: 'chevron.right', ionicon: 'chevron-forward' },
  chevronDown: { sf: 'chevron.down', ionicon: 'chevron-down' },
  chevronUp: { sf: 'chevron.up', ionicon: 'chevron-up' },
  search: { sf: 'magnifyingglass', ionicon: 'search' },
  filter: { sf: 'line.3.horizontal.decrease.circle', ionicon: 'options-outline' },
  filterActive: { sf: 'line.3.horizontal.decrease.circle.fill', ionicon: 'options' },
  calendar: { sf: 'calendar', ionicon: 'calendar-outline' },
  calendarAdd: { sf: 'calendar.badge.plus', ionicon: 'calendar' },
  clock: { sf: 'clock', ionicon: 'time-outline' },
  location: { sf: 'mappin.and.ellipse', ionicon: 'location-outline' },
  walk: { sf: 'figure.walk', ionicon: 'walk-outline' },
  people: { sf: 'person.2', ionicon: 'people-outline' },
  peopleFill: { sf: 'person.2.fill', ionicon: 'people' },
  person: { sf: 'person.crop.circle', ionicon: 'person-circle-outline' },
  personAdd: { sf: 'person.badge.plus', ionicon: 'person-add-outline' },
  mail: { sf: 'envelope', ionicon: 'mail-outline' },
  share: { sf: 'square.and.arrow.up', ionicon: 'share-outline' },
  link: { sf: 'link', ionicon: 'link-outline' },
  openExternal: { sf: 'arrow.up.right.square', ionicon: 'open-outline' },
  lock: { sf: 'lock', ionicon: 'lock-closed-outline' },
  lockFill: { sf: 'lock.fill', ionicon: 'lock-closed' },
  eye: { sf: 'eye', ionicon: 'eye-outline' },
  bell: { sf: 'bell', ionicon: 'notifications-outline' },
  bellFill: { sf: 'bell.fill', ionicon: 'notifications' },
  warning: { sf: 'exclamationmark.triangle.fill', ionicon: 'warning' },
  info: { sf: 'info.circle', ionicon: 'information-circle-outline' },
  infoFill: { sf: 'info.circle.fill', ionicon: 'information-circle' },
  sparkles: { sf: 'sparkles', ionicon: 'sparkles' },
  star: { sf: 'star', ionicon: 'star-outline' },
  starFill: { sf: 'star.fill', ionicon: 'star' },
  note: { sf: 'note.text', ionicon: 'document-text-outline' },
  cloudUpload: { sf: 'icloud.and.arrow.up', ionicon: 'cloud-upload-outline' },
  cloudOffline: { sf: 'icloud.slash', ionicon: 'cloud-offline-outline' },
  refresh: { sf: 'arrow.clockwise', ionicon: 'refresh-outline' },
  trash: { sf: 'trash', ionicon: 'trash-outline' },
  laptop: { sf: 'laptopcomputer', ionicon: 'laptop-outline' },
  mic: { sf: 'mic', ionicon: 'mic-outline' },
  swap: { sf: 'arrow.triangle.2.circlepath', ionicon: 'swap-horizontal-outline' },
  now: { sf: 'dot.radiowaves.left.and.right', ionicon: 'radio-outline' },
  handshake: { sf: 'hands.clap', ionicon: 'hand-left-outline' },
  coffee: { sf: 'cup.and.saucer', ionicon: 'cafe-outline' },
  building: { sf: 'building.2', ionicon: 'business-outline' },
  ticket: { sf: 'ticket', ionicon: 'ticket-outline' },
  apple: { sf: 'apple.logo', ionicon: 'logo-apple' },
  signOut: { sf: 'rectangle.portrait.and.arrow.right', ionicon: 'log-out-outline' },
  personRemove: { sf: 'person.badge.minus', ionicon: 'person-remove-outline' },
  gear: { sf: 'gearshape', ionicon: 'settings-outline' },
  heart: { sf: 'heart', ionicon: 'heart-outline' },
  tag: { sf: 'tag', ionicon: 'pricetag-outline' },
  list: { sf: 'list.bullet', ionicon: 'list-outline' },
  learn: { sf: 'graduationcap', ionicon: 'school-outline' },
} satisfies Record<string, IconSpec>;

export type IconName = keyof typeof icons;
