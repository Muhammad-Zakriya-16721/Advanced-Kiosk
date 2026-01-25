"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Receipt } from "lucide-react";

interface SuccessScreenProps {
  onComplete: () => void;
  orderNumber: string;
}

const SuccessScreen = ({ onComplete, orderNumber }: SuccessScreenProps) => {
  const [countdown, setCountdown] = useState(10);
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
          bg-[#1a1a1a] 
          rounded-3xl 
          border border-white/10 
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
            className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 ring-1 ring-green-500/30"
          >
            <Check className="w-12 h-12 text-green-500" strokeWidth={4} />
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Order Confirmed!
          </h2>

          <p className="text-gray-400 text-sm mb-8">
            Kitchen is preparing your meal
          </p>

          {/* Huge Order Number */}
          <div className="w-full bg-black/40 rounded-2xl p-6 border border-white/5 mb-8">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">
              Order Number
            </p>
            <h1 className="text-6xl md:text-7xl font-black text-yellow-400 tracking-tighter shadow-yellow-500/20 drop-shadow-lg">
              #{displayNo}
            </h1>
          </div>

          <p className="text-gray-300 font-medium mb-8">
            Please wait for your number to be called.
          </p>

          {/* Action Button */}
          <button
            onClick={onComplete}
            className="
              w-full py-4 rounded-xl 
              bg-white/10 hover:bg-white/20 
              text-white font-bold 
              transition-all active:scale-95
              flex items-center justify-center gap-2
              mb-6 cursor-pointer
            "
          >
            Start New Order
          </button>

          {/* Footer Progress Bar */}
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: `${(countdown / DURATION) * 100}%` }}
              transition={{ ease: "linear", duration: 1 }}
              className="h-full bg-green-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 font-mono">
            Auto-closing in {countdown}s
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SuccessScreen;
