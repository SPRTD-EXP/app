import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiPost } from '../lib/api';
import { colors, typography } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

const INITIAL_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  subject: '',
  message: '',
};

export default function ContactModal({ visible, onClose }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    onClose();
    // Reset after close animation
    setTimeout(() => {
      setSubmitted(false);
      setForm(INITIAL_FORM);
      setError(null);
    }, 300);
  }

  async function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.email || !form.subject || !form.message) {
      setError('PLEASE FILL IN ALL FIELDS.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiPost('/api/contact', form);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message.toUpperCase() : 'SOMETHING WENT WRONG. PLEASE TRY AGAIN.');
    } finally {
      setLoading(false);
    }
  }

  function setField(key: keyof FormState) {
    return (value: string) => setForm(prev => ({ ...prev, [key]: value }));
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            style={styles.sheet}
            activeOpacity={1}
            onPress={() => {}}
          >
            {/* Close */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeText}>CLOSE</Text>
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {submitted ? (
                // Success state
                <View style={styles.successContainer}>
                  <Text style={[typography.label, styles.successLabel]}>
                    MESSAGE SENT
                  </Text>
                  <Text style={styles.successHeading}>GOT IT.</Text>
                  <Text style={styles.successBody}>
                    WE'LL BE IN TOUCH SOON.
                  </Text>
                </View>
              ) : (
                // Form
                <>
                  <Text style={[typography.label, styles.sectionLabel]}>
                    CONTACT
                  </Text>
                  <Text style={styles.formHeading}>GET IN TOUCH.</Text>

                  {/* First + Last Name row */}
                  <View style={styles.nameRow}>
                    <View style={styles.nameField}>
                      <Text style={styles.inputLabel}>FIRST NAME</Text>
                      <TextInput
                        style={styles.input}
                        value={form.firstName}
                        onChangeText={setField('firstName')}
                        placeholderTextColor="rgba(245,240,232,0.3)"
                        autoCorrect={false}
                      />
                    </View>
                    <View style={styles.nameField}>
                      <Text style={styles.inputLabel}>LAST NAME</Text>
                      <TextInput
                        style={styles.input}
                        value={form.lastName}
                        onChangeText={setField('lastName')}
                        placeholderTextColor="rgba(245,240,232,0.3)"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Email */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>EMAIL</Text>
                    <TextInput
                      style={styles.input}
                      value={form.email}
                      onChangeText={setField('email')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor="rgba(245,240,232,0.3)"
                    />
                  </View>

                  {/* Subject */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>SUBJECT</Text>
                    <TextInput
                      style={styles.input}
                      value={form.subject}
                      onChangeText={setField('subject')}
                      placeholderTextColor="rgba(245,240,232,0.3)"
                    />
                  </View>

                  {/* Message */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>MESSAGE</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={form.message}
                      onChangeText={setField('message')}
                      multiline
                      numberOfLines={5}
                      placeholderTextColor="rgba(245,240,232,0.3)"
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Error */}
                  {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : null}

                  {/* Submit */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.submitButtonText, loading && styles.submitButtonTextDisabled]}>
                      {loading ? 'SENDING...' : 'SEND MESSAGE'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.12)',
    width: '100%',
    maxHeight: '90%',
    position: 'relative',
  },
  scrollContent: {
    padding: 36,
    paddingTop: 48,
    gap: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  closeText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 1.8,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  // Success
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  successLabel: {
    textAlign: 'center',
  },
  successHeading: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 28,
    letterSpacing: 4,
    color: colors.goldLight,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  successBody: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 11,
    letterSpacing: 1,
    color: colors.foreground,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // Form
  sectionLabel: {
    textAlign: 'center',
  },
  formHeading: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 26,
    letterSpacing: 4,
    color: colors.goldLight,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
    gap: 6,
  },
  fieldGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: colors.divider,
    color: colors.foreground,
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 11,
    letterSpacing: 0.9,
    padding: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.error,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  submitButton: {
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.55)',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 10,
    letterSpacing: 3,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  submitButtonTextDisabled: {
    color: 'rgba(245,240,232,0.5)',
  },
});
