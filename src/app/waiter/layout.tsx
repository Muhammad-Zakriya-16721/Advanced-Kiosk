import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QuickBite Waiter",
  description: "Mobile Companion for Staff",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevent zooming
  },
};

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased overflow-hidden selection:bg-brand-primary selection:text-black">
      {/* Mobile Constraint Container */}
      <div className="mx-auto w-full max-w-md h-[100dvh] flex flex-col relative bg-zinc-950 shadow-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}
