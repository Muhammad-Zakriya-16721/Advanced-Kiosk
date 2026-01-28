"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Clock } from "lucide-react";
import { Product } from "@/lib/api";
import { formatPrice } from "@/lib/money";
import { UpsellResult } from "@/lib/ai-upsell";

// interface SmartUpsellModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onConfirm: (product: Product) => void;
//   mainProduct: Product | null;
//   upsellProducts: Product[];
// }

const SmartUpsellModal = ({
  isOpen,
  onClose,
  onConfirm,
  mainProduct,
  recommendation, // Changed from upsellProducts[]
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (product: Product) => void;
  mainProduct: Product | null;
  recommendation: UpsellResult | null;
}) => {
  if (!recommendation || !mainProduct) return null;
  const { product: suggestion, reason } = recommendation;

  return (
    <AnimatePresence>
      {isOpen && (
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
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none p-4"
          >
            <div className="bg-white dark:bg-[#1A1A1A] w-full max-w-sm rounded-3xl shadow-2xl pointer-events-auto overflow-hidden border border-white/10 relative">
              {/* Decorative Background Blob */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />

              <div className="p-6 text-center space-y-4 relative">
                <div className="inline-block p-3 bg-green-100 dark:bg-green-900/30 rounded-full mb-2">
                  <Plus className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>

                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                  {reason || "Make it a Meal?"}
                </h3>

                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Customers who ordered{" "}
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {mainProduct.name}
                  </span>{" "}
                  also loved this:
                </p>

                {/* Suggestion Card */}
                <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-4 flex items-center gap-4 text-left border border-gray-100 dark:border-white/5">
                  <img
                    src={suggestion.image}
                    alt={suggestion.name}
                    className="w-16 h-16 rounded-xl object-cover bg-gray-200"
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">
                      {suggestion.name}
                    </h4>
                    <p className="text-brand-primary font-bold">
                      {formatPrice(suggestion.price)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={onClose}
                    className="py-3 px-4 rounded-xl font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer active:scale-95"
                  >
                    No Thanks
                  </button>
                  <button
                    onClick={() => {
                      onConfirm(suggestion);
                    }}
                    className="py-3 px-4 rounded-xl font-bold bg-brand-primary text-white hover:brightness-110 transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Plus size={18} strokeWidth={3} />
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};

export default SmartUpsellModal;
