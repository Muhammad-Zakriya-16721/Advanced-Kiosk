import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Link,
  Image as ImageIcon,
  Check,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadImage } from "@/lib/storage";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  className?: string;
}

export default function ImageUploader({
  value,
  onChange,
  className = "",
}: ImageUploaderProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // URL Input State
  const [urlInput, setUrlInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    // Determine if we can upload
    // For now, try uploading to 'products' bucket
    const publicUrl = await uploadImage(file);

    if (publicUrl) {
      onChange(publicUrl);
      setIsPickerOpen(false);
    } else {
      // If upload fails (e.g. no bucket), maybe fallback or alert?
      // For this demo, we might just assume it works or alert.
      alert(
        "Failed to upload image. Please check Supabase storage configuration.",
      );
    }
    setIsLoading(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput) {
      onChange(urlInput);
      setIsPickerOpen(false);
      setUrlInput("");
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">
        Image
      </label>

      {/* Main Image Preview Area */}
      <div
        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group ${
          isDragOver
            ? "border-brand-primary bg-brand-primary/10"
            : "border-white/10 bg-zinc-900"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => setIsPickerOpen(true)}
      >
        {value ? (
          <img
            src={value}
            alt="Product"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <Upload size={32} className="mb-2" />
            <span className="text-xs font-bold uppercase">Upload</span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <p className="text-white text-xs font-bold uppercase flex items-center gap-2">
            <EditIcon size={14} /> Change
          </p>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-brand-primary" />
          </div>
        )}
      </div>

      {/* Popover / Modal for Selection */}
      <AnimatePresence>
        {isPickerOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[60] bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                setIsPickerOpen(false);
              }}
            />

            {/* Popover Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute top-full left-0 mt-2 w-72 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-4 z-[70]"
            >
              <h3 className="text-sm font-bold text-white mb-3">
                Select Image
              </h3>

              <div className="space-y-3">
                {/* Option 1: Upload */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors border border-white/5 hover:border-white/10"
                >
                  <div className="bg-brand-primary/10 p-2 rounded-lg text-brand-primary">
                    <Upload size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Upload File</p>
                    <p className="text-[10px] text-zinc-500">
                      From your computer
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />

                <div className="flex w-full items-center gap-2">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="text-[10px] text-zinc-600 font-bold uppercase">
                    OR
                  </span>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>

                {/* Option 2: URL */}
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 block">
                    Paste URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary"
                    />
                    <button
                      onClick={handleUrlSubmit}
                      className="bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-brand-dark p-2 rounded-lg transition-colors"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Close Button Absolute */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPickerOpen(false);
                }}
                className="absolute top-3 right-3 text-zinc-500 hover:text-white"
              >
                <X size={14} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditIcon({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
