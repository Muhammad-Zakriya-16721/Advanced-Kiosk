"use client";

import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Pencil,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  useReducedMotion,
  LayoutGroup,
} from "framer-motion";

import type { CartItem } from "@/types/cart";
import { useCartStore } from "@/store/cartStore";

// ... existing imports

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

interface CartPanelProps {
  onCheckout: () => void;
  orderNo: string;
  isKeyboardEnabled: boolean;
  isFocusedSection: boolean;
  focusedIndex: number;
  onManualFocus: (index: number) => void;
  onEdit: (item: CartItem) => void;
}

const CartPanel = ({
  onCheckout,
  orderNo,
  // Focus Props
  isKeyboardEnabled,
  isFocusedSection,
  focusedIndex,
  onManualFocus, // New Prop
  onEdit, // New Prop
}: CartPanelProps) => {
  const {
    cart,
    updateQuantity,
    isClearConfirming,
    setClearConfirming,
    clearCart,
  } = useCartStore();

  // Map store actions to component names if needed or use directly
  const cartItems = cart;
  const onUpdateQuantity = updateQuantity;
  const onTriggerClear = () => setClearConfirming(!isClearConfirming);

  const controls = useAnimation();
  const shouldReduceMotion = useReducedMotion();

  // STABLE FOCUS HANDLER
  const handleFocus = useCallback(
    (index: number) => {
      if (onManualFocus) onManualFocus(index);
    },
    [onManualFocus],
  );

  // Subtle Border Glow Animation (Replaced Heartbeat)
  useEffect(() => {
    if (cartItems.length > 0 && !shouldReduceMotion) {
      controls.start({
        borderColor: [
          "rgba(255,255,255,0.05)",
          "rgba(255, 199, 0, 0.5)",
          "rgba(255,255,255,0.05)",
        ],
        transition: { duration: 0.4, ease: "easeInOut" },
      });
    }
  }, [cartItems, controls, shouldReduceMotion]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => acc + (Number(item.price) || 0) * item.quantity,
        0,
      ),
    [cartItems],
  );
  const tax = useMemo(() => subtotal * 0.1, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  return (
    <motion.aside
      id="cart-panel"
      animate={controls}
      className="
        w-full h-full flex flex-col
        bg-[var(--glass-panel)] backdrop-blur-[var(--blur-strength)] 
        border-l border-[var(--glass-border)] 
        relative z-40
        /* Adjusted Shadow: shadow-md mobile, shadow-2xl desktop */
        shadow-2xl transition-colors duration-300
        pb-[env(safe-area-inset-bottom)]
      "
    >
      <div aria-live="polite" className="sr-only">
        Total {fmt.format(total)}
      </div>

      {/* HEADER */}
      <div className="p-4 md:p-6 border-b border-[var(--glass-border)] flex items-center justify-between bg-white/10 dark:bg-white/5 backdrop-blur-md transition-colors duration-300">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            My Order
          </h2>
          <p className="text-[var(--text-secondary)] text-xs mt-1 font-medium tracking-wider uppercase">
            Order {orderNo}
          </p>
        </div>

        {cartItems.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              if (isClearConfirming) {
                clearCart();
              } else {
                setClearConfirming(true);
                // Optional: Auto-reset timeout could be handled in store or effect here,
                // but for now keeping it simple or moving logic to store if complex.
                // Resetting after 3s:
                setTimeout(() => setClearConfirming(false), 3000);
              }
            }}
            aria-label={
              isClearConfirming ? "Confirm clear cart" : "Clear all items"
            }
            className={`
              transition-all duration-300 active:scale-95 flex items-center gap-2
              outline-none p-2 rounded-xl border cursor-pointer
              /* Safety Visual State */
              ${
                isClearConfirming
                  ? "bg-red-600 border-red-500 text-white w-auto px-4 shadow-md"
                  : "bg-white border-gray-200 dark:border-red-500/30 dark:bg-[#2A2A2A] text-red-500 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              }
            `}
          >
            {isClearConfirming ? (
              <>
                <span className="text-sm font-bold">Confirm?</span>
              </>
            ) : (
              <Trash2 size={20} />
            )}
          </button>
        ) : (
          <div className="bg-gray-100 dark:bg-brand-dark p-3 rounded-xl border border-transparent dark:border-white/5">
            <ShoppingBag size={20} className="text-brand-primary" />
          </div>
        )}
      </div>

      {/* ITEMS LIST */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 no-scrollbar">
        {/* Removed mode="popLayout" to reduce jumps */}
        <LayoutGroup id="cart-panel">
          <AnimatePresence>
            {cartItems.length === 0 ? (
              <motion.div
                initial={!shouldReduceMotion ? { opacity: 0 } : undefined}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40"
              >
                <ShoppingBag
                  size={48}
                  className="mb-4 text-gray-300 dark:text-gray-600 md:w-16 md:h-16"
                  strokeWidth={1}
                />
                <p className="text-base md:text-lg font-bold text-[var(--text-secondary)]">
                  Your tray is empty
                </p>
                <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500">
                  Tap items to add them here
                </p>
              </motion.div>
            ) : (
              cartItems.map((item, index) => {
                const isFocused =
                  isKeyboardEnabled &&
                  isFocusedSection &&
                  index === focusedIndex;
                return (
                  <CartItem
                    key={item.cartId || item.id}
                    item={item}
                    index={index}
                    onUpdateQuantity={(delta: number) =>
                      onUpdateQuantity(item.cartId || item.id, delta)
                    }
                    shouldReduceMotion={shouldReduceMotion}
                    isFocused={isFocused}
                    onFocus={handleFocus} // Stable Callback
                    onEdit={onEdit}
                  />
                );
              })
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>

      {/* FOOTER */}
      <div className="p-4 md:p-6 bg-white/20 dark:bg-black/60 backdrop-blur-md border-t border-[var(--glass-border)] mt-auto transition-colors duration-300">
        <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
          <div className="flex justify-between text-[var(--text-secondary)] text-xs md:text-sm">
            <span>Subtotal</span>
            <span className="tabular-nums">{fmt.format(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)] text-xs md:text-sm">
            <span>Tax (10%)</span>
            <span className="tabular-nums">{fmt.format(tax)}</span>
          </div>
          <div className="flex justify-between text-[var(--text-primary)] text-lg md:text-xl font-bold pt-3 md:pt-4 border-t border-[var(--glass-border)]">
            <span>Total</span>
            <span className="text-zinc-900 dark:text-brand-primary tabular-nums">
              {fmt.format(total)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCheckout}
          disabled={cartItems.length === 0}
          className="
            w-full bg-brand-primary rounded-xl md:rounded-2xl 
            flex items-center justify-between px-6 md:px-8 text-white font-black text-base md:text-lg 
            hover:brightness-110 active:scale-95 transition-all 
            disabled:opacity-50 disabled:cursor-not-allowed group
            focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1A]
            /* Increased Vertical Padding: py-4 mobile, py-5 desktop */
            py-4 md:py-5 cursor-pointer
          "
        >
          <span>Pay Now</span>
          <span className="bg-black/10 p-2 rounded-full group-hover:bg-black/20 transition-colors">
            <ArrowRight size={20} />
          </span>
        </button>
      </div>
    </motion.aside>
  );
};

