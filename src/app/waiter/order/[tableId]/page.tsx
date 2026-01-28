"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Send,
  Trash2,
  DollarSign,
  Receipt,
  Utensils,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMenuData } from "@/hooks/useMenuData";
import { formatPrice } from "@/lib/money";
import { calculateDiscountedPrice } from "@/lib/api";
import CustomizationModal from "@/components/menu/modals/CustomizationModal";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedModifiers?: any[];
}

const calculateItemTotal = (item: CartItem) => {
  const modifiersCost =
    item.selectedModifiers?.reduce((sum, mod) => sum + (mod.price || 0), 0) ||
    0;
  return item.price + modifiersCost;
};

import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function WaiterOrder() {
  const params = useParams();
  const router = useRouter();
  const tableId = params.tableId as string;

  const {
    menuItems: products,
    isLoading: loading,
    refetch: refetchMenu,
  } = useMenuData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // View State
  const [viewMode, setViewMode] = useState<"menu" | "bill">("menu");
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [isLoadingActive, setIsLoadingActive] = useState(true);

  // Local Cart
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Modal State
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Confirmation State
  const [showPayConfirmation, setShowPayConfirmation] = useState(false);

  // 1. Fetch Active Orders
  const fetchActiveOrders = async () => {
    setIsLoadingActive(true);
    const { data } = await import("@/lib/supabase").then((mod) =>
      mod.supabase
        .from("orders")
        .select("*")
        .eq("table_no", parseInt(tableId))
        .in("status", ["pending", "preparing", "ready"]),
    );

    if (data && data.length > 0) {
      setActiveOrders(data);
      if (localCart.length === 0) {
        setViewMode("bill");
      }
    } else {
      setActiveOrders([]);
      setViewMode("menu");
    }
    setIsLoadingActive(false);
  };

  useEffect(() => {
    fetchActiveOrders();
    refetchMenu();

    let channel: any;
    let interval: NodeJS.Timeout;

    const setupSubscription = async () => {
      const { supabase } = await import("@/lib/supabase");
      channel = supabase
        .channel(`waiter-orders-all-${Date.now()}`) // Unique channel ID
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            // Removed server-side filter to avoid type issues. Filtering client-side.
          },
          (payload: any) => {
            const updatedTableNo =
              payload.new?.table_no || payload.old?.table_no;
            // Loose equality check to handle string/number differences
            if (updatedTableNo == tableId) {
              console.log("Relevant Realtime Update:", payload);
              fetchActiveOrders();
            }
          },
        )
        .subscribe();
    };

    setupSubscription();

    // Polling Fallback (Every 5 seconds)
    interval = setInterval(fetchActiveOrders, 5000);

    return () => {
      clearInterval(interval);
      if (channel) {
        import("@/lib/supabase").then(({ supabase }) =>
          supabase.removeChannel(channel),
        );
      }
    };
  }, [tableId]);

  const billItems = useMemo(() => {
    const allItems: any[] = [];
    activeOrders.forEach((order) => {
      if (Array.isArray(order.items)) {
        allItems.push(...order.items);
      }
    });
    return allItems;
  }, [activeOrders]);

  const billTotal = activeOrders.reduce(
    (sum, o) => sum + (o.total_amount || 0),
    0,
  );
  const totalCartCount = localCart.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );

  // Categories
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(cats)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCat =
        selectedCategory === "All" || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  // Handler 1: Add to Cart (With Stacking Logic)
  const handleAddToCart = (product: any, modifiers: any[]) => {
    setLocalCart((prev) => {
      // Helper: Check if modifiers are identical
      const areModifiersEqual = (
        m1: any[] | undefined,
        m2: any[] | undefined,
      ) => {
        const a1 = m1 || [];
        const a2 = m2 || [];
        if (a1.length !== a2.length) return false;
        // Sort by ID to ensure order doesn't matter
        const s1 = [...a1].sort((a, b) => (a.id > b.id ? 1 : -1));
        const s2 = [...a2].sort((a, b) => (a.id > b.id ? 1 : -1));
        return JSON.stringify(s1) === JSON.stringify(s2);
      };

      // Check if identical item exists
      const existingIndex = prev.findIndex(
        (item) =>
          item.id === product.id &&
          areModifiersEqual(item.selectedModifiers, modifiers),
      );

      if (existingIndex !== -1) {
        // Increment quantity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }

      // Add new item
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: calculateDiscountedPrice(product),
          quantity: 1,
          selectedModifiers: modifiers,
        },
      ];
    });

    if (typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate(50);

    setIsCustomizing(false);
    setSelectedItem(null);
  };

  const updateQty = (index: number, delta: number) => {
    setLocalCart((prev) => {
      return prev
        .map((item, i) => {
          if (i === index) {
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const cartTotal = localCart.reduce(
    (acc, item) => acc + calculateItemTotal(item) * item.quantity,
    0,
  );

  const handleSendOrder = async () => {
    if (localCart.length === 0) return;
    setIsSending(true);

    try {
      const orderData = {
        items: localCart.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          modifiers: i.selectedModifiers || [],
        })),
        total: cartTotal,
        note: `Table ${tableId} (Waiter App)`,
      };

      const { error } = await import("@/lib/supabase").then((mod) =>
        mod.supabase.from("orders").insert({
          total_amount: orderData.total,
          items: orderData.items,
          customer_note: orderData.note,
          status: "pending",
          table_no: parseInt(tableId, 10),
        }),
      );

      if (error) throw error;

      // Success
      setLocalCart([]);
      await fetchActiveOrders(); // Refresh bill
      setViewMode("bill"); // Go to bill view
    } catch (err) {
      console.error("Failed to send order:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseTable = () => {
    setShowPayConfirmation(true);
  };

  // Actual Logic to Clear Table
  const confirmCloseTable = async () => {
    setIsSending(true);
    try {
      const { error } = await import("@/lib/supabase").then((mod) =>
        mod.supabase
          .from("orders")
          .update({ status: "completed" })
          .eq("table_no", parseInt(tableId))
          .in("status", ["pending", "preparing", "ready"]),
      );
      if (error) throw error;
      router.push("/waiter/tables");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
      setShowPayConfirmation(false);
    }
  };

  // --- VIEW: BILL (Summary) ---
  if (viewMode === "bill") {
    return (
      <div className="flex-1 flex flex-col bg-zinc-950 text-white h-screen">
        <div className="p-4 flex items-center gap-4 bg-zinc-900 border-b border-white/5 shrink-0">
          <button
            onClick={() => router.push("/waiter/tables")}
            className="p-2 text-zinc-400 hover:text-white"
          >
            <ChevronLeft />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg">Table {tableId}</h1>
            <p className="text-xs text-zinc-500">
              Current Bill • {activeOrders.length} Orders
            </p>
          </div>
          <div className="p-2 bg-red-500/10 text-red-500 rounded-lg font-bold text-sm">
            BUSY
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingActive ? (
            <div className="text-center py-10 text-zinc-500">
              Loading bill...
            </div>
          ) : billItems.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">
              <p>No active items.</p>
              <button
                onClick={() => setViewMode("menu")}
                className="mt-4 text-brand-primary underline"
              >
                Create Order
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {billItems.map((item: any, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start py-3 border-b border-white/5 last:border-0"
                  >
                    <div className="flex gap-3">
                      <div className="bg-zinc-900 w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-zinc-400">
                        {item.quantity}
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <p className="text-xs text-zinc-500">
                            {item.modifiers.map((m: any) => m.name).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-zinc-400">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-dashed border-zinc-700 mt-4">
                <div className="flex justify-between items-end">
                  <span className="text-zinc-500 uppercase tracking-widest text-xs font-bold">
                    Total Due
                  </span>
                  <span className="text-3xl font-black text-brand-primary">
                    {formatPrice(billTotal)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-zinc-900 border-t border-white/5 space-y-3">
          <button
            onClick={() => setViewMode("menu")}
            className="w-full py-4 bg-zinc-800 text-white hover:bg-zinc-700
                    rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Plus size={20} /> Add Items
          </button>

          <button
            onClick={handleCloseTable}
            disabled={
              isSending || activeOrders.some((o) => o.status !== "ready")
            }
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg
              ${
                isSending || activeOrders.some((o) => o.status !== "ready")
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none"
                  : "bg-green-600 text-white hover:bg-green-500 shadow-green-900/20"
              }`}
          >
            {activeOrders.some((o) => o.status !== "ready") ? (
              <>
                <Utensils size={20} />
                <span>Kitchen Preparing...</span>
              </>
            ) : (
              <>
                <DollarSign size={20} />
                <span>Paid & Free Table</span>
              </>
            )}
          </button>
        </div>

        <ConfirmationModal
          isOpen={showPayConfirmation}
          onClose={() => setShowPayConfirmation(false)}
          onConfirm={confirmCloseTable}
          title="Free this table?"
          message="This will mark all orders as completed and free up the table for new customers. Ensure payment has been received."
          confirmText="Paid & Free Table"
          variant="neutral"
        />
      </div>
    );
  }

  // --- VIEW: MENU (Add Items) ---
  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-white h-screen">
      {/* Header */}
      <div className="p-4 flex items-center gap-4 bg-zinc-900 border-b border-white/5 shrink-0">
        <button
          onClick={() => {
            if (activeOrders.length > 0) setViewMode("bill");
            else router.push("/waiter/tables");
          }}
          className="p-2 text-zinc-400 hover:text-white"
        >
          <ChevronLeft />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg">Table {tableId}</h1>
          <p className="text-xs text-zinc-500">Adding Items</p>
        </div>
        <div className="relative">
          <div className="p-2 bg-zinc-800 rounded-full text-brand-primary">
            <ShoppingBag size={20} />
          </div>
          {totalCartCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {totalCartCount}
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-4 pb-2 space-y-4 shrink-0">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-primary transition-colors"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                        px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all
                        ${
                          selectedCategory === cat
                            ? "bg-brand-primary text-black border-brand-primary"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                        }
                    `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {loading ? (
          <div className="text-center py-10 text-zinc-600">Loading menu...</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredProducts.map((product) => {
              const isSoldOut = (product.stock_level ?? 999) <= 0;
              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (!isSoldOut) {
                      setSelectedItem(product);
                      setIsCustomizing(true);
                    }
                  }}
                  className={`flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-white/5 cursor-pointer active:scale-[0.98] transition-all ${isSoldOut ? "opacity-50 grayscale pointer-events-none" : "hover:bg-zinc-800"}`}
                >
                  <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={product.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">
                      {product.name}
                    </h3>
                    <p className="text-brand-primary text-xs font-mono">
                      {formatPrice(calculateDiscountedPrice(product))}
                      {(product.discount_value || 0) > 0 && (
                        <span className="ml-2 line-through text-zinc-500">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </p>
                  </div>

                  {isSoldOut ? (
                    <span className="text-xs text-red-500 font-bold uppercase">
                      Sold Out
                    </span>
                  ) : (
                    <button className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-black shadow-lg">
                      <Plus size={18} strokeWidth={3} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      <AnimatePresence>
        {totalCartCount > 0 && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 shadow-2xl z-20"
          >
            <div className="max-h-32 overflow-y-auto mb-4 space-y-2">
              {localCart.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-zinc-800 rounded-lg">
                      <button
                        onClick={() => updateQty(index, -1)}
                        className="p-1 px-2 text-zinc-400 hover:text-white"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs w-4 text-center font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(index, 1)}
                        className="p-1 px-2 text-zinc-400 hover:text-white"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div>
                      <span className="truncate max-w-[120px] block">
                        {item.name}
                      </span>
                      {item.selectedModifiers &&
                        item.selectedModifiers.length > 0 && (
                          <span className="text-[10px] text-zinc-500">
                            {item.selectedModifiers
                              .map((m) => m.name)
                              .join(", ")}
                          </span>
                        )}
                    </div>
                  </div>
                  <span className="text-zinc-400">
                    {formatPrice(calculateItemTotal(item) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="w-full flex gap-3">
              <button
                onClick={handleSendOrder}
                disabled={isSending}
                className="flex-1 py-4 bg-brand-primary text-black font-bold text-lg rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSending ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Send Order • {formatPrice(cartTotal)}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CustomizationModal
        isOpen={isCustomizing}
        onClose={() => setIsCustomizing(false)}
        item={selectedItem}
        onSave={handleAddToCart}
      />
    </div>
  );
}
