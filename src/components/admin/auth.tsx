"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Key } from "lucide-react";

export default function AdminLoginForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setAuthError(error.message);
      setLoading(false);
    } else {
      // Force reload to let the Server Component detect the new session cookie
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Key className="text-brand-primary" /> Admin Login
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/20 border border-zinc-700 rounded-lg p-3 text-white focus:border-brand-primary focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-zinc-700 rounded-lg p-3 text-white focus:border-brand-primary focus:outline-none"
              required
            />
          </div>
          {authError && <p className="text-red-500 text-sm">{authError}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-black font-bold py-3 rounded-lg hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
