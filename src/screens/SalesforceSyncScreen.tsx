import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { Cell, GroupedSection, Row } from '../components/GroupedList';
import { Icon } from '../components/Icon';
import { icons } from '../components/icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAgendaActions, useAgendaState } from '../contexts/AgendaContext';
import { shortDay, timeRange } from '../data/catalog';
import { addWithConflictCheck } from '../lib/agenda-actions';
import { readEventWindowEntries } from '../lib/calendar';
import { reconcile, resolveTimeId } from '../lib/salesforce-agenda';
import type { RootScreenProps } from '../navigation';
import {
  setSalesforceEnabled,
  storeReconciliation,
  useSalesforce,
  type StoredMatch,
} from '../state/salesforce';
import { colors, radii, spacing, text } from '../theme';

const officialAgendaUrl = 'https://www.salesforce.com/dreamforce/my-agenda/';

export function SalesforceSyncScreen({ navigation }: RootScreenProps<'SalesforceSync'>) {
  const { enabled, matches, checkedAt, scanned } = useSalesforce();
  const { resolved } = useAgendaState();
  const actions = useAgendaActions();
  const [scanning, setScanning] = useState(false);

  const runScan = useCallback(async () => {
    setScanning(true);
    try {
      const events = await readEventWindowEntries();
      const report = reconcile(events, resolved);
      const stored: StoredMatch[] = report.matched.map((entry) => ({
        sessionTimeId: entry.time.id,
        sessionId: entry.session.id,
        status: entry.status,
        driftMinutes: entry.driftMinutes,
      }));
      storeReconciliation(stored, report.checkedAt, report.scanned);
      if (!stored.length) {
        Alert.alert(
          'No Dreamforce sessions found',
          'Nothing in your calendar during the event matched the catalog. Sync your agenda from the Salesforce Events app first, then check again.',
        );
      }
    } catch (error) {
      Alert.alert('Could not read your calendar', (error as Error).message);
    } finally {
      setScanning(false);
    }
  }, [resolved]);

  const toggle = async (next: boolean) => {
    setSalesforceEnabled(next);
    if (next) await runScan();
  };

  // Differences are only meaningful once a scan has actually run. Before that
  // we know nothing about the official agenda and must not imply otherwise.
  const hasResult = enabled && Boolean(checkedAt);
  const missing = hasResult
    ? resolved.filter((item) => !matches.some((match) => match.sessionId === item.session.id))
    : [];
  const unplanned = matches.filter((match) => match.status === 'unplanned');
  const changed = matches.filter((match) => match.status === 'timeChanged');
  const inBoth = matches.filter((match) => match.status === 'planned');

  return (
    <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.intro}>
        <Text style={text.bodySecondary}>
          DF Together cannot book or cancel anything on the official Dreamforce agenda. It can read
          the sessions the Salesforce Events app wrote into your phone's calendar and show you where
          the two plans disagree.
        </Text>
      </View>

      <GroupedSection
        footer="Only the Dreamforce dates are read, only sessions that match the catalog are kept, and nothing from your calendar ever leaves this device."
        header="Check official agenda"
      >
        <Row
          leading={<Icon {...icons.calendar} color={colors.tint} size={20} />}
          subtitle={enabled ? 'Reads your calendar when you tap Check now' : 'Off'}
          title="Compare with my calendar"
          trailing={
            <Switch
              accessibilityLabel="Compare with my calendar"
              onValueChange={(next) => void toggle(next)}
              trackColor={{ true: colors.green as string }}
              value={enabled}
            />
          }
        />
        {enabled ? (
          <Row
            detail={checkedAt ? new Date(checkedAt).toLocaleString() : 'Never'}
            onPress={scanning ? undefined : () => void runScan()}
            title="Last checked"
            trailing={
              scanning ? (
                <ActivityIndicator color={colors.tint} size="small" />
              ) : (
                <PrimaryButton compact icon={icons.refresh} onPress={() => void runScan()} title="Check now" variant="tinted" />
              )
            }
          />
        ) : null}
      </GroupedSection>

      {!enabled ? (
        <GroupedSection header="How to set this up">
          <Cell>
            <Text style={text.subheadline}>1. Build your agenda on the official site or in the Salesforce Events app.</Text>
          </Cell>
          <Cell>
            <Text style={text.subheadline}>2. In the Events app, open More, then Sync to my calendar.</Text>
          </Cell>
          <Cell>
            <Text style={text.subheadline}>3. Turn the switch above on and DF Together will match those entries to the catalog.</Text>
          </Cell>
          <Row
            accessory="chevron"
            leading={<Icon {...icons.openExternal} color={colors.tint} size={20} />}
            onPress={() => Linking.openURL(officialAgendaUrl)}
            tinted
            title="Open My Agenda on salesforce.com"
          />
        </GroupedSection>
      ) : null}

      {enabled && checkedAt && !matches.length ? (
        <EmptyState
          body={`Looked at ${scanned} calendar ${scanned === 1 ? 'entry' : 'entries'} during Dreamforce and found no sessions from the catalog.`}
          icon={icons.calendar}
          title="Nothing matched yet"
        />
      ) : null}

      {unplanned.length ? (
        <GroupedSection
          footer="These are on your official agenda but not planned here. Adding them keeps both views the same."
          header={`On Salesforce only (${unplanned.length})`}
        >
          {unplanned.map((match) => (
            <MatchRow
              actionLabel="Add"
              key={match.sessionTimeId}
              match={match}
              onAction={() => {
                const item = resolveTimeId(match.sessionTimeId);
                if (item) addWithConflictCheck(actions, item.session, item.time);
              }}
              onOpen={() => openSession(navigation, match)}
            />
          ))}
        </GroupedSection>
      ) : null}

      {missing.length ? (
        <GroupedSection
          footer="Planned here with no matching entry in your calendar. If a session needs a reserved seat, book it on the official site."
          header={`Not on your official agenda (${missing.length})`}
        >
          {missing.map((item) => (
            <Row
              accessory="chevron"
              key={item.time.id}
              onPress={() =>
                navigation.navigate('SessionDetail', { sessionId: item.session.id, sessionTimeId: item.time.id })
              }
              subtitle={`${shortDay(item.time.dateLabel)} · ${timeRange(item.time)}`}
              title={item.session.title}
              titleLines={2}
            />
          ))}
        </GroupedSection>
      ) : null}

      {changed.length ? (
        <GroupedSection
          footer="Your calendar entry starts at a different time than the bundled catalog. The catalog was imported earlier, so check the official page for the current time."
          header={`Times disagree (${changed.length})`}
        >
          {changed.map((match) => (
            <MatchRow
              key={match.sessionTimeId}
              match={match}
              onOpen={() => openSession(navigation, match)}
              trailingNote={`${match.driftMinutes} min apart`}
            />
          ))}
        </GroupedSection>
      ) : null}

      {inBoth.length ? (
        <GroupedSection header={`In both (${inBoth.length})`}>
          {inBoth.map((match) => (
            <MatchRow key={match.sessionTimeId} match={match} onOpen={() => openSession(navigation, match)} />
          ))}
        </GroupedSection>
      ) : null}

      <View style={styles.caveat}>
        <Icon {...icons.info} color={colors.tertiaryLabel} size={14} />
        <Text style={[text.footnoteSecondary, styles.flex]}>
          This reads a snapshot of your calendar. If your official agenda changes later, re-sync it
          from the Salesforce Events app and check again.
        </Text>
      </View>
    </ScrollView>
  );
}

function openSession(
  navigation: RootScreenProps<'SalesforceSync'>['navigation'],
  match: StoredMatch,
) {
  navigation.navigate('SessionDetail', {
    sessionId: match.sessionId,
    sessionTimeId: match.sessionTimeId,
  });
}

function MatchRow({
  match,
  onOpen,
  onAction,
  actionLabel,
  trailingNote,
}: {
  match: StoredMatch;
  onOpen: () => void;
  onAction?: () => void;
  actionLabel?: string;
  trailingNote?: string;
}) {
  const item = resolveTimeId(match.sessionTimeId);
  if (!item) return null;
  return (
    <Row
      accessory={onAction ? 'none' : 'chevron'}
      onPress={onOpen}
      subtitle={`${shortDay(item.time.dateLabel)} · ${timeRange(item.time)} · ${item.time.location}`}
      title={item.session.title}
      titleLines={2}
      trailing={
        onAction && actionLabel ? (
          <PrimaryButton compact onPress={onAction} title={actionLabel} variant="tinted" />
        ) : trailingNote ? (
          <Chip label={trailingNote} tone="orange" />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.xl },
  intro: { paddingHorizontal: spacing.xs },
  flex: { flex: 1 },
  caveat: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderRadius: radii.lg,
  },
});
