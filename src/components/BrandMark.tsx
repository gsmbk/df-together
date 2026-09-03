import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

/** The original DF Together mark: a blue superellipse with a green orbit dot. */
export function BrandMark({ size = 64 }: { size?: number }) {
  return (
    <LinearGradient
      colors={[colors.brandBlueVivid, colors.brandBlue]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={[styles.mark, { width: size, height: size, borderRadius: size * 0.225 }]}
    >
      <Text style={[styles.text, { fontSize: size * 0.36 }]}>DF</Text>
      <View
        style={[
          styles.dot,
          {
            width: size * 0.18,
            height: size * 0.18,
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
  text: { color: colors.white, fontWeight: '800', letterSpacing: -0.5 },
  dot: {
    position: 'absolute',
    top: '13%',
    right: '11%',
    backgroundColor: colors.brandGreen,
    borderColor: colors.white,
  },
});
