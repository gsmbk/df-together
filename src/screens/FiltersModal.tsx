import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../components/Chip';
import { PrimaryButton } from '../components/PrimaryButton';
import {
  emptyFilters,
  filterLabels,
  filterOptions,
  filterOrder,
} from '../data/catalog';
import { colors, spacing } from '../theme';
import type { CatalogFilters, FilterKey } from '../types';

type Props = {
  visible: boolean;
  filters: CatalogFilters;
  onApply: (filters: CatalogFilters) => void;
  onClose: () => void;
};

export function FiltersModal({ visible, filters, onApply, onClose }: Props) {
  const [draft, setDraft] = useState(filters);
  const [expanded, setExpanded] = useState<FilterKey[]>([
    'formats',
    'products',
    'roles',
  ]);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [filters, visible]);

  const toggle = (key: FilterKey, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  };

  const selectedCount = Object.values(draft).reduce(
    (total, values) => total + values.length,
    0,
  );

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Filter sessions</Text>
            <Text style={styles.subtitle}>{selectedCount} selected</Text>
          </View>
          <Pressable accessibilityLabel="Close filters" hitSlop={8} onPress={onClose}>
            <Ionicons color={colors.ink} name="close" size={28} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {filterOrder.map((key) => {
            const isExpanded = expanded.includes(key);
            return (
              <View key={key} style={styles.section}>
                <Pressable
                  onPress={() =>
                    setExpanded((current) =>
                      current.includes(key)
                        ? current.filter((item) => item !== key)
                        : [...current, key],
                    )
                  }
                  style={styles.sectionHeader}
                >
                  <Text style={styles.sectionTitle}>{filterLabels[key]}</Text>
                  <View style={styles.sectionMeta}>
                    {draft[key].length ? (
                      <Text style={styles.count}>{draft[key].length}</Text>
                    ) : null}
                    <Ionicons
                      color={colors.inkMuted}
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                    />
                  </View>
                </Pressable>
                {isExpanded ? (
                  <View style={styles.options}>
                    {filterOptions[key].map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        onPress={() => toggle(key, value)}
                        selected={draft[key].includes(value)}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            compact
            onPress={() => setDraft(emptyFilters())}
            title="Clear"
            variant="secondary"
            style={styles.footerButton}
          />
          <PrimaryButton
            compact
            onPress={() => {
              onApply(draft);
              onClose();
            }}
            title="Show sessions"
            style={styles.footerButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.white,
  },
  title: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  subtitle: { color: colors.inkMuted, fontSize: 13, marginTop: 2 },
  content: { padding: spacing.xl, paddingBottom: 100 },
  section: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  sectionMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  count: { color: colors.blue, fontSize: 13, fontWeight: '800' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.md },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
  footerButton: { flex: 1 },
});
