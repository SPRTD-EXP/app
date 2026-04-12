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

const BUDGETS = [
  'UNDER $1K',
  '$1K–$2K',
  '$2K–$5K',
  '$5K–$10K',
  '$10K+',
  'NOT SURE YET',
] as const;

type Budget = typeof BUDGETS[number];

interface FormState {
  businessName: string;
  contactName: string;
  email: string;
  website: string;
  niche: string;
  budget: Budget | '';
  message: string;
}

const INITIAL_FORM: FormState = {
  businessName: '',
  contactName: '',
  email: '',
  website: '',
  niche: '',
  budget: '',
  message: '',
};

export default function PartnerModal({ visible, onClose }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setForm(INITIAL_FORM);
      setError(null);
    }, 300);
  }

  async function handleSubmit() {
    const { businessName, contactName, email, niche, budget, message } = form;
    if (!businessName || !contactName || !email || !niche || !budget || !message) {
      setError('PLEASE FILL IN ALL REQUIRED FIELDS.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiPost('/api/partner', form);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.toUpperCase()
          : 'SOMETHING WENT WRONG. PLEASE TRY AGAIN.'
      );
    } finally {
      setLoading(false);
    }
  }

  function setField(key: keyof FormState) {
    return (value: string) => setForm(prev => ({ ...prev, [key]: value }));
  }

  function selectBudget(b: Budget) {
    setForm(prev => ({ ...prev, budget: b }));
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
                    APPLICATION RECEIVED
                  </Text>
                  <Text style={styles.successHeading}>WE'LL BE IN TOUCH.</Text>
                  <Text style={styles.successBody}>
                    A MEMBER OF THE SPRTD TEAM WILL REACH OUT WITHIN 48 HOURS.
                  </Text>
                </View>
              ) : (
                // Form
                <>
                  <Text style={[typography.label, styles.sectionLabel]}>
                    PARTNERSHIP INQUIRY
                  </Text>
                  <Text style={styles.formHeading}>GET STARTED.</Text>

                  {/* Business Name + Contact Name */}
                  <View style={styles.twoColRow}>
                    <View style={styles.twoColField}>
                      <Text style={styles.inputLabel}>BUSINESS NAME</Text>
                      <TextInput
                        style={styles.input}
                        value={form.businessName}
                        onChangeText={setField('businessName')}
                        placeholderTextColor="rgba(245,240,232,0.3)"
                        autoCorrect={false}
                      />
                    </View>
                    <View style={styles.twoColField}>
                      <Text style={styles.inputLabel}>YOUR NAME</Text>
                      <TextInput
                        style={styles.input}
                        value={form.contactName}
                        onChangeText={setField('contactName')}
                        placeholderTextColor="rgba(245,240,232,0.3)"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Email + Website */}
                  <View style={styles.twoColRow}>
                    <View style={styles.twoColField}>
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
                    <View style={styles.twoColField}>
                      <Text style={styles.inputLabel}>WEBSITE (OPTIONAL)</Text>
                      <TextInput
                        style={styles.input}
                        value={form.website}
                        onChangeText={setField('website')}
                        placeholder="HTTPS://"
                        placeholderTextColor="rgba(245,240,232,0.3)"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                      />
                    </View>
                  </View>

                  {/* Niche */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>BUSINESS NICHE</Text>
                    <TextInput
                      style={styles.input}
                      value={form.niche}
                      onChangeText={setField('niche')}
                      placeholder="E.G. BARBERSHOP, GYM, FASHION..."
                      placeholderTextColor="rgba(245,240,232,0.3)"
                    />
                  </View>

                  {/* Budget — custom button grid */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>ANNUAL BUDGET</Text>
                    <View style={styles.budgetGrid}>
                      {BUDGETS.map(b => {
                        const isSelected = form.budget === b;
                        return (
                          <TouchableOpacity
                            key={b}
                            onPress={() => selectBudget(b)}
                            style={[
                              styles.budgetOption,
                              isSelected
                                ? styles.budgetOptionSelected
                                : styles.budgetOptionUnselected,
                            ]}
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.budgetOptionText,
                                isSelected
                                  ? styles.budgetOptionTextSelected
                                  : styles.budgetOptionTextUnselected,
                              ]}
                            >
                              {b}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Message */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>TELL US ABOUT YOUR BUSINESS</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={form.message}
                      onChangeText={setField('message')}
                      multiline
                      numberOfLines={4}
                      placeholder="WHAT DO YOU DO, WHO DO YOU SERVE, AND WHAT ISSUES ARE YOU FACED WITH?"
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
                    <Text
                      style={[
                        styles.submitButtonText,
                        loading && styles.submitButtonTextDisabled,
                      ]}
                    >
                      {loading ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
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
    backgroundColor: 'rgba(0,0,0,0.80)',
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
    gap: 18,
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
    paddingVertical: 32,
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
    lineHeight: 19,
  },
  // Form header
  sectionLabel: {
    textAlign: 'center',
  },
  formHeading: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 24,
    letterSpacing: 4,
    color: colors.goldLight,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // Rows / fields
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  twoColField: {
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
  // Budget grid
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  budgetOption: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  budgetOptionSelected: {
    borderColor: colors.gold,
  },
  budgetOptionUnselected: {
    borderColor: colors.divider,
  },
  budgetOptionText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  budgetOptionTextSelected: {
    color: colors.gold,
  },
  budgetOptionTextUnselected: {
    color: 'rgba(245,240,232,0.55)',
  },
  // Error
  errorText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.error,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // Submit
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
