"use client";

import React, { useState, useRef, ChangeEvent, DragEvent } from "react";
import imageCompression from "browser-image-compression";

export interface CompressionStats {
  originalSizeKB: number;
  compressedSizeKB: number;
  reductionPercent: number;
}

export interface CompressedImageUploadProps {
  value?: string | null;
  onChange?: (base64: string | null) => void;
  onImageChange?: (base64: string | null) => void;
  label?: string;
  helperText?: string;
  className?: string;
  disabled?: boolean;
  maxWidthOrHeight?: number;
  initialQuality?: number;
  maxSizeMB?: number;
  fileType?: string;
}

export function CompressedImageUpload({
  value,
  onChange,
  onImageChange,
  label = "Upload Image",
  helperText = "Auto-compressed to WebP (max 800px, ~150KB)",
  className = "",
  disabled = false,
  maxWidthOrHeight = 800,
  initialQuality = 0.7,
  maxSizeMB = 0.15, // ~150KB
  fileType = "image/webp",
}: CompressedImageUploadProps) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [stats, setStats] = useState<CompressionStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notifyChange = (base64: string | null) => {
    if (onChange) onChange(base64);
    if (onImageChange) onImageChange(base64);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WebP, etc.)");
      return;
    }

    setError(null);
    setIsCompressing(true);

    const originalSizeKB = Math.round(file.size / 1024);

    try {
      const options = {
        maxSizeMB, // ~150KB target
        maxWidthOrHeight, // 800px max width/height
        initialQuality, // 0.7 quality
        fileType, // image/webp
        useWebWorker: true,
      };

      // Perform client-side compression
      const compressedBlob = await imageCompression(file, options);
      const compressedSizeKB = Math.round(compressedBlob.size / 1024);
      const reduction = Math.max(
        0,
        Math.round(((file.size - compressedBlob.size) / file.size) * 100)
      );

      // Convert compressed WebP to Base64 data URL
      const base64 = await imageCompression.getDataUrlFromFile(compressedBlob);

      setStats({
        originalSizeKB,
        compressedSizeKB,
        reductionPercent: reduction,
      });

      notifyChange(base64);
    } catch (err: unknown) {
      console.error("Compression error:", err);
      setError(
        err instanceof Error
          ? `Compression failed: ${err.message}`
          : "Failed to compress image. Please try again."
      );
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStats(null);
    setError(null);
    notifyChange(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
            {label}
          </label>
          {stats && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white border border-white/20">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Optimized {stats.reductionPercent}% ({stats.originalSizeKB}KB → {stats.compressedSizeKB}KB WebP)
            </span>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled || isCompressing}
        className="hidden"
        id="compressed-image-input"
      />

      {/* Uploader Box / Preview */}
      {value ? (
        <div className="relative group overflow-hidden rounded-2xl border border-white/15 bg-black p-2 transition-all hover:border-white/40">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-950 flex items-center justify-center border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded preview"
              className="h-full w-full object-contain"
            />

            {/* Overlay Actions on Hover */}
            <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isCompressing}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Change Photo
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isCompressing}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remove
              </button>
            </div>
          </div>

          {/* Quick status bar below preview */}
          <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-white/50">
            <span className="flex items-center gap-1.5 text-white/80 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block animate-pulse" />
              Compressed WebP Ready
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-white hover:text-neutral-300 underline font-semibold cursor-pointer"
            >
              Replace
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !isCompressing && fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            dragActive
              ? "border-white bg-white/10 scale-[1.01]"
              : "border-white/15 bg-white/[0.02] hover:border-white/40 hover:bg-white/[0.05]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isCompressing ? (
            <div className="py-4 flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <svg className="w-8 h-8 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Compressing Image...</p>
                <p className="text-xs text-white/40 mt-0.5">Optimizing to WebP format (~150KB)</p>
              </div>
            </div>
          ) : (
            <div className="py-2 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-3 shadow-inner">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-white/80">
                <span className="text-white font-bold underline underline-offset-2">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-white/40 mt-1">
                {helperText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl border border-white/20 bg-neutral-900 text-xs text-white">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default CompressedImageUpload;
