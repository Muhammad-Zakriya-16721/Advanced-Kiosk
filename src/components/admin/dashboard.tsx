"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import {
  Shield,
  Utensils,
  BarChart3,
  LogOut,
  LayoutDashboard,
  ChefHat,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Components
import DeviceManager from "./DeviceManager";
import MenuManager from "./MenuManager";
import SalesAnalytics from "./SalesAnalytics";
import StockAlerts from "./StockAlerts";
import PeakHoursHeatmap from "./PeakHoursHeatmap";
import BrokenDealsAlert from "./BrokenDealsAlert";
import KitchenManager from "./KitchenManager"; // Imported
import { getProducts, Product } from "@/lib/api"; // Need data

type Tab = "overview" | "security" | "menu" | "analytics" | "kitchen";

export default function AdminDashboard() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [products, setProducts] = useState<Product[]>([]);

  const refreshProducts = () => {
    getProducts().then(setProducts);
  };

  React.useEffect(() => {
    refreshProducts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("admin-products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          refreshProducts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "menu", label: "Menu Manager", icon: Utensils },
    { id: "kitchen", label: "Kitchen Settings", icon: ChefHat }, // New Tab
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans flex flex-col md:flex-row">
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-zinc-900/50 border-r border-white/5 p-6 flex flex-col shrink-0">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-brand-dark font-black text-xl">
            QB
          </div>
          <span className="font-bold text-xl text-white tracking-tight">
            Admin Panel
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group text-left ${
                  isActive
                    ? "text-white font-bold bg-white/10"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? "text-brand-primary" : ""}
                />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto relative h-screen">
        <div className="max-w-6xl mx-auto">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 md:col-span-3">
                <BrokenDealsAlert products={products} onFix={refreshProducts} />
              </div>
              <StockAlerts products={products} onRefresh={refreshProducts} />
              <PeakHoursHeatmap />
            </div>
          )}
          {activeTab === "security" && <DeviceManager />}
          {activeTab === "menu" && (
            <MenuManager products={products} onRefresh={refreshProducts} />
          )}
          {activeTab === "kitchen" && (
            <KitchenManager products={products} onRefresh={refreshProducts} />
          )}
          {activeTab === "analytics" && <SalesAnalytics />}
        </div>
      </main>
    </div>
  );
}
