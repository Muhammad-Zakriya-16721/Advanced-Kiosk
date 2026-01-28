"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/api";
import { Loader2, Shield, User, Lock, UserPlus, LogIn } from "lucide-react";

export default function KitchenLogin() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (mode === "register") {
        // --- REGISTRATION ---
        const { error: regError } = await supabase
          .from("kitchen_staff")
          .insert({
            username,
            password, // Storing as requested
            status: "pending",
          });

        if (regError) {
          if (regError.code === "23505")
            throw new Error("Username already taken");
          throw regError;
        }

        setSuccessMsg("Registration successful! Wait for Admin approval.");
        setMode("login");
        setPassword("");
      } else {
        // --- LOGIN ---
        // Use Secure RPC
        const { data, error: loginError } = await supabase.rpc(
          "kitchen_login",
          {
            p_username: username,
            p_password: password,
          },
        );

        if (loginError) throw loginError;

        if (data && data.length > 0) {
          const staff = data[0];
          // Set Cookie
          const d = new Date();
          d.setTime(d.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 Days
          document.cookie = `kitchen_token=${staff.id};expires=${d.toUTCString()};path=/`;
          localStorage.setItem("kitchen_user", JSON.stringify(staff));

          // Log Session
          await supabase.from("staff_sessions").insert({
            staff_id: staff.id,
            login_at: new Date(),
          });

          router.push("/kitchen/waiting");
        } else {
          throw new Error("Invalid credentials or account not approved.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50" />

        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4 text-brand-primary ring-1 ring-brand-primary/20">
            <Shield size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {mode === "login" ? "Kitchen Access" : "Staff Registration"}
          </h1>
          <p className="text-zinc-500 text-sm">
            {mode === "login"
              ? "Sign in to access the Kitchen Display System"
              : "Create a unique staff identity for approval"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5 relative z-10">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
              Username
            </label>
            <div className="relative group">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-primary transition-colors"
                size={20}
              />
              <input
                type="text"
                required
                placeholder="e.g. ChefJohn"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-brand-primary/50 focus:bg-white/5 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative group">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-primary transition-colors"
                size={20}
              />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-brand-primary/50 focus:bg-white/5 transition-all font-medium tracking-widest"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium text-center animate-shake">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-green-900/20 border border-green-500/20 rounded-xl text-green-500 text-sm font-medium text-center">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-brand-dark font-bold text-lg py-4 rounded-xl hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : mode === "login" ? (
              <>
                <LogIn size={20} /> Sign In
              </>
            ) : (
              <>
                <UserPlus size={20} /> Send Request
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
              setSuccessMsg("");
            }}
            className="text-zinc-500 hover:text-brand-primary text-sm font-medium transition-colors cursor-pointer"
          >
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <span className="underline">Register</span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span className="underline">Sign In</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
