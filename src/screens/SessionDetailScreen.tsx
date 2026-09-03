import * as Linking from 'expo-linking';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Chip } from '../components/Chip';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { EmptyState } from '../components/EmptyState';
import { Cell, GroupedSection, Row } from '../components/GroupedList';
import { HeaderButton } from '../components/HeaderButton';
import { Icon } from '../components/Icon';
import { icons } from '../components/icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAgendaActions, useAgendaState } from '../contexts/AgendaContext';
import { useAuth } from '../contexts/AuthContext';
import { sessionsById, shortDay, timeRange } from '../data/catalog';
import { showActions } from '../lib/actions';
import { addWithConflictCheck, removeWithFeedback } from '../lib/agenda-actions';
import { addToCalendarWithForm } from '../lib/calendar';
import { shareSession } from '../lib/share';
import type { RootScreenProps } from '../navigation';
import { saveNote, useNote } from '../state/notes';
import { useFriendsGoing } from '../state/social';
import { colors, radii, spacing, text } from '../theme';
import type { SessionTime } from '../types';

export function SessionDetailScreen({ navigation, route }: RootScreenProps<'SessionDetail'>) {
  const session = sessionsById.get(route.params.sessionId);
  const { selectedTimeIds } = useAgendaState();
  const actions = useAgendaActions();
  const { user } = useAuth();
  const { byTime, bySession } = useFriendsGoing();

  useLayoutEffect(() => {
    if (!session) return;
    navigation.setOptions({
      headerRight: () => (
        <HeaderButton
          accessibilityLabel="Share session"
          icon={icons.share}
          onPress={() => shareSession(session).catch(() => undefined)}
        />
      ),
    });
  }, [navigation, session]);

  const selectedTimes = useMemo(
    () => (session ? session.times.filter((time) => selectedTimeIds.has(time.id)) : []),
    [selectedTimeIds, session],
  );

  if (!session) {
    return (
      <EmptyState
        body="This session is not in the bundled catalog. It may have been added after the last import."
        icon={icons.warning}
        style={styles.missing}
        title="Session not found"
      />
    );
  }

  const friendsGoing = bySession.get(session.id) ?? [];

  const addToCalendar = () => {
    const perform = (time: SessionTime) =>
      addToCalendarWithForm({ session, time }).catch((error) =>
        Alert.alert('Could not open Calendar', (error as Error).message),
      );
    const candidates = selectedTimes.length ? selectedTimes : session.times;
    if (candidates.length === 1) return perform(candidates[0]);
    showActions({
      title: 'Which time?',
      options: candidates.map((time) => ({
        label: `${shortDay(time.dateLabel)} · ${timeRange(time)}`,
        onPress: () => void perform(time),
      })),
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
    >
      <View style={styles.hero}>
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
        <Text style={text.title1}>{session.title}</Text>
        {session.speakers?.length ? (
          <View style={styles.speakers}>
            <Icon {...icons.mic} color={colors.secondaryLabel} size={15} />
            <Text style={[text.subheadlineSecondary, styles.flex]}>{session.speakers.join(', ')}</Text>
          </View>
        ) : null}
        <Text style={text.bodySecondary}>{session.abstract}</Text>
      </View>

      <GroupedSection
        footer={
          session.times.length > 1
            ? 'This session repeats. Pick the time that fits your day.'
            : selectedTimes.length
              ? 'On your agenda.'
              : undefined
        }
        header={session.times.length > 1 ? 'Times' : 'Time'}
      >
        {session.times.map((time) => {
          const selected = selectedTimeIds.has(time.id);
          const friends = byTime.get(time.id) ?? [];
          return (
            <Cell key={time.id} style={styles.timeCell}>
              <View style={styles.timeRow}>
                <View style={styles.flex}>
                  <Text style={text.headline}>
                    {shortDay(time.dateLabel)} · {timeRange(time)}
                  </Text>
                  <Text style={text.footnoteSecondary}>{time.location}</Text>
                  {time.seating ? (
                    <Text style={[text.caption1Secondary, styles.seating]}>{titleCase(time.seating)}</Text>
                  ) : null}
                </View>
                <PrimaryButton
                  accessibilityLabel={selected ? 'Remove this time from agenda' : 'Add this time to agenda'}
                  compact
                  icon={selected ? icons.checkmark : undefined}
                  onPress={() =>
                    selected ? removeWithFeedback(actions, time.id) : addWithConflictCheck(actions, session, time)
                  }
                  title={selected ? 'Added' : 'Add'}
                  variant={selected ? 'tinted' : 'filled'}
                />
              </View>
              {friends.length ? (
                <View style={styles.friendsRow}>
                  {friends.slice(0, 4).map((friend) => (
                    <Avatar color={friend.color} key={friend.id} name={friend.name} size={20} />
                  ))}
                  <Text style={[text.caption1Secondary, styles.flex]}>
                    {friends.map((friend) => friend.name.split(' ')[0]).join(', ')}{' '}
                    {friends.length === 1 ? 'is' : 'are'} going to this one
                  </Text>
                </View>
              ) : null}
            </Cell>
          );
        })}
      </GroupedSection>

      {friendsGoing.length ? (
        <GroupedSection header="Friends going">
          {friendsGoing.map((friend) => (
            <Row
              accessory="chevron"
              key={friend.id}
              leading={<Avatar color={friend.color} name={friend.name} size={28} />}
              onPress={() => navigation.navigate('FriendAgenda', { friendId: friend.id, friendName: friend.name })}
              title={friend.name}
            />
          ))}
        </GroupedSection>
      ) : null}

      <GroupedSection>
        <Row
          leading={<Icon {...icons.calendarAdd} color={colors.tint} size={20} />}
          onPress={addToCalendar}
          tinted
          title="Add to Calendar"
        />
        <Row
          leading={<Icon {...icons.share} color={colors.tint} size={20} />}
          onPress={() => shareSession(session, selectedTimes[0]).catch(() => undefined)}
          tinted
          title="Share with a friend"
        />
        <Row
          leading={<Icon {...icons.openExternal} color={colors.tint} size={20} />}
          onPress={() => Linking.openURL(session.officialUrl)}
          tinted
          title="Official session page"
        />
      </GroupedSection>

      {session.requiredEquipment.length ? (
        <View style={styles.equipment}>
          <Icon {...icons.laptop} color={colors.orange} size={20} />
          <Text style={[text.subheadline, styles.flex]}>{session.requiredEquipment.join(' ')}</Text>
        </View>
      ) : null}

      {session.objectives.length ? (
        <GroupedSection header="What you’ll learn">
          {session.objectives.map((objective) => (
            <Row
              key={objective}
              leading={<Icon {...icons.added} color={colors.green} size={20} />}
              title={objective}
              titleStyle={text.subheadline}
            />
          ))}
        </GroupedSection>
      ) : null}

      <GroupedSection header="Details">
        {(
          [
            ['Products', session.products],
            ['Roles', session.roles],
            ['Topics', session.topics],
            ['Industries', session.industries],
            ['Location', session.locations.slice(0, 1)],
          ] as const
        )
          .filter(([, values]) => values.length)
          .map(([label, values]) => (
            <Row key={label} subtitle={values.join(' · ')} title={label} titleStyle={text.footnoteSecondary} />
          ))}
      </GroupedSection>

      <NotesSection sessionId={session.id} userId={user?.id} />

      <DisclaimerFooter />
    </ScrollView>
  );
}

function NotesSection({ sessionId, userId }: { sessionId: string; userId?: string }) {
  const note = useNote(sessionId);
  const [draft, setDraft] = useState(note?.note ?? '');
  const latest = useRef(draft);
  latest.current = draft;

  useEffect(() => {
    setDraft(note?.note ?? '');
  }, [note?.note]);

  const commit = () => {
    if ((note?.note ?? '') !== latest.current) saveNote(sessionId, { note: latest.current }, userId);
  };

  return (
    <GroupedSection
      footer={userId ? 'Notes and ratings sync with your account and stay private.' : 'Notes stay on this device until you sign in.'}
      header="My notes"
    >
      <Cell>
        <View accessibilityRole="radiogroup" style={styles.stars}>
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = (note?.rating ?? 0) >= value;
            return (
              <Pressable
                accessibilityLabel={`${value} star${value === 1 ? '' : 's'}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: note?.rating === value }}
                hitSlop={6}
                key={value}
                onPress={() => saveNote(sessionId, { rating: note?.rating === value ? 0 : value }, userId)}
              >
                <Icon {...(filled ? icons.starFill : icons.star)} color={filled ? colors.orange : colors.tertiaryLabel} size={26} />
              </Pressable>
            );
          })}
          <Text style={[text.footnoteSecondary, styles.ratingLabel]}>
            {note?.rating ? ['', 'Skip it', 'Meh', 'Good', 'Great', 'Must see'][note.rating] : 'Rate it'}
          </Text>
        </View>
        <TextInput
          accessibilityLabel="Session note"
          multiline
          onBlur={commit}
          onChangeText={setDraft}
          onEndEditing={commit}
          placeholder="Questions to ask, people to meet, takeaways…"
          placeholderTextColor={colors.placeholder}
          style={styles.noteInput}
          value={draft}
        />
      </Cell>
    </GroupedSection>
  );
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.xl },
  missing: { flex: 1, justifyContent: 'center' },
  hero: { gap: spacing.md, paddingHorizontal: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  speakers: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1 },
  timeCell: { paddingVertical: spacing.md },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  seating: { marginTop: 2 },
  friendsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  equipment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    backgroundColor: colors.orangeSoft,
  },
  stars: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ratingLabel: { marginLeft: spacing.xs },
  noteInput: {
    ...text.body,
    minHeight: 72,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
});
