"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  product: {
    id: string;
    slug: string;
    name: string;
    image_url: string;
  };
};

type CartState = {
  id: string | null;
  items: CartItem[];
  subtotal: number;
  item_count: number;
};

type CartContextValue = CartState & {
  isLoading: boolean;
  isOpen: boolean;
  storeSlug: string;
  openCart: () => void;
  closeCart: () => void;
  refresh: () => Promise<void>;
  addItem: (payload: { product_id: string; quantity?: number }) => Promise<void>;
  updateQuantity: (item_id: string, quantity: number) => Promise<void>;
  removeItem: (item_id: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ storeSlug, children }: { storeSlug: string; children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ id: null, items: [], subtotal: 0, item_count: 0 });
  const [isLoading, setLoading] = useState(true);
  const [isOpen, setOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cart?store_slug=${storeSlug}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setState({
          id: json.id ?? null,
          items: json.items ?? [],
          subtotal: json.subtotal ?? 0,
          item_count: json.item_count ?? 0,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeSlug]);

  const value = useMemo<CartContextValue>(
    () => ({
      ...state,
      isLoading,
      isOpen,
      storeSlug,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      refresh,
      addItem: async ({ product_id, quantity = 1 }) => {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product_id, quantity, store_slug: storeSlug }),
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          console.error('[cart] POST /api/cart failed', res.status, errText);
          throw new Error(`Cart error: ${res.status} ${errText}`);
        }
        await refresh();
        setOpen(true);
      },
      updateQuantity: async (item_id, quantity) => {
        await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id, quantity }),
        });
        await refresh();
      },
      removeItem: async (item_id) => {
        await fetch(`/api/cart/${item_id}`, { method: "DELETE" });
        await refresh();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, isLoading, isOpen, storeSlug],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
