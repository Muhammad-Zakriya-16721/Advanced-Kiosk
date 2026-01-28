"use client";

import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FilterState } from "@/hooks/useMenuFilter";

interface ActiveFiltersProps {
  filters: FilterState;
  onRemove: (type: "price" | "tag", value?: string) => void;
}

const ActiveFilters = ({ filters, onRemove }: ActiveFiltersProps) => {
  const hasFilters = filters.priceRange || filters.tags.length > 0;

  if (!hasFilters) return null;

  return (
    <div className="flex items-center gap-2 mr-2">
      <AnimatePresence>
        {/* Price Filter Pill */}
        {filters.priceRange && (
          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onRemove("price")}
            className="
              flex items-center gap-1.5 px-3 py-1.5 
              bg-brand-primary text-white 
              rounded-full text-xs font-bold uppercase tracking-wide
              hover:bg-brand-primary/80 transition-colors cursor-pointer
            "
          >
            <span>
              {filters.priceRange === "under-10"
                ? "< $10"
                : filters.priceRange === "10-20"
                  ? "$10 - $20"
                  : "$20+"}
            </span>
            <X size={14} strokeWidth={3} />
          </motion.button>
        )}

        {/* Tag Filter Pills */}
        {filters.tags.map((tag) => (
          <motion.button
            layout
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onRemove("tag", tag)}
            className="
              flex items-center gap-1.5 px-3 py-1.5 
              bg-white/10 dark:bg-white/10 text-zinc-800 dark:text-white 
              border border-zinc-200 dark:border-white/10
              rounded-full text-xs font-bold uppercase tracking-wide
              hover:bg-red-500 hover:text-white hover:border-red-500
              dark:hover:bg-red-500 dark:hover:border-red-500
              transition-colors group
            "
          >
            <span>{tag}</span>
            <X
              size={14}
              strokeWidth={3}
              className="opacity-50 group-hover:opacity-100"
            />
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ActiveFilters;
