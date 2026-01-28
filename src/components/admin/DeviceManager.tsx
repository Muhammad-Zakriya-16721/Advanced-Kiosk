"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import {
  Shield,
  Check,
  X,
  User,
  Trash2,
  AlertTriangle,
  Clock,
  Download,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function StaffManager() {
  const supabase = createClient();
  const [pendingStaff, setPendingStaff] = useState<any[]>([]);
  const [activeStaff, setActiveStaff] = useState<any[]>([]);
  const [rejectedStaff, setRejectedStaff] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});

  // Modals
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    fetchStaff();

    // 1. Subscribe to DB Changes (New Registrations)
    const dbChannel = supabase
      .channel("admin-staff-db")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kitchen_staff" },
        () => fetchStaff(),
      )
      .subscribe();

    // 2. Subscribe to Presence (Online Status)
    const presenceChannel = supabase.channel("room:kitchen", {
      config: {
        presence: {
          key: "admin-viewer",
        },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        updateOnlineStatus(state);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        console.log("User Joined:", newPresences);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        console.log("User Left:", leftPresences);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, []);

  const updateOnlineStatus = (state: any) => {
    // Map presence state to simple ID map
    const online: Record<string, any> = {};
    Object.keys(state).forEach((key) => {
      // Users publish their staffId as key or inside payload
      // We'll assume the client publishes { staffId, ... }
      const presences = state[key];
      presences.forEach((p: any) => {
        if (p.staffId) online[p.staffId] = p;
      });
    });
    setOnlineUsers(online);
  };

  const fetchStaff = async () => {
    const { data } = await supabase
      .from("kitchen_staff")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setPendingStaff(data.filter((d: any) => d.status === "pending"));
      setActiveStaff(data.filter((d: any) => d.status === "approved"));
      setRejectedStaff(data.filter((d: any) => d.status === "rejected"));
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("kitchen_staff").update({ status }).eq("id", id);
    fetchStaff();
  };

  const deleteStaff = async (id: string) => {
    await supabase.from("kitchen_staff").delete().eq("id", id);
    fetchStaff();
    setDeleteId(null);
  };

  const clearRejected = async () => {
    await supabase.from("kitchen_staff").delete().eq("status", "rejected");
    setShowBulkModal(false);
    fetchStaff();
  };

  const downloadHistory = async (id: string, name: string) => {
    const { data } = await supabase
      .from("staff_sessions")
      .select("*")
      .eq("staff_id", id)
      .gte(
        "created_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order("login_at", { ascending: false });

    if (!data) return;

    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Login Time,Logout Time,Duration (Mins)\n" +
      data
        .map(
          (e) =>
            `${e.login_at},${e.logout_at || "Active"},${e.duration_minutes || 0}`,
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${name}_weekly_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="text-green-500" size={32} /> Staff Management
          </h1>
          <p className="text-zinc-500">
            Approve pending requests and monitor live attendance.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* CARD 1: PENDING REQUESTS */}
        <div className="bg-[#111] border border-zinc-800 rounded-3xl overflow-hidden flex flex-col h-[600px]">
          <div className="bg-blue-500/10 p-5 border-b border-blue-500/10 flex justify-between items-center">
            <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
              <User className="text-blue-500" size={20} /> Pending Requests
            </h2>
            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold">
              {pendingStaff.length}
            </span>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {pendingStaff.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 opacity-50">
                <Check size={40} className="mb-2" />
                <p>All caught up</p>
              </div>
            ) : (
              pendingStaff.map((s) => (
                <div
                  key={s.id}
                  className="bg-zinc-900/50 p-4 rounded-xl border border-white/5"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white text-lg">
                        {s.username}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Requested: {new Date(s.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateStatus(s.id, "approved")}
                      className="py-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg font-bold transition-all text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(s.id, "rejected")}
                      className="py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-bold transition-all text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CARD 2: APPROVED STAFF (LIVE) */}
        <div className="bg-[#111] border border-zinc-800 rounded-3xl overflow-hidden flex flex-col h-[600px]">
          <div className="bg-green-500/10 p-5 border-b border-green-500/10 flex justify-between items-center">
            <h2 className="text-lg font-bold text-green-400 flex items-center gap-2">
              <div className="relative flex h-3 w-3 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </div>
              Live Staff
            </h2>
            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-bold">
              {activeStaff.length}
            </span>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {activeStaff.map((s) => {
              const isOnline = !!onlineUsers[s.id];
              return (
                <div
                  key={s.id}
                  className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500/50"}`}
                      ></div>
                      <div>
                        <h3 className="font-bold text-white">{s.username}</h3>
                        <p className="text-xs text-zinc-500">
                          {isOnline ? "Online Now" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => downloadHistory(s.id, s.username)}
                        title="Download 1-Week History"
                        className="p-2 text-zinc-400 hover:text-blue-400 bg-white/5 rounded-lg"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => updateStatus(s.id, "rejected")}
                        title="Revoke Access"
                        className="p-2 text-zinc-400 hover:text-red-500 bg-white/5 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CARD 3: REJECTED HISTORY */}
        <div className="bg-[#111] border border-zinc-800 rounded-3xl overflow-hidden flex flex-col h-[600px]">
          <div className="bg-red-500/10 p-5 border-b border-red-500/10 flex justify-between items-center">
            <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} /> Rejected /
              Revoked
            </h2>
            {rejectedStaff.length > 0 && (
              <button
                onClick={() => setShowBulkModal(true)}
                className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {rejectedStaff.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 opacity-50">
                <p>No rejected records</p>
              </div>
            ) : (
              rejectedStaff.map((s) => (
                <div
                  key={s.id}
                  className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 opacity-60"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-zinc-400">{s.username}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(s.id, "approved")}
                        className="text-xs text-zinc-500 hover:text-green-500 underline"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => deleteStaff(s.id)}
                        className="text-zinc-500 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CLEAR REJECTED MODAL */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Clear History?
              </h3>
              <p className="text-zinc-400 mb-6">
                This will permanently delete all {rejectedStaff.length} rejected
                records.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 py-3 bg-zinc-800 rounded-xl font-bold hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={clearRejected}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                >
                  Delete All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
