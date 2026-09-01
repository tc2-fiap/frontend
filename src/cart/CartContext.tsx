import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

export interface CartItem {
  gameId: string;
  title: string;
  price: number;
  coverImageUrl?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (gameId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function storageKey(userId: string | undefined): string {
  return `fiap-games.cart.${userId ?? 'anon'}`;
}

function readCart(userId: string | undefined): CartItem[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(userId: string | undefined, items: CartItem[]): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(items));
  } catch {
    /* localStorage unavailable (private mode, quota) — cart just won't persist */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [loadedForUserId, setLoadedForUserId] = useState(userId);
  const [items, setItems] = useState<CartItem[]>(() => readCart(userId));

  // Switching accounts (including logging out) swaps to that account's own
  // persisted cart instead of carrying the previous user's items over. On an
  // actual logout (a real user id -> anonymous), also wipe the anonymous
  // bucket so nothing lingers for the next person on a shared machine.
  // Adjusted during render (React's prescribed pattern for resetting state
  // when a derived value changes) rather than in an effect, to avoid an
  // extra commit-then-recommit render pass.
  if (loadedForUserId !== userId) {
    if (loadedForUserId && !userId) {
      try {
        localStorage.removeItem(storageKey(undefined));
      } catch {
        /* best-effort only */
      }
    }
    setLoadedForUserId(userId);
    setItems(readCart(userId));
  }

  useEffect(() => {
    writeCart(userId, items);
  }, [userId, items]);

  const value = useMemo<CartContextValue>(() => {
    const total = items.reduce((sum, item) => sum + item.price, 0);
    return {
      items,
      count: items.length,
      total,
      addItem: (item) =>
        setItems((prev) => (prev.some((i) => i.gameId === item.gameId) ? prev : [...prev, item])),
      removeItem: (gameId) => setItems((prev) => prev.filter((i) => i.gameId !== gameId)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
