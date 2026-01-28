import React, { useState, useEffect } from "react";
import { X, Save, Trash2, Clock, Flame, List, Plus } from "lucide-react";
import { Product, updateProduct, supabase } from "@/lib/api";
import { ModifierGroup } from "@/data/modifiers";
import { CATEGORIES } from "@/data/categories";
import CustomSelect from "@/components/ui/CustomSelect";
import ImageUploader from "./ImageUploader";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import PricingScheduleSection from "./PricingScheduleSection";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Product;
  onSave: () => void;
}

export default function EditProductModal({
  isOpen,
  onClose,
  item,
  onSave,
}: EditProductModalProps) {
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState(item.name);
  const [image, setImage] = useState(item.image || ""); // Added Image state
  const [price, setPrice] = useState(item.price.toString());
  const [description, setDescription] = useState(item.description || "");
  const [stock, setStock] = useState(item.stock_level?.toString() || "");
  const [popular, setPopular] = useState(item.popular || false);
  const [category, setCategory] = useState(item.category || "burgers"); // Add Category State
  const [dealEndsAt, setDealEndsAt] = useState(
    item.deal_ends_at
      ? new Date(item.deal_ends_at).toISOString().slice(0, 16)
      : "",
  );

  // Advanced Pricing State
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    "percent",
  );
  const [discountValue, setDiscountValue] = useState(0);
  const [discountStartAt, setDiscountStartAt] = useState("");
  const [discountEndsAt, setDiscountEndsAt] = useState("");

  // Modifiers State
  const [customModifiers, setCustomModifiers] = useState<
    { name: string; price: number }[]
  >([]);
  const [newModName, setNewModName] = useState("");
  const [newModPrice, setNewModPrice] = useState("");

  // Sync when item changes
  useEffect(() => {
    setName(item.name);
    setImage(item.image || ""); // Sync image
    setPrice(item.price.toString());
    setDescription(item.description || "");
    setStock(item.stock_level?.toString() || "");
    setPopular(item.popular || false);
    setCategory(item.category || "burgers");
    setDealEndsAt(
      item.deal_ends_at
        ? new Date(item.deal_ends_at).toISOString().slice(0, 16)
        : "",
    );

    // Sync Pricing
    setDiscountType(item.discount_type || "percent");
    setDiscountValue(item.discount_value || item.discount_percentage || 0);
    setDiscountStartAt(
      item.discount_start_at
        ? new Date(item.discount_start_at).toISOString().slice(0, 16)
        : "",
    );
    setDiscountEndsAt(
      item.discount_ends_at
        ? new Date(item.discount_ends_at).toISOString().slice(0, 16)
        : "",
    );

    // Parse existing modifiers
    if (item.modifiers && item.modifiers.length > 0) {
      // Handle both Grouped (New) and Flat (Old) structures
      const first = item.modifiers[0] as any;
      let flat: { name: string; price: number }[] = [];

      if (first && Array.isArray(first.options)) {
        // Grouped Structure
        flat = (item.modifiers as any[]).flatMap((g) =>
          g.options.map((o: any) => ({ name: o.name, price: o.price })),
        );
      } else {
        // Flat Structure (Legacy)
        flat = (item.modifiers as any[]).map((m) => ({
          name: m.name,
          price: m.price,
        }));
      }

      setCustomModifiers(flat);
    } else {
      setCustomModifiers([]);
    }
  }, [item]);

  if (!isOpen) return null;

  const handleSave = async () => {
    // Validation
    if (discountStartAt && discountEndsAt) {
      if (new Date(discountStartAt) > new Date(discountEndsAt)) {
        alert("Error: Discount Start Date must be before End Date.");
        return;
      }
    }

    setLoading(true);
    try {
      // Reconstruct modifiers
      const modifiersPayload: ModifierGroup[] =
        customModifiers.length > 0
          ? [
              {
                name: "Options",
                options: customModifiers.map((m) => ({
                  name: m.name,
                  price: m.price,
                })),
              },
            ]
          : [];

      await updateProduct(item.id, {
        name,
        image, // Save image
        description,
        price: parseFloat(price),
        category, // Include category update
        stock_level: parseInt(stock) || 0,
        popular,
        discount_type: discountType,
        discount_value: discountValue,
        discount_start_at: discountStartAt
          ? new Date(discountStartAt).toISOString()
          : null,
        discount_ends_at: discountEndsAt
          ? new Date(discountEndsAt).toISOString()
          : null,
        deal_ends_at: dealEndsAt ? new Date(dealEndsAt).toISOString() : null,
        modifiers: modifiersPayload as any,
      } as Partial<Product>);

      onSave();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await supabase.from("products").delete().eq("id", item.id);
    onSave(); // This closes the modal and refreshes
  };

  const addModifier = () => {
    if (!newModName) return;
    setCustomModifiers([
      ...customModifiers,
      { name: newModName, price: parseFloat(newModPrice) || 0 },
    ]);
    setNewModName("");
    setNewModPrice("");
  };

  const removeModifier = (index: number) => {
    setCustomModifiers(customModifiers.filter((_, i) => i !== index));
  };

  return (
    <>
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${item.name}"? This action cannot be undone.`}
        variant="danger"
        confirmText="Yes, Delete"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-zinc-900 border border-white/10 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900 sticky top-0 z-10">
            <h2 className="text-xl font-bold text-white">
              Edit {item.type === "deal" ? "Deal" : "Item"}
            </h2>
            <button onClick={onClose}>
              <X className="text-zinc-500 hover:text-white" />
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
            {/* Top Section: Image + Key Details */}
            <div className="flex gap-6">
              {/* Left: Image Uploader */}
              <div className="w-1/3 shrink-0">
                <ImageUploader value={image} onChange={setImage} />
              </div>

              {/* Right: Fields */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                    Name
                  </label>
                  <input
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                      Price
                    </label>
                    <input
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>

                  {item.type === "single" ? (
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                        Stock Level
                      </label>
                      <input
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary"
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase mb-2">
                        <Clock size={12} /> Deal Expiration
                      </label>
                      <input
                        type="datetime-local"
                        value={dealEndsAt}
                        onChange={(e) => setDealEndsAt(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category Selection - Full Width */}
            <div>
              <CustomSelect
                label="Category"
                options={CATEGORIES}
                value={category}
                onChange={setCategory}
              />
            </div>

            {/* Pricing Schedule - Full Width */}
            <PricingScheduleSection
              price={parseFloat(price) || 0}
              discountType={discountType}
              discountValue={discountValue}
              discountStartAt={discountStartAt}
              discountEndsAt={discountEndsAt}
              onChange={(updates) => {
                if (updates.discount_type)
                  setDiscountType(updates.discount_type);
                if (updates.discount_value !== undefined)
                  setDiscountValue(updates.discount_value);
                if (updates.discount_start_at !== undefined)
                  setDiscountStartAt(updates.discount_start_at);
                if (updates.discount_ends_at !== undefined)
                  setDiscountEndsAt(updates.discount_ends_at);
              }}
            />

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
                Description
              </label>
              <textarea
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white h-24 resize-none focus:outline-none focus:border-brand-primary"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Modifiers Editor */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <List size={16} className="text-zinc-500" />
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  Custom Modifiers
                </label>
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  className="flex-1 bg-black/40 rounded-lg px-3 py-2 text-sm text-white border border-white/10"
                  placeholder="Name (e.g. Spicy)"
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

              {customModifiers.length > 0 && (
                <div className="space-y-2">
                  {customModifiers.map((m, i) => (
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

            {/* Popular Toggle */}
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
              <div
                onClick={() => setPopular(!popular)}
                className={`w-6 h-6 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${
                  popular
                    ? "bg-orange-500 border-orange-500"
                    : "border-zinc-600 bg-zinc-800"
                }`}
              >
                {popular && (
                  <Flame className="w-3 h-3 text-black fill-current" />
                )}
              </div>
              <label
                onClick={() => setPopular(!popular)}
                className="text-sm font-bold text-white cursor-pointer select-none"
              >
                Mark as Popular Item
              </label>
            </div>

            {/* Deal Bundle Contents (Read Only) */}
            {item.type === "deal" && item.bundle_items && (
              <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <h4 className="font-bold text-purple-400 mb-2 text-sm uppercase">
                  Bundle Contents (Read Only)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {item.bundle_items.map((b: any, idx) => (
                    <span
                      key={idx}
                      className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-md"
                    >
                      {b.quantity}x {b.product_name}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">
                  To change contents, create a new deal.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 font-bold flex items-center justify-center gap-2"
            >
              <Trash2 size={16} /> Delete Item
            </button>
          </div>

          <div className="p-6 border-t border-white/5 bg-zinc-900 flex justify-end gap-3 sticky bottom-0 z-10">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl font-bold text-zinc-400 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                loading ||
                !name ||
                !price ||
                !category ||
                !description ||
                (!!discountStartAt && !discountEndsAt)
              }
              className="px-8 py-2 bg-brand-primary text-brand-dark rounded-xl font-bold hover:brightness-110 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:brightness-100"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
