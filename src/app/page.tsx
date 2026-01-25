"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";

// Components
// Note: These will need to be converted to .tsx as well
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MenuGrid from "@/components/MenuGrid";
import CartPanel from "@/components/CartPanel";
import OrderSuccess from "@/components/OrderSuccess";
import SettingsModal from "@/components/SettingsModal";

// Data & Hooks
import { menuItems } from "@/data/menuItems";
import { useKeyboardControls, SECTIONS } from "@/hooks/useKeyboardControls";

export default function Home() {
  const [category, setCategory] = useState("popular");
  const [cartItems, setCartItems] = useState<any[]>([]); // Added explicit 'any' for now to bypass strict TS check during migration
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Settings & Keyboard State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKeyboardEnabled, setIsKeyboardEnabled] = useState(false);
  const [isClickFocusEnabled, setIsClickFocusEnabled] = useState(true);

  const shouldReduceMotion = useReducedMotion();

  // 1. Stable Order Number
  const orderNo = useMemo(() => {
    return `#${Math.floor(1000 + Math.random() * 9000)}`;
  }, []);

  // 2. Load Cart & Settings
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("quickbite-cart");
      const savedKeyboard = localStorage.getItem("quickbite-keyboard-enabled");
      const savedDetailFocus = localStorage.getItem("quickbite-click-focus");

      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (e) {
          console.error("Cart data corrupted, resetting.", e);
          localStorage.removeItem("quickbite-cart");
        }
      }

      if (savedKeyboard) {
        setIsKeyboardEnabled(JSON.parse(savedKeyboard));
      }

      if (savedDetailFocus) {
        setIsClickFocusEnabled(JSON.parse(savedDetailFocus));
      }

      setIsLoaded(true);
    }
  }, []);

  // 3. Save Cart & Scroll Lock
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      try {
        localStorage.setItem("quickbite-cart", JSON.stringify(cartItems));
        localStorage.setItem(
          "quickbite-keyboard-enabled",
          JSON.stringify(isKeyboardEnabled),
        );
        localStorage.setItem(
          "quickbite-click-focus",
          JSON.stringify(isClickFocusEnabled),
        );
      } catch (e) {
        console.error("Storage failed", e);
      }
    }

    if (typeof document !== "undefined") {
      if (isMobileCartOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
  }, [
    cartItems,
    isLoaded,
    isMobileCartOpen,
    isKeyboardEnabled,
    isClickFocusEnabled,
  ]);

  const totalItems = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems],
  );
  const totalPrice = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => acc + Number(item.price) * item.quantity,
        0,
      ),
    [cartItems],
  );

  const filteredItems = useMemo(() => {
    return menuItems.filter((item: any) => {
      if (category === "popular") return item.popular;
      return item.category === category;
    });
  }, [category]);

  const handleAddToCart = useCallback((item: any, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { ...item, quantity: quantity }];
    });
  }, []);

  const handleUpdateQuantity = useCallback((id: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const [isClearConfirming, setIsClearConfirming] = useState(false);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClearCartAction = useCallback(() => {
    if (isClearConfirming) {
      setCartItems([]);
      setIsMobileCartOpen(false);
      setIsClearConfirming(false);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    } else {
      setIsClearConfirming(true);
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = setTimeout(() => {
        setIsClearConfirming(false);
      }, 3000);
    }
  }, [isClearConfirming]);

  const handleCheckout = useCallback(() => {
    setShowSuccess(true);
    setIsMobileCartOpen(false);
  }, []);

  const handleCloseSuccess = useCallback(() => {
    setShowSuccess(false);
    setCartItems([]);
    localStorage.removeItem("quickbite-cart");
    setCategory("popular");
  }, []);

  const CATEGORIES = [
    { id: "popular", label: "Popular", icon: "Flame" },
    { id: "burgers", label: "Burgers", icon: "Beef" },
    { id: "pizza", label: "Pizza", icon: "Pizza" },
    { id: "wraps", label: "Wraps", icon: "Sandwich" },
    { id: "drinks", label: "Drinks", icon: "Coffee" },
    { id: "dessert", label: "Dessert", icon: "IceCream" },
  ];

  const { activeSection, focusedIndex, setActiveSection, setFocusedIndex } =
    useKeyboardControls(
      isKeyboardEnabled,
      CATEGORIES,
      setCategory,
      filteredItems,
      cartItems,
      handleAddToCart,
      handleUpdateQuantity,
      handleCheckout,
      handleClearCartAction,
      handleCloseSuccess,
      showSuccess,
      isClearConfirming,
      handleClearCartAction,
    );

  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current);
    };
  }, []);

  const handleManualFocus = useCallback(
    (section: string, index: number) => {
      if (isKeyboardEnabled && isClickFocusEnabled) {
        setActiveSection(section);
        setFocusedIndex(index);
      }
    },
    [isKeyboardEnabled, isClickFocusEnabled, setActiveSection, setFocusedIndex],
  );

  // Framer Motion Variants
  const drawerVariants = {
    hidden: { x: "100%" },
    visible: { x: 0 },
    exit: { x: "100%" },
  };

  const simpleFade = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // Hydration safety check
  if (!isLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <div className="h-[100svh] w-full bg-[image:var(--bg-gradient)] text-[var(--text-primary)] font-sans overflow-x-hidden flex flex-col md:flex-row transition-[background-image] duration-500">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isKeyboardEnabled={isKeyboardEnabled}
        toggleKeyboard={() => setIsKeyboardEnabled(!isKeyboardEnabled)}
        isClickFocusEnabled={isClickFocusEnabled}
        toggleClickFocus={() => setIsClickFocusEnabled(!isClickFocusEnabled)}
      />

      {/* Sidebar */}
      <Sidebar
        activeCategory={category}
        onSelectCategory={setCategory}
        onOpenSettings={() => setIsSettingsOpen(true)}
        // Focus Props
        isKeyboardEnabled={isKeyboardEnabled}
        isFocusedSection={activeSection === SECTIONS.SIDEBAR}
        focusedIndex={focusedIndex}
        onManualFocus={(index: number) =>
          handleManualFocus(SECTIONS.SIDEBAR, index)
        }
        // @ts-ignore - Temporary ignore until Sidebar is TSX
        categories={CATEGORIES}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative min-w-0 z-0">
        <div className="relative z-30">
          <Header />
        </div>

        {/* SCROLLABLE GRID CONTAINER */}
        <div className="flex-1 overflow-y-auto scroll-smooth no-scrollbar relative">
          {/* Scroll Gradient Indicator (Top) */}
          <div className="fixed top-[88px] left-0 right-0 h-8 bg-gradient-to-b from-white/90 dark:from-black/50 to-transparent pointer-events-none z-10" />

          <div className="px-4 md:px-8 pt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={category}
                initial={
                  !shouldReduceMotion ? { opacity: 0, x: 10 } : { opacity: 0 }
                }
                animate={{ opacity: 1, x: 0 }}
                exit={
                  !shouldReduceMotion ? { opacity: 0, x: -10 } : { opacity: 0 }
                }
                transition={{ duration: 0.2 }}
              >
                <MenuGrid
                  selectedCategory={category}
                  items={filteredItems}
                  onAddToCart={handleAddToCart}
                  isKeyboardEnabled={isKeyboardEnabled}
                  isFocusedSection={activeSection === SECTIONS.MAIN}
                  focusedIndex={focusedIndex}
                  onManualFocus={(index: number) =>
                    handleManualFocus(SECTIONS.MAIN, index)
                  }
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="fixed bottom-20 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-[#111] to-transparent pointer-events-none z-10 md:hidden" />
        </div>
      </main>

      {/* DESKTOP Cart Panel */}
      <motion.div
        initial={!shouldReduceMotion ? { x: 20, opacity: 0 } : undefined}
        animate={{ x: 0, opacity: 1 }}
        className="hidden lg:flex w-[400px] h-full border-l border-gray-200 dark:border-white/5 shadow-2xl z-20"
      >
        <CartPanel
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onCheckout={handleCheckout}
          onClearCart={handleClearCartAction}
          orderNo={orderNo}
          isKeyboardEnabled={isKeyboardEnabled}
          isFocusedSection={activeSection === SECTIONS.CART}
          focusedIndex={focusedIndex}
          onManualFocus={(index: number) =>
            handleManualFocus(SECTIONS.CART, index)
          }
          isClearConfirming={isClearConfirming}
          onTriggerClear={handleClearCartAction}
        />
      </motion.div>

      {/* MOBILE: Floating "View Cart" Button (FAB) */}
      <AnimatePresence>
        {totalItems > 0 && !isMobileCartOpen && (
          <motion.button
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 20 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileCartOpen(true)}
            className="
              lg:hidden fixed z-40 
              bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 
              bg-brand-primary text-brand-dark 
              pl-5 pr-6 py-4 rounded-full shadow-2xl shadow-brand-primary/30
              flex items-center gap-3 font-bold text-lg
              border border-white/10 backdrop-blur-sm
            "
          >
            <div className="relative">
              <ShoppingBag size={24} strokeWidth={2.5} />
              <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-brand-primary">
                {totalItems}
              </span>
            </div>
            <span className="tracking-tight">View Cart</span>
            <span className="bg-black/10 px-2 py-1 rounded text-sm font-black tabular-nums">
              ${(totalPrice * 1.1).toFixed(2)}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* MOBILE: Cart Drawer (Overlay) */}
      <AnimatePresence>
        {isMobileCartOpen && (
          <>
            <motion.div
              variants={simpleFade}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsMobileCartOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
            />

            <motion.div
              variants={!shouldReduceMotion ? drawerVariants : simpleFade}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="
                fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 lg:hidden flex flex-col 
                bg-white dark:bg-[#1A1A1A] sm:rounded-l-3xl shadow-2xl overflow-hidden
              "
            >
              <div className="bg-white dark:bg-[#1A1A1A] p-4 flex flex-col items-center border-b border-gray-100 dark:border-white/5 relative shrink-0">
                <div className="w-12 h-1.5 bg-white/20 rounded-full mb-4 sm:hidden" />

                <div className="w-full flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Current Order{" "}
                    <span className="text-gray-500 text-sm font-normal">
                      ({totalItems} items)
                    </span>
                  </h2>
                  <button
                    onClick={() => setIsMobileCartOpen(false)}
                    className="p-3 bg-gray-100 dark:bg-[#2A2A2A] rounded-full text-gray-900 dark:text-white active:scale-95 transition-transform"
                    aria-label="Close cart"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative">
                <CartPanel
                  cartItems={cartItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onCheckout={handleCheckout}
                  onClearCart={handleClearCartAction}
                  orderNo={orderNo}
                  isClearConfirming={isClearConfirming}
                  onTriggerClear={handleClearCartAction}
                  // @ts-ignore
                  isKeyboardEnabled={isKeyboardEnabled}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <OrderSuccess
        isOpen={showSuccess}
        orderNo={orderNo}
        onClose={handleCloseSuccess}
        autoCloseMs={8000}
      />
    </div>
  );
}
