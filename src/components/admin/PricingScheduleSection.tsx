import React, { useState, useEffect } from "react";
import { Calendar, DollarSign, Percent, Clock, Tag } from "lucide-react";
import { Product } from "@/lib/api";

interface PricingScheduleProps {
  price: number;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountStartAt: string;
  discountEndsAt: string;
  onChange: (updates: Partial<Product>) => void;
}

export default function PricingScheduleSection({
  price,
  discountType,
  discountValue,
  discountStartAt,
  discountEndsAt,
  onChange,
}: PricingScheduleProps) {
  const [isDiscountEnabled, setIsDiscountEnabled] = useState(
    discountValue > 0 || !!discountStartAt || !!discountEndsAt,
  );

  const [isScheduled, setIsScheduled] = useState(
    !!discountStartAt || !!discountEndsAt,
  );

  // Sync internal state with props only on mount or reset?
  // Actually, better to just rely on props, but we need local state for toggles
  // that might not strictly map to data until inputs are changed.

  useEffect(() => {
    if (!isDiscountEnabled) {
      if (discountValue !== 0 || discountStartAt || discountEndsAt) {
        // logic to clear if disabled?
        // For now, we just visually toggle.
        // If user disables, we might want to clear values on Save, or just hide them.
        // Let's assume we maintain values but maybe clear them if explicit "off" action is desired?
        // The parent modal usually handles the save.
        // We can just emit 0/null if disabled, OR keep them and just let the parent decide.
        // UX pattern: Turning off toggle usually implies "Remove Discount".
      }
    }
  }, [isDiscountEnabled]);

  const handleTypeChange = (type: "percent" | "fixed") => {
    onChange({ discount_type: type });
  };

  const handleValueChange = (val: string) => {
    const num = parseFloat(val);
    onChange({ discount_value: isNaN(num) ? 0 : num });
  };

  const handleStartChange = (val: string) => {
    onChange({ discount_start_at: val });
  };

  const handleEndChange = (val: string) => {
    onChange({ discount_ends_at: val });
  };

  // Calculate final price for preview
  const finalPrice =
    discountType === "percent"
      ? price - (price * discountValue) / 100
      : price - discountValue;

  return (
    <div className="space-y-4 p-5 bg-zinc-900/50 border border-white/5 rounded-2xl">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
            <Tag size={20} />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100">Pricing & Promotions</h3>
            <p className="text-xs text-zinc-500">
              Manage discounts and schedule
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isDiscountEnabled}
            onChange={(e) => {
              setIsDiscountEnabled(e.target.checked);
              if (!e.target.checked) {
                onChange({
                  discount_value: 0,
                  discount_start_at: "",
                  discount_ends_at: "",
                });
              }
            }}
          />
          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
        </label>
      </div>

      {isDiscountEnabled && (
        <div className="space-y-6 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 fade-in duration-200">
          {/* Discount Value Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                Discount Type
              </label>
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => handleTypeChange("percent")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                    discountType === "percent"
                      ? "bg-zinc-800 text-white shadow-lg"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Percent size={14} /> Percent
                </button>
                <button
                  onClick={() => handleTypeChange("fixed")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
                    discountType === "fixed"
                      ? "bg-zinc-800 text-white shadow-lg"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <DollarSign size={14} /> Fixed
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                Discount Value
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={discountValue || ""}
                  onChange={(e) => handleValueChange(e.target.value)}
                  placeholder="0"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-16 py-2.5 text-white focus:outline-none focus:border-green-500 transition-colors"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold pointer-events-none">
                  {discountType === "percent" ? "% OFF" : "OFF"}
                </div>
              </div>
            </div>
          </div>

          {/* Price Preview */}
          <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3 flex justify-between items-center">
            <span className="text-zinc-400 text-sm">New Price Preview:</span>
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 line-through text-sm">
                ${price.toFixed(2)}
              </span>
              <span className="text-green-400 font-bold text-lg">
                ${Math.max(0, finalPrice).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Scheduling Toggle */}
          <div>
            <div
              className="flex items-center gap-2 mb-4 cursor-pointer"
              onClick={() => {
                const newScheduled = !isScheduled;
                setIsScheduled(newScheduled);
                if (newScheduled) {
                  // Default Start Date to Now
                  const now = new Date();
                  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                  onChange({
                    discount_start_at: now.toISOString().slice(0, 16),
                  });
                } else {
                  // Clear dates -> Permanent / None
                  onChange({ discount_start_at: "", discount_ends_at: "" });
                }
              }}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isScheduled ? "bg-green-500 border-green-500" : "border-zinc-600"}`}
              >
                {isScheduled && <CheckIcon size={12} className="text-black" />}
              </div>
              <span className="text-sm text-zinc-300 select-none">
                Schedule this promotion
              </span>
            </div>

            {isScheduled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <Clock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      type="datetime-local"
                      value={discountStartAt}
                      onChange={(e) => handleStartChange(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase">
                      End Date
                    </label>
                    <span className="text-[10px] text-red-500 font-bold uppercase">
                      Required
                    </span>
                  </div>
                  <div className="relative">
                    <Clock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      type="datetime-local"
                      value={discountEndsAt}
                      onChange={(e) => handleEndChange(e.target.value)}
                      className={`w-full bg-black/40 border rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none transition-colors ${
                        !discountEndsAt
                          ? "border-red-500/50 focus:border-red-500 bg-red-500/5"
                          : "border-white/10 focus:border-green-500"
                      }`}
                      required
                      min={discountStartAt}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon({ size, className }: { size: number; className: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
