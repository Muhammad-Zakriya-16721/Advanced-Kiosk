"use client";

import React, { useState, useEffect, useRef } from "react";
import { getActiveOrders, updateOrderStatus } from "@/lib/api";
import { createClient } from "@/lib/supabase-browser";
import KitchenTicket from "@/components/kitchen/KitchenTicket";
import KitchenPresence from "@/components/kitchen/KitchenPresence";
import { Loader2, Wifi, WifiOff, Volume2, Play, Check } from "lucide-react";
import { useMenuData } from "@/hooks/useMenuData"; // Fixed Import

export default function KitchenDisplay() {
  const [supabase] = useState(() => createClient());
  const { menuItems } = useMenuData(); // Fetch Products for KDS Logic
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  // Audio State
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Audio Ref (Standard Ding Sound)
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- 1. Audio Interaction Unlocker ---
  const unlockAudio = async () => {
    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      await ctx.resume();
      audioContextRef.current = ctx;
      setIsAudioUnlocked(true);
      playDing(); // Test sound
    } catch (e) {
      console.error("Audio unlock failed", e);
      setAudioError("Could not enable audio. Check browser permissions.");
      setIsAudioUnlocked(true); // Proceed anyway visuals-only
    }
  };

  const playDing = () => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Simple "Ding" styling
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // Drop

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  };

  // --- 2. Initial Fetch ---
  const fetchOrders = async () => {
    try {
      const data = await getActiveOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- 3. Realtime Subscription ---
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("Realtime Event:", payload);

          // HANDLE INSERT
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new;
            // Filter completed/cancelled if they somehow insert as such
            if (
              newOrder.status === "completed" ||
              newOrder.status === "cancelled"
            )
              return;

            setOrders((prev) => {
              // De-duplication
              if (prev.some((o) => o.id === newOrder.id)) return prev;

              // Play Sound!
              if (isAudioUnlocked) playDing();

              return [...prev, newOrder].sort(
                (a, b) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime(),
              );
            });
          }

          // HANDLE UPDATE
          if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new;

            setOrders((prev) => {
              // If completed/cancelled, remove it
              if (
                updatedOrder.status === "completed" ||
                updatedOrder.status === "cancelled" ||
                updatedOrder.status === "ready"
              ) {
                return prev.filter((o) => o.id !== updatedOrder.id);
              }
              // Otherwise update data in place
              return prev.map((o) =>
                o.id === updatedOrder.id ? updatedOrder : o,
              );
            });
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setIsConnected(true);
        if (status === "CHANNEL_ERROR") setIsConnected(false);
        if (status === "TIMED_OUT") setIsConnected(false);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, isAudioUnlocked]);

  // --- Self-Monitoring for Revocation ---
  useEffect(() => {
    let channel: any;

    const setupAuthListener = async () => {
      // 1. Get User ID
      const storedUser = localStorage.getItem("kitchen_user");
      if (!storedUser) return;
      const user = JSON.parse(storedUser);

      // 2. Initial Check via RPC
      const { data: statusStr } = await supabase.rpc("get_staff_status", {
        p_staff_id: user.id,
      });

      if (statusStr !== "approved") {
        await handleLogout();
        return;
      }

      // 3. Listen for Status Changes
      channel = supabase
        .channel(`staff-status-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "kitchen_staff",
            filter: `id=eq.${user.id}`,
          },
          async (payload) => {
            if (payload.new.status !== "approved") {
              await handleLogout();
            }
          },
        )
        .subscribe();
    };

    setupAuthListener();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    // 1. Find Open Session
    const storedUser = localStorage.getItem("kitchen_user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Update latest OPEN session for this user
      // Logic: Find session where staff_id=X and logout_at is null
      const { data: sessions } = await supabase
        .from("staff_sessions")
        .select("id, login_at")
        .eq("staff_id", user.id)
        .is("logout_at", null)
        .order("login_at", { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        const now = new Date();
        const duration = Math.round(
          (now.getTime() - new Date(session.login_at).getTime()) / 60000,
        );

        await supabase
          .from("staff_sessions")
          .update({
            logout_at: now.toISOString(),
            duration_minutes: duration,
          })
          .eq("id", session.id);
      }
    }

    // 2. Clear Local State
    localStorage.removeItem("kitchen_user");
    document.cookie =
      "kitchen_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // 3. Redirect
    window.location.href = "/kitchen/login";
  };

  // --- 4. Status Update Handler ---
  const handleUpdateStatus = async (
    orderId: string,
    status: string,
    payload: any = {},
  ) => {
    // Optimistic Update
    setOrders((prev) => {
      if (status === "completed" || status === "ready")
        return prev.filter((o) => o.id !== orderId);
      return prev.map((o) =>
        o.id === orderId ? { ...o, status, ...payload } : o,
      );
    });

    const success = await updateOrderStatus(orderId, status, payload);
    if (!success) {
      fetchOrders(); // Revert on failure
      alert("Failed to update order status");
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-brand-primary/30">
      <KitchenPresence />
      {/* START SESSION OVERLAY */}
      {!isAudioUnlocked && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="bg-brand-primary/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Volume2 size={48} className="text-brand-primary" />
            </div>
            <h1 className="text-4xl font-black">Kitchen Display</h1>
            <p className="text-gray-400">
              Click below to start the session and enable audio alerts for
              incoming orders.
            </p>
            <button
              onClick={unlockAudio}
              className="
                    w-full py-4 bg-brand-primary text-brand-dark 
                    rounded-2xl font-black text-xl uppercase tracking-widest
                    hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-primary/20
                    flex items-center justify-center gap-3 cursor-pointer
                "
            >
              <Play fill="currentColor" /> Start Service
            </button>
            {audioError && <p className="text-red-500 text-sm">{audioError}</p>}
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#111]">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-wide uppercase text-gray-400">
            Active Orders
            <span className="ml-3 bg-white/10 text-white px-3 py-1 rounded-full text-base">
              {orders.length}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="text-xs bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 px-3 py-1.5 rounded-lg transition-colors font-bold uppercase tracking-wider"
          >
            End Shift
          </button>

          {isConnected ? (
            <div className="flex items-center gap-2 text-green-500 text-sm font-bold bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
              <Wifi size={16} /> LIVE
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 animate-pulse">
              <WifiOff size={16} /> OFFLINE
            </div>
          )}
        </div>
      </header>

      {/* TICKET GRID */}
      <main className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 items-start">
        {isLoading ? (
          <div className="col-span-full h-[60vh] flex items-center justify-center flex-col gap-4 text-gray-500">
            <Loader2 size={48} className="animate-spin text-brand-primary" />
            <p>Connecting to Kitchen...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="col-span-full h-[60vh] flex items-center justify-center flex-col gap-4 opacity-30">
            <div className="w-24 h-24 border-4 border-dashed rounded-full flex items-center justify-center border-gray-600">
              <Check size={48} className="text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold">All caught up!</h2>
            <p>Waiting for new orders...</p>
          </div>
        ) : (
          orders.map((order) => (
            <KitchenTicket
              key={order.id}
              order={order}
              onUpdateStatus={handleUpdateStatus}
              allProducts={menuItems}
            />
          ))
        )}
      </main>
    </div>
  );
}
