import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../components/Chip';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAgenda } from '../contexts/AgendaContext';
import { overlappingTimes, sessionsById, timeIndex } from '../data/catalog';
import type { RootStackParamList } from '../navigation';
import { colors, radii, spacing } from '../theme';
import type { SessionTime } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionDetail'>;

export function SessionDetailScreen({ route }: Props) {
  const session = sessionsById.get(route.params.sessionId);
  const { add, remove, selections, isSelected } = useAgenda();

  if (!session) {
    return (
      <EmptyState
        body="This session is not available in the bundled catalog."
        icon="alert-circle-outline"
        title="Session not found"
      />
    );
  }

  const addOccurrence = (time: SessionTime) => {
    const perform = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      add({ sessionId: session.id, sessionTimeId: time.id }).catch((error) =>
        Alert.alert('Could not save agenda', (error as Error).message),
      );
    };
    const conflicts = selections
      .map((selection) => timeIndex.get(selection.sessionTimeId))
      .filter((item) => item && overlappingTimes(item.time, time));
    if (!conflicts.length) return perform();
    Alert.alert(
      'This time overlaps',
      `“${conflicts[0]?.session.title}” is already on your agenda.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Keep both', onPress: perform },
      ],
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.chips}>
          {session.formats.map((value) => (
            <Chip key={value} label={value} />
          ))}
          {session.levels.map((value) => (
            <Chip key={value} label={value} tone="purple" />
          ))}
          {session.community.length ? <Chip label="Community speaker" tone="green" /> : null}
          {session.viewingOptions.map((value) => (
            <Chip key={value} label={value} tone="orange" />
          ))}
        </View>

        <Text style={styles.title}>{session.title}</Text>
        <Text style={styles.abstract}>{session.abstract}</Text>

        <Text style={styles.sectionTitle}>Choose a time</Text>
        <View style={styles.timeList}>
          {session.times.map((time) => {
            const selected = isSelected(time.id);
            return (
              <View key={time.id} style={[styles.timeCard, selected && styles.timeCardSelected]}>
                <View style={styles.timeCopy}>
                  <Text style={styles.timeTitle}>
                    {time.dateLabel} · {time.startTime}–{time.endTime}
                  </Text>
                  <Text style={styles.timeMeta}>{time.location}</Text>
                  <Text style={styles.seating}>{time.seating}</Text>
                </View>
                <PrimaryButton
                  compact
                  icon={selected ? 'checkmark' : 'add'}
                  onPress={() => {
                    if (selected) {
                      remove(time.id).catch((error) =>
                        Alert.alert('Could not save agenda', (error as Error).message),
                      );
                    } else addOccurrence(time);
                  }}
                  title={selected ? 'Added' : 'Add'}
                  variant={selected ? 'secondary' : 'primary'}
                />
              </View>
            );
          })}
        </View>

        {session.requiredEquipment.length ? (
          <View style={styles.equipment}>
            <Ionicons color={colors.orange} name="laptop-outline" size={21} />
            <Text style={styles.equipmentText}>{session.requiredEquipment.join(' ')}</Text>
          </View>
        ) : null}

        <View style={styles.metaGrid}>
          {[
            ['Products', session.products],
            ['Roles', session.roles],
            ['Topics', session.topics],
            ['Industries', session.industries],
          ].map(([label, values]) => (
            <View key={label as string} style={styles.metaSection}>
              <Text style={styles.metaLabel}>{label as string}</Text>
              <Text style={styles.metaValues}>{(values as string[]).join(' · ') || '—'}</Text>
            </View>
          ))}
        </View>

        {session.objectives.length ? (
          <>
            <Text style={styles.sectionTitle}>What you’ll learn</Text>
            {session.objectives.map((objective) => (
              <View key={objective} style={styles.objective}>
                <Ionicons color={colors.green} name="checkmark-circle" size={20} />
                <Text style={styles.objectiveText}>{objective}</Text>
              </View>
            ))}
          </>
        ) : null}

        <DisclaimerBanner />
        <PrimaryButton
          icon="open-outline"
          onPress={() => Linking.openURL(session.officialUrl)}
          title="View official session page"
          variant="secondary"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.xl, paddingBottom: 60, gap: spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  title: { color: colors.ink, fontSize: 29, lineHeight: 35, fontWeight: '900' },
  abstract: { color: colors.inkMuted, fontSize: 16, lineHeight: 24 },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '900', marginTop: spacing.sm },
  timeList: { gap: spacing.md },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  timeCardSelected: { borderColor: colors.green, backgroundColor: colors.greenSoft },
  timeCopy: { flex: 1, gap: 3 },
  timeTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  timeMeta: { color: colors.inkMuted, fontSize: 13, lineHeight: 18 },
  seating: { color: colors.blue, fontSize: 10, fontWeight: '900', letterSpacing: 0.4 },
  equipment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.orangeSoft,
  },
  equipmentText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  metaGrid: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  metaSection: { gap: 4 },
  metaLabel: { color: colors.inkMuted, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  metaValues: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  objective: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  objectiveText: { flex: 1, color: colors.inkMuted, fontSize: 14, lineHeight: 21 },
});
