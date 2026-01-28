"use client";

import React, { useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { AlertCircle } from "lucide-react";
import MenuCard from "./MenuCard";
// Removed explicit data import if not used strictly, but it is imported.
// However, MenuGrid receives items as prop usually.
// menuItems import removed

interface MenuGridProps {
  selectedCategory: string;
  items: any[];
  onAddToCart: (item: any, e?: React.SyntheticEvent) => void;
  isKeyboardEnabled: boolean;
  isFocusedSection: boolean;
  focusedIndex: number;
  onManualFocus: (index: number) => void;
  headerAction?: React.ReactNode;
  EmptyStateComponent?: React.ReactNode;
}

const MenuGrid = ({
  selectedCategory,
  items, // Use the pre-filtered items from App.jsx
  onAddToCart,
  // Focus Props
  isKeyboardEnabled,
  isFocusedSection,
  focusedIndex,
  onManualFocus,
  headerAction,
  EmptyStateComponent,
}: MenuGridProps) => {
  // Removed local filtering to ensure sync with Keyboard Hook
  const displayItems = items || [];

  // STABLE HANDLER to prevent MenuCard re-renders
  const handleItemClick = useCallback(
    (item: any, index: number, e?: React.SyntheticEvent) => {
      onAddToCart(item, e);
      if (onManualFocus) onManualFocus(index);
    },
    [onAddToCart, onManualFocus],
  );

  return (
    <div
      className="
        w-full relative min-h-full
        /* Safe Area Padding for Mobile Bottom Nav (16px + 4rem nav + extra space) */
        pb-32 
        md:pb-12
      "
    >
      {/* Category Header - Strengthened Hierarchy */}
      <div className="sticky top-0 z-20 bg-[var(--glass-panel)] backdrop-blur-[var(--blur-strength)] py-4 mb-6 md:mb-10 border-b border-[var(--glass-border)] rounded-2xl md:rounded-3xl transition-colors duration-300">
        <div className="flex items-center justify-between px-4 md:px-6">
          <div className="flex items-end gap-4">
            <h2 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] capitalize tracking-tighter leading-none transition-colors duration-300">
              {selectedCategory}
            </h2>
            <span className="text-yellow-600 dark:text-brand-primary text-base md:text-xl font-bold pb-1 border-l-2 border-yellow-600/30 dark:border-brand-primary/30 pl-4">
              {displayItems.length}{" "}
              <span className="text-gray-500 font-medium text-sm md:text-base uppercase tracking-wide">
                Selections
              </span>
            </span>
          </div>

          {/* Header Action (Sort Menu) */}
          {headerAction && (
            <div className="hidden md:block">{headerAction}</div>
          )}
        </div>
      </div>

      {displayItems.length > 0 ? (
        <LayoutGroup id="menu-grid">
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            /* RESPONSIVE GRID LAYOUT - Capped at 3 columns for big touch targets */
            className="
            grid 
            /* Increased Gap on Mobile for safety */
            gap-5 md:gap-8
            grid-cols-1        /* Mobile: 1 Column */
            sm:grid-cols-2     /* Large Phone/Tablet: 2 Columns */
            lg:grid-cols-2     /* Desktop (with Cart open): 2 Columns */
            xl:grid-cols-3     /* Large Desktop: 3 Columns (Max) */
          "
          >
            <AnimatePresence mode="popLayout">
              {displayItems.map((item, index) => {
                const isFocused =
                  isKeyboardEnabled &&
                  isFocusedSection &&
                  index === focusedIndex;
                return (
                  <MenuCard
                    key={item.id}
                    item={item}
                    index={index}
                    onItemClick={handleItemClick} // Stable Prop
                    isFocused={isFocused}
                    priority={index < 4}
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      ) : (
        /* Empty State */
        EmptyStateComponent || (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center opacity-60"
          >
            <div className="bg-gray-200 dark:bg-[#2A2A2A] p-6 rounded-full mb-6 transition-colors duration-300">
              <AlertCircle
                size={48}
                className="text-gray-500 dark:text-gray-400"
              />
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              No items in this category
            </h3>
            <p className="text-[var(--text-secondary)] text-lg">
              Please select a different category from the menu.
            </p>
          </motion.div>
        )
      )}

      {/* Bottom Scroll Gradient Hint (Visual cue for long lists) */}
      <div className="fixed bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#f5f5f5] dark:from-brand-dark to-transparent pointer-events-none md:hidden z-10" />
    </div>
  );
};

export default MenuGrid;
