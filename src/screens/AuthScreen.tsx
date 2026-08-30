import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '../components/BrandMark';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import type { RootStackParamList } from '../navigation';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthScreen({ navigation }: Props) {
  const { configured, sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

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
      Alert.alert('Could not send magic link', (error as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <BrandMark size={72} />
        <Text style={styles.eyebrow}>DF TOGETHER</Text>
        <Text style={styles.title}>Plan together. Find each other.</Text>
        <Text style={styles.body}>
          Sign in with a password-free email link to sync your agenda and connect with
          friends.
        </Text>

        {!configured ? (
          <View style={styles.setupCard}>
            <Text style={styles.setupTitle}>Supabase setup needed</Text>
            <Text style={styles.setupBody}>
              Add the public project URL and publishable key to your .env file. Browsing
              and local agenda planning already work without an account.
            </Text>
          </View>
        ) : sent ? (
          <View style={styles.sentCard}>
            <Text style={styles.sentTitle}>Check your inbox</Text>
            <Text style={styles.sentBody}>
              Open the magic link sent to {email} on this device.
            </Text>
            <PrimaryButton
              title="Use another email"
              variant="secondary"
              onPress={() => setSent(false)}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              onSubmitEditing={submit}
              placeholder="you@company.com"
              placeholderTextColor={colors.inkMuted}
              returnKeyType="send"
              style={styles.input}
              value={email}
            />
            <PrimaryButton
              icon="mail-outline"
              loading={sending}
              onPress={submit}
              title="Email me a magic link"
            />
          </View>
        )}

        <PrimaryButton
          title="Continue planning locally"
          variant="ghost"
          onPress={() => navigation.goBack()}
        />
        <DisclaimerBanner compact />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  eyebrow: { color: colors.blueBright, fontSize: 12, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 34, lineHeight: 39, fontWeight: '900' },
  body: { color: colors.inkMuted, fontSize: 16, lineHeight: 23 },
  form: { gap: spacing.md },
  label: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: spacing.lg,
  },
  setupCard: {
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.orangeSoft,
    gap: spacing.sm,
  },
  setupTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  setupBody: { color: colors.inkMuted, fontSize: 14, lineHeight: 20 },
  sentCard: {
    padding: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.greenSoft,
    gap: spacing.md,
  },
  sentTitle: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  sentBody: { color: colors.inkMuted, fontSize: 15, lineHeight: 21 },
});
