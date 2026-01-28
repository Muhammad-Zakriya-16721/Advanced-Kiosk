import React, { useMemo } from "react";
import { AlertCircle, ArrowRight, RefreshCcw } from "lucide-react";
import { Product, updateProduct } from "@/lib/api";

// This component checks for Deals that are technically marked as AVAILABLE/ACTIVE
// but are actually BROKEN because one of their sub-items is OUT OF STOCK.
// It provides a quick way to restore them.

interface BrokenDealsAlertProps {
  products: Product[];
  onFix: () => void; // Called after stock update
}

const BrokenDealsAlert = ({ products, onFix }: BrokenDealsAlertProps) => {
  const brokenDeals = useMemo(() => {
    // 1. Find all active deals
    const activeDeals = products.filter(
      (p) => p.type === "deal" && p.is_available,
    );

    // 2. Check if any sub-item is OOS
    const broken = activeDeals.filter((deal) => {
      const subItems = deal.bundle_items || [];
      // Find any item in the bundle that is OOS
      const oosItem = subItems.find((bundleItem) => {
        const product = products.find((p) => p.id === bundleItem.product_id);
        return product && !product.is_available;
      });
      return !!oosItem;
    });

    // Return extended info about first broken item per deal
    return broken.map((deal) => {
      const oosItem = deal.bundle_items?.find((bi) => {
        const p = products.find((prod) => prod.id === bi.product_id);
        return p && !p.is_available;
      });
      const missingProduct = products.find((p) => p.id === oosItem?.product_id);
      return { deal, missingProduct };
    });
  }, [products]);

  const handleFix = async (productId: string) => {
    await updateProduct(productId, { is_available: true });
    // This will trigger realtime update -> refresh products -> remove from list
    onFix();
  };

  if (brokenDeals.length === 0) return null;

  return (
    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mb-6 animate-pulse-subtle">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="text-orange-500 w-5 h-5" />
        <h3 className="font-bold text-orange-200">Broken Deals Detected</h3>
        <span className="bg-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
          {brokenDeals.length}
        </span>
      </div>

      <div className="space-y-2">
        {brokenDeals.map(({ deal, missingProduct }, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between bg-black/20 p-2 rounded-lg text-sm"
          >
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="text-white font-bold">{deal.name}</span>
              is down because
              <span className="text-red-400 font-bold">
                {missingProduct?.name || "Item"}
              </span>
              is OOS.
            </div>

            {missingProduct && (
              <button
                onClick={() => handleFix(missingProduct.id)}
                className="flex items-center gap-1 text-xs font-bold bg-green-500 text-black px-2 py-1 rounded hover:brightness-110 transition-all"
              >
                <RefreshCcw size={12} /> Restock {missingProduct.name}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrokenDealsAlert;
