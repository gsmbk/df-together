import Ionicons from '@expo/vector-icons/Ionicons';
import { SymbolView, type SymbolWeight } from 'expo-symbols';
import { Platform, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../theme';
import type { IconSpec } from './icons';

type Props = IconSpec & {
  size?: number;
  color?: ColorValue;
  weight?: SymbolWeight;
  style?: StyleProp<ViewStyle>;
};

/** SF Symbol on iOS with an Ionicons fallback elsewhere. */
export function Icon({ sf, ionicon, size = 20, color = colors.label, weight = 'regular', style }: Props) {
  const fallback = <Ionicons color={color as string} name={ionicon} size={size} />;
  if (Platform.OS !== 'ios') return fallback;
  return (
    <SymbolView
      fallback={fallback}
      name={sf}
      resizeMode="scaleAspectFit"
      size={size}
      style={[{ width: size, height: size }, style]}
      tintColor={color}
      weight={weight}
    />
  );
}
