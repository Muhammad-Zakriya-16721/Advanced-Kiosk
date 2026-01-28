"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Leaf, Star, Check } from "lucide-react";
import { FilterState, PriceRange, FilterTag } from "@/hooks/useMenuFilter";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resultCount: number;
}

const FilterModal = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  resultCount,
}: FilterModalProps) => {
  const toggleTag = (tag: FilterTag) => {
    setFilters((prev) => {
      const exists = prev.tags.includes(tag);
      return {
        ...prev,
        tags: exists ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
      };
    });
  };

  const setPrice = (range: PriceRange) => {
    setFilters((prev) => ({
      ...prev,
      priceRange: prev.priceRange === range ? null : range,
    }));
  };

  const resetFilters = () => {
    setFilters({ priceRange: null, tags: [] });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="
                fixed bottom-0 left-0 right-0 
                md:top-1/2 md:left-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 
                md:w-[480px] md:rounded-3xl rounded-t-3xl
                bg-white dark:bg-[#1E1E1E] 
                shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[90vh]
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Filter Items
              </h2>
              <button
                onClick={resetFilters}
                className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-primary transition-colors cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 space-y-8 overflow-y-auto">
              {/* Price Range Section */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Price Range
                </h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "under-10", label: "Under $10" },
                    { id: "10-20", label: "$10 - $20" },
                    { id: "20-plus", label: "$20+" },
                  ].map((option) => {
                    const isActive = filters.priceRange === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setPrice(option.id as PriceRange)}
                        className={`
                            px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 border-2 cursor-pointer
                            ${
                              isActive
                                ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20"
                                : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-transparent hover:border-gray-200 dark:hover:border-white/10"
                            }
                        `}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Preferences Section */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Dietary & Preferences
                </h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    {
                      id: "veg",
                      label: "Vegetarian",
                      icon: Leaf,
                      color: "text-green-500",
                    },
                    {
                      id: "spicy",
                      label: "Spicy",
                      icon: Flame,
                      color: "text-red-500",
                    },
                    {
                      id: "popular",
                      label: "Popular Only",
                      icon: Star,
                      color: "text-yellow-500",
                    },
                  ].map((option) => {
                    const isActive = filters.tags.includes(
                      option.id as FilterTag,
                    );
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => toggleTag(option.id as FilterTag)}
                        className={`
                            flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 border-2 cursor-pointer
                            ${
                              isActive
                                ? "bg-white dark:bg-[#2A2A2A] border-brand-primary text-brand-primary shadow-lg"
                                : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-transparent hover:border-gray-200 dark:hover:border-white/10"
                            }
                        `}
                      >
                        <Icon
                          size={16}
                          className={isActive ? "fill-current" : option.color}
                        />
                        {option.label}
                        {isActive && <Check size={14} className="ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#1E1E1E]">
              <button
                onClick={onClose}
                className="
                    w-full py-4 rounded-2xl 
                    bg-brand-primary text-white font-black text-lg 
                    shadow-xl shadow-brand-primary/20 
                    active:scale-[0.98] transition-all cursor-pointer hover:brightness-110
                "
              >
                Show {resultCount} Results
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterModal;
