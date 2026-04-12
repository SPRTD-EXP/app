import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';

WebBrowser.maybeCompleteAuthSession();

type Mode = 'signin' | 'signup';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function LoginModal({ visible, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('signin');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const resetForm = () => {
    setError('');
    setSuccess('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setLoading(false);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setSuccess('');
    setFirstName('');
    setLastName('');
  };

  const handleClose = () => {
    resetForm();
    setMode('signin');
    onClose();
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      setLoading(false);
      handleClose();
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`.trim(),
            display_name: firstName,
          },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      setSuccess('CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT.');
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      const redirectTo = Linking.createURL('/auth/callback');
      const { data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success') {
          const hashParams = new URLSearchParams(result.url.split('#')[1] ?? '');
          const accessToken  = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            handleClose();
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          onPress={handleClose}
          activeOpacity={1}
        />

        {/* Panel */}
        <View style={styles.panel}>
          {/* Close */}
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.closeBtnText}>×</Text>
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Mode tabs */}
            <View style={styles.tabRow}>
              {(['signin', 'signup'] as Mode[]).map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => switchMode(m)}
                  style={styles.tab}
                >
                  <Text
                    style={[
                      styles.tabText,
                      mode === m && styles.tabTextActive,
                    ]}
                  >
                    {m === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                  </Text>
                  {mode === m && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Signup name fields */}
            {mode === 'signup' && (
              <View style={styles.nameRow}>
                <TextInput
                  style={[styles.input, styles.nameInput]}
                  placeholder="FIRST NAME"
                  placeholderTextColor="rgba(245,240,232,0.2)"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                <TextInput
                  style={[styles.input, styles.nameInput]}
                  placeholder="LAST NAME"
                  placeholderTextColor="rgba(245,240,232,0.2)"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            )}

            {/* Email */}
            <TextInput
              style={styles.input}
              placeholder="EMAIL"
              placeholderTextColor="rgba(245,240,232,0.2)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            {/* Password */}
            <TextInput
              style={styles.input}
              placeholder="PASSWORD"
              placeholderTextColor="rgba(245,240,232,0.2)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            {/* Error */}
            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {/* Success */}
            {!!success && <Text style={styles.successText}>{success}</Text>}

            {/* Submit button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity
              onPress={handleGoogle}
              style={styles.googleBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>CONTINUE WITH GOOGLE</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  panel: {
    width: '88%',
    maxWidth: 380,
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.divider,
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 32,
    zIndex: 1,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 22,
    color: colors.foreground,
    lineHeight: 26,
  },
  scrollContent: {
    gap: 12,
  },
  // Tabs
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tab: {
    alignItems: 'center',
    paddingBottom: 6,
  },
  tabText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 10,
    letterSpacing: 2.2,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: colors.gold,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.gold,
  },
  // Name row
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nameInput: {
    flex: 1,
  },
  // Input
  input: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 11,
    letterSpacing: 1.32,   // 0.12 * 11
    color: colors.foreground,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  // Messages
  errorText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 1.35,
    color: colors.error,
    textTransform: 'uppercase',
  },
  successText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 1.35,
    color: colors.success,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // Submit / action buttons
  submitBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.55)',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 10,
    letterSpacing: 2.2,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  dividerLabel: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 8,
    letterSpacing: 2.8,
    color: colors.gold,
    textTransform: 'uppercase',
  },
  // Google button
  googleBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.55)',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
