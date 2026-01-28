"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Loader2, Clock } from "lucide-react";

export default function KitchenWaiting() {
  const router = useRouter();
  const [supabase] = React.useState(() => createClient());

  useEffect(() => {
    const checkStatus = async () => {
      // 1. Get User
      const storedUser = localStorage.getItem("kitchen_user");
      if (!storedUser) {
        router.replace("/kitchen/login");
        return;
      }
      const user = JSON.parse(storedUser);

      // 2. Check Status
      const { data: statusStr } = await supabase.rpc("get_staff_status", {
        p_staff_id: user.id,
      });

      if (statusStr === "approved") {
        router.replace("/kitchen"); // Go to dashboard
      } else if (statusStr === "rejected") {
        alert("Your request has been rejected.");
        router.replace("/kitchen/login");
      }
    };

    // Initial Check
    checkStatus();

    // 3. Realtime Listener
    const storedUser = localStorage.getItem("kitchen_user");
    if (!storedUser) return;
    const user = JSON.parse(storedUser);

    const channel = supabase
      .channel(`staff-status-opt-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "kitchen_staff",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.status === "approved") {
            router.replace("/kitchen");
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-[#111] p-10 rounded-3xl border border-white/10 max-w-md w-full flex flex-col items-center">
        <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Clock size={48} className="text-yellow-500" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Request Pending</h1>
        <p className="text-zinc-500 mb-8">
          Your account is awaiting administrator approval. This page will
          automatically update once you are approved.
        </p>

        <div className="flex items-center gap-2 text-zinc-600 text-sm">
          <Loader2 size={16} className="animate-spin" />
          <span>Listening for updates...</span>
        </div>

        <button
          onClick={() => router.push("/kitchen/login")}
          className="mt-8 text-zinc-500 hover:text-white transition-colors text-sm underline"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
