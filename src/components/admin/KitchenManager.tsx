import React, { useState } from "react";
import { ChefHat, Search, Filter, Clock, AlertCircle } from "lucide-react";
import { Product, updateProduct } from "@/lib/api";

interface KitchenManagerProps {
  products: Product[];
  onRefresh?: () => void;
}

export default function KitchenManager({
  products,
  onRefresh,
}: KitchenManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter Logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStock = showOnlyInStock ? p.is_available : true;
    return matchesSearch && matchesStock;
  });

  // Group by Category
  const categories = Array.from(
    new Set(filteredProducts.map((p) => p.category || "Uncategorized")),
  );

  const handleUpdatePrepTime = async (id: string, newVal: string) => {
    const num = parseInt(newVal);
    if (!isNaN(num) && num >= 0) {
      await updateProduct(id, { prep_time: num });
      if (onRefresh) onRefresh();
    }
  };

  const handleUpdateStock = async (id: string, newVal: string) => {
    const num = parseInt(newVal);
    if (!isNaN(num) && num >= 0) {
      // If stock > 0, we can also auto-set availability to true if desired,
      // but let's keep it manual or implicit.
      // Better: If stock > 0, ensure it's available.
      await updateProduct(id, {
        stock_level: num,
        is_available: num > 0,
      });
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 w-full md:w-auto md:min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search Items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowOnlyInStock(!showOnlyInStock)}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-xl border border-white/5 transition-all
              ${showOnlyInStock ? "bg-brand-primary text-brand-dark font-bold" : "bg-zinc-900 text-zinc-400 hover:text-white"}
            `}
          >
            <Filter size={18} />
            {showOnlyInStock ? "In Stock Only" : "Show All"}
          </button>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="flex-1 bg-zinc-900 border border-white/5 rounded-3xl p-6 overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
            <ChefHat size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Prep Configuration</h2>
            <p className="text-zinc-500 text-sm">
              Set standardized cooking times (minutes) for the KDS.
            </p>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar pr-2 pb-10 space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-brand-primary font-bold uppercase tracking-widest text-xs mb-3 pl-2 border-l-2 border-brand-primary">
                {category}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredProducts
                  .filter((p) => (p.category || "Uncategorized") === category)
                  .map((product) => (
                    <KitchenPrepRow
                      key={product.id}
                      product={product}
                      onUpdatePrep={handleUpdatePrepTime}
                      onUpdateStock={handleUpdateStock}
                    />
                  ))}
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="text-center py-20 opacity-50">
              <p>No items found matching your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const KitchenPrepRow = ({
  product,
  onUpdatePrep,
  onUpdateStock,
}: {
  product: Product;
  onUpdatePrep: (id: string, val: string) => void;
  onUpdateStock: (id: string, val: string) => void;
}) => {
  const [prepVal, setPrepVal] = useState(product.prep_time?.toString() || "5");
  const [stockVal, setStockVal] = useState(
    product.stock_level?.toString() || "0",
  );
  const [focusedField, setFocusedField] = useState<"prep" | "stock" | null>(
    null,
  );

  // Sync props
  React.useEffect(() => {
    if (focusedField !== "prep")
      setPrepVal(product.prep_time?.toString() || "5");
    if (focusedField !== "stock")
      setStockVal(product.stock_level?.toString() || "0");
  }, [product.prep_time, product.stock_level, focusedField]);

  const handleBlurPrep = () => {
    setFocusedField(null);
    if (prepVal !== product.prep_time?.toString())
      onUpdatePrep(product.id, prepVal);
  };

  const handleBlurStock = () => {
    setFocusedField(null);
    if (stockVal !== product.stock_level?.toString())
      onUpdateStock(product.id, stockVal);
  };

  return (
    <div
      className={`
       relative flex items-center justify-between p-3 rounded-xl border border-white/5 transition-all
       ${product.is_available ? "bg-white/5" : "opacity-60 bg-red-500/5"}
       ${focusedField ? "ring-1 ring-brand-primary border-brand-primary/50 bg-black" : "hover:bg-white/10"}
    `}
    >
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={product.image}
          alt={product.name}
          className={`w-12 h-12 rounded-lg object-cover bg-zinc-800 ${!product.is_available && "grayscale"}`}
        />
        <div className="min-w-0">
          <h4 className="font-bold text-white truncate">{product.name}</h4>
          <span
            className={`text-xs ${product.is_available ? "text-green-500" : "text-red-500"}`}
          >
            {product.is_available ? "In Stock" : "Sold Out"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Stock Input */}
        <div className="flex items-center gap-2 bg-black/50 rounded-lg p-1 pr-3 border border-white/10">
          <div
            className={`p-2 rounded-md ${focusedField === "stock" ? "text-blue-400" : "text-zinc-500"}`}
          >
            <Filter size={16} />
            {/* Using Filter icon as Stock placeholder for now or Box */}
          </div>
          <div className="flex flex-col items-end">
            <input
              type="number"
              min="0"
              value={stockVal}
              onFocus={() => setFocusedField("stock")}
              onBlur={handleBlurStock}
              onChange={(e) => setStockVal(e.target.value)}
              className="w-12 bg-transparent text-right font-mono font-bold text-lg text-white outline-none"
            />
          </div>
          <span className="text-xs text-zinc-500 font-bold mt-1">Left</span>
        </div>

        {/* Prep Input */}
        <div className="flex items-center gap-2 bg-black/50 rounded-lg p-1 pr-3 border border-white/10">
          <div
            className={`p-2 rounded-md ${focusedField === "prep" ? "text-brand-primary" : "text-zinc-500"}`}
          >
            <Clock size={16} />
          </div>
          <div className="flex flex-col items-end">
            <input
              type="number"
              min="0"
              max="120"
              value={prepVal}
              onFocus={() => setFocusedField("prep")}
              onBlur={handleBlurPrep}
              onChange={(e) => setPrepVal(e.target.value)}
              className="w-12 bg-transparent text-right font-mono font-bold text-lg text-white outline-none"
            />
          </div>
          <span className="text-xs text-zinc-500 font-bold mt-1">min</span>
        </div>
      </div>
    </div>
  );
};
