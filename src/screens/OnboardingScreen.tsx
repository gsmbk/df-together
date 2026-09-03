import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '../components/BrandMark';
import { Icon } from '../components/Icon';
import { icons, type IconSpec } from '../components/icons';
import { InterestsPicker } from '../components/InterestsPicker';
import { PrimaryButton } from '../components/PrimaryButton';
import { catalog } from '../data/catalog';
import type { RootScreenProps } from '../navigation';
import { hasInterests, updatePreferences, usePreferences } from '../state/preferences';
import { colors, spacing, text } from '../theme';

const features: Array<{ icon: IconSpec; title: string; body: string; color: typeof colors.tint }> = [
  {
    icon: icons.search,
    title: `${catalog.metadata.sessionCount.toLocaleString()} sessions, offline`,
    body: 'The whole Dreamforce catalog is on your phone. Search and filter without a signal.',
    color: colors.tint,
  },
  {
    icon: icons.lock,
    title: 'Private by default',
    body: 'Your agenda stays on your device unless you sign in and choose to share it with accepted friends.',
    color: colors.green,
  },
  {
    icon: icons.people,
    title: 'Find your people',
    body: 'See which sessions friends are attending, spot overlaps, and find time to meet up.',
    color: colors.purple,
  },
];

export function OnboardingScreen({ navigation }: RootScreenProps<'Onboarding'>) {
  const { interests } = usePreferences();

  const finish = () => {
    updatePreferences({ onboardingComplete: true, forYouEnabled: hasInterests(interests) });
    navigation.replace('Main', { screen: 'Browse', params: { screen: 'BrowseHome' } });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <BrandMark size={88} />
          <Text style={[text.largeTitle, styles.center]}>Welcome to DF Together</Text>
          <Text style={[text.bodySecondary, styles.center]}>An independent planner for Dreamforce 2026.</Text>
        </View>

        <View style={styles.features}>
          {features.map((feature) => (
            <View key={feature.title} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Icon {...feature.icon} color={feature.color} size={30} weight="medium" />
              </View>
              <View style={styles.flex}>
                <Text style={text.headline}>{feature.title}</Text>
                <Text style={text.subheadlineSecondary}>{feature.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.interests}>
          <Text style={text.title2}>What are you here for?</Text>
          <Text style={text.subheadlineSecondary}>
            Pick a few products or roles and Browse can show sessions picked for you. You can change this anytime.
          </Text>
          <InterestsPicker />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton onPress={finish} title={hasInterests(interests) ? 'Get started' : 'Skip for now'} />
        <Text style={[text.caption1Secondary, styles.center]}>{catalog.metadata.disclaimer}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.groupedBackground },
  content: { padding: spacing.xl, paddingTop: spacing.xxl, gap: spacing.xxl },
  hero: { alignItems: 'center', gap: spacing.md },
  center: { textAlign: 'center' },
  flex: { flex: 1 },
  features: { gap: spacing.xl },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  featureIcon: { width: 44, alignItems: 'center', paddingTop: 2 },
  interests: { gap: spacing.md },
  footer: { padding: spacing.xl, paddingTop: spacing.md, gap: spacing.md, backgroundColor: colors.groupedBackground },
});
