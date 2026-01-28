"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function KitchenPresence() {
  const [supabase] = useState(() => createClient());
  useEffect(() => {
    // 1. Get User from localStorage (set during login)
    const storedUser = localStorage.getItem("kitchen_user");
    if (!storedUser) return;

    const user = JSON.parse(storedUser);

    // 2. Join Presence Channel
    const channel = supabase.channel("room:kitchen", {
      config: {
        presence: {
          key: user.id, // Use unique ID as key
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {})
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            staffId: user.id,
            username: user.username,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // Invisible component
}
