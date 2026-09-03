import * as AppleAuthentication from 'expo-apple-authentication';
import { useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
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
import { colors, radii, spacing, text } from '../theme';

export function AuthScreen({ navigation }: RootScreenProps<'Auth'>) {
  const { configured, sendMagicLink, signInWithApple, appleAvailable } = useAuth();
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
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

  const apple = async () => {
    setAppleBusy(true);
    try {
      const signedIn = await signInWithApple();
      if (signedIn) navigation.goBack();
    } catch (error) {
      Alert.alert('Could not sign in with Apple', (error as Error).message);
    } finally {
      setAppleBusy(false);
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
            {appleAvailable ? (
              <AppleAuthentication.AppleAuthenticationButton
                buttonStyle={
                  colorScheme === 'dark'
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                cornerRadius={radii.lg}
                onPress={() => void apple()}
                style={[styles.appleButton, appleBusy && styles.busy]}
              />
            ) : null}
            {appleAvailable ? (
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={text.footnoteSecondary}>or use email</Text>
                <View style={styles.dividerLine} />
              </View>
            ) : null}
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
  appleButton: { height: 50, width: '100%' },
  busy: { opacity: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  emailCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  sent: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
});
