"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Check,
  Clock,
  Flame,
  PauseCircle,
  ChefHat,
  AlertTriangle,
  Play,
} from "lucide-react";
import { Product } from "@/lib/api";
import { calculateOrderTimings, getTimeToFire } from "@/lib/kds-logic";

interface KitchenTicketProps {
  order: any;
  onUpdateStatus: (orderId: string, status: string, payload?: any) => void;
  allProducts: Product[];
}

const KitchenTicket = ({
  order,
  onUpdateStatus,
  allProducts,
}: KitchenTicketProps) => {
  const [elapsed, setElapsed] = useState("00:00");
  const [now, setNow] = useState(Date.now());
  const [isLate, setIsLate] = useState(false);

  // Derive Status & Timings
  const kdsOrder = useMemo(() => {
    return calculateOrderTimings(order, allProducts);
  }, [order, allProducts, now]); // Recalc on 'now' to update Fire status dynamically

  // Determine Ticket Mode
  const isPending = order.status === "pending";
  const isPreparing = order.status === "preparing";

  // --- TIMER LOGIC ---
  useEffect(() => {
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);

      const created = new Date(order.created_at).getTime();
      const diff = Math.max(0, current - created);

      // Lateness Check (3 mins = 180000 ms)
      if (isPending && diff > 180000) {
        setIsLate(true);
      } else {
        setIsLate(false);
      }

      // Format Timer string
      // User Req: "Time starts when kitchen staff accept"
      let baseTime = created;

      if (isPreparing && order.accepted_at) {
        baseTime = new Date(order.accepted_at).getTime();
      }

      // If Preparing, we show time ELAPSED since acceptance (Count UP).
      // If Pending, we show time WAITING since creation.
      const displayDiff = Math.max(0, current - baseTime);

      const mins = Math.floor(displayDiff / 60000);
      const secs = Math.floor((displayDiff % 60000) / 1000);
      setElapsed(
        `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [order.created_at, order.accepted_at, isPending, isPreparing]);

  // --- ACTIONS ---
  const handleAccept = () => {
    onUpdateStatus(order.id, "preparing", {
      accepted_at: new Date().toISOString(),
    });
  };

  const handleComplete = () => {
    onUpdateStatus(order.id, "ready");
  };

  // --- STYLING ---
  // Base Color
  let borderColor = "border-gray-600";
  let bgColor = "bg-[#1e1e1e]";

  if (isPending) {
    borderColor = isLate ? "border-red-600" : "border-gray-500";
    bgColor = isLate ? "bg-red-950/20" : "bg-[#1e1e1e]";
  } else if (isPreparing) {
    // If ANY item is "Fire", turn Ticket Green/Active
    const hasFire = kdsOrder.items.some(
      (i) => i.status === "fire" || i.status === "cooking",
    );
    borderColor = hasFire ? "border-green-500" : "border-blue-600";
  }

  return (
    <div
      className={`
      relative overflow-hidden rounded-xl border-t-8 shadow-2xl flex flex-col transition-colors duration-300
      ${borderColor} ${bgColor}
      ${isLate ? "animate-pulse-slow ring-2 ring-red-500/50" : ""}
    `}
    >
      {/* HEADER */}
      <div className="p-4 flex justify-between items-center border-b border-white/10 bg-black/20">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-mono uppercase tracking-widest flex items-center gap-2">
            {isPending && isLate && (
              <span className="text-red-500 font-black flex items-center gap-1">
                <AlertTriangle size={12} /> LATE
              </span>
            )}
            {isPending && !isLate && <span>New Order</span>}
            {isPreparing && <span className="text-blue-400">Preparing</span>}
          </span>
          <span className="text-3xl font-black tracking-tighter text-white">
            #{order.order_number}
          </span>
        </div>

        <div
          className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5
          ${isLate ? "bg-red-500/20 text-red-500" : "bg-black/40 text-gray-300"}
        `}
        >
          <Clock size={16} />
          <span className="font-mono font-bold text-xl">{elapsed}</span>
        </div>
      </div>

      {/* BODY (Items) */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[300px]">
        {/* If Pending, we just list items simply. If Preparing, we show Fire Times. */}
        {kdsOrder.items.map((item, idx) => {
          let statusLabel = "";
          let statusColor = "text-gray-500";
          let rowBg = "bg-white/5";

          if (isPreparing) {
            const timeToFire = item.fire_at - now;
            if (item.status === "fire" || item.status === "cooking") {
              statusLabel = "COOKING";
              statusColor = "text-green-400";
              rowBg = "bg-green-900/10 border-green-500/20";
            } else {
              statusLabel = `Fire in ${getTimeToFire(item.fire_at)}`;
              statusColor = "text-blue-300";
            }
          }

          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border border-white/5 ${rowBg} flex justify-between items-start`}
            >
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-white">
                    {item.quantity}
                  </span>
                  <span className="font-bold text-gray-200 leading-tight">
                    {item.name}
                  </span>
                </div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="mt-1 pl-4 border-l-2 border-gray-700">
                    {item.modifiers.map((m: any, i: number) => (
                      <div key={i} className="text-xs text-gray-400">
                        + {m.selectedOption || m.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isPreparing && (
                <div className="text-right">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider block ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                  <span className="text-xs text-gray-600 font-mono">
                    {item.prep_time}m
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {order.customer_note && (
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <span className="text-xs text-yellow-500 font-bold uppercase block mb-1">
              Kitchen Note
            </span>
            <p className="text-yellow-100 text-sm italic">
              "{order.customer_note}"
            </p>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-4 bg-black/30 border-t border-white/5 mt-auto">
        {isPending ? (
          <button
            onClick={handleAccept}
            className="
                  w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest
                  bg-brand-primary text-brand-dark hover:bg-white
                  transition-all active:scale-95 flex items-center justify-center gap-3
                  shadow-lg shadow-brand-primary/20
               "
          >
            <Play fill="currentColor" size={20} /> Accept Order
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="
                  w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest
                  bg-zinc-800 hover:bg-green-600 text-gray-300 hover:text-white
                  transition-all active:scale-95 flex items-center justify-center gap-3
                  group
               "
          >
            <div className="bg-white/10 p-1 rounded-full group-hover:bg-white/20">
              <Check size={20} />
            </div>
            Mark Ready
          </button>
        )}
      </div>
    </div>
  );
};

export default KitchenTicket;
