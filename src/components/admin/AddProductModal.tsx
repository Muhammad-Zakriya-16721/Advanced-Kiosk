import React, { useState } from "react";
import {
  X,
  Upload,
  Plus,
  Trash2,
  Search,
  Clock,
  Flame,
  List,
  Check,
} from "lucide-react";
import { Product, createProduct, createDeal } from "@/lib/api";
import { Modifier, ModifierGroup } from "@/data/modifiers";
import { CATEGORIES } from "@/data/categories";
import CustomSelect from "@/components/ui/CustomSelect";
import ImageUploader from "./ImageUploader";
import PricingScheduleSection from "./PricingScheduleSection";

import { ProductDraft, DEFAULT_DRAFT } from "@/types/draft";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "single" | "deal";
  existingProducts: Product[]; // For bundle selection
}

export default function AddProductModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  existingProducts,
}: AddProductModalProps) {
  const [loading, setLoading] = useState(false);

  // Persistent Draft State
  const [drafts, setDrafts] = useState<{
    single: ProductDraft;
    deal: ProductDraft;
  }>({
    single: { ...DEFAULT_DRAFT },
    deal: { ...DEFAULT_DRAFT, category: "deals" },
  });

  // Helper to get current draft
  const current = drafts[mode];

  // Helper to update current draft
  const updateDraft = (updates: Partial<ProductDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], ...updates },
    }));
  };

  // Local state for modifier inputs (transient)
  const [newModName, setNewModName] = useState("");
  const [newModPrice, setNewModPrice] = useState("");
  const [modifiersMultiSelect, setModifiersMultiSelect] = useState(true); // Default to true for "Options"
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validation
    if (current.discountStartAt && current.discountEndsAt) {
      if (
        new Date(current.discountStartAt) > new Date(current.discountEndsAt)
      ) {
        alert("Error: Discount Start Date must be before End Date.");
        return;
      }
    }

    setLoading(true);
    try {
      const modifiersPayload: ModifierGroup[] =
        current.customModifiers.length > 0
          ? [
              {
                name: "Options",
                options: current.customModifiers.map((m) => ({
                  name: m.name,
                  price: m.price,
                })),
                allow_multiselect: modifiersMultiSelect,
              },
            ]
          : [];

      const baseProduct = {
        name: current.name,
        description: current.description,
        price: parseFloat(current.price),
        category: mode === "deal" ? "deals" : current.category,
        image: current.image,
        calories: parseInt(current.calories) || 0,
        is_available: true,
        popular: current.isPopular,
        discount_percentage: 0, // Legacy, or set if needed
        discount_type: current.discountType,
        discount_value: current.discountValue,
        discount_start_at: current.discountStartAt || undefined,
        discount_ends_at: current.discountEndsAt || undefined,
        modifiers: modifiersPayload,
        deal_ends_at: current.dealEndsAt
          ? new Date(current.dealEndsAt).toISOString()
          : undefined,
      };

      if (mode === "single") {
        await createProduct(baseProduct);
        // Reset Single Draft only
        setDrafts((prev) => ({ ...prev, single: { ...DEFAULT_DRAFT } }));
      } else {
        await createDeal(baseProduct, current.bundleItems);
        // Reset Deal Draft only
        setDrafts((prev) => ({
          ...prev,
          deal: { ...DEFAULT_DRAFT, category: "deals" },
        }));
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addModifier = () => {
    if (!newModName) return;
    updateDraft({
      customModifiers: [
        ...current.customModifiers,
        { name: newModName, price: parseFloat(newModPrice) || 0 },
      ],
    });
    setNewModName("");
    setNewModPrice("");
  };

  const removeModifier = (index: number) => {
    updateDraft({
      customModifiers: current.customModifiers.filter((_, i) => i !== index),
    });
  };

  const toggleBundleItem = (productId: string) => {
    // User Request: "The more click, the more item added" -> Increment Mode
    const exists = current.bundleItems.find((p) => p.product_id === productId);
    let newItems;
    if (exists) {
      newItems = current.bundleItems.map((p) =>
        p.product_id === productId ? { ...p, quantity: p.quantity + 1 } : p,
      );
    } else {
      newItems = [
        ...current.bundleItems,
        { product_id: productId, quantity: 1 },
      ];
    }
    updateDraft({ bundleItems: newItems });
  };

  const updateBundleQuantity = (productId: string, delta: number) => {
    const newItems = current.bundleItems.map((item) => {
      if (item.product_id === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    });
    updateDraft({ bundleItems: newItems });
  };

  const setBundleQuantity = (productId: string, quantity: number) => {
    const newItems = current.bundleItems.map((item) => {
      if (item.product_id === productId) {
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    });
    updateDraft({ bundleItems: newItems });
  };

  // Filter available products for bundle
  const availableForBundle = existingProducts.filter(
    (p) =>
      p.type !== "deal" &&
      p.is_available &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-white">
              {mode === "single" ? "Add New Item" : "Create New Deal"}
            </h2>
            <p className="text-zinc-500 text-sm">
              {mode === "single"
                ? "Add a single product to your menu"
                : current.step === 1
                  ? "Step 1: Deal Details"
                  : "Step 2: Select Items"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="text-zinc-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: Basic Details (Shared) */}
          {(mode === "single" || current.step === 1) && (
            <div className="space-y-4">
              {/* Top Section: Image + Key Details */}
              <div className="flex gap-6">
                {/* Left: Image Uploader */}
                <div className="w-1/3 shrink-0">
                  <ImageUploader
                    value={current.image}
                    onChange={(val) => updateDraft({ image: val })}
                  />
                </div>

                {/* Right: Fields */}
                <div className="flex-1 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={current.name}
                      onChange={(e) => updateDraft({ name: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary font-bold"
                      placeholder={
                        mode === "deal"
                          ? "e.g. Family Feast"
                          : "e.g. Super Burger"
                      }
                    />
                  </div>

                  {/* Price & Calories Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        value={current.price}
                        onChange={(e) => updateDraft({ price: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary font-bold"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                        Calories
                      </label>
                      <input
                        type="number"
                        value={current.calories}
                        onChange={(e) =>
                          updateDraft({ calories: e.target.value })
                        }
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary"
                        placeholder="e.g. 500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Category / Deal Expiration - Full Width */}
              {mode === "single" ? (
                <div>
                  <CustomSelect
                    label="Category"
                    options={CATEGORIES}
                    value={current.category}
                    onChange={(val) => updateDraft({ category: val })}
                    placeholder="Select a category"
                  />
                </div>
              ) : (
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase mb-2">
                    <Clock size={12} /> Deal Expiration (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={current.dealEndsAt}
                    onChange={(e) =>
                      updateDraft({ dealEndsAt: e.target.value })
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
              )}

              {/* Pricing Schedule Section - Full Width */}
              <PricingScheduleSection
                price={parseFloat(current.price) || 0}
                discountType={current.discountType}
                discountValue={current.discountValue}
                discountStartAt={current.discountStartAt}
                discountEndsAt={current.discountEndsAt}
                onChange={(updates) => {
                  const draftUpdates: any = {};
                  if (updates.discount_type)
                    draftUpdates.discountType = updates.discount_type;
                  if (updates.discount_value !== undefined)
                    draftUpdates.discountValue = updates.discount_value;
                  if (updates.discount_start_at !== undefined)
                    draftUpdates.discountStartAt = updates.discount_start_at;
                  if (updates.discount_ends_at !== undefined)
                    draftUpdates.discountEndsAt = updates.discount_ends_at;
                  updateDraft(draftUpdates);
                }}
              />

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                  Description
                </label>
                <textarea
                  value={current.description}
                  onChange={(e) => updateDraft({ description: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary resize-none h-24"
                  placeholder="Describe the deliciousness..."
                />
              </div>

              {/* Add Modifiers Section (Both Modes) */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <List size={16} className="text-zinc-500" />
                  <label className="text-xs font-bold text-zinc-500 uppercase">
                    Custom Modifiers
                  </label>
                </div>

                {/* Multi-Select Toggle */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    onClick={() =>
                      setModifiersMultiSelect(!modifiersMultiSelect)
                    }
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${modifiersMultiSelect ? "bg-brand-primary border-brand-primary" : "border-zinc-600 bg-black/20"}`}
                  >
                    {modifiersMultiSelect && (
                      <Check size={10} className="text-black" strokeWidth={4} />
                    )}
                  </div>
                  <label
                    onClick={() =>
                      setModifiersMultiSelect(!modifiersMultiSelect)
                    }
                    className="text-xs text-zinc-400 select-none cursor-pointer"
                  >
                    Allow picking multiple options?
                  </label>
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    className="flex-1 bg-black/40 rounded-lg px-3 py-2 text-sm text-white border border-white/10"
                    placeholder="Option Name (e.g. Extra Cheese)"
                    value={newModName}
                    onChange={(e) => setNewModName(e.target.value)}
                  />
                  <input
                    className="w-20 bg-black/40 rounded-lg px-3 py-2 text-sm text-white border border-white/10"
                    placeholder="$0.00"
                    type="number"
                    value={newModPrice}
                    onChange={(e) => setNewModPrice(e.target.value)}
                  />
                  <button
                    onClick={addModifier}
                    className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {current.customModifiers.length > 0 && (
                  <div className="space-y-2">
                    {current.customModifiers.map((m, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-black/20 px-3 py-2 rounded-lg text-sm text-zinc-400"
                      >
                        <span>
                          {m.name} (+${m.price})
                        </span>
                        <button
                          onClick={() => removeModifier(i)}
                          className="text-zinc-500 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Popular Checkbox */}
              <div className="flex items-center gap-3">
                <div
                  onClick={() => updateDraft({ isPopular: !current.isPopular })}
                  className={`w-6 h-6 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${current.isPopular ? "bg-orange-500 border-orange-500" : "border-zinc-600 bg-black/20"}`}
                >
                  {current.isPopular && (
                    <Flame className="w-3 h-3 text-black fill-current" />
                  )}
                </div>
                <label
                  onClick={() => updateDraft({ isPopular: !current.isPopular })}
                  className="text-sm font-bold text-white cursor-pointer select-none"
                >
                  Mark as Popular {mode === "deal" && "(Recommended for Deals)"}
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: Bundle Items (Deal Only) */}
          {mode === "deal" && current.step === 2 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search items to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {availableForBundle.map((prod) => {
                  const inBundle = current.bundleItems.find(
                    (b) => b.product_id === prod.id,
                  );
                  return (
                    <div
                      key={prod.id}
                      onClick={() => toggleBundleItem(prod.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${inBundle ? "bg-brand-primary/10 border-brand-primary" : "bg-white/5 border-transparent hover:bg-white/10"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${inBundle ? "bg-brand-primary border-brand-primary" : "border-zinc-600"}`}
                        >
                          {inBundle && (
                            <Plus className="w-3 h-3 text-brand-dark" />
                          )}
                        </div>
                        <img
                          src={prod.image}
                          className="w-10 h-10 rounded-lg object-cover bg-zinc-800"
                        />
                        <div>
                          <p className="text-white font-bold text-sm">
                            {prod.name}
                          </p>
                          <p className="text-zinc-500 text-xs">${prod.price}</p>
                        </div>
                      </div>

                      {inBundle && (
                        <div
                          className="flex items-center gap-3 bg-black/30 rounded-lg px-2 py-1"
                          onClick={(e) => e.stopPropagation()} // Prevent toggling when adjusting qty
                        >
                          <button
                            onClick={() => updateBundleQuantity(prod.id, -1)}
                            className="text-zinc-400 hover:text-white px-2"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={inBundle.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              // Allow NaN (empty string) to be typed, but only update if number
                              // For consistent UX, we rely on number input behavior.
                              // Improvements: Use setBundleQuantity for direct set.
                              if (!isNaN(val)) {
                                setBundleQuantity(prod.id, val);
                              }
                            }}
                            className="w-10 bg-transparent text-center text-white text-sm font-bold focus:outline-none"
                          />
                          <button
                            onClick={() => updateBundleQuantity(prod.id, 1)}
                            className="text-white hover:text-brand-primary px-2"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
                <h4 className="font-bold text-brand-primary mb-2 text-sm uppercase">
                  Deal Contents
                </h4>
                {current.bundleItems.length === 0 ? (
                  <p className="text-zinc-500 text-sm">
                    No items selected yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {current.bundleItems.map((b) => {
                      const p = existingProducts.find(
                        (ep) => ep.id === b.product_id,
                      );
                      return (
                        <span
                          key={b.product_id}
                          className="bg-brand-primary text-brand-dark text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1"
                        >
                          {b.quantity}x {p?.name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-zinc-900 flex justify-end gap-3 sticky bottom-0 z-10">
          {mode === "deal" && current.step === 2 && (
            <button
              onClick={() => updateDraft({ step: 1 })}
              className="px-6 py-3 rounded-xl font-bold text-zinc-400 hover:bg-white/5 transition-colors"
            >
              Back
            </button>
          )}

          <button
            onClick={() => {
              if (mode === "deal" && current.step === 1) {
                updateDraft({ step: 2 });
              } else {
                handleSubmit();
              }
            }}
            disabled={
              loading ||
              !current.name ||
              !current.price ||
              !current.description ||
              (mode === "single" && !current.category) ||
              (current.discountStartAt && !current.discountEndsAt) ||
              (mode === "deal" &&
                current.step === 2 &&
                current.bundleItems.length === 0)
            }
            className="px-8 py-3 bg-brand-primary text-brand-dark rounded-xl font-black text-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading
              ? "Saving..."
              : mode === "deal" && current.step === 1
                ? "Next: Select Items"
                : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
