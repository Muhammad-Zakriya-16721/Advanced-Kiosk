import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowLeft, Moon, Sun } from "lucide-react";
import SearchBar from "@/components/menu/filters/SearchBar";
import { useTheme } from "@/context/ThemeContext";

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isSearching?: boolean;
  onClearSearch?: () => void;
  onFilterClick?: () => void;
  onOpenSettings?: () => void;
}

const Header = ({
  searchQuery = "",
  onSearchChange,
  isSearching = false,
  onClearSearch,
  onFilterClick,
  onOpenSettings,
}: HeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Theme Context
  // @ts-ignore - ThemeContext might not be strictly typed yet
  const { theme, toggleTheme } = useTheme();

  // Mobile Search State & Refs
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Client-side only interval
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Rotation & Resize Safety Valve
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSearchOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  // 2. Focus & Scroll Manager
  useEffect(() => {
    if (isMobileSearchOpen) {
      // Lock Scroll
      document.body.style.overflow = "hidden";

      // Focus Hack for Mobile Keyboards
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Restore Scroll
      document.body.style.overflow = "";

      // Restore Focus to trigger button if it exists
      if (searchButtonRef.current) {
        // Optional: searchButtonRef.current.focus();
      }
    }
  }, [isMobileSearchOpen]);

  // Hydration mismatch prevention
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <>
      <header
        role="banner"
        className="
          flex items-center justify-between 
          px-4 md:px-8 
          pb-4 md:pb-6
          pt-[calc(1rem+env(safe-area-inset-top))] md:pt-[calc(1.5rem+env(safe-area-inset-top))]
          bg-[var(--glass-panel)] backdrop-blur-[var(--blur-strength)] sticky top-0 z-30 
          border-b border-[var(--glass-border)]
          shadow-xl
          transition-colors duration-300
          gap-4
        "
      >
        {/* DESKTOP LAYOUT (Hidden on Mobile) */}
        <div className="hidden md:flex flex-1 items-center justify-between">
          {/* LEFT: Title */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col justify-center shrink-0"
          >
            <h1 className="font-bold text-[var(--text-primary)] tracking-tight leading-none transition-colors duration-300">
              <span className="block text-xs sm:text-sm md:text-base xl:text-xl opacity-60 font-medium mb-0.5 md:mb-1">
                Welcome to
              </span>
              <span className="text-xl sm:text-3xl md:text-3xl xl:text-5xl text-brand-primary block filter drop-shadow-md">
                QuickBite
              </span>
            </h1>
          </motion.div>

          {/* CENTER: SEARCH BAR */}
          <SearchBar
            value={searchQuery}
            onChange={(val) => onSearchChange?.(val)}
            isSearching={isSearching}
            onClear={() => onClearSearch?.()}
            onFilterClick={onFilterClick}
          />

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-4 md:gap-6">
            <div
              className="flex flex-col items-end min-w-[90px] md:min-w-[130px] xl:min-w-[160px]"
              aria-live="polite"
            >
              <span className="text-lg md:text-xl xl:text-3xl font-bold text-[var(--text-primary)] leading-none tracking-widest tabular-nums transition-colors duration-300">
                {mounted ? formattedTime : "--:-- --"}
              </span>

              <div className="flex items-center gap-1.5 md:gap-2 mt-1 md:mt-2">
                <span className="relative flex h-2 w-2 md:h-3 md:w-3">
                  <span className="relative inline-flex rounded-full h-full w-full bg-green-500"></span>
                </span>
                <span className="text-[10px] md:text-sm xl:text-base text-brand-primary font-bold tracking-widest opacity-90">
                  OPEN 24/7
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE LAYOUT (Flex on Mobile, Hidden on Desktop) */}
        <div className="flex md:hidden flex-1 items-center justify-between w-full">
          {/* Left: QuickBite Text (Yellow) */}
          <span className="text-2xl font-black text-brand-primary tracking-tight">
            QuickBite
          </span>

          {/* Right: Icons Row */}
          <div className="flex items-center gap-3">
            {/* Search Trigger (Left) */}
            <button
              ref={searchButtonRef}
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-2 text-zinc-600 dark:text-gray-300 rounded-full hover:bg-black/5 active:scale-95 transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search size={24} />
            </button>

            {/* Settings Trigger (Right) */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-zinc-600 dark:text-gray-300 rounded-full hover:bg-black/5 active:scale-95 transition-colors cursor-pointer"
              aria-label="Settings"
            >
              {/* Using Settings Icon - import needed if not present? It is used in sidebar logic but here header might need it */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-settings"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>

        {/* MOBILE SEARCH OVERLAY */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              className="
                        absolute inset-0 z-50 
                        bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur-md 
                        flex items-center px-4 gap-2 
                        pt-[env(safe-area-inset-top)] pb-4
                        shadow-xl border-b border-gray-100 dark:border-white/5
                    "
            >
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-2 -ml-2 text-zinc-600 dark:text-gray-300 active:scale-95 cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft size={24} />
              </button>

              <div className="flex-1">
                <SearchBar
                  ref={inputRef}
                  autoFocus={true}
                  value={searchQuery}
                  onChange={(val) => onSearchChange?.(val)}
                  isSearching={isSearching}
                  onClear={() => onClearSearch?.()}
                  onFilterClick={onFilterClick}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Header;
