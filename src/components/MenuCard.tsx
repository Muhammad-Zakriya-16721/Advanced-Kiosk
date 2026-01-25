"use client";

import React, { memo, useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface MenuCardProps {
  item: any;
  index: number;
  onItemClick: (item: any, index: number) => void;
  isFocused: boolean;
  priority?: boolean;
}

const MenuCard = ({
  item,
  index,
  onItemClick,
  isFocused,
  priority = false,
}: MenuCardProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageError, setIsImageError] = useState(false);

  const handleImageLoad = () => setIsImageLoaded(true);
  const handleImageError = () => {
    setIsImageLoaded(true); // Stop loading state
    setIsImageError(true);
  };

  return (
    <motion.div
      layout="position"
      style={{ transform: "translateZ(0)" }} // GPU Acceleration Hint
      initial={!shouldReduceMotion ? { opacity: 0, scale: 0.9 } : undefined}
      animate={{
        opacity: 1,
        scale: isFocused ? 1.05 : 1, // Visual Pop on Focus
      }}
      exit={!shouldReduceMotion ? { opacity: 0, scale: 0.9 } : undefined}
      whileHover={!shouldReduceMotion ? { scale: 1.02, y: -5 } : {}}
      transition={{ duration: 0.3 }}
      onClick={() => onItemClick(item, index)}
      role="button"
      tabIndex={0}
      aria-label={`Add ${item.name} to order for $${item.price}`}
      className={`
        group relative flex flex-col gap-3 md:gap-4
        bg-white/80 dark:bg-white/5 backdrop-blur-md border border-[var(--glass-border)] overflow-hidden
        /* Visual Noise Reduction: Softer shadows */
        shadow-lg
        /* Responsive Rounded Corners */
        rounded-2xl md:rounded-3xl 
        /* Responsive Padding: Increased mobile to p-4 */
        p-4 md:p-5
        /* Interactive State: Active Scale & Cursor */
        cursor-pointer transition-all duration-300
        active:bg-white/90 dark:active:bg-white/10 hover:bg-white dark:hover:bg-white/10 hover:border-[var(--glass-border)] hover:shadow-2xl
        outline-none
        
        /* KEYBOARD FOCUS STATE */
        ${
          isFocused
            ? "ring-4 ring-brand-primary dark:ring-brand-primary/60 z-10 shadow-2xl scale-[1.02]"
            : ""
        }
      `}
    >
      {/* Image Section with Skeleton Placeholder */}
      <div className="relative w-full aspect-[16/10] md:aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#111]">
        {/* Loading Skeleton */}
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-[#2A2A2A] animate-pulse" />
        )}

        {!isImageError ? (
          <img
            src={item.image}
            alt="" // Decorative since container has aria-label
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`
              w-full h-full object-cover transition-all duration-500 group-hover:scale-105
              ${isImageLoaded ? "opacity-100" : "opacity-0"}
            `}
            loading="lazy"
          />
        ) : (
          /* Fallback for broken image */
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#222]">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        )}

        {/* Softened Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-40" />
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-start gap-3 mb-1">
          <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] leading-tight line-clamp-2">
            {item.name}
          </h3>
          {/* Strengthened Price Hierarchy */}
          <span className="text-yellow-600 dark:text-brand-primary font-black text-xl md:text-2xl tabular-nums shrink-0 leading-none">
            ${item.price}
          </span>
        </div>

        <p className="text-[var(--text-secondary)] text-xs md:text-sm line-clamp-2 mb-4 leading-relaxed font-medium">
          {item.description}
        </p>

        {/* Action Button (Visual Affordance) */}
        {/* Note: This is a div to avoid nested button semantics, but looks identical to a button */}
        <div
          className="
            mt-auto w-full 
            /* Button Height: 48px mobile, 60px desktop */
            h-12 md:h-14
            bg-zinc-900 dark:bg-[#2A2A2A] rounded-xl md:rounded-2xl 
            flex items-center justify-center gap-2 
            text-white group-hover:bg-brand-primary group-hover:text-brand-dark 
            transition-colors duration-300
          "
        >
          <Plus size={20} strokeWidth={3} className="w-5 h-5 md:w-6 md:h-6" />
          <span className="font-bold text-sm md:text-base uppercase tracking-wide">
            Add to Order
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(MenuCard);
