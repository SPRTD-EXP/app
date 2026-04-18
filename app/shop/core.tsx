'use client';

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiGet } from '../../lib/api';
import { type Product, formatPrice } from '../../lib/products';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import LoginModal from '../../components/LoginModal';
import CartDrawer from '../../components/CartDrawer';
import { colors, typography, spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 16;
const CARD_PADDING = spacing.screenPaddingH;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ urls: string[] }>('/api/product-images', {
      product: product.name,
      colorway: 'black',
    })
      .then(({ urls }) => { if (urls?.length) setImageUrl(urls[0]); })
      .catch(() => {});
  }, [product.name]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/shop/${product.slug}` as any)}
      activeOpacity={0.85}
    >
      <View style={styles.cardImage}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
          />
        ) : (
          <View style={styles.cardImagePlaceholder} />
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.cardPrice}>{formatPrice(product.price_cents)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ShopCoreScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    apiGet<{ products: Product[] }>('/api/products')
      .then(({ products }) => { if (products) setProducts(products); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Navbar
        onLoginPress={() => setLoginOpen(true)}
        onCartPress={() => setCartOpen(true)}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={[typography.label, { textAlign: 'center' }]}>NO PRODUCTS FOUND</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={p => String(p.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>SHOP</Text>
          }
          renderItem={({ item }) => <ProductCard product={item} />}
        />
      )}

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    ...typography.label,
    fontSize: 8,
    letterSpacing: 3,
    textAlign: 'center',
    paddingVertical: 20,
  },
  listContent: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 40,
  },
  row: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP + 4,
  },
  card: {
    width: CARD_WIDTH,
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    backgroundColor: colors.dark,
    overflow: 'hidden',
  },
  cardImagePlaceholder: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  cardInfo: {
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 4,
  },
  cardName: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.gold,
    textTransform: 'uppercase',
    flex: 1,
  },
  cardPrice: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.gold,
  },
});