const CartItem = React.memo(
  ({
    item,
    index,
    onUpdateQuantity,
    shouldReduceMotion,
    isFocused,
    onFocus,
    onEdit,
  }: {
    item: CartItem;
    index: number;
    onUpdateQuantity: (delta: number) => void;
    shouldReduceMotion: boolean | null;
    isFocused: boolean;
    onFocus: (index: number) => void;
    onEdit: (item: CartItem) => void;
  }) => {
    const handleImageError = (
      e: React.SyntheticEvent<HTMLImageElement, Event>,
    ) => {
      e.currentTarget.style.display = "none";
    };

    // Keyboard Edit Trigger
    useEffect(() => {
      if (isFocused) {
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation(); // Prevent conflicting triggers
            onEdit(item);
          }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
      }
    }, [isFocused, item, onEdit]);

    return (
      <motion.div
        layout="position"
        style={{ transform: "translateZ(0)" }} // GPU Hint
        initial={!shouldReduceMotion ? { opacity: 0, x: 20 } : undefined}
        animate={{ opacity: 1, x: 0 }}
        exit={!shouldReduceMotion ? { opacity: 0, x: -20 } : undefined}
        className={`
        bg-white/50 dark:bg-white/5 p-3 rounded-2xl flex gap-3 
        border border-[var(--glass-border)] group 
        hover:bg-white/80 dark:hover:bg-white/10 transition-colors
        ${isFocused ? "ring-4 ring-brand-primary shadow-lg z-10" : ""}
      `}
      >
        <motion.img
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          src={item.image}
          alt={item.name}
          onError={handleImageError}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="
            w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover 
            bg-gray-100 dark:bg-black/20 
            cursor-pointer hover:opacity-80 transition-opacity
            shrink-0
          "
          loading="lazy"
        />

        <div className="flex-1 flex flex-col justify-between py-1">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h4 className="text-[var(--text-primary)] font-bold text-sm md:text-base line-clamp-2 leading-tight">
                  {item.name}
                </h4>
              </div>
              {/* Display Selected Modifiers */}
              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                <div className="flex flex-col gap-0.5 mt-1">
                  {item.selectedModifiers.map((mod: any) => (
                    <span
                      key={mod.id}
                      className="text-xs text-slate-500 dark:text-slate-400 font-medium"
                    >
                      + {mod.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* Strengthened Visual Hierarchy for Price */}
            <span className="text-zinc-900 dark:text-brand-primary font-bold text-base md:text-lg tabular-nums">
              {fmt.format((Number(item.price) || 0) * item.quantity)}
            </span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onUpdateQuantity(-1)}
                aria-label="Decrease quantity"
                className="
                  w-10 h-10 md:w-11 md:h-11 
                  rounded-xl flex items-center justify-center 
                  bg-white border border-gray-200 shadow-sm text-zinc-900 
                  hover:bg-gray-100 hover:text-black hover:border-gray-300 hover:shadow-md
                  dark:bg-[#2A2A2A] dark:border-transparent dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#333]
                  transition-all duration-200 cursor-pointer
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary
                "
              >
                {item.quantity === 1 ? (
                  <Trash2 size={18} />
                ) : (
                  <Minus size={18} />
                )}
              </button>

              <span className="text-zinc-900 dark:text-white font-bold w-6 text-center text-sm md:text-base tabular-nums">
                {item.quantity}
              </span>

              <button
                type="button"
                onClick={() => onUpdateQuantity(1)}
                aria-label="Increase quantity"
                className="
                  /* Increased Button Size */
                  w-10 h-10 md:w-11 md:h-11
                  rounded-xl flex items-center justify-center 
                  bg-white border border-gray-200 shadow-sm text-zinc-900 
                  hover:bg-gray-100 hover:text-black hover:border-gray-300 hover:shadow-md
                  dark:bg-[#2A2A2A] dark:border-transparent dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#333]
                  transition-all duration-200 outline-none cursor-pointer
               "
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Edit Button - Bottom Right */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-3 rounded hover:bg-black/5 dark:hover:bg-white/10 text-amber-500 transition-colors cursor-pointer"
              aria-label="Edit item"
            >
              <Pencil size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  },
);

export default CartPanel;
