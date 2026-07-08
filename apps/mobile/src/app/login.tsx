import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth/auth-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = userId.length > 0 && password.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMessage(null);
    const result = await login(userId, password);
    if (!result.ok) {
      setErrorMessage(result.message);
      setSubmitting(false);
    }
    // 成功時は AuthProvider の状態遷移で保護ルートへ自動的に切り替わる
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.title}>家計簿</Text>
          <Text style={styles.subtitle}>ログインして家計状況を確認</Text>

          <View style={styles.form}>
            <Text style={styles.label}>ユーザー名</Text>
            <TextInput
              style={styles.input}
              value={userId}
              onChangeText={setUserId}
              placeholder="ユーザー名を入力"
              placeholderTextColor="rgba(28,20,16,0.35)"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              editable={!submitting}
            />

            <Text style={styles.label}>パスワード</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="パスワードを入力"
              placeholderTextColor="rgba(28,20,16,0.35)"
              secureTextEntry
              textContentType="password"
              editable={!submitting}
              onSubmitEditing={handleSubmit}
            />

            {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

            <Pressable
              style={[styles.button, !canSubmit && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              accessibilityRole="button"
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonLabel}>ログイン</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf6f2',
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1c1410',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#1c1410',
    opacity: 0.55,
    textAlign: 'center',
  },
  form: {
    marginTop: 32,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1410',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(28,20,16,0.15)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1c1410',
    marginBottom: 8,
  },
  error: {
    fontSize: 13,
    color: '#c62828',
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
