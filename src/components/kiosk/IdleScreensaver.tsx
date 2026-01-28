"use client";

import React, { useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import { motion, AnimatePresence } from "framer-motion";
import { TouchpadOff } from "lucide-react";

export default function IdleScreensaver() {
  const [isIdle, setIsIdle] = useState(false);

  // Activate after 60 seconds (60 * 1000ms)
  const onIdle = () => {
    setIsIdle(true);
  };

  const onActive = () => {
    setIsIdle(false);
  };

  useIdleTimer({
    onIdle,
    onActive,
    timeout: 60_000,
    throttle: 500,
  });

  return (
    <AnimatePresence>
      {isIdle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer overflow-hidden"
          onClick={() => setIsIdle(false)}
        >
          {/* Background Video / Ken Burns Slideshow */}
          <div className="absolute inset-0 opacity-60">
            {/* 
                For a real production app, use a <video> tag here.
                Using a high-quality food image with Ken Burns effect for now 
                since we don't have a guaranteed video file.
             */}
            <motion.img
              src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=2938"
              alt="Delicious Food"
              className="w-full h-full object-cover"
              animate={{
                scale: [1, 1.1],
                x: [0, -20],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "linear",
              }}
            />
          </div>

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

          {/* Call to Action content */}
          <div className="relative z-10 text-center space-y-8">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter drop-shadow-2xl">
                HUNGRY?
              </h1>
              <p className="text-2xl md:text-4xl font-bold text-brand-primary mt-2 drop-shadow-lg">
                Fresh & Hot • Ready in Minutes
              </p>
            </motion.div>

            <div className="animate-bounce mt-10">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full text-xl font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                Touch to Order
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
