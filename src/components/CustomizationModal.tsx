"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { Modifier, getModifiersForCategory } from "@/data/modifiers";

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any; // Using `any` temporarily during migration, ideally `CartItem`
  onSave: (item: any, selectedModifiers: Modifier[]) => void;
}

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const CustomizationModal = ({
  isOpen,
  onClose,
  item,
  onSave,
}: CustomizationModalProps) => {
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);

  // Reset or Pre-fill when modal opens
  useEffect(() => {
    if (isOpen && item) {
      setSelectedModifiers(item.selectedModifiers || []);
    }
  }, [isOpen, item]);

  // Handle Modifier Toggle
  const toggleModifier = (modifier: Modifier) => {
    setSelectedModifiers((prev) => {
      const exists = prev.find((m) => m.id === modifier.id);
      if (exists) {
        return prev.filter((m) => m.id !== modifier.id);
      }
      return [...prev, modifier];
    });
  };

  // Calculate Prices
  const basePrice = Number(item?.price) || 0;
  const modifiersCost = selectedModifiers.reduce((acc, m) => acc + m.price, 0);
  const totalPrice = basePrice + modifiersCost;

  // Get available modifiers
  const availableModifiers = item ? getModifiersForCategory(item.category) : [];

  return (
    <AnimatePresence>
      {isOpen && item && (
        <React.Fragment>
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="
              fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
              w-full max-w-md max-h-[85vh] 
              bg-white dark:bg-[#1A1A1A] 
              rounded-3xl shadow-2xl z-[70] overflow-hidden flex flex-col
              border border-white/20
            "
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={20} className="text-gray-500" />
              </button>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white pr-8">
                Customize Item
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {item.name}
              </p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {availableModifiers.length > 0 ? (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                    Add-ons & Options
                  </h3>
                  <div className="space-y-3">
                    {availableModifiers.map((mod) => {
                      const isSelected = selectedModifiers.some(
                        (m) => m.id === mod.id,
                      );
                      return (
                        <div
                          key={mod.id}
                          onClick={() => toggleModifier(mod)}
                          className={`
                            flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200
                            ${
                              isSelected
                                ? "border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/5"
                                : "border-gray-200 dark:border-white/10 hover:border-brand-primary/50 dark:hover:border-brand-primary/50"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`
                                w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                                ${
                                  isSelected
                                    ? "bg-brand-primary border-brand-primary text-brand-dark"
                                    : "border-gray-300 dark:border-gray-600"
                                }
                              `}
                            >
                              {isSelected && (
                                <Check size={14} strokeWidth={3} />
                              )}
                            </div>
                            <span
                              className={`font-medium ${isSelected ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}`}
                            >
                              {mod.name}
                            </span>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                            {mod.price > 0
                              ? `+${fmt.format(mod.price)}`
                              : "Free"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No customization options available for this item.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
              <div className="flex justify-between items-center mb-4 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Base Price
                </span>
                <span className="tabular-nums text-gray-900 dark:text-white">
                  {fmt.format(basePrice)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-6 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Modifiers
                </span>
                <span className="tabular-nums text-brand-primary font-bold">
                  +{fmt.format(modifiersCost)}
                </span>
              </div>

              <button
                onClick={() => onSave(item, selectedModifiers)}
                className="
                  w-full py-4 rounded-2xl bg-brand-primary text-brand-dark font-black text-lg
                  hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-primary/20
                  cursor-pointer
                "
              >
                Update Item • {fmt.format(totalPrice)}
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};

export default CustomizationModal;
