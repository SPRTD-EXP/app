import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { apiPost } from '../../lib/api';
import { formatPrice } from '../../lib/products';
import GhostButton from '../../components/GhostButton';
import { colors, typography, spacing } from '../../theme';

type Step = 1 | 2 | 3;

type ShippingAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

const EMPTY_ADDRESS: ShippingAddress = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'US',
};

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Step state
  const [step, setStep] = useState<Step>(1);

  // Step 1 — info
  const [email, setEmail] = useState(user?.email ?? '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2 — shipping + promo
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoLabel, setPromoLabel] = useState('');
  const [discountCents, setDiscountCents] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [isRosterCode, setIsRosterCode] = useState(false);
  const [rosterMemberName, setRosterMemberName] = useState('');
  const [applyingRosterItem, setApplyingRosterItem] = useState(false);

  // Step 3 — payment
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [taxCents, setTaxCents] = useState(0);
  const [sheetReady, setSheetReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const totalCents = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
  const finalTotal = totalCents - discountCents + taxCents;

  const cartItemsForApi = items.map(item => ({
    productId: item.productId,
    slug: item.slug,
    size: item.size,
    quantity: item.quantity,
    priceCents: item.priceCents,
    stripeProductId: item.stripeProductId,
    stripePriceId: item.stripePriceId,
  }));

  // Redirect empty cart away
  useEffect(() => {
    if (items.length === 0) {
      router.replace('/shop');
    }
  }, [items.length]);

  // When entering step 3: create PI + calculate tax + init sheet
  useEffect(() => {
    if (step !== 3) return;
    (async () => {
      setLoading(true);
      setInitError(null);
      setSheetReady(false);
      try {
        const { clientSecret: cs } = await apiPost<{ clientSecret: string }>(
          '/api/create-payment-intent',
          { items: cartItemsForApi, userId: user?.id ?? null },
        );
        setClientSecret(cs);
        const piId = cs.split('_secret_')[0];
        setPaymentIntentId(piId);

        // Calculate tax
        try {
          const taxRes = await apiPost<{ taxCents: number }>('/api/calculate-tax', {
            address: {
              line1: address.line1,
              line2: address.line2 || undefined,
              city: address.city,
              state: address.state,
              postal_code: address.postal_code,
              country: address.country,
            },
            subtotalCents: totalCents - discountCents,
            paymentIntentId: piId,
          });
          setTaxCents(taxRes.taxCents ?? 0);
        } catch {
          // tax failure is non-fatal
        }

        const { error: initErr } = await initPaymentSheet({
          paymentIntentClientSecret: cs,
          merchantDisplayName: 'SPRTD',
          defaultBillingDetails: { name, email, phone },
          appearance: {
            colors: {
              background: '#111111',
              primary: '#fff3af',
              primaryText: '#111111',
              secondaryText: '#f5f0e8',
              componentBackground: '#1a1a1a',
              componentBorder: '#2a2a2a',
              componentDivider: '#2a2a2a',
              icon: '#f5f0e8',
              error: '#ff6b6b',
            },
          },
          applePay: { merchantCountryCode: 'US' },
          googlePay: { merchantCountryCode: 'US', testEnv: __DEV__ },
        });

        if (initErr) throw new Error(initErr.message);
        setSheetReady(true);
      } catch (err: any) {
        setInitError(err.message ?? 'Failed to initialise payment.');
      } finally {
        setLoading(false);
      }
    })();
  }, [step]);

  // ── PROMO ────────────────────────────────────────────────────────────────
  async function handleApplyPromo() {
    if (!promoCode.trim() || promoApplied) return;
    setApplyingPromo(true);
    setPromoError(null);
    try {
      const data = await apiPost<{
        discountCents?: number;
        label?: string;
        isRosterCode?: boolean;
        memberName?: string;
        error?: string;
      }>('/api/apply-promo', {
        code: promoCode.trim().toUpperCase(),
        paymentIntentId,
        totalCents,
      });
      if (data.isRosterCode) {
        setIsRosterCode(true);
        setRosterMemberName(data.memberName ?? '');
      } else {
        setDiscountCents(data.discountCents ?? 0);
        setPromoLabel(data.label ?? '');
        setPromoApplied(true);
      }
    } catch (err: any) {
      setPromoError(err.message ?? 'Invalid code.');
    } finally {
      setApplyingPromo(false);
    }
  }

  async function handleSelectRosterItem(item: { slug: string; size: string; priceCents: number }) {
    setApplyingRosterItem(true);
    setPromoError(null);
    try {
      const data = await apiPost<{ discountCents: number; label: string }>('/api/apply-roster-code', {
        code: promoCode.trim().toUpperCase(),
        paymentIntentId,
        selectedItemSlug: item.slug,
        selectedItemSize: item.size,
        items: cartItemsForApi,
      });
      setDiscountCents(data.discountCents);
      setPromoLabel(data.label);
      setPromoApplied(true);
      setIsRosterCode(false);
    } catch (err: any) {
      setPromoError(err.message ?? 'Failed to apply discount.');
      setIsRosterCode(false);
    } finally {
      setApplyingRosterItem(false);
    }
  }

  // ── PAY ───────────────────────────────────────────────────────────────────
  async function handlePay() {
    if (!sheetReady) return;
    setPaying(true);
    setPayError(null);
    const { error } = await presentPaymentSheet();
    if (error) {
      setPayError(error.message ?? 'Payment failed. Please try again.');
      setPaying(false);
    } else {
      await clearCart();
      router.replace('/order-confirmed');
    }
  }

  // ── STEP VALIDATION ───────────────────────────────────────────────────────
  function step1Valid() {
    return email.trim().length > 0 && name.trim().length > 0;
  }

  function step2Valid() {
    return (
      address.line1.trim().length > 0 &&
      address.city.trim().length > 0 &&
      address.state.trim().length === 2 &&
      address.postal_code.trim().length >= 4
    );
  }

  // ── STEP INDICATOR ────────────────────────────────────────────────────────
  const STEP_LABELS: Record<Step, string> = { 1: 'INFO', 2: 'SHIPPING & PROMO', 3: 'PAYMENT' };

  const StepIndicator = () => (
    <View style={styles.stepRow}>
      {([1, 2, 3] as Step[]).map(s => {
        const done = step > s;
        const active = step === s;
        return (
          <TouchableOpacity
            key={s}
            onPress={() => done && setStep(s)}
            disabled={!done}
            style={styles.stepItem}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.stepLabel,
                active && styles.stepLabelActive,
                done && styles.stepLabelDone,
              ]}
            >
              {STEP_LABELS[s]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ── ORDER SUMMARY ─────────────────────────────────────────────────────────
  const OrderSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={[typography.label, { fontSize: 9, letterSpacing: 2.52, marginBottom: 16, textAlign: 'center' }]}>
        ORDER SUMMARY
      </Text>
      {items.map(item => (
        <View
          key={`${item.productId}_${item.size}`}
          style={styles.summaryRow}
        >
          <Text style={styles.summaryItemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.summaryItemMeta}>
            {item.size}{item.attributes ? Object.values(item.attributes).map(v => ` · ${v}`).join('') : ''} · QTY {item.quantity}
          </Text>
          <Text style={styles.summaryItemPrice}>
            {formatPrice(item.priceCents * item.quantity)}
          </Text>
        </View>
      ))}
      <View style={styles.summaryDivider} />
      <SummaryLine label="SUBTOTAL" value={formatPrice(totalCents)} />
      <SummaryLine label="SHIPPING" value="FREE" />
      {discountCents > 0 && (
        <SummaryLine
          label={`${promoCode.toUpperCase()} ${promoLabel}`}
          value={`−${formatPrice(discountCents)}`}
          gold
        />
      )}
      <SummaryLine
        label="TAX"
        value={step < 3 ? 'CALCULATED AT CHECKOUT' : formatPrice(taxCents)}
        small={step < 3}
      />
      <View style={styles.summaryTotalRow}>
        <Text style={styles.summaryTotalLabel}>TOTAL</Text>
        <Text style={styles.summaryTotalValue}>{formatPrice(finalTotal)}</Text>
      </View>
    </View>
  );

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <StepIndicator />

          {/* ── STEP 1: INFO ── */}
          {step === 1 && (
            <View style={styles.formSection}>
              <Field label="EMAIL *">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  style={styles.input}
                  placeholderTextColor="rgba(245,240,232,0.3)"
                  placeholder="EMAIL"
                />
              </Field>
              <Field label="FULL NAME *">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                  returnKeyType="next"
                  style={styles.input}
                  placeholderTextColor="rgba(245,240,232,0.3)"
                  placeholder="FULL NAME"
                />
              </Field>
              <Field label="PHONE">
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  returnKeyType="done"
                  style={styles.input}
                  placeholderTextColor="rgba(245,240,232,0.3)"
                  placeholder="PHONE"
                />
              </Field>

              <GhostButton
                label="CONTINUE"
                onPress={() => { if (step1Valid()) setStep(2); }}
                fullWidth
                style={[styles.continueBtn, !step1Valid() && { opacity: 0.4 }]}
              />
            </View>
          )}

          {/* ── STEP 2: SHIPPING & PROMO ── */}
          {step === 2 && (
            <View style={styles.formSection}>
              <Text style={[typography.label, { fontSize: 8, marginBottom: 16 }]}>
                SHIPPING ADDRESS
              </Text>
              <Field label="ADDRESS LINE 1 *">
                <TextInput
                  value={address.line1}
                  onChangeText={v => setAddress(a => ({ ...a, line1: v }))}
                  autoComplete="street-address"
                  returnKeyType="next"
                  style={styles.input}
                  placeholderTextColor="rgba(245,240,232,0.3)"
                  placeholder="123 Main St"
                />
              </Field>
              <Field label="ADDRESS LINE 2">
                <TextInput
                  value={address.line2}
                  onChangeText={v => setAddress(a => ({ ...a, line2: v }))}
                  returnKeyType="next"
                  style={styles.input}
                  placeholderTextColor="rgba(245,240,232,0.3)"
                  placeholder="APT, SUITE, ETC. (OPTIONAL)"
                />
              </Field>
              <View style={styles.twoCol}>
                <View style={{ flex: 2 }}>
                  <Field label="CITY *">
                    <TextInput
                      value={address.city}
                      onChangeText={v => setAddress(a => ({ ...a, city: v }))}
                      autoComplete="postal-address-locality"
                      returnKeyType="next"
                      style={styles.input}
                      placeholderTextColor="rgba(245,240,232,0.3)"
                      placeholder="CITY"
                    />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="STATE *">
                    <TextInput
                      value={address.state}
                      onChangeText={v => setAddress(a => ({ ...a, state: v.toUpperCase().slice(0, 2) }))}
                      autoCapitalize="characters"
                      maxLength={2}
                      returnKeyType="next"
                      style={styles.input}
                      placeholderTextColor="rgba(245,240,232,0.3)"
                      placeholder="CA"
                    />
                  </Field>
                </View>
              </View>
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Field label="ZIP *">
                    <TextInput
                      value={address.postal_code}
                      onChangeText={v => setAddress(a => ({ ...a, postal_code: v }))}
                      keyboardType="number-pad"
                      autoComplete="postal-code"
                      returnKeyType="next"
                      style={styles.input}
                      placeholderTextColor="rgba(245,240,232,0.3)"
                      placeholder="90210"
                    />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="COUNTRY">
                    <TextInput
                      value={address.country}
                      onChangeText={v => setAddress(a => ({ ...a, country: v.toUpperCase().slice(0, 2) }))}
                      autoCapitalize="characters"
                      maxLength={2}
                      returnKeyType="done"
                      style={styles.input}
                      placeholderTextColor="rgba(245,240,232,0.3)"
                      placeholder="US"
                    />
                  </Field>
                </View>
              </View>

              {/* Promo code */}
              <View style={styles.promoBlock}>
                {!promoApplied && !isRosterCode && (
                  <View style={styles.promoRow}>
                    <TextInput
                      value={promoCode}
                      onChangeText={v => { setPromoCode(v.toUpperCase()); setPromoError(null); }}
                      onSubmitEditing={handleApplyPromo}
                      returnKeyType="done"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      style={[styles.input, { flex: 1 }]}
                      placeholderTextColor="rgba(245,240,232,0.3)"
                      placeholder="DISCOUNT CODE"
                    />
                    <TouchableOpacity
                      onPress={handleApplyPromo}
                      disabled={applyingPromo || !promoCode.trim()}
                      style={[styles.applyBtn, (applyingPromo || !promoCode.trim()) && { opacity: 0.4 }]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.applyBtnLabel}>
                        {applyingPromo ? '...' : 'APPLY'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isRosterCode && !promoApplied && (
                  <View>
                    <Text style={[typography.label, { fontSize: 9, color: colors.gold, marginBottom: 12 }]}>
                      {rosterMemberName} — SELECT ITEM FOR 50% OFF
                    </Text>
                    {items.map(item => (
                      <TouchableOpacity
                        key={`${item.slug}_${item.size}`}
                        onPress={() => !applyingRosterItem && handleSelectRosterItem(item)}
                        disabled={applyingRosterItem}
                        style={[styles.rosterItem, applyingRosterItem && { opacity: 0.5 }]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.rosterItemName}>
                          {item.name} / {item.size}
                        </Text>
                        <Text style={styles.rosterItemDiscount}>
                          −{formatPrice(Math.round(item.priceCents * 0.5))}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {promoApplied && (
                  <View style={styles.promoAppliedRow}>
                    <Text style={styles.promoAppliedLabel}>
                      {promoCode.toUpperCase()} {promoLabel}
                    </Text>
                    <Text style={styles.promoAppliedValue}>
                      −{formatPrice(discountCents)}
                    </Text>
                  </View>
                )}

                {promoError && (
                  <Text style={styles.promoErrorText}>{promoError}</Text>
                )}
              </View>

              <OrderSummary />

              <GhostButton
                label="CONTINUE"
                onPress={() => { if (step2Valid()) setStep(3); }}
                fullWidth
                style={[styles.continueBtn, !step2Valid() && { opacity: 0.4 }]}
              />
            </View>
          )}

          {/* ── STEP 3: PAYMENT ── */}
          {step === 3 && (
            <View style={styles.formSection}>
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.gold} size="small" />
                  <Text style={styles.loadingText}>PREPARING PAYMENT...</Text>
                </View>
              )}

              {initError && (
                <Text style={styles.errorText}>{initError}</Text>
              )}

              {!loading && !initError && (
                <>
                  <OrderSummary />

                  {payError && (
                    <Text style={styles.errorText}>{payError}</Text>
                  )}

                  <GhostButton
                    label={paying ? 'PROCESSING...' : `PAY ${formatPrice(finalTotal)}`}
                    onPress={handlePay}
                    fullWidth
                    style={[styles.continueBtn, (!sheetReady || paying) && { opacity: 0.5 }]}
                  />
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── FIELD HELPER ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 1.62,
    textTransform: 'uppercase',
    color: colors.foreground,
    marginBottom: 8,
  },
});

// ── SUMMARY LINE ─────────────────────────────────────────────────────────────
function SummaryLine({ label, value, gold, small }: { label: string; value: string; gold?: boolean; small?: boolean }) {
  return (
    <View style={sumStyles.row}>
      <Text style={sumStyles.label}>{label}</Text>
      <Text style={[sumStyles.value, gold && { color: colors.gold }, small && { fontSize: 8 }]}>
        {value}
      </Text>
    </View>
  );
}

const sumStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 1.98,
    textTransform: 'uppercase',
    color: colors.foreground,
  },
  value: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 11,
    letterSpacing: 0.88,
    color: colors.gold,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.screenPaddingH,
    paddingBottom: 48,
  },
  // Step indicator
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: 28,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepLabel: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 8,
    letterSpacing: 1.76,
    textTransform: 'uppercase',
    color: 'rgba(245,240,232,0.3)',
  },
  stepLabelActive: {
    color: colors.gold,
  },
  stepLabelDone: {
    color: colors.foreground,
  },
  // Form
  formSection: {
    gap: 0,
  },
  input: {
    height: 44,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.divider,
    color: colors.foreground,
    fontFamily: 'HelveticaNeue-Light',
    fontSize: 12,
    letterSpacing: 0.6,
    paddingHorizontal: 14,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  continueBtn: {
    marginTop: 24,
  },
  // Promo
  promoBlock: {
    marginTop: 8,
    marginBottom: 24,
  },
  promoRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  applyBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnLabel: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 1.98,
    textTransform: 'uppercase',
    color: colors.foreground,
  },
  rosterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 8,
  },
  rosterItemName: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.foreground,
    textTransform: 'uppercase',
    flex: 1,
  },
  rosterItemDiscount: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.gold,
  },
  promoAppliedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  promoAppliedLabel: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 1.62,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  promoAppliedValue: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 11,
    color: colors.gold,
  },
  promoErrorText: {
    fontFamily: 'HelveticaNeue-Light',
    fontSize: 10,
    color: colors.error,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  // Summary
  summaryContainer: {
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 8,
  },
  summaryItemName: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.foreground,
    textTransform: 'uppercase',
    flex: 1,
  },
  summaryItemMeta: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 8,
    letterSpacing: 1.2,
    color: colors.foreground,
    textTransform: 'uppercase',
    flex: 1,
    textAlign: 'center',
  },
  summaryItemPrice: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.gold,
    textAlign: 'right',
    flex: 0,
    minWidth: 60,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 8,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  summaryTotalLabel: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 1.98,
    textTransform: 'uppercase',
    color: colors.foreground,
  },
  summaryTotalValue: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 1.98,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  // Loading / error
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 2.52,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  errorText: {
    fontFamily: 'HelveticaNeue-Light',
    fontSize: 11,
    color: colors.error,
    letterSpacing: 0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
});
