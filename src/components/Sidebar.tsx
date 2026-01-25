"use client";

import React, { useCallback, memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
// Ensure ThemeContext is migrated or use simple placeholder for now if it doesn't exist
// I will assume it exists as .jsx or .tsx
import { useTheme } from "../context/ThemeContext";
import {
  Flame,
  Beef,
  Pizza,
  Sandwich,
  Coffee,
  IceCream,
  Sun,
  Moon,
  Settings, // Imported Settings Icon
} from "lucide-react";

export const categories = [
  { id: "popular", label: "Popular", icon: Flame },
  { id: "burgers", label: "Burgers", icon: Beef },
  { id: "pizza", label: "Pizza", icon: Pizza },
  { id: "wraps", label: "Wraps", icon: Sandwich },
  { id: "drinks", label: "Drinks", icon: Coffee },
  { id: "dessert", label: "Dessert", icon: IceCream },
];

interface SidebarProps {
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  onOpenSettings: () => void;
  isKeyboardEnabled: boolean;
  isFocusedSection: boolean;
  focusedIndex: number;
  onManualFocus: (index: number) => void;
  categories?: any[]; // Allow external categories override or default
}

const Sidebar = ({
  activeCategory,
  onSelectCategory,
  onOpenSettings,
  isKeyboardEnabled,
  isFocusedSection,
  focusedIndex,
  onManualFocus,
}: SidebarProps) => {
  // @ts-ignore - ThemeContext might not be typed yet
  const { theme, toggleTheme } = useTheme();

  const handleSelect = useCallback(
    (id: string) => {
      if (onSelectCategory) onSelectCategory(id);
    },
    [onSelectCategory],
  );

  return (
    <aside
      className="
        /* MOBILE: Compact Bottom Navigation Bar + Safe Area */
        fixed bottom-0 left-0 w-full 
        /* Sidebar Height: h-16 (64px) + Safe Area */
        h-[calc(4rem+env(safe-area-inset-bottom))] 
        pb-[env(safe-area-inset-bottom)] 
        bg-[var(--glass-panel)] backdrop-blur-[var(--blur-strength)] border-t border-[var(--glass-border)] z-50 
        /* Layout: Distribute items evenly across width */
        flex flex-row items-center justify-evenly shadow-[0_-5px_20px_rgba(0,0,0,0.1)] transition-colors duration-300
        /* DESKTOP: Left Vertical Sidebar */
        md:relative md:w-20 lg:w-28 md:h-full md:pb-0 md:flex-col md:border-r md:border-t-0 md:py-6 md:justify-start md:px-0
      "
      aria-label="Main categories"
    >
      {/* Brand Logo - Desktop Only */}
      <div className="hidden md:block mb-6">
        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-brand-primary rounded-full flex items-center justify-center shadow-lg shadow-brand-primary/20">
          <span className="text-lg lg:text-xl font-black text-brand-dark">
            Q
          </span>
        </div>
      </div>

      {/* Nav (Scroll Snap on Mobile) */}
      <nav
        className="
          flex-1 w-full flex 
          /* Mobile: Horizontal Row (No overflow needed if items fit, otherwise allow scroll but hide bar) */
          /* Mobile: Horizontal Row (No overflow needed if items fit, otherwise allow scroll but hide bar) */
          flex-row items-center justify-evenly overflow-x-visible no-scrollbar
          /* Desktop: Vertical Column - Explicitly justify start to prevent spreading */
          md:flex-col md:overflow-y-auto md:overflow-x-hidden md:px-2 md:gap-4 md:justify-start md:pt-7
        "
        role="tablist"
      >
        {categories.map((category, index) => {
          // Calculate Focus State
          const isActive = activeCategory === category.id;
          const isFocused =
            isKeyboardEnabled && isFocusedSection && index === focusedIndex;

          return (
            <MemoCategoryButton
              key={category.id}
              category={category}
              isActive={isActive}
              isFocused={isFocused} // Pass Focus State
              onClick={() => {
                handleSelect(category.id);
                if (onManualFocus) onManualFocus(index);
              }}
            />
          );
        })}
      </nav>

      {/* Decoration - Desktop Only */}
      {/* Footer Actions: Settings & Theme */}
      <div className="hidden md:flex flex-col items-center gap-4 mt-auto mb-6 w-full">
        {/* Settings Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onOpenSettings}
          className="
            mt-6
            py-3 px-4 lg:py-4 lg:px-7 rounded-2xl
            bg-white border border-gray-200 hover:bg-gray-200 hover:shadow-lg
            dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/5
            text-zinc-600 dark:text-[var(--text-secondary)] 
            hover:text-zinc-900 dark:hover:text-[var(--text-primary)]
            transition-all duration-300 cursor-pointer 
          "
          aria-label="Settings"
        >
          <Settings size={20} className="w-5 h-5 lg:w-6 lg:h-6" />
        </motion.button>

        {/* Theme Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="
            py-3 px-4 lg:py-4 lg:px-7 rounded-2xl
            bg-white border border-gray-200 hover:bg-gray-200 hover:shadow-lg
            dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/5
            text-zinc-600 dark:text-[var(--text-secondary)] 
            hover:text-zinc-900 dark:hover:text-[var(--text-primary)]
            transition-all duration-300 cursor-pointer
          "
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Moon size={20} className="w-5 h-5 lg:w-6 lg:h-6" />
          ) : (
            <Sun size={20} className="w-5 h-5 lg:w-6 lg:h-6" />
          )}
        </motion.button>
      </div>
    </aside>
  );
};

const CategoryButton = ({ category, isActive, onClick, isFocused }: any) => {
  const Icon = category.icon;
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      role="tab"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-selected={isActive}
      aria-label={category.label}
      aria-controls={`panel-${category.id}`}
      onClick={onClick}
      className={`
        relative flex items-center justify-center rounded-2xl transition-colors duration-200 shrink-0 snap-center cursor-pointer
        /* Focus Styles (Keyboard Only) */
        outline-none
        ${isFocused ? "ring-4 ring-brand-primary/60 dark:ring-brand-primary/40 z-20" : ""}
        
        /* Mobile Sizing: Reduced to allow more items visible */
        w-12 h-12 
        /* Desktop Sizing */
        md:w-full md:h-14 md:aspect-square
        /* Active State */
        ${
          isActive
            ? "text-brand-dark"
            : "text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
        }
      `}
    >
      {/* Active Background - Conditional Motion */}
      {isActive && (
        <motion.div
          layoutId="activeCategory"
          className="absolute inset-0 bg-brand-primary rounded-2xl shadow-[0_0_20px_rgba(255,199,0,0.5)]"
          initial={false}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 300, damping: 25 }
          }
        />
      )}

      {/* Icon & Label */}
      <div className="relative z-10 flex flex-col items-center gap-1 pointer-events-none">
        <Icon
          size={24}
          strokeWidth={2.5}
          className="w-6 h-6 md:w-4 md:h-4 lg:w-6 lg:h-6"
        />
        {/* Label: Fixed visibility logic */}
        <span className="text-[10px] md:text-[10px] lg:text-[12px] font-bold tracking-wide uppercase hidden md:block">
          {category.label}
        </span>
      </div>
    </motion.button>
  );
};

const MemoCategoryButton = memo(CategoryButton);
export default Sidebar;
