"use client";

import React from "react";
import { Search, Loader2, X, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isSearching: boolean;
  onClear: () => void;
  onFilterClick?: () => void;
  autoFocus?: boolean;
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  (
    { value, onChange, isSearching, onClear, onFilterClick, autoFocus },
    ref,
  ) => {
    return (
      <div className="flex-1 max-w-md mx-4 md:block group w-full">
        <div
          className="
            relative h-12
            bg-gray-100/80 dark:bg-white/10 
            border border-gray-200 dark:border-white/10
            focus-within:bg-white dark:focus-within:bg-white/15 
            focus-within:border-brand-primary/50 dark:focus-within:border-brand-primary/50
            focus-within:shadow-lg focus-within:shadow-brand-primary/10
            rounded-full transition-all duration-300 overflow-hidden
            flex items-center
         "
        >
          {/* Left Icon */}
          <div className="pl-4 pr-3 text-zinc-400 dark:text-gray-400 group-focus-within:text-brand-primary transition-colors">
            <Search size={20} strokeWidth={2.5} />
          </div>

          {/* Input */}
          <input
            ref={ref}
            autoFocus={autoFocus}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search for burgers, spicy, prices..."
            className="
                  w-full bg-transparent outline-none border-none 
                  text-base font-medium text-zinc-900 dark:text-white 
                  placeholder-zinc-400 dark:placeholder-gray-500
               "
          />

          {/* Right Actions */}
          <div className="flex items-center px-2 mr-2 gap-1">
            <AnimatePresence mode="popLayout">
              {isSearching ? (
                <motion.div
                  key="loader"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="p-2 text-brand-primary"
                >
                  <Loader2 size={18} className="animate-spin" />
                </motion.div>
              ) : value.length > 0 ? (
                <motion.button
                  key="clear"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={onClear}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 cursor-pointer"
                >
                  <X size={18} />
                </motion.button>
              ) : null}
            </AnimatePresence>

            {/* Separator */}
            <div className="w-px h-5 bg-zinc-300 dark:bg-white/10 mx-1" />

            {/* Filter Button */}
            <button
              onClick={onFilterClick}
              className="p-2 text-zinc-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-primary transition-colors hover:bg-brand-primary/5 rounded-full active:scale-95 z-20 cursor-pointer"
              aria-label="Filter"
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";

export default SearchBar;
