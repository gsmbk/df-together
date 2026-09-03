import { ScrollView, StyleSheet, Text } from 'react-native';
import { InterestsPicker } from '../components/InterestsPicker';
import { spacing, text } from '../theme';

export function InterestsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <Text style={text.subheadlineSecondary}>
        Sessions matching any of these show up when “For you” is on in Browse. Saved automatically.
      </Text>
      <InterestsPicker />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.xl },
});
