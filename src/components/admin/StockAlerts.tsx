import React, { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Product, updateProduct } from "@/lib/api";

interface StockAlertsProps {
  products: Product[];
  onRefresh?: () => void;
}

const StockAlerts = ({ products, onRefresh }: StockAlertsProps) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<string>("20"); // Default restock

  // Filter for Out of Stock items only (Realtime source of truth)
  const alerts = products.filter(
    (p) => !p.is_available || (p.stock_level ?? 999) <= 0,
  );

  const confirmRestock = async () => {
    if (!restockProduct) return;
    setLoadingId(restockProduct.id);

    try {
      const parsedQty = parseInt(restockQty);
      if (isNaN(parsedQty) || parsedQty < 0) return;

      const success = await updateProduct(restockProduct.id, {
        is_available: true,
        stock_level: parsedQty,
      });

      if (success) {
        if (onRefresh) onRefresh();
        setRestockProduct(null); // Close modal
      }
    } finally {
      setLoadingId(null);
    }
  };

  if (alerts.length === 0) return null;

  return (
    <>
      <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />

        <div className="flex items-center gap-2 mb-6 relative">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertTriangle className="text-red-500 w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-white">Attention Needed</h3>
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {alerts.length}
          </span>
        </div>

        <div className="space-y-3 relative">
          {alerts.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                  <img
                    src={item.image}
                    alt=""
                    className="w-full h-full object-cover opacity-70 grayscale"
                  />
                </div>
                <div>
                  <p className="font-bold text-white text-sm line-clamp-1">
                    {item.name}
                  </p>
                  <p className="text-xs font-bold text-red-500">Out of Stock</p>
                </div>
              </div>

              <button
                onClick={() => setRestockProduct(item)}
                disabled={loadingId === item.id}
                className="text-xs font-bold text-zinc-400 hover:text-white hover:bg-green-600/20 hover:border-green-600/50 border border-transparent px-3 py-2 bg-black/40 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loadingId === item.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  "Restock"
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Restock Item</h3>
            <p className="text-zinc-400 text-sm mb-6">
              How many <b>{restockProduct.name}</b> are you adding?
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full bg-zinc-800 border-none rounded-xl p-4 text-white font-mono text-lg focus:ring-2 ring-brand-primary"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setRestockProduct(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-zinc-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRestock}
                  disabled={loadingId !== null}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {loadingId ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Update Stock"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StockAlerts;
