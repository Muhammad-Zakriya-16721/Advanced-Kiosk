"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { calculateDiscountedPrice } from "@/lib/api";
import { getModifiersForCategory, ModifierGroup } from "@/data/modifiers";
import { useCartStore } from "@/store/cartStore";

interface ModifierOption {
  name: string;
  price: number;
}

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onSave: (item: any, modifiers: any[]) => void;
}

const CustomizationModal = ({
  isOpen,
  onClose,
  item,
  onSave,
}: CustomizationModalProps) => {
  const cart = useCartStore((state) => state.cart);

  // We store selected options as a flat list of Objects { name, price, grouping? }
  // to be compatible with the rest of the app which expects a list of modifiers.
  const [selectedModifiers, setSelectedModifiers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (item?.selectedModifiers) {
        setSelectedModifiers(item.selectedModifiers);
      } else {
        setSelectedModifiers([]);
      }
    }
  }, [isOpen, item]);

  const toggleOption = (option: ModifierOption, groupName: string) => {
    // Find the group definition to check select mode
    // We need to look up the group from 'modifierGroups' inside the render scope,
    // but better to pass the group object or mode to this function.
    // However, recreating 'modifierGroups' here is safe since it is deterministic based on 'item'.

    // RE-DERIVE modifierGroups (A bit redundant but safe)
    let currentGroups: ModifierGroup[] = [];
    if (
      item?.modifiers &&
      Array.isArray(item.modifiers) &&
      item.modifiers.length > 0
    ) {
      // Logic mirrors lines 96-123
      const rawMods = item.modifiers;
      const definedGroups: ModifierGroup[] = [];
      const flatOptions: ModifierOption[] = [];
      rawMods.forEach((m: any) => {
        if (m.options && Array.isArray(m.options)) {
          definedGroups.push(m);
        } else if (m.name && m.price !== undefined) {
          flatOptions.push(m);
        }
      });
      if (flatOptions.length > 0)
        definedGroups.push({ name: "Options", options: flatOptions });
      currentGroups = definedGroups;
    } else if (item?.category) {
      // Fallback
      const staticMods = getModifiersForCategory(item.category);
      if (staticMods.length > 0)
        currentGroups = [{ name: "Customize", options: staticMods }];
    }

    const targetGroup = currentGroups.find((g) => g.name === groupName);
    const formattedGroup = groupName.toLowerCase();

    // LOGIC: Use explicit flag if present, otherwise heuristic
    let isMultiSelect = ["add-on", "extra", "topping", "option"].some((k) =>
      formattedGroup.includes(k),
    );

    if (targetGroup?.allow_multiselect !== undefined) {
      isMultiSelect = targetGroup.allow_multiselect;
    }

    setSelectedModifiers((prev) => {
      const exists = prev.some(
        (m) => m.name === option.name && m.group === groupName,
      );

      if (exists) {
        // Deselect
        return prev.filter(
          (m) => !(m.name === option.name && m.group === groupName),
        );
      } else {
        // Select
        let newSelections = [...prev];

        // If Single Select, clear other options from THIS group
        if (!isMultiSelect) {
          newSelections = newSelections.filter((m) => m.group !== groupName);
        }

        return [
          ...newSelections,
          { ...option, id: option.name, group: groupName },
        ];
      }
    });
  };

  const handleSave = () => {
    onSave(item, selectedModifiers);
  };

  // Calculate Prices
  const basePrice = calculateDiscountedPrice(item);
  const modifiersCost = selectedModifiers.reduce((acc, m) => acc + m.price, 0);
  const totalPrice = basePrice + modifiersCost;

  // Resolve Modifiers Source
  let modifierGroups: ModifierGroup[] = [];

  if (
    item?.modifiers &&
    Array.isArray(item.modifiers) &&
    item.modifiers.length > 0
  ) {
    const rawMods = item.modifiers;
    const definedGroups: ModifierGroup[] = [];
    const flatOptions: ModifierOption[] = [];

    // Separate groups from flat options
    rawMods.forEach((m: any) => {
      if (m.options && Array.isArray(m.options)) {
        definedGroups.push(m);
      } else if (m.name && m.price !== undefined) {
        flatOptions.push(m);
      }
    });

    // If we have flat options, wrap them in a group
    if (flatOptions.length > 0) {
      definedGroups.push({
        name: definedGroups.length > 0 ? "Extras" : "Options",
        options: flatOptions,
      });
    }

    modifierGroups = definedGroups;
  }

  // Fallback to static category defaults if no DB modifiers
  if (modifierGroups.length === 0 && item?.category) {
    const staticMods = getModifiersForCategory(item.category);
    if (staticMods.length > 0) {
      modifierGroups = [{ name: "Customize", options: staticMods }];
    }
  }

  // CHECK STOCK
  const qtyInCart = cart
    .filter((c) => c.id === item?.id)
    .reduce((sum, c) => sum + c.quantity, 0);

  const currentStock = item?.stock_level ?? 0; // Use nullish coalescing

  // Logic:
  // - If stock_level is 0 or less, it's Sold Out (handled by isAvailable).
  // - If stock_level > 0, we check if cart qty + 1 > stock.
  // Note: If item.stock_level is undefined/null, we assume unlimited (or handle via prep_time check only).
  // Let's assume strict tracking: if (stock_level > 0) enforce it.

  const isStockReached =
    item?.stock_level !== undefined &&
    item?.stock_level !== null &&
    item.stock_level > 0
      ? qtyInCart + 1 > item.stock_level
      : false;

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="
                  pointer-events-auto
                  relative w-full max-w-lg max-h-[90vh] flex flex-col
                  bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl overflow-hidden
                "
            >
              {/* Header */}
              <div className="relative h-48 sm:h-56 bg-gray-100 dark:bg-[#111] shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                {/* Deal Badge */}
                {item.type === "deal" && (
                  <div className="absolute top-4 left-4 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10 uppercase tracking-widest">
                    Bundle Deal
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors duration-300 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md z-10"
                >
                  <X size={20} />
                </button>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-1">
                    {item.name}
                  </h2>
                  <p className="text-gray-300 font-medium">
                    {formatPrice(basePrice)}
                  </p>
                </div>
              </div>

              {/* Content Scroller */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Deal Contents Section */}
                {item.type === "deal" &&
                  item.bundle_items &&
                  item.bundle_items.length > 0 && (
                    <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-2xl">
                      <h3 className="text-sm font-bold text-brand-primary uppercase tracking-widest mb-3">
                        Includes
                      </h3>
                      <div className="space-y-2">
                        {item.bundle_items.map((b: any, idx: number) => {
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-3 text-black dark:text-white"
                            >
                              <div className="w-6 h-6 rounded-full bg-brand-primary text-black font-bold flex items-center justify-center text-xs">
                                {b.quantity}x
                              </div>
                              <span className="font-medium">
                                {b.product_name || "Mystery Item"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {modifierGroups.length > 0
                  ? modifierGroups.map((group, idx) => (
                      <div key={idx}>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                          {group.name}
                          <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {group.options.map((opt, oIdx) => {
                            const isSelected = selectedModifiers.some(
                              (m) =>
                                m.name === opt.name && m.group === group.name,
                            );
                            return (
                              <button
                                key={oIdx}
                                onClick={() => toggleOption(opt, group.name)}
                                className={`
                                                relative flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]
                                                ${
                                                  isSelected
                                                    ? "border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20 shadow-sm"
                                                    : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5"
                                                }
                                            `}
                              >
                                <div>
                                  <p
                                    className={`font-bold ${isSelected ? "text-brand-primary" : "text-gray-900 dark:text-gray-100"}`}
                                  >
                                    {opt.name}
                                  </p>
                                  {opt.price > 0 && (
                                    <p className="text-sm text-gray-500 font-medium">
                                      + {formatPrice(opt.price)}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="bg-brand-primary rounded-full p-1 text-brand-dark">
                                    <Check size={14} strokeWidth={3} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  : (!item.type || item.type === "single") && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>No customization options available for this item.</p>
                      </div>
                    )}
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#1A1A1A] shrink-0">
                <button
                  onClick={handleSave}
                  disabled={isStockReached}
                  className="
                    w-full py-4 rounded-2xl
                    bg-brand-primary text-white
                    font-black text-xl tracking-wide uppercase
                    hover:brightness-110 active:scale-[0.98]
                    transition-all duration-300 shadow-xl shadow-brand-primary/20
                    flex items-center justify-center gap-2 cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale
                  "
                >
                  <span>
                    {isStockReached ? "Max Stock Reached" : "Add to Order"}
                  </span>
                  {!isStockReached && (
                    <span className="bg-brand-dark/10 px-2 py-1 rounded-lg text-lg">
                      {formatPrice(totalPrice)}
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};

export default CustomizationModal;
