"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";

// Components
// Components
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MenuGrid from "@/components/menu/core/MenuGrid";
import CartPanel from "@/components/cart/CartPanel";
import EmptyState from "@/components/cart/EmptyState";
import SuccessScreen from "@/components/orders/SuccessScreen";
import ActiveFilters from "@/components/menu/filters/ActiveFilters";
import dynamic from "next/dynamic";

// Dynamic Imports for Modals
const SettingsModal = dynamic(
  () => import("@/components/layout/SettingsModal"),
  { ssr: false },
);
const CheckoutModal = dynamic(() => import("@/components/cart/CheckoutModal"), {
  ssr: false,
});
const CustomizationModal = dynamic(
  () => import("@/components/menu/modals/CustomizationModal"),
  { ssr: false },
);
const SmartUpsellModal = dynamic(
  () => import("@/components/menu/modals/SmartUpsellModal"),
  { ssr: false },
);
const FilterModal = dynamic(
  () => import("@/components/menu/filters/FilterModal"),
  { ssr: false },
);
const SortMenu = dynamic(() => import("@/components/menu/filters/SortMenu"), {
  ssr: false,
});

// Data & Hooks
import { Modifier } from "@/data/modifiers";
import {
  getProducts,
  Product,
  formatOrderId,
  supabase,
  calculateDiscountedPrice,
} from "@/lib/api";
import { getUpsellRecommendation, UpsellResult } from "@/lib/ai-upsell";
import { useKeyboardControls, SECTIONS } from "@/hooks/useKeyboardControls";
import { useMenuFilter } from "@/hooks/useMenuFilter";

import { useCartStore } from "@/store/cartStore";
import { useMenuData } from "@/hooks/useMenuData";

const CATEGORIES = [
  { id: "burgers", name: "Burgers", icon: "🍔" },
  { id: "pizza", name: "Pizza", icon: "🍕" },
  { id: "drinks", name: "Drinks", icon: "🥤" },
  { id: "popular", name: "Popular", icon: "🔥" },
];

