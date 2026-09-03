import {
  DynamicColorIOS,
  Platform,
  PlatformColor,
  StyleSheet,
  type ColorValue,
  type TextStyle,
} from 'react-native';

const ios = Platform.OS === 'ios';

/** A UIKit semantic color on iOS, with a light-appearance fallback elsewhere. */
function system(name: string, fallback: string): ColorValue {
  return ios ? PlatformColor(name) : fallback;
}

/** A brand color that adapts to light and dark appearance on iOS. */
function adaptive(light: string, dark: string): ColorValue {
  return ios ? DynamicColorIOS({ light, dark }) : light;
}

/**
 * Semantic palette. Names follow Apple's UIKit semantic colors so components
 * automatically pick up Dark Mode, Increase Contrast, and other accessibility
 * settings on iOS. Brand blue is used only as the tint.
 */
export const colors = {
  // Brand tint (sky blue in light, brighter in dark for contrast).
  tint: adaptive('#0176D3', '#5AB0FF'),
  tintSoft: adaptive('#E6F2FC', '#0F2740'),
  onTint: '#FFFFFF',

  // Text
  label: system('label', '#000000'),
  secondaryLabel: system('secondaryLabel', 'rgba(60,60,67,0.6)'),
  tertiaryLabel: system('tertiaryLabel', 'rgba(60,60,67,0.3)'),
  placeholder: system('placeholderText', 'rgba(60,60,67,0.3)'),

  // Backgrounds (grouped style, like Settings)
  groupedBackground: system('systemGroupedBackground', '#F2F2F7'),
  card: system('secondarySystemGroupedBackground', '#FFFFFF'),
  tertiaryCard: system('tertiarySystemGroupedBackground', '#F2F2F7'),
  background: system('systemBackground', '#FFFFFF'),

  // Lines and fills
  separator: system('separator', 'rgba(60,60,67,0.29)'),
  fill: system('systemFill', 'rgba(120,120,128,0.2)'),
  secondaryFill: system('secondarySystemFill', 'rgba(120,120,128,0.16)'),
  tertiaryFill: system('tertiarySystemFill', 'rgba(118,118,128,0.12)'),
  quaternaryFill: system('quaternarySystemFill', 'rgba(116,116,128,0.08)'),

  // Semantic accents
  green: system('systemGreen', '#34C759'),
  greenSoft: adaptive('#E7F8EC', '#0F2A18'),
  orange: system('systemOrange', '#FF9500'),
  orangeSoft: adaptive('#FFF3E0', '#2E1F0A'),
  red: system('systemRed', '#FF3B30'),
  redSoft: adaptive('#FDECEB', '#2F1211'),
  purple: system('systemPurple', '#AF52DE'),
  purpleSoft: adaptive('#F4ECFB', '#24132F'),
  indigo: system('systemIndigo', '#5856D6'),

  // Constants that must stay literal (gradients, shadows, brand mark)
  white: '#FFFFFF',
  brandBlue: '#0176D3',
  brandBlueVivid: '#1B96FF',
  brandNavy: '#032D60',
  brandGreen: '#45C65A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 32,
};

/** iOS-style corner radii: 10 for controls, 12 for grouped cards, 16 for sheets. */
export const radii = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 999,
};

export const hairline = StyleSheet.hairlineWidth;

type Weight = NonNullable<TextStyle['fontWeight']>;

function style(fontSize: number, lineHeight: number, fontWeight: Weight, letterSpacing = 0): TextStyle {
  return { fontSize, lineHeight, fontWeight, letterSpacing };
}

/**
 * Apple's Dynamic Type ramp at the default (Large) content size. Line heights
 * scale with the user's text size because React Native scales both.
 */
export const type = {
  largeTitle: style(34, 41, '700', 0.37),
  title1: style(28, 34, '700', 0.36),
  title2: style(22, 28, '700', 0.35),
  title3: style(20, 25, '600', 0.38),
  headline: style(17, 22, '600', -0.41),
  body: style(17, 22, '400', -0.41),
  callout: style(16, 21, '400', -0.32),
  subheadline: style(15, 20, '400', -0.24),
  footnote: style(13, 18, '400', -0.08),
  caption1: style(12, 16, '400', 0),
  caption2: style(11, 13, '400', 0.07),
} satisfies Record<string, TextStyle>;

export const text = StyleSheet.create({
  largeTitle: { ...type.largeTitle, color: colors.label },
  title1: { ...type.title1, color: colors.label },
  title2: { ...type.title2, color: colors.label },
  title3: { ...type.title3, color: colors.label },
  headline: { ...type.headline, color: colors.label },
  body: { ...type.body, color: colors.label },
  bodySecondary: { ...type.body, color: colors.secondaryLabel },
  callout: { ...type.callout, color: colors.label },
  calloutSecondary: { ...type.callout, color: colors.secondaryLabel },
  subheadline: { ...type.subheadline, color: colors.label },
  subheadlineSecondary: { ...type.subheadline, color: colors.secondaryLabel },
  footnote: { ...type.footnote, color: colors.label },
  footnoteSecondary: { ...type.footnote, color: colors.secondaryLabel },
  caption1: { ...type.caption1, color: colors.label },
  caption1Secondary: { ...type.caption1, color: colors.secondaryLabel },
  caption2Secondary: { ...type.caption2, color: colors.secondaryLabel },
  /** Grouped-list section header: uppercase footnote in secondary color. */
  sectionHeader: {
    ...type.footnote,
    color: colors.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
