"use client";

import React from "react";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";

interface EmptyStateProps {
  query: string;
  onReset: () => void;
}

const EmptyState = ({ query, onReset }: EmptyStateProps) => {
  const isSearch = !!query;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="bg-gray-100 dark:bg-white/5 p-6 rounded-full mb-6">
        {isSearch ? (
          <SearchX size={48} className="text-gray-400 dark:text-gray-500" />
        ) : (
          <div className="opacity-50 text-gray-400 dark:text-gray-500 font-bold text-4xl">
            🍽️
          </div>
        )}
      </div>

      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
        {isSearch ? `No results found for "${query}"` : "No Items Available"}
      </h3>

      <p className="text-zinc-500 dark:text-gray-400 mb-8 max-w-xs mx-auto">
        {isSearch
          ? "We couldn't find any items matching your search. Try checking for typos or use a different keyword."
          : "This category currently has no delicious items. Please check back later!"}
      </p>

      {isSearch && (
        <button
          onClick={onReset}
          className="
              px-6 py-3 bg-brand-primary text-brand-dark font-bold rounded-xl
              hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-primary/20
          "
        >
          Clear Search
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
