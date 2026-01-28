"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface AccessibilityContextType {
  highContrast: boolean;
  toggleHighContrast: () => void;
  reachability: boolean;
  toggleReachability: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(
  null,
);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider",
    );
  }
  return context;
}

export function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [highContrast, setHighContrast] = useState(false);
  const [reachability, setReachability] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedContrast = localStorage.getItem("highContrast") === "true";
    const storedReachability = localStorage.getItem("reachability") === "true";
    setHighContrast(storedContrast);
    setReachability(storedReachability);

    if (storedContrast) {
      document.documentElement.classList.add("high-contrast");
    }
  }, []);

  const toggleHighContrast = () => {
    setHighContrast((prev) => {
      const next = !prev;
      localStorage.setItem("highContrast", String(next));
      if (next) {
        document.documentElement.classList.add("high-contrast");
      } else {
        document.documentElement.classList.remove("high-contrast");
      }
      return next;
    });
  };

  const toggleReachability = () => {
    setReachability((prev) => {
      const next = !prev;
      localStorage.setItem("reachability", String(next));
      return next;
    });
  };

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        toggleHighContrast,
        reachability,
        toggleReachability,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}
