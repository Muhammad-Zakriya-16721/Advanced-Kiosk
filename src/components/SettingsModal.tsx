"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard, Check, ToggleLeft, ToggleRight } from "lucide-react";

const SHORTCUTS = [
  {
    category: "General",
    items: [
      { key: "Tab", action: "Switch Focus (Sidebar → Main → Cart)" },
      { key: "Settings Icon", action: "Toggle Keyboard Controls" },
    ],
  },
  {
    category: "Sidebar (Menu Categories)",
    items: [
      { key: "Up / Down", action: "Move focus" },
      { key: "Enter", action: "Select Category" },
    ],
  },
  {
    category: "Main Menu (Food Items)",
    items: [
      { key: "Left / Right", action: "b/w Items" },
      { key: "Enter", action: "Add to Order (Hold for more)" },
      { key: "Shift + Enter", action: "Add 10 Quantity" },
      { key: "Backspace", action: "Remove 1 Quantity" },
      { key: "Delete", action: "Remove Item Completely" },
    ],
  },
  {
    category: "My Order (Cart)",
    items: [
      { key: "Up / Down", action: "Move focus" },
      { key: "Left / Right", action: "Decrease / Increase Qty" },
      { key: "Backspace", action: "Remove Selected Item" },
      { key: "Enter", action: "Pay Now / Start New Order" },
      { key: "Delete", action: "Clear Cart (Press twice)" },
    ],
  },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isKeyboardEnabled: boolean;
  toggleKeyboard: () => void;
  isClickFocusEnabled: boolean;
  toggleClickFocus: () => void;
}

