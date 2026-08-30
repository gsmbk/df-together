import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function BrandMark({ inverted = false, size = 48 }: { inverted?: boolean; size?: number }) {
  return (
    <LinearGradient
      colors={inverted ? [colors.white, colors.cloud] : [colors.blueVivid, colors.blueBright]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          boxShadow: `0 ${Math.max(4, size * 0.1)}px ${Math.max(10, size * 0.24)}px rgba(3, 45, 96, 0.16)`,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: inverted ? colors.navy : colors.white, fontSize: size * 0.34 },
        ]}
      >
        DF
      </Text>
      <View
        style={[
          styles.dot,
          {
            width: size * 0.16,
            height: size * 0.16,
            borderRadius: size,
            borderWidth: Math.max(2, size * 0.04),
          },
        ]}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  text: { fontWeight: '900', letterSpacing: -0.6 },
  dot: {
    position: 'absolute',
    top: '12%',
    right: '10%',
    backgroundColor: colors.greenBright,
    borderColor: colors.white,
  },
});
