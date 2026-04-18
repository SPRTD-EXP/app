import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiGet } from '../../lib/api';
import { type Product, type Colorway, COLORWAYS, formatPrice } from '../../lib/products';
import { useCart } from '../../context/CartContext';
import { colors, typography } from '../../theme';
import SizeChartModal from '../../components/SizeChart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SWATCH_COLORS: Record<string, string> = {
  black: '#1a1a1a',
  blue:  '#1a3a6b',
  pink:  '#d4a0a0',
  red:   '#8b1a1a',
};

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  const [selectedColorway, setSelectedColorway] = useState<Colorway>('black');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});

  const [addedFeedback, setAddedFeedback] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const imageListRef = useRef<FlatList>(null);

  // Load product
  useEffect(() => {
    if (!slug) return;
    apiGet<{ product: Product }>('/api/products', { slug })
      .then(({ product }) => {
        setProduct(product);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  // Reset variations when product changes
  useEffect(() => {
    if (!product) return;
    setSelectedVariations({});
  }, [product]);

  // Fetch images whenever product or colorway changes
  useEffect(() => {
    if (!product) return;
    setImagesLoading(true);
    setActiveImageIndex(0);
    apiGet<{ urls: string[] }>('/api/product-images', {
      product: product.name,
      colorway: selectedColorway,
    })
      .then(({ urls }) => {
        setImageUrls(urls ?? []);
      })
      .catch(() => setImageUrls([]))
      .finally(() => setImagesLoading(false));
  }, [product, selectedColorway]);

  function handleColorwaySelect(cw: Colorway) {
    setSelectedColorway(cw);
  }

  function handleSizeSelect(size: string) {
    setSelectedSize(size);
    setSizeError(false);
  }

  function handleVariationSelect(axisName: string, value: string) {
    setSelectedVariations(prev => ({ ...prev, [axisName]: value }));
  }

  function handleAddToCart() {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    if (!product) return;
    setSizeError(false);
    const attributes: Record<string, string> = {
      colorway: selectedColorway,
      ...selectedVariations,
    };
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.price_cents,
      size: selectedSize,
      stripeProductId: product.stripe_product_id,
      stripePriceId: product.stripe_price_id,
      attributes,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  }

  function handleScroll(event: { nativeEvent: { contentOffset: { x: number } } }) {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveImageIndex(index);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={[typography.label, { textAlign: 'center' }]}>PRODUCT NOT FOUND</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasImages = imageUrls.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← BACK</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Image carousel */}
        <View style={styles.imageSection}>
          {imagesLoading ? (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : hasImages ? (
            <FlatList
              ref={imageListRef}
              data={imageUrls}
              keyExtractor={(_, i) => String(i)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              renderItem={({ item: url }) => (
                <Image
                  source={{ uri: url }}
                  style={{ width: SCREEN_WIDTH, aspectRatio: 1 }}
                  contentFit="cover"
                />
              )}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>NO IMAGE</Text>
            </View>
          )}

          {/* Page dots */}
          {hasImages && imageUrls.length > 1 && (
            <View style={styles.dotsRow}>
              {imageUrls.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === activeImageIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Info panel */}
        <View style={styles.infoPanel}>

          {/* Name + price */}
          <View style={styles.namePriceRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>{formatPrice(product.price_cents)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Colorway swatches */}
          <View style={styles.colorwaySection}>
            <Text style={styles.colorwayLabel}>{selectedColorway.toUpperCase()}</Text>
            <View style={styles.swatchRow}>
              {COLORWAYS.map(cw => (
                <TouchableOpacity
                  key={cw}
                  onPress={() => handleColorwaySelect(cw)}
                  style={[
                    styles.swatch,
                    { backgroundColor: SWATCH_COLORS[cw] ?? '#1a1a1a' },
                    selectedColorway === cw ? styles.swatchSelected : styles.swatchUnselected,
                  ]}
                  accessibilityLabel={cw.toUpperCase()}
                />
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Variation axes */}
          {product.variations?.axes && product.variations.axes.length > 0 && (
            <View style={styles.variationsSection}>
              {product.variations.axes.map(axis => (
                <View key={axis.name} style={styles.axisGroup}>
                  <Text style={styles.axisLabel}>{axis.name.toUpperCase()}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.optionRow}
                  >
                    {axis.options.map(opt => {
                      const isSelected = selectedVariations[axis.name] === opt.label;
                      return (
                        <TouchableOpacity
                          key={opt.label}
                          onPress={() => handleVariationSelect(axis.name, opt.label)}
                          style={[
                            styles.optionButton,
                            isSelected ? styles.optionSelected : styles.optionUnselected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              isSelected ? styles.optionTextSelected : styles.optionTextUnselected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}
            </View>
          )}

          {/* Size selector */}
          <View style={styles.sizeSection}>
            <Text
              style={[
                styles.axisLabel,
                sizeError && { color: colors.error },
              ]}
            >
              {sizeError ? 'SELECT A SIZE' : 'SIZE'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionRow}
            >
              {product.sizes.map(size => {
                const isSelected = selectedSize === size;
                return (
                  <TouchableOpacity
                    key={size}
                    onPress={() => handleSizeSelect(size)}
                    style={[
                      styles.optionButton,
                      isSelected ? styles.optionSelected : styles.optionUnselected,
                      sizeError && !isSelected && styles.optionError,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected ? styles.optionTextSelected : styles.optionTextUnselected,
                        sizeError && !isSelected && { color: colors.error },
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Info text buttons */}
          <View style={styles.infoButtonRow}>
            <TouchableOpacity
              style={styles.infoTextButton}
              onPress={() => router.push('/policies')}
            >
              <Text style={styles.infoTextButtonLabel}>SHIPPING &amp; RETURNS</Text>
            </TouchableOpacity>
            {product.size_chart && (
              <TouchableOpacity
                style={styles.infoTextButton}
                onPress={() => setSizeGuideOpen(true)}
              >
                <Text style={styles.infoTextButtonLabel}>SIZE GUIDE</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ADD TO CART */}
          <TouchableOpacity
            onPress={handleAddToCart}
            style={[
              styles.addToCartButton,
              addedFeedback && styles.addToCartAdded,
            ]}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.addToCartText,
                addedFeedback && styles.addToCartTextAdded,
              ]}
            >
              {addedFeedback ? 'ADDED' : 'ADD TO CART'}
            </Text>
          </TouchableOpacity>

          {/* Description */}
          {product.description ? (
            <>
              <View style={[styles.divider, { borderColor: colors.gold }]} />
              <Text style={styles.description}>{product.description}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Shipping & Returns accordion modal */}
      <Modal
        visible={shippingOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setShippingOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShippingOpen(false)}
        >
          <TouchableOpacity
            style={styles.shippingModalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShippingOpen(false)}
            >
              <Text style={styles.modalCloseText}>CLOSE</Text>
            </TouchableOpacity>
            <Text style={[typography.label, { textAlign: 'center', marginBottom: 16 }]}>
              SHIPPING &amp; RETURNS
            </Text>
            <Text style={styles.shippingBody}>
              FREE STANDARD SHIPPING ON ORDERS OVER $100.{'\n\n'}
              STANDARD SHIPPING: 5–7 BUSINESS DAYS{'\n'}
              EXPRESS SHIPPING: 2–3 BUSINESS DAYS{'\n\n'}
              RETURNS ACCEPTED WITHIN 30 DAYS OF DELIVERY.{'\n'}
              ITEMS MUST BE UNWORN AND IN ORIGINAL PACKAGING.{'\n\n'}
              FINAL SALE ITEMS ARE NON-RETURNABLE.
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Size guide modal */}
      {product.size_chart && (
        <SizeChartModal
          visible={sizeGuideOpen}
          onClose={() => setSizeGuideOpen(false)}
          chart={product.size_chart}
        />
      )}
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
    gap: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    fontFamily: 'HelveticaNeue-Light',
    fontSize: 9,
    fontWeight: '300',
    letterSpacing: 2,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  backLink: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.35)',
  },
  backLinkText: {
    fontFamily: 'HelveticaNeue-Light',
    fontSize: 9,
    fontWeight: '300',
    letterSpacing: 2,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  // Images
  imageSection: {
    width: SCREEN_WIDTH,
  },
  imagePlaceholder: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontFamily: 'HelveticaNeue-Light',
    fontSize: 9,
    fontWeight: '300',
    letterSpacing: 2,
    color: 'rgba(245,240,232,0.2)',
    textTransform: 'uppercase',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    backgroundColor: colors.gold,
  },
  dotInactive: {
    backgroundColor: 'rgba(245,240,232,0.25)',
  },
  // Info panel
  infoPanel: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 20,
  },
  namePriceRow: {
    gap: 8,
  },
  productName: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 28,
    letterSpacing: 2.5,
    lineHeight: 32,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  productPrice: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 13,
    letterSpacing: 2,
    color: colors.gold,
  },
  divider: {
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  // Colorway
  colorwaySection: {
    alignItems: 'center',
    gap: 12,
  },
  colorwayLabel: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: colors.gold,
  },
  swatchUnselected: {
    borderWidth: 2,
    borderColor: colors.divider,
  },
  // Variations
  variationsSection: {
    gap: 16,
  },
  axisGroup: {
    gap: 8,
  },
  axisLabel: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    borderColor: colors.gold,
  },
  optionUnselected: {
    borderColor: colors.divider,
  },
  optionError: {
    borderColor: colors.error,
  },
  optionText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  optionTextSelected: {
    color: colors.gold,
  },
  optionTextUnselected: {
    color: 'rgba(245,240,232,0.6)',
  },
  // Size
  sizeSection: {
    gap: 8,
  },
  // Info text buttons
  infoButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoTextButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.25)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextButtonLabel: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 8,
    letterSpacing: 1.8,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  // Add to cart
  addToCartButton: {
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.55)',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartAdded: {
    borderColor: colors.success,
  },
  addToCartText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.foreground,
  },
  addToCartTextAdded: {
    color: colors.success,
  },
  // Description
  description: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 12,
    lineHeight: 21,
    letterSpacing: 0.5,
    color: colors.foreground,
  },
  // Shipping modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  shippingModalContent: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.12)',
    width: '100%',
    padding: 32,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  modalCloseText: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 1.8,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  shippingBody: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 11,
    lineHeight: 20,
    letterSpacing: 0.5,
    color: 'rgba(245,240,232,0.75)',
    marginTop: 8,
  },
});
