"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Application Error:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4 text-center dark:bg-[#121212]">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Something went wrong!
      </h2>
      <p className="mb-8 max-w-sm text-gray-500 dark:text-gray-400">
        We encountered an unexpected issue properly rendering this page.
      </p>

      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-xl bg-brand-primary px-6 py-3 font-bold text-white transition-all hover:opacity-90 active:scale-95"
      >
        <RefreshCw size={20} />
        Try Again
      </button>

      {error.digest && (
        <p className="mt-8 text-xs font-mono text-gray-400">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
