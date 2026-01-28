import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartItem } from "@/types/cart";

interface CartState {
  cart: CartItem[];
  isClearConfirming: boolean;
  upsellTriggered: boolean;

  // Actions
  addToCart: (item: CartItem) => void;
  updateQuantity: (id: string | number, delta: number) => void;
  removeFromCart: (id: string | number) => void;
  clearCart: () => void;
  setClearConfirming: (status: boolean) => void;
  setUpsellTriggered: (status: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      isClearConfirming: false,
      upsellTriggered: false,

      addToCart: (item) =>
        set((state) => {
          // Check for duplicate (same ID + same modifiers)
          const existingIndex = state.cart.findIndex(
            (cartItem) =>
              cartItem.id === item.id &&
              JSON.stringify(cartItem.selectedModifiers) ===
                JSON.stringify(item.selectedModifiers),
          );

          if (existingIndex !== -1) {
            const newCart = [...state.cart];
            newCart[existingIndex].quantity += item.quantity;
            return { cart: newCart };
          }

          return { cart: [...state.cart, item] };
        }),

      updateQuantity: (id, delta) =>
        set((state) => {
          const newCart = state.cart
            .map((item) => {
              if (item.cartId === id || (!item.cartId && item.id === id)) {
                return {
                  ...item,
                  quantity: Math.max(0, item.quantity + delta),
                };
              }
              return item;
            })
            .filter((item) => item.quantity > 0);
          return { cart: newCart };
        }),

      removeFromCart: (id) =>
        set((state) => ({
          cart: state.cart.filter(
            (item) => item.cartId !== id && item.id !== id,
          ),
        })),

      clearCart: () => set({ cart: [], isClearConfirming: false }),
      setClearConfirming: (status) => set({ isClearConfirming: status }),
      setUpsellTriggered: (status) => set({ upsellTriggered: status }),
    }),
    {
      name: "kiosk-cart-storage",
      storage: createJSONStorage(() => localStorage),
      // Optional: Partialize to only save cart, not UI state like confirming
      partialize: (state) => ({ cart: state.cart }),
    },
  ),
);
