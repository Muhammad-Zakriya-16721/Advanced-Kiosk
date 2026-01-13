import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

const OrderSuccess = ({ isOpen, orderNo, onClose, autoCloseMs = 5000 }) => {
  const closeBtnRef = useRef(null);
  const previouslyFocusedEl = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previously focused element and focus the close button
    previouslyFocusedEl.current = document.activeElement;
    // Small timeout to ensure element exists in DOM
    setTimeout(() => closeBtnRef.current?.focus(), 50);

    // Disable background scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Close on Escape
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    // Optional auto-close
    let timer;
    if (autoCloseMs > 0) {
      timer = setTimeout(onClose, autoCloseMs);
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer) clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      // Restore focus
      try {
        previouslyFocusedEl.current?.focus?.();
      } catch {
        /* empty */
      }
    };
  }, [isOpen, onClose, autoCloseMs]);

  // Ensure orderNo is string and remove leading hash if present
  const displayNo = String(orderNo ?? "").replace(/^#/, "");

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        // Use motion.div as the immediate AnimatePresence child so exit animation works.
        <motion.div
          key="order-success-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          aria-hidden={!isOpen}
        >
          {/* Backdrop */}
          <motion.button
            aria-label="Close order success"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm border-0 p-0 m-0"
            // Make backdrop non-focusable but still clickable
            style={{ appearance: "none" }}
            tabIndex={-1}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-success-title"
            aria-describedby="order-success-desc"
            initial={{ scale: 0.5, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="
              relative w-full max-w-md 
              bg-white dark:bg-[#1A1A1A] 
              border border-gray-100 dark:border-white/10 
              rounded-3xl p-8 flex flex-col items-center text-center 
              shadow-2xl overflow-hidden transition-colors duration-300
            "
          >
            {/* Background Glow - Adjusted for Light Mode */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-500/10 blur-3xl rounded-full pointer-events-none" />

            {/* Checkmark */}
            <div className="relative mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-500/20"
              >
                <Check size={48} strokeWidth={4} className="text-white" />
              </motion.div>
            </div>

            <h2 id="order-success-title" className="text-3xl font-black text-zinc-900 dark:text-white mb-2">
              Order Placed!
            </h2>

            <p id="order-success-desc" className="text-zinc-600 dark:text-gray-400 mb-6">
              Kitchen is preparing your meal.
              <br />
              <span className="text-sm">Please take your receipt.</span>
            </p>

            <div className="bg-gray-50 dark:bg-[#252525] border border-dashed border-gray-200 dark:border-white/10 rounded-xl p-4 w-full mb-8 transition-colors">
              <p className="text-zinc-500 dark:text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">
                Order Number
              </p>
              <p className="text-4xl font-mono font-bold text-zinc-900 dark:text-brand-primary tracking-widest">
                {displayNo}
              </p>
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Start a new order"
              className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-lg rounded-xl hover:opacity-90 transition-opacity active:scale-95 shadow-lg"
            >
              Start New Order
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderSuccess;
