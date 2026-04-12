import { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  priceCents: number;
  size: string;
  quantity: number;
  stripeProductId?: string;
  stripePriceId?: string;
  attributes?: Record<string, string>;
};

function itemKey(productId: number, size: string, attributes?: Record<string, string>) {
  const attrStr = attributes ? JSON.stringify(Object.entries(attributes).sort()) : '';
  return `${productId}_${size}_${attrStr}`;
}

type CartContextType = {
  items: CartItem[];
  itemCount: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: number, size: string, attributes?: Record<string, string>) => void;
  updateQuantity: (productId: number, size: string, qty: number, attributes?: Record<string, string>) => void;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType>({
  items: [],
  itemCount: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: async () => {},
});

const STORAGE_KEY = 'sprtd_cart_v2';

async function getLocalItems(): Promise<CartItem[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();
  const prevUserRef = useRef<string | null>(null);

  // On mount: load AsyncStorage (guest state, before auth resolves)
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setItems(JSON.parse(stored));
      } catch {}
    })();
  }, []);

  // Handle login / logout transitions
  useEffect(() => {
    const prevId = prevUserRef.current;
    const currId = user?.id ?? null;
    prevUserRef.current = currId;

    if (currId && !prevId) {
      handleLogin(currId);
    } else if (!currId && prevId) {
      setItems([]);
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Persist to AsyncStorage only when guest
  useEffect(() => {
    if (!user) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
    }
  }, [items, user]);

  async function handleLogin(userId: string) {
    const localItems = await getLocalItems();
    await AsyncStorage.removeItem(STORAGE_KEY); // Clear immediately — DB is source of truth from this point

    const { data: dbItems, error } = await supabase
      .from('cart_items')
      .select('*, products(id, slug, name, price_cents)')
      .eq('user_id', userId);

    if (error) return;

    if (dbItems && dbItems.length > 0) {
      const dbCart = dbItems.map(row => {
        const p = row.products as { id: number; slug: string; name: string; price_cents: number };
        return {
          productId: p.id, slug: p.slug, name: p.name, priceCents: p.price_cents,
          size: row.size, quantity: row.quantity,
          attributes: (row.attributes && Object.keys(row.attributes).length > 0) ? row.attributes : undefined,
        };
      });
      setItems(dbCart);
    } else if (localItems.length > 0) {
      await Promise.all(localItems.map(item =>
        supabase.from('cart_items').insert({
          user_id: userId, product_id: item.productId, size: item.size,
          quantity: item.quantity, attributes: item.attributes ?? {},
        })
      ));
      setItems(localItems);
    } else {
      setItems([]);
    }
  }

  async function addItem(item: Omit<CartItem, 'quantity'>) {
    setItems(prev => {
      const idx = prev.findIndex(i => itemKey(i.productId, i.size, i.attributes) === itemKey(item.productId, item.size, item.attributes));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { ...item, quantity: 1 }];
    });

    if (user) {
      const attrs = item.attributes ?? {};
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', item.productId)
        .eq('size', item.size)
        .eq('attributes', attrs)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('cart_items')
          .update({ quantity: existing.quantity + 1 })
          .eq('id', existing.id);
        if (error) console.error('Failed to update cart item:', error);
      } else {
        const { error } = await supabase.from('cart_items')
          .insert({ user_id: user.id, product_id: item.productId, size: item.size, quantity: 1, attributes: attrs });
        if (error) console.error('Failed to add cart item:', error);
      }
    }
  }

  async function removeItem(productId: number, size: string, attributes?: Record<string, string>) {
    const key = itemKey(productId, size, attributes);
    setItems(prev => prev.filter(i => itemKey(i.productId, i.size, i.attributes) !== key));
    if (user) {
      const attrs = attributes ?? {};
      const { data: existing } = await supabase
        .from('cart_items').select('id')
        .eq('user_id', user.id).eq('product_id', productId).eq('size', size)
        .eq('attributes', attrs).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('cart_items').delete().eq('id', existing.id);
        if (error) console.error('Failed to remove cart item:', error);
      }
    }
  }

  async function updateQuantity(productId: number, size: string, qty: number, attributes?: Record<string, string>) {
    if (qty < 1) { removeItem(productId, size, attributes); return; }
    const key = itemKey(productId, size, attributes);
    setItems(prev => prev.map(i =>
      itemKey(i.productId, i.size, i.attributes) === key ? { ...i, quantity: qty } : i
    ));
    if (user) {
      const attrs = attributes ?? {};
      const { data: existing } = await supabase
        .from('cart_items').select('id')
        .eq('user_id', user.id).eq('product_id', productId).eq('size', size)
        .eq('attributes', attrs).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('cart_items').update({ quantity: qty }).eq('id', existing.id);
        if (error) console.error('Failed to update cart quantity:', error);
      }
    }
  }

  const clearCart = async () => {
    setItems([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
    }
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