const SettingsModal = ({
  isOpen,
  onClose,
  isKeyboardEnabled,
  toggleKeyboard,
  isClickFocusEnabled,
  toggleClickFocus,
}: SettingsModalProps) => {
  // Detect Touch Device
  const [isTouch, setIsTouch] = useState(false);
  const [unlockAttempts, setUnlockAttempts] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleToggleAttempt = () => {
    if (!isTouch) {
      toggleKeyboard();
      return;
    }
    // Secret unlock logic for touch devices
    const newCount = unlockAttempts + 1;
    if (newCount >= 5) {
      setShowConfirm(true);
      setUnlockAttempts(0);
    } else {
      setUnlockAttempts(newCount);
    }
  };

  const forceEnable = () => {
    toggleKeyboard();
    setShowConfirm(false);
    // Optionally unlock "isTouch" so it acts like desktop for this session?
    // Or just let the toggle switch. The toggle calls the parent state.
    // However, the internal logic checks `isTouch` for rendering "Touch Device" badge.
    // We might want to visually treat it as unlocked.
    // For now, simpler: just call toggleKeyboard(). Parent prop `isKeyboardEnabled` will become true.
    // Does the UI prevent it flipping back? The UI shows status based on props.
    // BUT the click handler is still guarded by `isTouch`.
    // We need to bypass the guard in future clicks? OR just rely on the toggle being ON?
    // If it's ON, clicking it again (to turn OFF) should effectively work?
    // My logic: `onClick={() => !isTouch && toggleKeyboard()}`.
    // If I force enable, `isKeyboardEnabled` becomes true.
    // To turn it OFF, I need to click it.
    // If I click it, `!isTouch` is false, so it goes to counting again?
    // That's annoying. turning OFF should be easy.
    // Fix: If `isKeyboardEnabled` is TRUE, allow toggle always?
    // Or just set `isTouch` to false locally upon force enable?
    // Let's set `isTouch(false)` when force enabled.
    setIsTouch(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-2xl bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confirmation Overlay */}
            <AnimatePresence>
              {showConfirm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 z-50 bg-white/95 dark:bg-[#1A1A1A]/95 backdrop-blur flex flex-col items-center justify-center text-center p-8"
                >
                  <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4 text-red-600 dark:text-red-400">
                    <Keyboard size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
                    Enable Physical Keyboard?
                  </h3>
                  <p className="text-zinc-600 dark:text-gray-300 max-w-md mb-8">
                    This mode is designed for physical keyboard navigation and
                    may disable some touch interactions.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-6 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={forceEnable}
                      className="px-6 py-3 rounded-xl font-bold bg-brand-primary text-brand-dark hover:brightness-110 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
                    >
                      Turn On Anyway
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-primary/10 rounded-xl">
                  <Keyboard size={24} className="text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                    Settings
                  </h2>
                  <p className="text-zinc-500 dark:text-gray-400 text-sm">
                    Configure your kiosk experience
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-zinc-500 dark:text-gray-400 cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Toggle Section */}
              <div className="space-y-4 mb-8">
                {/* Master Toggle */}
                <div
                  onClick={handleToggleAttempt}
                  className={`
                      flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5
                      transition-all duration-200
                      ${isTouch ? "cursor-pointer active:scale-[0.99]" : "cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 hover:shadow-md hover:border-gray-200 dark:hover:border-white/10"}
                  `}
                >
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      Keyboard Navigation
                      {isTouch && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-full">
                          Touch Device
                        </span>
                      )}
                    </h3>
                    <p className="text-zinc-500 dark:text-gray-400 text-sm">
                      {isTouch && !isKeyboardEnabled
                        ? "Tap 5 times to force enable for testing."
                        : "Enable physical keyboard controls for accessibility"}
                    </p>
                  </div>

                  <div
                    className={`
                              relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 pointer-events-none
                              ${isKeyboardEnabled ? "bg-brand-primary" : "bg-gray-300 dark:bg-zinc-700"}
                          `}
                  >
                    <span
                      className={`
                                  inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300
                                  ${isKeyboardEnabled ? "translate-x-7" : "translate-x-1"}
                              `}
                    />
                  </div>
                </div>

                {/* Sync Focus Toggle (Dependent on Master) */}
                <div
                  onClick={() => isKeyboardEnabled && toggleClickFocus()}
                  className={`
                      flex items-center justify-between p-4 rounded-2xl border border-transparent
                      transition-all duration-300
                      ${
                        isKeyboardEnabled
                          ? "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 hover:shadow-md hover:border-gray-200 dark:hover:border-white/10"
                          : "opacity-40 grayscale pointer-events-none cursor-not-allowed"
                      }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${isClickFocusEnabled ? "bg-brand-primary/20 text-brand-dark" : "bg-gray-200 dark:bg-white/10 text-gray-500"}`}
                    >
                      <ToggleLeft size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                        Sync Focus on Click
                      </h3>
                      <p className="text-zinc-500 dark:text-gray-400 text-sm">
                        Move keyboard focus when clicking items
                      </p>
                    </div>
                  </div>

                  <div
                    className={`
                              relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 pointer-events-none
                              ${isClickFocusEnabled ? "bg-brand-primary" : "bg-gray-300 dark:bg-zinc-700"}
                          `}
                  >
                    <span
                      className={`
                                  inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300
                                  ${isClickFocusEnabled ? "translate-x-6" : "translate-x-1"}
                              `}
                    />
                  </div>
                </div>
              </div>

              {/* Shortcuts List */}
              <div
                className={`transition-opacity duration-300 ${isKeyboardEnabled ? "opacity-100" : "opacity-40 grayscale pointer-events-none"}`}
              >
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-brand-primary rounded-full" />
                  Keyboard Shortcuts
                  <span className="text-xs font-normal text-zinc-500 dark:text-gray-500 ml-2">
                    (Read Only)
                  </span>
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  {SHORTCUTS.map((section) => (
                    <div
                      key={section.category}
                      className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5"
                    >
                      <h4 className="font-bold text-zinc-900 dark:text-gray-200 mb-3 text-sm uppercase tracking-wider">
                        {section.category}
                      </h4>
                      <div className="space-y-2">
                        {section.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="font-mono bg-white dark:bg-black/20 px-2 py-1 rounded text-zinc-600 dark:text-brand-primary border border-gray-200 dark:border-white/5 text-xs font-bold">
                              {item.key}
                            </span>
                            <span className="text-zinc-500 dark:text-gray-400 text-right">
                              {item.action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
