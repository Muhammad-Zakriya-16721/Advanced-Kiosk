"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical Root Error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center bg-black p-4 text-center text-white">
          <h2 className="text-3xl font-bold text-red-500">Critical Error</h2>
          <p className="mt-4 text-gray-400">
            The application crashed critically.
          </p>
          <button
            onClick={() => reset()}
            className="mt-8 rounded-lg bg-white px-6 py-3 font-bold text-black"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
