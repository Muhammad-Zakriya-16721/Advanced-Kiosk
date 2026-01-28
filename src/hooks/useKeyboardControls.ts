import { useState, useEffect, useCallback } from 'react';

// Sections
export const SECTIONS = {
  SIDEBAR: 'sidebar',
  MAIN: 'main',
  CART: 'cart'
};

export const useKeyboardControls = (
  isEnabled: boolean,
  menuCategories: any[],
  setSelectedCategory: (id: string) => void,
  filteredItems: any[],
  cartItems: any[],
  onAddToCart: (item: any, qty: number) => void,
  onUpdateQuantity: (id: number, delta: number) => void,
  onCheckout: () => void,
  onClearCart: () => void,
  toggleOrderSuccess: (show: boolean) => void,
  isOrderSuccessOpen: boolean,
  // New Clear Props
  isClearConfirming: boolean,
  triggerClearConfirm: () => void
) => {

  const [activeSection, setActiveSection] = useState(SECTIONS.SIDEBAR);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [columns, setColumns] = useState(2); // Default mock, update via listener

  // Responsive Column Detection
  useEffect(() => {
    const updateColumns = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth >= 1280) setColumns(3); // xl
        else if (window.innerWidth >= 768) setColumns(2); // md
        else setColumns(1); // mobile
      }
    };
    updateColumns();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateColumns);
      return () => window.removeEventListener('resize', updateColumns);
    }
  }, []);

  // Reset/Clamp focus
  useEffect(() => {
    if (activeSection === SECTIONS.MAIN) {
      if (focusedIndex >= filteredItems.length) {
        setFocusedIndex(Math.max(0, filteredItems.length - 1));
      }
    } else if (activeSection === SECTIONS.CART) {
      if (focusedIndex >= cartItems.length) {
        setFocusedIndex(Math.max(0, cartItems.length - 1));
      }
    }
  }, [filteredItems, cartItems, activeSection, focusedIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isEnabled) return;

    // Tab: Cycle Sections
    if (e.key === 'Tab') {
      e.preventDefault();

      const sections = [SECTIONS.SIDEBAR, SECTIONS.MAIN, SECTIONS.CART];
      const currentIdx = sections.indexOf(activeSection);
      const nextIdx = (currentIdx + 1) % sections.length;

      setActiveSection(sections[nextIdx]);
      setFocusedIndex(0);
      return;
    }

    // --- SIDEBAR ---
    if (activeSection === SECTIONS.SIDEBAR) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + menuCategories.length) % menuCategories.length);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % menuCategories.length);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        setSelectedCategory(menuCategories[focusedIndex].id);
      }
    }

    // --- MAIN ---
    if (activeSection === SECTIONS.MAIN) {
      // Safety: No items
      if (!filteredItems.length) return;

      // Row-wise navigation logic
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(0, prev - 1));
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(filteredItems.length - 1, prev + 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(0, prev - columns));
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(filteredItems.length - 1, prev + columns));
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredItems[focusedIndex];
        const qty = e.shiftKey ? 10 : 1;
        onAddToCart(item, qty);
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        const item = filteredItems[focusedIndex];
        // Find if item is in cart
        const cartItem = cartItems.find(c => c.id === item.id);
        if (cartItem) {
          onUpdateQuantity(item.id, -1);
        }
      }

      if (e.key === 'Delete') {
        e.preventDefault();
        const item = filteredItems[focusedIndex];
        const cartItem = cartItems.find(c => c.id === item.id);
        if (cartItem) {
          // Remove COMPLETELY from Main
          onUpdateQuantity(item.id, -cartItem.quantity);
        }
      }
    }

    // --- CART ---
    if (activeSection === SECTIONS.CART) {
      if (cartItems.length === 0) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => Math.max(0, prev - 1));
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => Math.min(cartItems.length - 1, prev + 1));
      }

      const currentItem = cartItems[focusedIndex];

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentItem) onUpdateQuantity(currentItem.id, -1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentItem) onUpdateQuantity(currentItem.id, 1);
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (currentItem) onUpdateQuantity(currentItem.id, -currentItem.quantity);
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (isOrderSuccessOpen) {
          toggleOrderSuccess(false);
        } else {
          onCheckout();
        }
      }

      if (e.key === 'Delete') {
        e.preventDefault();
        triggerClearConfirm(); // This toggles logic in App/Hook
      }
    }

  }, [isEnabled, activeSection, focusedIndex, menuCategories, filteredItems, cartItems, isOrderSuccessOpen, onAddToCart, onUpdateQuantity, onCheckout, onClearCart, toggleOrderSuccess, columns, isClearConfirming, triggerClearConfirm]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown as any);
      return () => window.removeEventListener('keydown', handleKeyDown as any);
    }
  }, [handleKeyDown]);

  return { 
    activeSection, 
    focusedIndex, 
    setActiveSection, 
    setFocusedIndex,
    setManualFocus: (section: string, index: number) => {
        setActiveSection(section);
        setFocusedIndex(index);
    }
  };
};
