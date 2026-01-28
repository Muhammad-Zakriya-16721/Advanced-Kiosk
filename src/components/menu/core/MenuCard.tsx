"use client";

import React, { memo, useState, useEffect } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTimeStore } from "@/store/timeStore"; // Global Timer

interface MenuCardProps {
  item: any;
  index: number;
  onItemClick: (item: any, index: number, e?: React.SyntheticEvent) => void;
  isFocused: boolean;
  priority?: boolean;
}

import {
  calculateDiscountedPrice,
  isDiscountActive as checkDiscountActive,
} from "@/lib/api";

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
    setIsImageLoaded(true);
    setIsImageError(true);
  };

  // use global timer to prevent 50+ intervals
  const now = useTimeStore((state) => state.now);

  const expiryTimestamp = item.deal_ends_at || item.discount_ends_at;

  // We don't need local effect anymore. 'now' updates every second globally.

  const isExpired = expiryTimestamp && new Date(expiryTimestamp) < now;

  // Logic: If deal has ended, it's unavailable.
  // Logic: If deal has ended, it's unavailable.
  const outOfStock = (item.stock_level ?? 999) <= 0;
  const isAvailable =
    item.is_available !== false &&
    !outOfStock &&
    !(item.type === "deal" && isExpired);

  // Use the helper, but we also re-run it based on currentTime state for real-time updates
  // Note: helper uses 'new Date()' internally so it will be accurate on render
  // However, checkDiscountActive might need 'currentTime' passed if we want it to react to the state,
  // but since we re-render on interval, it will call new Date() again inside the helper.
  // Wait, helper imports 'api', which isn't a hook. It will use the moment it's called.
  // Since component re-renders every second (if timer active), it works.

  const isDiscountActive = checkDiscountActive(item);
  const finalPrice = calculateDiscountedPrice(item);
  const discountValue = item.discount_value || 0;
  const discountType = item.discount_type || "percent";

  // Calculate percentage for badge if it's fixed
  const effectivePercent =
    discountType === "percent"
      ? discountValue
      : Math.round(((item.price - finalPrice) / item.price) * 100);

  const timeLeft =
    expiryTimestamp && new Date(expiryTimestamp).getTime() - now.getTime();
  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return "Included";
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const handleClick = (e: React.SyntheticEvent) => {
    if (isAvailable) {
      onItemClick(item, index, e); // Pass event
    }
  };

  return (
    <motion.div
      layout="position"
      style={{ transform: "translateZ(0)" }}
      initial={!shouldReduceMotion ? { opacity: 0, scale: 0.9 } : undefined}
      animate={{
        opacity: isAvailable ? 1 : 0.6,
        scale: isFocused ? 1.05 : 1,
        filter: isAvailable ? "grayscale(0%)" : "grayscale(100%)",
      }}
      exit={!shouldReduceMotion ? { opacity: 0, scale: 0.9 } : undefined}
      whileHover={
        !shouldReduceMotion && isAvailable ? { scale: 1.02, y: -5 } : {}
      }
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      role="button"
      tabIndex={isAvailable ? 0 : -1}
      aria-disabled={!isAvailable}
      aria-label={`${isAvailable ? "Add" : "Sold Out:"} ${item.name} ${
        isDiscountActive
          ? `at ${discountType === "percent" ? `${discountValue}%` : `$${discountValue}`} off`
          : ""
      }`}
      className={`
        group relative flex flex-col gap-3 md:gap-4
        bg-white/80 dark:bg-white/5 backdrop-blur-md border border-[var(--glass-border)] overflow-hidden
        shadow-lg rounded-2xl md:rounded-3xl p-4 md:p-5
        outline-none transition-all duration-300
        ${
          isAvailable
            ? "cursor-pointer active:bg-white/90 dark:active:bg-white/10 hover:bg-white dark:hover:bg-white/10 hover:border-[var(--glass-border)] hover:shadow-2xl"
            : "cursor-not-allowed opacity-80"
        }
        ${
          isFocused
            ? "ring-4 ring-brand-primary dark:ring-brand-primary/60 z-10 shadow-2xl scale-[1.02]"
            : ""
        }
      `}
    >
      {/* Image Section */}
      <div className="relative w-full aspect-[16/10] md:aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#111]">
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-[#2A2A2A] animate-pulse" />
        )}

        {!isImageError ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`object-cover transition-all duration-500 ${
              isAvailable ? "group-hover:scale-105" : ""
            } ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#222]">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-40" />

        {/* BADGES */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 items-start">
          {!isAvailable && (
            <span className="bg-zinc-800 text-white font-bold text-xs uppercase px-2 py-1 rounded-md shadow-lg border border-zinc-600">
              Sold Out
            </span>
          )}
          {isAvailable && isDiscountActive && (
            <span className="bg-red-600 text-white font-bold text-xs uppercase px-2 py-1 rounded-md shadow-lg animate-pulse">
              {discountType === "percent"
                ? `${discountValue}% OFF`
                : `$${discountValue} OFF`}
            </span>
          )}
          {/* Low Stock Badge */}
          {isAvailable &&
            item.stock_level > 0 &&
            item.stock_level <= (item.low_stock_threshold || 5) && (
              <span className="bg-orange-500 text-white font-bold text-xs uppercase px-2 py-1 rounded-md shadow-lg animate-bounce">
                Only {item.stock_level} Left!
              </span>
            )}
        </div>

        {/* Timer Badge */}
        {timeLeft && timeLeft > 0 && item.type === "deal" && (
          <div className="absolute top-2 right-2 bg-black/60 text-white backdrop-blur-md px-2 py-1 rounded-md border border-white/10 flex items-center gap-1 z-10 shadow-lg">
            <span className="text-[10px] font-bold uppercase text-orange-400">
              Ends in
            </span>
            <span className="text-xs font-mono font-bold tabular-nums ml-1">
              {formatTimeLeft(timeLeft)}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-start gap-3 mb-1">
          <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] leading-tight line-clamp-2">
            {item.name}
          </h3>
          {/* Price Options */}
          <div className="flex flex-col items-end leading-none">
            {isDiscountActive && isAvailable ? (
              <>
                <span className="text-xs text-gray-400 line-through mb-1">
                  ${item.price.toFixed(2)}
                </span>
                <span className="text-red-500 font-black text-xl md:text-2xl tabular-nums">
                  ${finalPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-yellow-600 dark:text-brand-primary font-black text-xl md:text-2xl tabular-nums">
                ${item.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <p className="text-[var(--text-secondary)] text-xs md:text-sm line-clamp-2 mb-4 leading-relaxed font-medium">
          {item.description}
        </p>

        {/* Action Button */}
        <div
          className={`
            mt-auto w-full h-12 md:h-14 rounded-xl md:rounded-2xl 
            flex items-center justify-center gap-2 
            transition-colors duration-300
            ${
              isAvailable
                ? "bg-zinc-900 dark:bg-[#2A2A2A] text-white group-hover:bg-brand-primary group-hover:text-white"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
            }
          `}
        >
          {isAvailable ? (
            <>
              <Plus
                size={20}
                strokeWidth={3}
                className="w-5 h-5 md:w-6 md:h-6"
              />
              <span className="font-bold text-sm md:text-base uppercase tracking-wide">
                Add to Order
              </span>
            </>
          ) : (
            <span className="font-bold text-xs md:text-sm uppercase tracking-wide text-zinc-500">
              {outOfStock ? "Sold Out" : "Unavailable"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default memo(MenuCard);
