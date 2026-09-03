import { useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { GroupedSection, Row } from '../components/GroupedList';
import { HeaderButton } from '../components/HeaderButton';
import { PrimaryButton } from '../components/PrimaryButton';
import {
  countActiveFilters,
  filterLabels,
  filterOptions,
  filterOrder,
  sessionMatches,
  sortedSessions,
} from '../data/catalog';
import type { RootScreenProps } from '../navigation';
import { resetFilters, toggleFilterValue, useFilters } from '../state/browse';
import { spacing } from '../theme';
import type { FilterKey } from '../types';

/** Always-expanded groups; the rest collapse behind a summary row. */
const alwaysOpen: FilterKey[] = ['days', 'formats', 'levels'];

export function FiltersScreen({ navigation }: RootScreenProps<'Filters'>) {
  const filters = useFilters();
  const [expanded, setExpanded] = useState<FilterKey[]>([]);
  const active = countActiveFilters(filters);

  const matchCount = useMemo(
    () => sortedSessions.reduce((total, session) => total + (sessionMatches(session, '', filters) ? 1 : 0), 0),
    [filters],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <HeaderButton disabled={!active} label="Reset" onPress={resetFilters} />,
      headerRight: () => <HeaderButton bold label="Done" onPress={() => navigation.goBack()} />,
    });
  }, [active, navigation]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        {filterOrder.map((key) => {
          const options = filterOptions[key];
          if (options.length < 2 && !filters[key].length) return null;
          const selected = filters[key];
          const isOpen = alwaysOpen.includes(key) || expanded.includes(key);
          return (
            <GroupedSection header={filterLabels[key]} key={key}>
              {isOpen ? (
                options.map((value) => (
                  <Row
                    accessory="checkmark"
                    checked={selected.includes(value)}
                    key={value}
                    onPress={() => toggleFilterValue(key, value)}
                    title={value}
                  />
                ))
              ) : (
                <Row
                  accessory="chevron"
                  detail={selected.length ? `${selected.length} selected` : 'Any'}
                  onPress={() => setExpanded((current) => [...current, key])}
                  title={`${options.length} options`}
                />
              )}
            </GroupedSection>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          onPress={() => navigation.goBack()}
          title={`Show ${matchCount.toLocaleString()} ${matchCount === 1 ? 'session' : 'sessions'}`}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 120, gap: spacing.xl },
  footer: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
