import { StyleSheet, Text, View } from 'react-native';
import { filterOptions } from '../data/catalog';
import { updatePreferences, usePreferences } from '../state/preferences';
import { spacing, text } from '../theme';
import { Chip } from './Chip';

/** Chip clouds for products and roles that feed the "For you" view in Browse. */
export function InterestsPicker() {
  const { interests } = usePreferences();

  const toggle = (key: 'products' | 'roles', value: string) => {
    const current = interests[key];
    updatePreferences({
      interests: {
        ...interests,
        [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
      },
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.group}>
        <Text style={text.headline}>Products</Text>
        <View style={styles.chips}>
          {filterOptions.products.map((value) => (
            <Chip
              key={value}
              label={value}
              onPress={() => toggle('products', value)}
              selected={interests.products.includes(value)}
            />
          ))}
        </View>
      </View>
      <View style={styles.group}>
        <Text style={text.headline}>Roles</Text>
        <View style={styles.chips}>
          {filterOptions.roles.map((value) => (
            <Chip
              key={value}
              label={value}
              onPress={() => toggle('roles', value)}
              selected={interests.roles.includes(value)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xl },
  group: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
