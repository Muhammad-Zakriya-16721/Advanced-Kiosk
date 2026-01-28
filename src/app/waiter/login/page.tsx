"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Delete, ArrowRight, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
// import { toast } from "sonner"; // Assuming sonner or basic alert

export default function WaiterLogin() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // PIN Pad Numbers
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  useEffect(() => {
    if (pin.length === 4) {
      handleLogin();
    }
  }, [pin]);

  const handlePress = (num: number) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
      setError("");
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // 1. Check against kitchen_staff table
      // Note: In production, password should be hashed. Start simple.
      const { data, error } = await supabase
        .from("kitchen_staff")
        .select("*")
        .eq("password", pin) // Treating PIN as password for now
        .eq("status", "approved") // Must be approved
        .single();

      if (error || !data) {
        throw new Error("Invalid PIN");
      }

      // 2. Success: Set Session (Local Storage for simple mobile auth)
      localStorage.setItem("waiter_session", JSON.stringify(data));

      // 3. Update 'is_online' presence
      await supabase
        .from("kitchen_staff")
        .update({ is_online: true, last_active: new Date().toISOString() })
        .eq("id", data.id);

      router.push("/waiter/tables");
    } catch (err) {
      setError("Invalid PIN");
      setPin("");
      // Vibrate if mobile
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(200);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 items-center justify-center relative">
      {/* Header */}
      <div className="mb-12 flex flex-col items-center">
        <div className="w-20 h-20 bg-brand-primary rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-brand-primary/20">
          <ChefHat size={40} className="text-black" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Waiter Access
        </h1>
        <p className="text-zinc-500 text-sm">Enter your 4-digit PIN</p>
      </div>

      {/* PIN Dots */}
      <div className="flex gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              scale: pin.length > i ? 1.2 : 1,
              backgroundColor:
                pin.length > i ? "var(--brand-primary)" : "#27272a", // brand vs zinc-800
              borderColor: error ? "#ef4444" : "transparent",
            }}
            className={`
              w-4 h-4 rounded-full transition-colors duration-200
              ${error ? "border-2 border-red-500 bg-transparent" : ""}
            `}
          />
        ))}
      </div>

      {/* Error Message */}
      <div className="h-10 mb-6 flex items-center justify-center w-full">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-red-500 font-medium text-sm bg-red-500/10 px-4 py-2 rounded-full"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Numpad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-x-6 gap-y-6">
        {numbers.map((num) => (
          <button
            key={num}
            onClick={() => handlePress(num)}
            className="
              h-20 w-20 rounded-full flex items-center justify-center
              bg-zinc-900 text-2xl font-medium text-white
              active:bg-zinc-800 active:scale-95 transition-all
              mx-auto
            "
          >
            {num}
          </button>
        ))}

        {/* Bottom Row */}
        <div className="flex items-center justify-center h-20 w-20">
          {/* Empty or specific action */}
        </div>

        <button
          onClick={() => handlePress(0)}
          className="
            h-20 w-20 rounded-full flex items-center justify-center
            bg-zinc-900 text-2xl font-medium text-white
            active:bg-zinc-800 active:scale-95 transition-all
            mx-auto
          "
        >
          0
        </button>

        <button
          onClick={handleDelete}
          className="
            h-20 w-20 rounded-full flex items-center justify-center
            text-zinc-500
            active:text-white active:scale-95 transition-all
            mx-auto
          "
        >
          <Delete size={28} />
        </button>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-primary"></div>
        </div>
      )}
    </div>
  );
}
