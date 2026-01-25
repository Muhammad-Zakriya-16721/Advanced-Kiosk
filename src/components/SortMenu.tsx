"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Star,
  Check,
} from "lucide-react";

interface SortMenuProps {
  sortOption: string;
  onSortChange: (option: any) => void;
}

const SORT_OPTIONS = [
  { id: "recommended", label: "Recommended", icon: Star },
  { id: "price-asc", label: "Price: Low to High", icon: ArrowUpNarrowWide },
  { id: "price-desc", label: "Price: High to Low", icon: ArrowDownWideNarrow },
];

const SortMenu = ({ sortOption, onSortChange }: SortMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const activeLabel = SORT_OPTIONS.find((o) => o.id === sortOption)?.label;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
            flex items-center gap-2 px-4 py-2 rounded-xl 
            border transition-all duration-300 cursor-pointer
            ${
              isOpen
                ? "bg-brand-primary/10 border-brand-primary text-brand-dark dark:text-brand-primary"
                : "bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-brand-primary/50 text-zinc-700 dark:text-gray-300"
            }
        `}
      >
        <span className="font-medium text-sm">Arrange</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="
                absolute right-0 top-full mt-2 w-56 
                bg-white dark:bg-[#1E1E1E] 
                rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 
                overflow-hidden z-50
            "
          >
            <div className="p-1.5 space-y-1">
              {SORT_OPTIONS.map((option) => {
                const isActive = sortOption === option.id;
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      onSortChange(option.id);
                      setIsOpen(false);
                    }}
                    className={`
                                w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
                                ${
                                  isActive
                                    ? "bg-brand-primary/10 text-brand-dark dark:text-brand-primary"
                                    : "text-zinc-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                                }
                            `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={16}
                        className={
                          isActive ? "text-brand-primary" : "text-zinc-400"
                        }
                      />
                      {option.label}
                    </div>
                    {isActive && (
                      <Check size={14} className="text-brand-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SortMenu;
