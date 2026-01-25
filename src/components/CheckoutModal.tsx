"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/money";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: any[];
  taxRate?: number;
}

const CheckoutModal = ({
  isOpen,
  onClose,
  onConfirm,
  items,
  taxRate = 0.1,
}: CheckoutModalProps) => {
  const [tipPercentage, setTipPercentage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock Body Scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Calculations (Using simple safe math for display, better to use cents in production but floats are okay for this demo scale if careful)
  // Re-read requirement: "Crucial: All internal calculations... must use Cents"
  const totals = useMemo(() => {
    // 1. Calculate Item Subtotal in Cents
    const subtotalCents = items.reduce((acc, item) => {
      const priceCents = Math.round((Number(item.price) || 0) * 100);
      return acc + priceCents * item.quantity;
    }, 0);

    // 2. Calculate Tax in Cents
    const taxCents = Math.round(subtotalCents * taxRate);

    // 3. Calculate Tip in Cents
    const tipCents = Math.round(subtotalCents * (tipPercentage / 100));

    // 4. Total
    const totalCents = subtotalCents + taxCents + tipCents;

    return {
      subtotal: subtotalCents / 100,
      tax: taxCents / 100,
      tip: tipCents / 100,
      total: totalCents / 100,
    };
  }, [items, taxRate, tipPercentage]);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Simulate Network Delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 10% Chance of Failure
      if (Math.random() < 0.1) {
        throw new Error("Payment Declined. Please try again.");
      }

      onConfirm();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isProcessing ? onClose : undefined}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="
              relative w-full max-w-5xl h-[90vh] md:h-auto md:max-h-[85vh]
              bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl overflow-hidden
              flex flex-col md:flex-row
            "
          >
            {/* Header (Mobile Only) */}
            <div className="md:hidden p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-bold">Checkout</h2>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* ERROR TOAST (Absolute) */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-4 left-0 right-0 mx-auto w-max max-w-[90%] z-50 bg-red-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2"
                >
                  <AlertCircle size={20} />
                  <span className="font-bold">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* LEFT COLUMN: Order Summary */}
            <div className="flex-1 bg-gray-50 dark:bg-[#111] p-6 md:p-8 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-200 dark:border-white/5">
              <h3 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                Order Summary
                <span className="text-sm font-normal text-gray-500 bg-white dark:bg-white/10 px-3 py-1 rounded-full">
                  {items.reduce((acc, i) => acc + i.quantity, 0)} items
                </span>
              </h3>

              <div className="space-y-4">
                {items.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-white dark:bg-white/5 p-1 border border-gray-100 dark:border-white/5 shrink-0">
                      <img
                        src={item.image}
                        alt=""
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg leading-tight">
                          {item.name}
                        </h4>
                        <span className="font-bold tabular-nums">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Qty: {item.quantity}
                      </p>
                      {item.selectedModifiers?.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {item.selectedModifiers
                            .map((m: any) => m.name)
                            .join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: Payment & Totals */}
            <div className="flex-1 p-6 md:p-8 flex flex-col">
              {/* Header (Desktop) */}
              <div className="hidden md:flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black">Payment</h2>
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                {/* Bill Breakdown */}
                <div className="space-y-3 pb-6 border-b border-gray-100 dark:border-white/5">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-medium">
                      {formatPrice(totals.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Tax (10%)</span>
                    <span className="tabular-nums font-medium">
                      {formatPrice(totals.tax)}
                    </span>
                  </div>
                  <div className="flex justify-between text-brand-primary font-bold">
                    <span>Tip ({tipPercentage}%)</span>
                    <span className="tabular-nums">
                      {formatPrice(totals.tip)}
                    </span>
                  </div>
                </div>

                {/* Tip Selector */}
                <div>
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 block">
                    Add a Tip
                  </label>
                  <div className="grid grid-cols-4 gap-2 md:gap-3">
                    {[0, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setTipPercentage(pct)}
                        className={`
                          py-3 rounded-xl font-bold text-sm md:text-base border-2 transition-all cursor-pointer
                          ${
                            tipPercentage === pct
                              ? "border-brand-primary bg-brand-primary/10 text-brand-primary shadow-sm"
                              : "border-gray-100 dark:border-white/10 text-gray-500 hover:border-brand-primary/50"
                          }
                        `}
                      >
                        {pct === 0 ? "No Tip" : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total Display */}
                <div className="flex justify-between items-center py-4">
                  <span className="text-2xl font-bold">Total</span>
                  <span className="text-4xl font-black text-brand-primary tabular-nums">
                    {formatPrice(totals.total)}
                  </span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="
                  w-full py-5 rounded-2xl
                  bg-zinc-900 dark:bg-white 
                  text-white dark:text-black
                  font-black text-xl tracking-wide
                  hover:scale-[1.02] active:scale-[0.98]
                  disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed
                  transition-all shadow-xl
                  flex items-center justify-center gap-3
                  mt-auto cursor-pointer
                "
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={24} />
                    Pay {formatPrice(totals.total)}
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                <CreditCard size={12} />
                Secure Mock Payment Processor
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CheckoutModal;
