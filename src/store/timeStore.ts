import { create } from "zustand";
import { useEffect } from "react";

interface TimeState {
  now: Date;
  tick: () => void;
}

export const useTimeStore = create<TimeState>((set) => ({
  now: new Date(),
  tick: () => set({ now: new Date() }),
}));

// Helper hook to be mounted ONCE in the RootLayout or Providers
export const useGlobalTimer = (intervalMs = 1000) => {
  const tick = useTimeStore((state) => state.tick);

  useEffect(() => {
    // Sync immediately on mount
    tick();

    const interval = setInterval(() => {
      tick();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [tick, intervalMs]);
};
