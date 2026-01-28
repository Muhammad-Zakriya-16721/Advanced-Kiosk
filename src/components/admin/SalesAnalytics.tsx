"use client";

import React, { useEffect, useState } from "react";
import { getDailyStats } from "@/lib/api";
import {
  BarChart3,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  RefreshCcw,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SalesAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    const data = await getDailyStats();
    setStats(data);
    setIsLoading(false);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    bgColor,
    textColor,
  }: {
    title: string;
    value: string;
    icon: any;
    bgColor: string;
    textColor: string;
  }) => (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4">
      <div className={`p-4 rounded-xl ${bgColor} bg-opacity-10`}>
        <Icon className={textColor} size={24} />
      </div>
      <div>
        <p className="text-zinc-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-white">
          {isLoading ? "..." : value}
        </h3>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="text-brand-primary" /> Sales Analytics
          </h2>
          <p className="text-zinc-400">Real-time overview for today</p>
        </div>
        <button
          onClick={loadStats}
          disabled={isLoading}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
          title="Refresh Data"
        >
          <RefreshCcw size={20} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${stats?.revenue?.toFixed(2) || "0.00"}`}
          icon={DollarSign}
          bgColor="bg-green-500/20"
          textColor="text-green-500"
        />
        <StatCard
          title="Total Orders"
          value={stats?.orders?.toString() || "0"}
          icon={ShoppingBag}
          bgColor="bg-blue-500/20"
          textColor="text-blue-500"
        />
        <StatCard
          title="Avg. Order Value"
          value={`$${stats?.avgValue?.toFixed(2) || "0.00"}`}
          icon={TrendingUp}
          bgColor="bg-purple-500/20"
          textColor="text-purple-500"
        />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Items Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">
            Top Selling Items
          </h3>

          {!stats?.popularItems?.length ? (
            <div className="text-center py-10 text-zinc-600">
              No sales data yet today.
            </div>
          ) : (
            <div className="space-y-5">
              {stats.popularItems.map((item: any, index: number) => {
                const maxCount = stats.popularItems[0].count; // Baseline for 100% width
                const percentage = (item.count / maxCount) * 100;

                return (
                  <div key={item.name} className="relative">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-zinc-300">
                        {index + 1}. {item.name}
                      </span>
                      <span className="text-zinc-500">{item.count} sold</span>
                    </div>
                    {/* Bar Background */}
                    <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-brand-primary rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity / Placeholder */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <TrendingUp size={32} className="text-brand-primary" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Growth Insights</h3>
          <p className="text-zinc-500 max-w-sm">
            More advanced analytics like weekly comparisons and category
            breakdowns are coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
