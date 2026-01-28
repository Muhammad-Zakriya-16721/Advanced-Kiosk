"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  supabase,
  getActiveOrders,
  getRecentCompletedOrders,
  formatOrderId,
} from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Clock } from "lucide-react";

export default function OrderTracker() {
  const [preparingOrders, setPreparingOrders] = useState<any[]>([]);
  const [readyOrders, setReadyOrders] = useState<any[]>([]);

  // Audio state
  const audioContextRef = useRef<AudioContext | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Stats
  const [waitTime, setWaitTime] = useState(5);

  // --- 1. Audio Setup (Chime + Voice) ---
  const unlockAudio = () => {
    if (!hasInteracted) {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      setHasInteracted(true);

      // Test Speak
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance("Audio enabled");
        u.volume = 0; // Silent test
        window.speechSynthesis.speak(u);
      }
    }
  };

  const playChime = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    const now = ctx.currentTime;
    const notes = [392.0, 493.88, 587.33, 783.99];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 1.5);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 1.5);
    });
  };

  const announceOrder = (idStr: string) => {
    if ("speechSynthesis" in window) {
      // Create legible string (e.g. "9 F 4 A" instead of "nine thousand...")
      const readableId = idStr.split("").join(" ");
      const text = `Order ${readableId} is now ready.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;

      // Priority
      window.speechSynthesis.cancel(); // Stop current
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- 2. Initial Data ---
  useEffect(() => {
    const initData = async () => {
      const active = await getActiveOrders();
      const pending = active.filter((o: any) => o.status === "pending");
      setPreparingOrders(pending);
      setWaitTime(5 + Math.ceil(pending.length / 2)); // Dynamic Wait Time Heuristic

      const recent = await getRecentCompletedOrders();
      setReadyOrders(recent);
    };
    initData();
  }, []);

  // --- 3. Realtime ---
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("tracker-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new;
            if (newOrder.status === "pending") {
              setPreparingOrders((prev) => {
                const updated = [...prev, newOrder];
                setWaitTime(5 + Math.ceil(updated.length / 2));
                return updated;
              });
            } else if (newOrder.status === "completed") {
              setReadyOrders((prev) => [newOrder, ...prev].slice(0, 10));
              playChime();
              announceOrder(
                newOrder.order_number
                  ? `#${newOrder.order_number}`
                  : formatOrderId(newOrder.id),
              );
            }
          }

          if (payload.eventType === "UPDATE") {
            const updated = payload.new;

            // Remove from pending
            setPreparingOrders((prev) => {
              const filtered = prev.filter((o) => o.id !== updated.id);
              setWaitTime(5 + Math.ceil(filtered.length / 2));
              return filtered;
            });

            if (updated.status === "completed") {
              setReadyOrders((prev) => {
                if (prev.find((o) => o.id === updated.id)) return prev;
                // New Completion
                playChime();
                announceOrder(
                  updated.order_number
                    ? `#${updated.order_number}`
                    : formatOrderId(updated.id),
                );
                return [updated, ...prev].slice(0, 10);
              });
            } else if (updated.status === "pending") {
              // Moved back?
              setPreparingOrders((prev) => {
                if (prev.find((o) => o.id === updated.id)) return prev;
                const updatedList = [...prev, updated];
                setWaitTime(5 + Math.ceil(updatedList.length / 2));
                return updatedList;
              });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-[#111] text-white font-sans flex flex-col relative overflow-hidden"
      onClick={unlockAudio}
    >
      {/* BANNER */}
      <div className="bg-brand-primary text-black font-bold py-2 px-4 shadow-lg z-20 flex justify-between items-center overflow-hidden">
        <div className="flex items-center gap-4 animate-marquee whitespace-nowrap w-full">
          <span className="uppercase tracking-widest text-sm md:text-base">
            🎉 Today's Special: 20% OFF ALL COMBOS! • Estimated Wait Time:{" "}
            {waitTime} Mins • Download our App for loyalty rewards! 🍔
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT: PREPARING */}
        <div className="flex-1 border-r border-white/10 flex flex-col relative bg-[#1a1a1a]">
          {/* Header */}
          <div className="h-24 bg-[#333] flex items-center justify-center border-b border-white/10 shadow-xl z-10">
            <h2 className="text-4xl md:text-5xl font-black text-gray-400 uppercase tracking-widest flex items-center gap-4">
              <Clock size={48} className="text-yellow-500 animate-pulse" />
              Preparing
            </h2>
          </div>

          {/* Content */}
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {preparingOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-white/5 rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-white/5"
                  >
                    <span className="text-gray-500 font-bold uppercase text-sm mb-2">
                      Order
                    </span>
                    <span className="text-5xl font-black text-gray-300 font-mono tracking-tighter">
                      {order.order_number
                        ? `#${order.order_number}`
                        : formatOrderId(order.id)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT: NOW SERVING */}
        <div className="flex-1 flex flex-col relative bg-black/50">
          {/* Header */}
          <div className="h-24 bg-green-700 flex items-center justify-center shadow-xl z-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-widest flex items-center gap-4 relative z-10">
              <CheckCircle size={48} className="text-white" />
              Now Serving
            </h2>
          </div>

          {/* Content */}
          <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-green-900/20 to-black">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {readyOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, x: 50, scale: 1.1 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      },
                    }}
                    className="
                                bg-green-600 text-white rounded-3xl p-8 
                                flex items-center justify-between
                                shadow-2xl shadow-green-900/50
                                border-4 border-green-400
                            "
                  >
                    <div className="flex flex-col">
                      <span className="font-bold uppercase text-green-200 text-lg mb-1">
                        Order Number
                      </span>
                      <span className="text-7xl font-black font-mono tracking-tighter">
                        {order.order_number
                          ? `#${order.order_number}`
                          : formatOrderId(order.id)}
                      </span>
                    </div>
                    <div className="bg-white/20 p-4 rounded-full">
                      <CheckCircle
                        size={48}
                        className="text-white"
                        strokeWidth={3}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Prompt Overlay */}
      {!hasInteracted && (
        <div className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg text-sm text-gray-400 animate-pulse pointer-events-none z-50">
          Click anywhere to enable announcer
        </div>
      )}
    </div>
  );
}
