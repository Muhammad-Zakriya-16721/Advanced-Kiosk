"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Receipt } from "lucide-react";

import DigitalReceipt from "./DigitalReceipt";

interface SuccessScreenProps {
  onComplete: () => void;
  orderNumber: string;
  cartItems: any[];
  subtotal: number;
  tax: number;
  total: number;
}

const SuccessScreen = ({
  onComplete,
  orderNumber,
  cartItems,
  subtotal,
  tax,
  total,
}: SuccessScreenProps) => {
  const [countdown, setCountdown] = useState(10);
  const [showReceipt, setShowReceipt] = useState(false);
  const DURATION = 10; // Total seconds for progress bar calc

  // LOGIC FIX:
  // We use a useEffect that depends on 'countdown'.
  // If countdown reaches 0, we trigger onComplete.
  // We use setTimeout to decrement, ensuring clean state updates.
  useEffect(() => {
    if (countdown === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  // Clean Order Number string
  const displayNo = String(orderNumber).replace("#", "");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      {/* Container: Dark Receipt Card */}
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="
          relative w-full max-w-md 
          bg-white dark:bg-[#1a1a1a] 
          rounded-3xl 
          border border-gray-100 dark:border-white/10 
          p-8 md:p-10 
          text-center 
          overflow-hidden 
          shadow-2xl
        "
      >
        {/* Background Texture/Noise (Optional) */}
        <div className="absolute inset-0 bg-white/5 pointer-events-none" />

        {/* Dynamic Receipt Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Animated Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2,
            }}
            className="w-24 h-24 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6 ring-1 ring-green-500/30"
          >
            <Check
              className="w-12 h-12 text-green-600 dark:text-green-500"
              strokeWidth={4}
            />
          </motion.div>

          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
            Order Confirmed!
          </h2>

          <p className="text-zinc-500 dark:text-gray-400 text-sm mb-8">
            Kitchen is preparing your meal
          </p>

          {/* Huge Order Number */}
          <div className="w-full bg-gray-50 dark:bg-black/40 rounded-2xl p-6 border border-gray-200 dark:border-white/5 mb-8">
            <p className="text-zinc-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">
              Order Number
            </p>
            <h1 className="text-6xl md:text-7xl font-black text-brand-primary dark:text-yellow-400 tracking-tighter shadow-brand-primary/20 dark:shadow-yellow-500/20 drop-shadow-lg">
              #{displayNo}
            </h1>
          </div>

          <p className="text-zinc-600 dark:text-gray-300 font-medium mb-8">
            Please wait for your number to be called.
          </p>

          {/* Action Button */}
          <button
            onClick={onComplete}
            className="
              w-full py-4 rounded-xl 
              bg-gray-100 hover:bg-gray-200 
              dark:bg-white/10 dark:hover:bg-white/20 
              text-zinc-900 dark:text-white font-bold 
              transition-all active:scale-95
              flex items-center justify-center gap-2
              mb-6 cursor-pointer
            "
          >
            Start New Order
          </button>

          <button
            onClick={() => setShowReceipt(true)}
            className="text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white text-sm font-bold transition-colors mb-6 cursor-pointer flex items-center gap-2"
          >
            <Receipt size={16} />
            View Receipt
          </button>

          {/* Footer Progress Bar */}
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: `${(countdown / DURATION) * 100}%` }}
              transition={{ ease: "linear", duration: 1 }}
              className="h-full bg-green-500"
            />
          </div>
          <p className="text-xs text-zinc-400 dark:text-gray-500 mt-2 font-mono">
            Auto-closing in {countdown}s
          </p>
        </div>
      </motion.div>
      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowReceipt(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-1 rounded-sm shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <DigitalReceipt
                orderNumber={orderNumber}
                items={cartItems}
                subtotal={subtotal}
                tax={tax}
                total={total}
                date={new Date()}
              />
              <button
                onClick={() => setShowReceipt(false)}
                className="w-full mt-4 bg-black text-white py-3 font-bold uppercase tracking-widest text-xs hover:bg-gray-800"
              >
                Close Receipt
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SuccessScreen;
