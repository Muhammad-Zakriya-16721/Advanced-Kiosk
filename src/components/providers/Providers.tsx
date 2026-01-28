"use client";

import { ThemeProvider } from "@/context/ThemeContext";
import { AccessibilityProvider } from "@/components/providers/AccessibilityProvider";

import { useGlobalTimer } from "@/store/timeStore";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Initialize Global Timer (1s tick)
  useGlobalTimer();

  return (
    <ThemeProvider>
      <AccessibilityProvider>{children}</AccessibilityProvider>
    </ThemeProvider>
  );
}
