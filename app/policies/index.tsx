import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../../theme';

// ─── Tab definitions ────────────────────────────────────────────────────────

const TABS = [
  { key: 'privacy',  label: 'PRIVACY' },
  { key: 'terms',    label: 'TERMS' },
  { key: 'returns',  label: 'RETURNS' },
  { key: 'shipping', label: 'SHIPPING' },
  { key: 'cookies',  label: 'COOKIES' },
] as const;

type TabKey = typeof TABS[number]['key'];

// ─── Shared text style helpers ───────────────────────────────────────────────

function SectionHeading({ children }: { children: string }) {
  return <Text style={styles.sectionHeading}>{children}</Text>;
}
function Body({ children }: { children: string }) {
  return <Text style={styles.body}>{children}</Text>;
}

// ─── Policy content components ───────────────────────────────────────────────

function PrivacyPolicy() {
  return (
    <>
      <Body>Last updated: March 2026</Body>
      <Body>
        SPRTD ("we," "us," or "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you visit sprtd.co or make a purchase.
      </Body>

      <SectionHeading>INFORMATION WE COLLECT</SectionHeading>
      <Body>
        We collect information you provide directly, including your name, email address, shipping address, phone number, and payment details when you place an order or create an account. We also automatically collect certain technical data such as IP address, browser type, device information, and browsing behavior on our site.
      </Body>

      <SectionHeading>HOW WE USE YOUR INFORMATION</SectionHeading>
      <Body>
        Your information is used to process and fulfill orders, send order confirmations and shipping updates, respond to customer service inquiries, improve our website and product offerings, and, where you have opted in, send marketing communications.
      </Body>

      <SectionHeading>THIRD-PARTY SERVICES</SectionHeading>
      <Body>
        We share data with trusted third parties solely to operate our business. Payment processing is handled by Stripe, Inc. Order data is stored securely via Supabase. Transactional emails are sent through Resend. These services have their own privacy policies and are contractually obligated to protect your information.
      </Body>

      <SectionHeading>DATA RETENTION</SectionHeading>
      <Body>
        We retain your personal data for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, and resolve disputes. Order records are retained for a minimum of five years for accounting and tax purposes.
      </Body>

      <SectionHeading>YOUR RIGHTS</SectionHeading>
      <Body>
        You have the right to access, correct, or delete your personal data at any time. To make a request, contact us at info@sprtd.co. We will respond within 30 days.
      </Body>

      <SectionHeading>SECURITY</SectionHeading>
      <Body>
        We implement industry-standard security measures to protect your information, including SSL encryption on all data transmissions and secure storage practices. However, no method of electronic transmission is 100% secure.
      </Body>

      <SectionHeading>CONTACT</SectionHeading>
      <Body>For privacy-related questions, email us at info@sprtd.co.</Body>
    </>
  );
}

function TermsConditions() {
  return (
    <>
      <Body>Last updated: March 2026</Body>
      <Body>
        By accessing or using sprtd.co, you agree to be bound by these Terms & Conditions. Please read them carefully before placing an order or using our services.
      </Body>

      <SectionHeading>USE OF THE WEBSITE</SectionHeading>
      <Body>
        You agree to use this website only for lawful purposes and in a manner that does not infringe the rights of others. You may not reproduce, distribute, or modify any content from this site without written permission from SPRTD.
      </Body>

      <SectionHeading>ACCOUNT RESPONSIBILITY</SectionHeading>
      <Body>
        If you create an account, you are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify us immediately at info@sprtd.co if you suspect unauthorized access.
      </Body>

      <SectionHeading>TERMS OF SALE</SectionHeading>
      <Body>
        All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order at our discretion. Prices are listed in USD and are subject to change without notice. We are not responsible for pricing errors and reserve the right to cancel orders placed at an incorrect price.
      </Body>

      <SectionHeading>PAYMENT</SectionHeading>
      <Body>
        Payment is processed securely through Stripe. By placing an order, you represent that you are authorized to use the payment method provided. All transactions are subject to Stripe's terms of service.
      </Body>

      <SectionHeading>INTELLECTUAL PROPERTY</SectionHeading>
      <Body>
        All content on this website — including logos, images, text, and designs — is the property of SPRTD and is protected by applicable copyright and trademark laws. Unauthorized use is strictly prohibited.
      </Body>

      <SectionHeading>LIMITATION OF LIABILITY</SectionHeading>
      <Body>
        To the fullest extent permitted by law, SPRTD shall not be liable for any indirect, incidental, or consequential damages arising from your use of our website or products. Our total liability in any matter shall not exceed the amount you paid for the relevant order.
      </Body>

      <SectionHeading>GOVERNING LAW</SectionHeading>
      <Body>
        These Terms are governed by the laws of the State of Michigan, United States. Any disputes shall be resolved in the courts of Michigan.
      </Body>

      <SectionHeading>CHANGES TO TERMS</SectionHeading>
      <Body>
        We reserve the right to update these Terms at any time. Continued use of our website after changes constitutes acceptance of the updated Terms.
      </Body>

      <SectionHeading>CONTACT</SectionHeading>
      <Body>Questions about these Terms? Email us at info@sprtd.co.</Body>
    </>
  );
}

function ReturnPolicy() {
  return (
    <>
      <Body>Last updated: March 2026</Body>
      <Body>
        We want you to be fully satisfied with your SPRTD purchase. Please review our return and refund policy below before placing your order.
      </Body>

      <SectionHeading>RETURN WINDOW</SectionHeading>
      <Body>
        Returns are accepted within 14 days of the delivery date. Items must be unworn, unwashed, and in original condition with all tags attached. Items that show signs of wear, alterations, or damage will not be accepted.
      </Body>

      <SectionHeading>NON-RETURNABLE ITEMS</SectionHeading>
      <Body>
        The following items are final sale and cannot be returned or exchanged: sale items, limited-edition drops, and any item marked as non-returnable at the time of purchase.
      </Body>

      <SectionHeading>HOW TO INITIATE A RETURN</SectionHeading>
      <Body>
        To start a return, email info@sprtd.co with your order number and reason for return. We will provide return instructions within 2 business days. Returns sent without prior authorization will not be accepted.
      </Body>

      <SectionHeading>RETURN SHIPPING</SectionHeading>
      <Body>
        Customers are responsible for return shipping costs unless the item arrived damaged or incorrect. We recommend using a trackable shipping method — SPRTD is not responsible for lost return packages.
      </Body>

      <SectionHeading>REFUNDS</SectionHeading>
      <Body>
        Once your return is received and inspected, we will notify you of the approval or rejection of your refund. Approved refunds are processed to your original payment method within 5–10 business days. Original shipping charges are non-refundable.
      </Body>

      <SectionHeading>EXCHANGES</SectionHeading>
      <Body>
        We do not process direct exchanges. If you need a different size or item, please return your original order for a refund and place a new order.
      </Body>

      <SectionHeading>DAMAGED OR INCORRECT ITEMS</SectionHeading>
      <Body>
        If you received a damaged or incorrect item, contact us at info@sprtd.co within 48 hours of delivery with your order number and photos. We will resolve the issue at no cost to you.
      </Body>
    </>
  );
}

function ShippingPolicy() {
  return (
    <>
      <Body>Last updated: March 2026</Body>
      <Body>
        All orders are processed and shipped from Michigan, United States as pre-order items.
      </Body>

      <SectionHeading>PROCESSING TIME</SectionHeading>
      <Body>
        Orders are processed within 1–3 business days of payment confirmation. Orders placed on weekends or holidays will begin processing the next business day. You will receive an email with tracking information once your order ships.
      </Body>

      <SectionHeading>DOMESTIC SHIPPING (UNITED STATES)</SectionHeading>
      <Body>
        Standard shipping typically takes 2-3 weeks after processing. Expedited options may be available at checkout. Delivery estimates are provided by the carrier and are not guaranteed.
      </Body>

      <SectionHeading>INTERNATIONAL SHIPPING</SectionHeading>
      <Body>
        We currently ship to select international destinations. International orders typically take 7–21 business days depending on destination and customs clearance. The customer is responsible for any applicable import duties, taxes, or customs fees.
      </Body>

      <SectionHeading>ORDER TRACKING</SectionHeading>
      <Body>
        A tracking number will be sent to your email once your order has shipped. You can use this number to track your shipment directly through the carrier's website.
      </Body>

      <SectionHeading>LOST OR DELAYED PACKAGES</SectionHeading>
      <Body>
        SPRTD is not responsible for delays caused by the carrier or customs. If your package is significantly delayed or marked delivered but not received, contact us at info@sprtd.co and we will work with you to resolve the issue.
      </Body>

      <SectionHeading>ADDRESS ACCURACY</SectionHeading>
      <Body>
        Please ensure your shipping address is correct before placing your order. SPRTD is not responsible for packages delivered to an incorrect address provided at checkout. Address change requests must be made before the order ships.
      </Body>
    </>
  );
}

function CookiePolicy() {
  return (
    <>
      <Body>Last updated: March 2026</Body>
      <Body>
        This Cookie Policy explains how SPRTD uses cookies and similar tracking technologies on sprtd.co.
      </Body>

      <SectionHeading>WHAT ARE COOKIES</SectionHeading>
      <Body>
        Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and understand how you interact with the site.
      </Body>

      <SectionHeading>COOKIES WE USE</SectionHeading>
      <Body>
        Essential Cookies — Required for the website to function. These include session cookies that keep you logged in and remember your cart contents. These cannot be disabled.
      </Body>
      <Body>
        Analytics Cookies — Used to understand how visitors interact with our website, such as which pages are visited most. This data is aggregated and anonymous.
      </Body>
      <Body>
        Payment Cookies — Set by Stripe to securely process payments and prevent fraud.
      </Body>

      <SectionHeading>THIRD-PARTY COOKIES</SectionHeading>
      <Body>
        Some cookies on our site are set by third-party services such as Stripe. These are governed by the respective third party's cookie policies and are outside our direct control.
      </Body>

      <SectionHeading>MANAGING COOKIES</SectionHeading>
      <Body>
        You can control and delete cookies through your browser settings. Note that disabling certain cookies may affect the functionality of our website — for example, your cart may not persist between sessions.
      </Body>

      <SectionHeading>CHANGES TO THIS POLICY</SectionHeading>
      <Body>
        We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated date.
      </Body>

      <SectionHeading>CONTACT</SectionHeading>
      <Body>Questions about our use of cookies? Email us at info@sprtd.co.</Body>
    </>
  );
}

const CONTENT: Record<TabKey, React.ReactNode> = {
  privacy:  <PrivacyPolicy />,
  terms:    <TermsConditions />,
  returns:  <ReturnPolicy />,
  shipping: <ShippingPolicy />,
  cookies:  <CookiePolicy />,
};

const TAB_HEADING: Record<TabKey, string> = {
  privacy:  'PRIVACY POLICY',
  terms:    'TERMS & CONDITIONS',
  returns:  'RETURN & REFUND POLICY',
  shipping: 'SHIPPING POLICY',
  cookies:  'COOKIE POLICY',
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function PoliciesScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('privacy');

  return (
    <SafeAreaView style={styles.container}>
      {/* Page label */}
      <View style={styles.pageLabelRow}>
        <Text style={styles.pageLabelText}>POLICIES</Text>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
        style={styles.tabBarScroll}
      >
        {TABS.map(({ key, label }) => {
          const isActive = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key)}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {label}
              </Text>
              <View style={[styles.tabUnderline, isActive && styles.tabUnderlineActive]} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active policy heading */}
        <Text style={styles.policyHeading}>{TAB_HEADING[activeTab]}</Text>

        {CONTENT[activeTab]}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageLabelRow: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  pageLabelText: {
    ...typography.label,
    fontSize: 8,
    letterSpacing: 2.4,
  },
  tabBarScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 28,
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  tabLabel: {
    fontFamily: 'HelveticaNeue-Light',
    fontSize: 9,
    fontWeight: '300',
    letterSpacing: 1.98, // 0.22em
    textTransform: 'uppercase',
    color: 'rgba(245, 240, 232, 0.4)',
  },
  tabLabelActive: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    color: colors.gold,
  },
  tabUnderline: {
    height: 1,
    width: '100%',
    backgroundColor: 'transparent',
    marginTop: 6,
  },
  tabUnderlineActive: {
    backgroundColor: colors.gold,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    alignItems: 'center',
  },
  policyHeading: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1.4,
    color: colors.foreground,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 28,
  },
  sectionHeading: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 9,
    letterSpacing: 2.52,
    color: colors.gold,
    textTransform: 'uppercase',
    marginTop: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 12,
    lineHeight: 22.8, // 1.9 * 12
    letterSpacing: 0.48, // 0.04em
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: 560,
  },
  bottomPad: {
    height: 48,
  },
});
