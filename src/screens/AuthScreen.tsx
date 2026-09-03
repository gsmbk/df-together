import { useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BrandMark } from '../components/BrandMark';
import { DisclaimerFooter } from '../components/DisclaimerFooter';
import { Cell, GroupedSection } from '../components/GroupedList';
import { HeaderButton } from '../components/HeaderButton';
import { Icon } from '../components/Icon';
import { icons } from '../components/icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import type { RootScreenProps } from '../navigation';
import { colors, spacing, text } from '../theme';

export function AuthScreen({ navigation }: RootScreenProps<'Auth'>) {
  const { configured, sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => <HeaderButton label="Cancel" onPress={() => navigation.goBack()} />,
    });
  }, [navigation]);

  const submit = async () => {
    if (!email.includes('@')) {
      Alert.alert('Enter a valid email address');
      return;
    }
    setSending(true);
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (error) {
      Alert.alert('Could not send sign-in link', (error as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <BrandMark size={72} />
          <Text style={[text.title1, styles.center]}>Plan together</Text>
          <Text style={[text.bodySecondary, styles.center]}>
            Sign in to sync your agenda across devices and connect with friends. No password needed.
          </Text>
        </View>

        {!configured ? (
          <GroupedSection footer="Browsing and local planning already work without an account.">
            <Cell>
              <Text style={text.headline}>Supabase setup needed</Text>
              <Text style={text.footnoteSecondary}>
                Add the public project URL and publishable key to your .env file to enable sign-in.
              </Text>
            </Cell>
          </GroupedSection>
        ) : sent ? (
          <GroupedSection>
            <Cell style={styles.sent}>
              <Icon {...icons.mail} color={colors.green} size={30} />
              <Text style={text.title3}>Check your inbox</Text>
              <Text style={[text.subheadlineSecondary, styles.center]}>
                Open the link we sent to {email} on this device to finish signing in.
              </Text>
              <PrimaryButton compact onPress={() => setSent(false)} title="Use another email" variant="tinted" />
            </Cell>
          </GroupedSection>
        ) : (
          <View style={styles.form}>
            <GroupedSection footer="We’ll email you a one-time sign-in link.">
              <Cell style={styles.emailCell}>
                <Icon {...icons.mail} color={colors.secondaryLabel} size={18} />
                <TextInput
                  accessibilityLabel="Email address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  onSubmitEditing={submit}
                  placeholder="you@company.com"
                  placeholderTextColor={colors.placeholder}
                  returnKeyType="send"
                  style={[text.body, styles.flex]}
                  textContentType="emailAddress"
                  value={email}
                />
              </Cell>
            </GroupedSection>
            <PrimaryButton
              disabled={!email.includes('@')}
              loading={sending}
              onPress={submit}
              title="Email me a sign-in link"
            />
          </View>
        )}

        <PrimaryButton onPress={() => navigation.goBack()} title="Continue without an account" variant="plain" />
        <DisclaimerFooter />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  center: { textAlign: 'center' },
  form: { gap: spacing.lg },
  emailCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  sent: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
});