export default function Home() {
  // State

  const [activeCategory, setActiveCategory] = useState("burgers");

  // Custom Hooks
  const { menuItems, isLoading, error, refetch } = useMenuData();
  const {
    cart,
    addToCart,
    clearCart,
    isClearConfirming,
    setClearConfirming,
    updateQuantity,
  } = useCartStore();

  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClickFocusEnabled, setIsClickFocusEnabled] = useState(true);

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderNo, setLastOrderNo] = useState("0000");
  const [lastOrderDetails, setLastOrderDetails] = useState<{
    cart: any[];
    subtotal: number;
    tax: number;
    total: number;
  } | null>(null);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isKeyboardEnabled, setIsKeyboardEnabled] = useState(false);

  // --- UPSERLL STATE ---
  const [showUpsell, setShowUpsell] = useState(false);
  const [upsellTriggerItem, setUpsellTriggerItem] = useState<Product | null>(
    null,
  );
  const [upsellRecommendation, setUpsellRecommendation] =
    useState<UpsellResult | null>(null);

  // Ref to prevent recursive upsells (e.g. adding the upsell item triggers another upsell)
  const isUpsellRef = useRef(false);

  // Helper to check availability (including Bundle logic)
  const isProductAvailable = useCallback(
    (item: Product, allItems: Product[]) => {
      // 1. Check direct availability
      if (!item.is_available) return false;

      // 2. If Deal, check all sub-items
      if (item.type === "deal" && item.bundle_items) {
        return item.bundle_items.every((bi) => {
          const child = allItems.find((p) => p.id === bi.product_id);
          // If child not found or unavailable -> Deal is unavailable
          return child ? child.is_available : false;
        });
      }

      return true;
    },
    [],
  );

  const availableMenuItems = menuItems.filter((item) =>
    isProductAvailable(item, menuItems),
  );

  // --- 2. Filtering Hook ---
  const {
    filteredItems,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    isSearching,
    sortOption,
    setSortOption,
  } = useMenuFilter(availableMenuItems, activeCategory);

  // Handlers needed for Keyboard Control
  const handleAddToCart = useCallback((item: Product) => {
    setSelectedItem(item);
    setIsCustomizing(true);
  }, []);

  const handleStartCheckout = () => {
    if (cart.length > 0) setIsCheckoutOpen(true);
  };

  const handleConfirmOrder = (orderNo?: string) => {
    setIsCheckoutOpen(false);
    const rawId = orderNo || Math.floor(1000 + Math.random() * 9000).toString();
    const formattedId = formatOrderId(rawId);

    setLastOrderNo(formattedId);

    const subtotal = cart.reduce(
      (acc, item) => acc + (Number(item.price) || 0) * item.quantity,
      0,
    );
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    setLastOrderDetails({ cart: [...cart], subtotal, tax, total });

    setShowSuccess(true);
    clearCart();
  };

  const handleNewOrder = () => {
    setShowSuccess(false);
    setFilters({ priceRange: null, tags: [] });
    setSearchQuery("");
    setActiveCategory("burgers");
  };

  const confirmAddToCart = (item: any, modifiers: any[]) => {
    // 3. New unique line item
    // Store handles Logic, we just construct the object
    const cartItem = {
      ...item,
      price:
        calculateDiscountedPrice(item) +
        modifiers.reduce((acc, m) => acc + m.price, 0),
      selectedModifiers: modifiers,
      quantity: item.quantity || 1,
      // cartId is generated in store or check duplication logic inside store
      // But for now, let's keep it simple:
      // If store handles duplication, we pass base; if we want to force unique, we pass ID.
      // Store logic I wrote handles duplication checking.
      // We'll let store handle ID if new, or update existing.
      // Actually, my store logic expects 'cartId' to be undefined for new items unless generated here.
      // Let's generate it here for "New unique line item" logic fallback
      cartId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    addToCart(cartItem);

    // --- SMART UPSELL TRIGGER ---
    // If not clearing cart/etc, try to find an upsell
    // AND ensure we are not currently adding an upsell item (prevent loops)
    if (!item.cartId && !isUpsellRef.current) {
      // Logic helper handles excluding items already in cart, but we pass current cart IDs just in case
      const currentCartIds = cart.map((c) => String(c.id));

      const recommendation = getUpsellRecommendation(
        item,
        menuItems,
        currentCartIds,
      );

      if (recommendation) {
        setTimeout(() => {
          setUpsellTriggerItem(item);
          setUpsellRecommendation(recommendation);
          setShowUpsell(true);
        }, 500);
      }
    }

    // Reset the flag after processing
    isUpsellRef.current = false;

    setIsCustomizing(false);
    setSelectedItem(null);
  };

  // Keyboard Hook
  const {
    activeSection: focusedSection,
    focusedIndex,
    setManualFocus,
  } = useKeyboardControls(
    isKeyboardEnabled,
    CATEGORIES,
    (id) => setActiveCategory(id),
    filteredItems,
    cart, // Pass cart from store
    handleAddToCart,
    updateQuantity,
    handleStartCheckout,
    clearCart, // Use store action directly
    setShowSuccess,
    showSuccess,
    isClearConfirming,
    () => setClearConfirming(!isClearConfirming), // Toggle confirm
  );

  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] dark:bg-[#121212] overflow-hidden transition-colors duration-300 font-sans selection:bg-brand-primary/30">
      {/* 1. SIDEBAR */}
      <Sidebar
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isKeyboardEnabled={isKeyboardEnabled}
        isFocusedSection={focusedSection === SECTIONS.SIDEBAR}
        focusedIndex={focusedIndex}
        onManualFocus={(idx) => setManualFocus(SECTIONS.SIDEBAR, idx)}
      />

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative min-w-0">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isSearching={isSearching}
          onClearSearch={() => {
            setSearchQuery("");
            setFilters({ priceRange: null, tags: [] });
          }}
          onFilterClick={() => setShowFilterModal(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Dynamic Content Grid */}
        <div
          className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth"
          id="main-scroll"
        >
          {/* LOADING STATE */}
          {isLoading && (
            <div className="h-full flex flex-col items-center justify-center space-y-4 min-h-[400px]">
              <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
              <p className="text-xl font-bold text-gray-400 animate-pulse">
                Loading Menu...
              </p>
            </div>
          )}

          {/* ERROR STATE */}
          {!isLoading && error && (
            <div className="h-full flex flex-col items-center justify-center space-y-4 min-h-[400px]">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Oops!
              </h3>
              <p className="text-gray-500 text-center max-w-sm">{error}</p>
              <button
                onClick={refetch}
                className="mt-4 px-6 py-2 bg-brand-primary text-brand-dark rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* SUCCESS STATE */}
          {!isLoading && !error && (
            <MenuGrid
              items={filteredItems}
              onAddToCart={(item, e) => {
                if (e?.target) {
                  // Legacy animation removed
                }
                handleAddToCart(item);
              }}
              selectedCategory={activeCategory} // Renamed prop
              isKeyboardEnabled={isKeyboardEnabled}
              isFocusedSection={focusedSection === SECTIONS.MAIN}
              focusedIndex={focusedIndex}
              onManualFocus={(idx) => setManualFocus(SECTIONS.MAIN, idx)}
              headerAction={
                <div className="flex items-center gap-3">
                  <ActiveFilters
                    filters={filters}
                    onRemove={(type, value) => {
                      setFilters((prev) => {
                        if (type === "price")
                          return { ...prev, priceRange: null };
                        if (type === "tag")
                          return {
                            ...prev,
                            tags: prev.tags.filter((t) => t !== value),
                          };
                        return prev;
                      });
                    }}
                  />
                  <SortMenu
                    sortOption={sortOption}
                    onSortChange={setSortOption}
                  />
                </div>
              }
              EmptyStateComponent={
                <EmptyState
                  query={searchQuery} // Added query prop
                  onReset={() => {
                    setSearchQuery("");
                    setFilters({ priceRange: null, tags: [] });
                  }}
                />
              }
            />
          )}
        </div>
      </main>

      {/* 3. CART PANEL */}
      <div className="hidden lg:block w-[400px] shrink-0 h-full">
        <CartPanel
          orderNo={lastOrderNo || "0000"}
          isKeyboardEnabled={isKeyboardEnabled}
          isFocusedSection={focusedSection === SECTIONS.CART}
          focusedIndex={focusedIndex}
          onManualFocus={() => setManualFocus(SECTIONS.CART, 0)}
          onEdit={(item: any) => {
            setSelectedItem(item);
            setIsCustomizing(true);
          }}
          onCheckout={handleStartCheckout}
        />
      </div>

      {/* MODALS */}
      <CustomizationModal
        isOpen={isCustomizing}
        onClose={() => setIsCustomizing(false)}
        item={selectedItem}
        onSave={confirmAddToCart}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirm={handleConfirmOrder}
        items={cart}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isKeyboardEnabled={isKeyboardEnabled}
        toggleKeyboard={() => setIsKeyboardEnabled((prev) => !prev)}
        isClickFocusEnabled={isClickFocusEnabled}
        toggleClickFocus={() => setIsClickFocusEnabled((prev) => !prev)}
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        setFilters={setFilters}
        resultCount={filteredItems.length}
      />

      <SmartUpsellModal
        isOpen={showUpsell}
        onClose={() => setShowUpsell(false)}
        mainProduct={upsellTriggerItem}
        recommendation={upsellRecommendation}
        onConfirm={(item) => {
          isUpsellRef.current = true; // Mark as upsell addition
          handleAddToCart(item);
          setShowUpsell(false);
        }}
      />

      <AnimatePresence>
        {showSuccess && (
          <SuccessScreen
            onComplete={handleNewOrder}
            orderNumber={lastOrderNo}
            cartItems={lastOrderDetails?.cart || []}
            subtotal={lastOrderDetails?.subtotal || 0}
            tax={lastOrderDetails?.tax || 0}
            total={lastOrderDetails?.total || 0}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
