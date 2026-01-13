// src/components/Header/Header.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });

  return (
    <header
      role="banner"
      className="
        flex items-center justify-between 
        px-4 md:px-8 
        /* Adjusted Padding: Ensure vertical centering by adding safe-area to base padding */
        pb-4 md:pb-6
        pt-[calc(1rem+env(safe-area-inset-top))] md:pt-[calc(1.5rem+env(safe-area-inset-top))]
        bg-[var(--glass-panel)] backdrop-blur-[var(--blur-strength)] sticky top-0 z-30 
        border-b border-[var(--glass-border)]
        /* Shadow: Consistent shadow-xl */
        shadow-xl
        transition-colors duration-300
      "
    >
      {/* LEFT: Title */}

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col justify-center"
      >
        <h1 className="font-bold text-[var(--text-primary)] tracking-tight leading-none transition-colors duration-300">
          {/* Always visible 'Welcome to' with responsive sizing */}
          <span className="block text-xs sm:text-sm md:text-3xl lg:text-4xl opacity-60 font-medium mb-0.5 md:mb-1">
            Welcome to
          </span>
          <span className="text-xl sm:text-3xl md:text-5xl lg:text-6xl text-brand-primary block filter drop-shadow-md">
            QuickBite
          </span>
        </h1>
      </motion.div>

      {/* RIGHT: Actions */}
        {/* Theme Toggle & Live Clock Container */}
        <div className="flex items-center gap-4 md:gap-6">
          


          {/* Live Clock Section */}
          {/* Increased min-width to 100px/160px */}
          <div className="flex flex-col items-end min-w-[90px] md:min-w-[160px]" aria-live="polite">
            <span className="text-lg md:text-4xl font-bold text-[var(--text-primary)] leading-none tracking-widest tabular-nums transition-colors duration-300">
               {formattedTime}
            </span>
            
            <div className="flex items-center gap-1.5 md:gap-2 mt-1 md:mt-2">
              {/* Ping animation removed, only static dot remains */}
              <span className="relative flex h-2 w-2 md:h-3 md:w-3">
                <span className="relative inline-flex rounded-full h-full w-full bg-green-500"></span>
              </span>
              <span className="text-[10px] md:text-base text-brand-primary font-bold tracking-widest opacity-90">
                OPEN 24/7
              </span>
            </div>
          </div>
        </div>

    </header>
  );
};

export default Header;