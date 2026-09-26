"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ProductWithStock, LocationWithChildren, OperationWithDetails } from "@/types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Listen for Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Toggle if already handled
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch searchable entities
  const { data: products } = useQuery<{ data: ProductWithStock[] }>({
    queryKey: ["command-products"],
    queryFn: async () => {
      const res = await fetch("/api/products?limit=50");
      return res.json();
    },
    enabled: isOpen,
  });

  const { data: locations } = useQuery<{ data: LocationWithChildren[] }>({
    queryKey: ["command-locations"],
    queryFn: async () => {
      const res = await fetch("/api/locations?flat=true");
      return res.json();
    },
    enabled: isOpen,
  });

  const { data: operations } = useQuery<{ data: OperationWithDetails[] }>({
    queryKey: ["command-operations"],
    queryFn: async () => {
      const res = await fetch("/api/operations?limit=50");
      return res.json();
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredProducts = (products?.data || []).filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q)) ||
      p.category.toLowerCase().includes(q)
  );

  const filteredLocations = (locations?.data || []).filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.type.toLowerCase().includes(q) ||
      (l.address && l.address.toLowerCase().includes(q))
  );

  const filteredOperations = (operations?.data || []).filter(
    (op) =>
      op.reference.toLowerCase().includes(q) ||
      op.type.toLowerCase().includes(q) ||
      op.state.toLowerCase().includes(q) ||
      op.sourceLocation.name.toLowerCase().includes(q) ||
      op.destLocation.name.toLowerCase().includes(q)
  );

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
          <svg className="w-5 h-5 text-slate-400 shrink-0 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a product, SKU, barcode, location, or operation reference..."
            className="flex-1 bg-transparent text-sm text-[#111827] placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-[11px] font-semibold text-slate-400 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[420px] overflow-y-auto p-3 space-y-4">
          {/* Quick Navigation Shortcuts */}
          {!query && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                Quick Navigation
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-1">
                {[
                  { name: "Dashboard", url: "/dashboard", icon: "📊" },
                  { name: "Products Catalog", url: "/products", icon: "📦" },
                  { name: "Locations Map", url: "/locations", icon: "📍" },
                  { name: "Kanban Board", url: "/operations", icon: "🔄" },
                ].map((item) => (
                  <button
                    key={item.url}
                    onClick={() => handleSelect(item.url)}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-200 transition-colors text-left cursor-pointer"
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="text-xs font-bold text-[#111827]">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Results */}
          {filteredProducts.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                Products ({filteredProducts.length})
              </p>
              <div className="space-y-1">
                {filteredProducts.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect("/products")}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.image_data || p.imageData ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_data || p.imageData || ""} alt={p.name} className="w-full h-full object-contain" />
                        ) : (
                          <span>📦</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#111827] group-hover:text-blue-600 truncate">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {p.sku} {p.barcode ? `• ${p.barcode}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                      {p.totalStock} {p.uom}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Locations Results */}
          {filteredLocations.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                Locations ({filteredLocations.length})
              </p>
              <div className="space-y-1">
                {filteredLocations.slice(0, 5).map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleSelect("/locations")}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#111827] group-hover:text-blue-600 truncate">
                          {loc.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{loc.address || "Wayfinding point"}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                      {loc.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Operations Results */}
          {filteredOperations.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                Operations ({filteredOperations.length})
              </p>
              <div className="space-y-1">
                {filteredOperations.slice(0, 5).map((op) => (
                  <button
                    key={op.id}
                    onClick={() => handleSelect(`/operations/${op.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        #
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#111827] group-hover:text-blue-600 truncate">
                          {op.reference}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {op.sourceLocation.name} → {op.destLocation.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {op.type}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 uppercase">
                        {op.state}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty Search Result */}
          {query &&
            filteredProducts.length === 0 &&
            filteredLocations.length === 0 &&
            filteredOperations.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">
                No products, locations, or operations matching &quot;{query}&quot;
              </div>
            )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Search StockSense Catalog & Ledger</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
