"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, RefreshCw, Users, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/money";

interface TableStatus {
  id: number;
  status: "available" | "occupied" | "payment";
  orderId?: string; // If occupied, link to active order
  totalSpend?: number; // Accumulated total for the table
}

export default function WaiterTables() {
  const router = useRouter();
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Waiter Session Check
  useEffect(() => {
    const session = localStorage.getItem("waiter_session");
    if (!session) {
      router.push("/waiter/login");
    }
  }, []);

  // Initialize Tables (1-12)
  useEffect(() => {
    const initialTables: TableStatus[] = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      status: "available",
      totalSpend: 0,
    }));
    setTables(initialTables);
    fetchTableStatuses();

    // Subscribe to Realtime Orders
    const channel = supabase
      .channel("waiter_tables_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchTableStatuses(); // Refresh on any order change
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTableStatuses = async () => {
    try {
      // Find all active orders (pending or preparing or ready) that have a table_no
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, table_no, total_amount")
        .in("status", ["pending", "preparing", "ready"]) // Occupied statuses
        .not("table_no", "is", null);

      if (error) throw error;

      setTables((prev) => {
        const newTables = [...prev];
        // Reset all first
        newTables.forEach((t) => {
          t.status = "available";
          t.orderId = undefined;
          t.totalSpend = 0;
        });

        // Mark occupied and sum totals
        data?.forEach((order: any) => {
          const tableIndex = newTables.findIndex(
            (t) => t.id === order.table_no,
          );
          if (tableIndex !== -1) {
            newTables[tableIndex].status = "occupied";
            // If there are multiple orders for one table, we might need a way to link them all?
            // For now, linking the LAST one as "orderId" is fine for navigation,
            // but we sum ALL total_amounts for the spend.
            newTables[tableIndex].orderId = order.id;
            newTables[tableIndex].totalSpend =
              (newTables[tableIndex].totalSpend || 0) +
              (order.total_amount || 0);
          }
        });

        return newTables;
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching tables:", err);
    }
  };

  const handleTableClick = (table: TableStatus) => {
    // If occupied, maybe show order details?
    // For now, simpler flow: Clicking ALWAYS goes to Order page for that table.
    // If occupied, Order page will show "Add to existing" or "View".
    router.push(`/waiter/order/${table.id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("waiter_session");
    // Optionally update DB to offline
    router.push("/waiter/login");
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 text-white">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-white/5 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tables</h1>
          <p className="text-xs text-zinc-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Updates
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 active:scale-95 transition-all"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 p-4 grid grid-cols-3 gap-4 content-start overflow-y-auto">
        {tables.map((table) => (
          <motion.button
            key={table.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTableClick(table)}
            className={`
              relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-2
              border-2 transition-all duration-300
              ${
                table.status === "occupied"
                  ? "bg-red-500/10 border-red-500 text-red-500"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800"
              }
            `}
          >
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                ${table.status === "occupied" ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-300"}
            `}
            >
              {table.id}
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs font-medium uppercase tracking-wider">
                {table.status === "occupied" ? "Busy" : "Free"}
              </span>
              {table.status === "occupied" && (table.totalSpend || 0) > 0 && (
                <span className="text-xs font-bold text-white mt-1 bg-black/40 px-2 py-0.5 rounded-full flex items-center">
                  {formatPrice(table.totalSpend || 0)}
                </span>
              )}
            </div>

            {/* Occupied Badge */}
            {table.status === "occupied" && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping" />
            )}
          </motion.button>
        ))}
      </div>

      {/* Footer Context */}
      <div className="p-4 bg-zinc-900/50 border-t border-white/5 flex justify-center pb-8">
        <p className="text-zinc-600 text-xs text-center max-w-[200px]">
          Tap a table to take a new order or view active items.
        </p>
      </div>
    </div>
  );
}
