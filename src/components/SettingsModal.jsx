import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Check, ToggleLeft, ToggleRight } from 'lucide-react';

const SHORTCUTS = [
  {
    category: "General",
    items: [
      { key: "Tab", action: "Switch Focus (Sidebar → Main → Cart)" },
      { key: "Settings Icon", action: "Toggle Keyboard Controls" }
    ]
  },
  {
    category: "Sidebar (Menu Categories)",
    items: [
      { key: "Up / Down", action: "Move focus" },
      { key: "Enter", action: "Select Category" }
    ]
  },
  {
    category: "Main Menu (Food Items)",
    items: [
      { key: "Left / Right", action: "b/w Items" },
      { key: "Enter", action: "Add to Order (Hold for more)" },
      { key: "Shift + Enter", action: "Add 10 Quantity" },
      { key: "Backspace", action: "Remove 1 Quantity" },
      { key: "Delete", action: "Remove Item Completely" }
    ]
  },
  {
    category: "My Order (Cart)",
    items: [
      { key: "Up / Down", action: "Move focus" },
      { key: "Left / Right", action: "Decrease / Increase Qty" },
      { key: "Backspace", action: "Remove Selected Item" },
      { key: "Enter", action: "Pay Now / Start New Order" },
      { key: "Delete", action: "Clear Cart (Press twice)" }
    ]
  }
];

const SettingsModal = ({ isOpen, onClose, isKeyboardEnabled, toggleKeyboard, isClickFocusEnabled, toggleClickFocus }) => {
  // Detect Touch Device
  const [isTouch, setIsTouch] = React.useState(false);

  React.useEffect(() => {
    setIsTouch(('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
  }, []);

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
            className="w-full max-w-2xl bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-primary/10 rounded-xl">
                    <Keyboard size={24} className="text-brand-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Settings</h2>
                    <p className="text-zinc-500 dark:text-gray-400 text-sm">Configure your kiosk experience</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-zinc-500 dark:text-gray-400"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {/* Toggle Section */}
                <div className="space-y-4 mb-8">
                  {/* Master Toggle */}
                  <div className={`
                      flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5
                      ${isTouch ? 'opacity-75' : ''}
                  `}>
                      <div>
                          <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                             Keyboard Navigation
                             {isTouch && (
                                 <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                     Touch Device
                                 </span>
                             )}
                          </h3>
                          <p className="text-zinc-500 dark:text-gray-400 text-sm">
                              {isTouch 
                                  ? "Keyboard controls are disabled on touch-primary devices." 
                                  : "Enable physical keyboard controls for accessibility"
                              }
                          </p>
                      </div>
                      
                      <button 
                          onClick={() => !isTouch && toggleKeyboard()}
                          disabled={isTouch}
                          className={`
                              relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300
                              ${isKeyboardEnabled ? 'bg-brand-primary' : 'bg-gray-300 dark:bg-zinc-700'}
                              ${isTouch ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                          `}
                      >
                          <span 
                              className={`
                                  inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300
                                  ${isKeyboardEnabled ? 'translate-x-7' : 'translate-x-1'}
                              `} 
                          />
                      </button>
                  </div>
                  
                  {/* Sync Focus Toggle (Dependent on Master) */}
                  <div className={`
                      flex items-center justify-between p-4 rounded-2xl border border-transparent
                      transition-all duration-300
                      ${isKeyboardEnabled ? 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5' : 'opacity-40 grayscale pointer-events-none'}
                  `}>
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isClickFocusEnabled ? 'bg-brand-primary/20 text-brand-dark' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                              <ToggleLeft size={20} />
                          </div>
                          <div>
                              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Sync Focus on Click</h3>
                              <p className="text-zinc-500 dark:text-gray-400 text-sm">Move keyboard focus when clicking items</p>
                          </div>
                      </div>
                      
                      <button 
                          onClick={toggleClickFocus}
                          disabled={!isKeyboardEnabled}
                          className={`
                              relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300
                              ${isClickFocusEnabled ? 'bg-brand-primary' : 'bg-gray-300 dark:bg-zinc-700'}
                          `}
                      >
                          <span 
                              className={`
                                  inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300
                                  ${isClickFocusEnabled ? 'translate-x-6' : 'translate-x-1'}
                              `} 
                          />
                      </button>
                  </div>
                </div>

                {/* Shortcuts List */}
                <div className={`transition-opacity duration-300 ${isKeyboardEnabled ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                   <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                     <span className="w-1.5 h-6 bg-brand-primary rounded-full"/>
                     Keyboard Shortcuts
                     <span className="text-xs font-normal text-zinc-500 dark:text-gray-500 ml-2">(Read Only)</span>
                   </h3>
                   
                   <div className="grid md:grid-cols-2 gap-4">
                      {SHORTCUTS.map((section) => (
                          <div key={section.category} className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                              <h4 className="font-bold text-zinc-900 dark:text-gray-200 mb-3 text-sm uppercase tracking-wider">{section.category}</h4>
                              <div className="space-y-2">
                                  {section.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-sm">
                                          <span className="font-mono bg-white dark:bg-black/20 px-2 py-1 rounded text-zinc-600 dark:text-brand-primary border border-gray-200 dark:border-white/5 text-xs font-bold">
                                            {item.key}
                                          </span>
                                          <span className="text-zinc-500 dark:text-gray-400 text-right">{item.action}</span>
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
