import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Modal,
  useWindowDimensions,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCart, CartItem } from '../context/CartContext';
import { formatPrice } from '../lib/products';
import { colors } from '../theme';
import GhostButton from './GhostButton';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function CartDrawer({ visible, onClose }: Props) {
  const router = useRouter();
  const { items, removeItem, updateQuantity } = useCart();
  const { width, height } = useWindowDimensions();

  const drawerWidth = width * 0.85;
  const translateX = useRef(new Animated.Value(drawerWidth)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : drawerWidth,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [visible, drawerWidth]);

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );

  const handleCheckout = () => {
    onClose();
    router.push('/checkout' as any);
  };

  const renderItem = ({ item }: ListRenderItemInfo<CartItem>) => {
    const attrValues = item.attributes ? Object.values(item.attributes) : [];
    const descriptor = [item.size, ...attrValues].filter(Boolean).join(' · ');

    return (
      <View style={styles.item}>
        {/* Product info */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {!!descriptor && (
            <Text style={styles.itemDescriptor}>{descriptor}</Text>
          )}
        </View>

        {/* Qty + price + remove */}
        <View style={styles.itemControls}>
          {/* Quantity */}
          <View style={styles.qtyRow}>
            <TouchableOpacity
              onPress={() =>
                updateQuantity(
                  item.productId,
                  item.size,
                  item.quantity - 1,
                  item.attributes,
                )
              }
              style={styles.qtyBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>

            <Text style={styles.qtyValue}>{item.quantity}</Text>

            <TouchableOpacity
              onPress={() =>
                updateQuantity(
                  item.productId,
                  item.size,
                  item.quantity + 1,
                  item.attributes,
                )
              }
              style={styles.qtyBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Price */}
          <Text style={styles.itemPrice}>
            {formatPrice(item.priceCents * item.quantity)}
          </Text>

          {/* Remove */}
          <TouchableOpacity
            onPress={() =>
              removeItem(item.productId, item.size, item.attributes)
            }
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.removeBtn}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!visible && translateX._value === drawerWidth) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.root, { width, height }]}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />

        {/* Drawer panel */}
        <Animated.View
          style={[
            styles.drawer,
            { width: drawerWidth, transform: [{ translateX }] },
          ]}
        >
          {/* Header */}
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>CART</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.closeBtnText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyHeading}>YOUR CART IS EMPTY</Text>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  router.push('/shop' as any);
                }}
              >
                <Text style={styles.shopLink}>SHOP</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={item =>
                `${item.productId}_${item.size}_${JSON.stringify(
                  item.attributes ?? {},
                )}`
              }
              renderItem={renderItem}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Footer */}
          {items.length > 0 && (
            <View style={styles.drawerFooter}>
              <View style={styles.subtotalRow}>
                <Text style={styles.subtotalLabel}>SUBTOTAL</Text>
                <Text style={styles.subtotalValue}>
                  {formatPrice(subtotalCents)}
                </Text>
              </View>
              <GhostButton
                label="PROCEED TO CHECKOUT"
                onPress={handleCheckout}
                fullWidth
              />
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    height: '100%',
    backgroundColor: colors.background,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.divider,
    flexDirection: 'column',
  },
  // Header
  drawerHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    paddingHorizontal: 24,
  },
  drawerTitle: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 8,
    letterSpacing: 2.8,     // 0.35 * 8
    color: colors.gold,
    textTransform: 'uppercase',
  },
  closeBtn: {
    position: 'absolute',
    right: 24,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 20,
    color: colors.foreground,
    lineHeight: 24,
  },
  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
  },
  // Item
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  itemName: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.gold,
    textTransform: 'uppercase',
  },
  itemDescriptor: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 8,
    letterSpacing: 1.2,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 14,
    color: 'rgba(245,240,232,0.4)',
    lineHeight: 18,
  },
  qtyValue: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 10,
    color: colors.foreground,
    minWidth: 12,
    textAlign: 'center',
  },
  itemPrice: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 10,
    letterSpacing: 1,
    color: colors.gold,
    minWidth: 52,
    textAlign: 'right',
  },
  removeBtn: {
    fontSize: 16,
    color: 'rgba(245,240,232,0.6)',
    lineHeight: 20,
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingBottom: 80,
  },
  emptyHeading: {
    fontFamily: 'HelveticaNeue-Bold',
    fontWeight: '700',
    fontSize: 22,
    letterSpacing: -0.2,
    color: colors.goldLight,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  shopLink: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 10,
    letterSpacing: 2.2,
    color: colors.foreground,
    textTransform: 'uppercase',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(245,240,232,0.4)',
    paddingBottom: 2,
  },
  // Footer
  drawerFooter: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    gap: 16,
  },
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subtotalLabel: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 9,
    letterSpacing: 2,
    color: colors.foreground,
    textTransform: 'uppercase',
  },
  subtotalValue: {
    fontFamily: 'HelveticaNeue-Light',
    fontWeight: '300',
    fontSize: 13,
    letterSpacing: 2,
    color: colors.gold,
  },
});
