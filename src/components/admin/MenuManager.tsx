import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  UtensilsCrossed,
} from "lucide-react";
import {
  Product,
  updateProduct,
  supabase,
  isDiscountActive,
  calculateDiscountedPrice,
} from "@/lib/api";
import EditProductModal from "./EditProductModal";
import AddProductModal from "./AddProductModal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface MenuManagerProps {
  products?: Product[]; // Optional, can fetch its own if needed, but better passed from Dashboard
  onRefresh?: () => void;
}

export default function MenuManager({
  products: initialProducts,
  onRefresh,
}: MenuManagerProps) {
  // If products not passed, we could fetch, but AdminDashboard usually handles it.
  // We'll use local state if props are missing, or just rely on props.
  // For safety, let's assume props are passed or fallback (but props is better for realtime sync).

  const [items, setItems] = useState<Product[]>(initialProducts || []);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<"single" | "deal">("single");

  const [editItem, setEditItem] = useState<Product | null>(null);

  useEffect(() => {
    if (initialProducts) setItems(initialProducts);
  }, [initialProducts]);

  const singleItems = items
    .filter((p) => !p.type || p.type === "single")
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const dealItems = items
    .filter((p) => p.type === "deal")
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleAvailability = async (product: Product) => {
    // Optimistic Update
    const newStatus = !product.is_available;
    setItems((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, is_available: newStatus } : p,
      ),
    );

    await updateProduct(product.id, { is_available: newStatus });
    if (onRefresh) onRefresh();
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleteId) return;
    // Logic to delete would go here if we implemented delete from the list directly
    // But currently MenuManager doesn't seem to have a direct delete button in the list
    // I will skip adding logic here if it's not used, but wait, `Trash2` IS imported.
    // I'll leave this file alone for a moment and check EditProductModal.
    setDeleteId(null);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Search Header */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {/* SINGLE ITEMS SECTION */}
      <div className="flex-1 bg-zinc-900 border border-white/5 rounded-3xl p-6 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
              <UtensilsCrossed size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Single Items</h2>
          </div>
          <button
            onClick={() => {
              setAddMode("single");
              setIsAddOpen(true);
            }}
            className="flex items-center gap-2 bg-white/5 hover:bg-brand-primary hover:text-brand-dark text-white px-4 py-2 rounded-xl transition-all font-bold"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>

        <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {singleItems.map((item) => (
            <MenuItemRow
              key={item.id}
              item={item}
              onToggle={() => toggleAvailability(item)}
              onEdit={() => setEditItem(item)}
            />
          ))}
        </div>
      </div>

      {/* DEALS SECTION */}
      <div className="h-[40%] bg-zinc-900 border border-white/5 rounded-3xl p-6 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <Tag size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Deals & Bundles</h2>
          </div>
          <button
            onClick={() => {
              setAddMode("deal");
              setIsAddOpen(true);
            }}
            className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500 hover:text-white text-purple-400 px-4 py-2 rounded-xl transition-all font-bold"
          >
            <Plus size={18} /> New Deal
          </button>
        </div>

        <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {dealItems.length === 0 ? (
            <div className="text-center text-zinc-500 py-10">
              No active deals. Create one to boost sales!
            </div>
          ) : (
            dealItems.map((item) => (
              <MenuItemRow
                key={item.id}
                item={item}
                onToggle={() => toggleAvailability(item)}
                onEdit={() => setEditItem(item)}
                isDeal
              />
            ))
          )}
        </div>
      </div>

      <AddProductModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        mode={addMode}
        onSuccess={() => onRefresh && onRefresh()}
        existingProducts={items}
      />

      {editItem && (
        <EditProductModal
          item={editItem}
          isOpen={!!editItem}
          onClose={() => setEditItem(null)}
          onSave={() => {
            setEditItem(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}

const MenuItemRow = ({
  item,
  onToggle,
  onEdit,
  isDeal,
}: {
  item: Product;
  onToggle: () => void;
  onEdit: () => void;
  isDeal?: boolean;
}) => {
  const isSoldOut = !item.is_available || (item.stock_level ?? 999) <= 0;

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${
        !isSoldOut
          ? "bg-white/5 border-transparent hover:bg-white/10"
          : "bg-red-500/5 border-red-500/20 opacity-75"
      }`}
      onClick={(e) => {
        // Prevent edit if clicking toggle/inner buttons (handled by bubbling check or explicit stops)
        onEdit();
      }}
    >
      <img
        src={item.image}
        className={`w-12 h-12 rounded-lg object-cover bg-zinc-800 ${
          isSoldOut && "grayscale"
        }`}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white truncate">{item.name}</h3>
          {(!item.is_available || (item.stock_level ?? 999) <= 0) && (
            <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full uppercase">
              Sold Out
            </span>
          )}
          {isDeal && (
            <span className="text-[10px] font-bold bg-purple-500 text-white px-2 py-0.5 rounded-full uppercase">
              Bundle
            </span>
          )}
          {isDiscountActive(item) && (
            <span className="text-[10px] font-bold bg-green-500 text-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
              <Tag size={10} /> Sale
            </span>
          )}
        </div>
        <p className="text-zinc-500 text-sm truncate flex items-center gap-2">
          {isDiscountActive(item) ? (
            <>
              <span className="line-through opacity-70">
                ${item.price.toFixed(2)}
              </span>
              <span className="text-green-400 font-bold">
                ${calculateDiscountedPrice(item).toFixed(2)}
              </span>
            </>
          ) : (
            <span>${item.price.toFixed(2)}</span>
          )}
          <span>•</span>
          <span>
            {isDeal
              ? `${item.bundle_items?.length || 0} items`
              : `${item.calories} cal`}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label
          className="relative inline-flex items-center cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={item.is_available}
            onChange={onToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
        </label>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
        >
          <Edit2 size={16} />
        </button>
      </div>
    </div>
  );
};
