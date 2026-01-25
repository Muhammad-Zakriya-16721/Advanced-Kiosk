"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const IdleScreen = () => {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Time in milliseconds before showing idle screen (60 seconds)
  const IDLE_TIMEOUT = 60000;

  useEffect(() => {
    // Function to reset timer
    const resetTimer = () => {
      if (isIdle) {
        setIsIdle(false);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, IDLE_TIMEOUT);
    };

    // Events to track
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    // Initialize timer
    resetTimer();

    // specific optimized handler for mousemove to avoid too many state updates?
    // Actually resetTimer just clears and sets timeout, it's fast enough.
    // But for mousemove it might fire every pixel. throttling might be good but for a kiosk 60s timeout, standard reset is usually fine if not lagging.
    // Let's debounce it slightly or just use raw for simplicity as requested.

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isIdle]);

  return (
    <AnimatePresence>
      {isIdle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={() => setIsIdle(false)}
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            {/* High quality food background placeholder */}
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"
              alt="Delicious Food"
              className="w-full h-full object-cover opacity-60"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center p-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {/* Brand Logo or Name */}
              <h1 className="text-6xl md:text-9xl font-black text-white mb-6 tracking-tighter drop-shadow-2xl">
                QuickBite
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: 1,
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              className="text-2xl md:text-4xl text-brand-primary font-bold uppercase tracking-[0.2em] mt-8"
            >
              Touch to Start Ordering
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IdleScreen;
