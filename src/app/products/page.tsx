"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ProductWithStock, PaginatedResponse, StockMoveWithDetails } from "@/types";
import { CompressedImageUpload } from "@/components/CompressedImageUpload";
import { Barcode } from "@/components/Barcode";
import { getCategoryBadgeClass, formatDateTime } from "@/lib/utils";

const CATEGORIES = ["ALL", "COMPONENTS", "FASTENERS", "SEALS", "ELECTRICAL", "FILTERS"];

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null);
  const [inspectProduct, setInspectProduct] = useState<ProductWithStock | null>(null);

  const initialFormData = {
    name: "",
    sku: "",
    barcode: "",
    category: "COMPONENTS",
    uom: "Units",
    description: "",
    image_data: null as string | null,
  };

  const [formData, setFormData] = useState(initialFormData);

  const { data, isLoading } = useQuery<PaginatedResponse<ProductWithStock>>({
    queryKey: ["products", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/products?${params}`);
      return res.json();
    },
  });

  // Query product ledger moves when inspectProduct is selected
  const { data: movesData } = useQuery<{ data: StockMoveWithDetails[] }>({
    queryKey: ["product-moves", inspectProduct?.id],
    queryFn: async () => {
      if (!inspectProduct) return { data: [] };
      const res = await fetch(`/api/stock/summary?view=moves&limit=50`);
      const allMoves: { data: StockMoveWithDetails[] } = await res.json();
      return {
        data: (allMoves?.data || []).filter((m) => m.product.id === inspectProduct.id),
      };
    },
    enabled: !!inspectProduct,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeModal();
    },
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const openEditModal = (product: ProductWithStock, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      category: product.category,
      uom: product.uom,
      description: product.description || "",
      image_data: product.image_data || product.imageData || null,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialFormData);
  };

  const exportCSV = () => {
    // Export currently filtered products or full catalog
    const items = selectedCategory !== "ALL" ? filteredProducts : (data?.data || []);
    if (items.length === 0) return;

    const headers = ["Name", "SKU", "Barcode", "Category", "Total Stock", "UoM", "Description"];
    const rows = items.map((p) => [
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${(p.sku || "").replace(/"/g, '""')}"`,
      `"${(p.barcode || "").replace(/"/g, '""')}"`,
      `"${(p.category || "").replace(/"/g, '""')}"`,
      p.totalStock ?? 0,
      `"${(p.uom || "").replace(/"/g, '""')}"`,
      `"${(p.description || "").replace(/"/g, '""')}"`,
    ]);

    const csvText = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    // Prepend UTF-8 BOM so Excel and spreadsheet apps display special characters properly
    const blob = new Blob(["\uFEFF" + csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stocksense_catalog_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Filter products by selected category
  const filteredProducts = (data?.data || []).filter((p) => {
    if (selectedCategory === "ALL") return true;
    return p.category.toUpperCase() === selectedCategory;
  });

  return (
    <div className="w-full space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] leading-[1.2] tracking-tight">
            Products
          </h1>
          <p className="mt-2 text-[15px] text-[#64748B] leading-normal">
            Manage your product catalog, visual wayfinding, and stock
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Export CSV Button */}
          <button
            onClick={exportCSV}
            className="h-[42px] flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3.5 py-2 text-xs font-semibold text-[#111827] hover:bg-slate-50 transition-colors shadow-[0_2px_8px_rgba(15,23,42,0.04)] cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Catalog
          </button>

          {/* Add Product Button */}
          <button
            onClick={openCreateModal}
            className="h-[42px] flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.2)] hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* ── Category Filter Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                isSelected
                  ? "bg-[#111827] text-white shadow-2xs"
                  : "bg-white border border-[#E5E7EB] text-[#64748B] hover:text-[#111827] hover:bg-slate-50"
              }`}
            >
              {cat === "ALL" ? "All Products" : cat}
            </button>
          );
        })}
      </div>

      {/* ── Products Grid matching Image 2 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
            ))
          : filteredProducts.map((product) => {
              const productImage = product.image_data || product.imageData;
              const isOutOfStock = product.totalStock <= 0;
              const progressPercent = Math.min(100, Math.max(5, (product.totalStock / 500) * 100));

              return (
                <div
                  key={product.id}
                  onClick={() => setInspectProduct(product)}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Top Row: Product Image + Info + 3-dots */}
                    <div className="flex items-start gap-3.5">
                      {/* Product Thumbnail (Visual Wayfinding) */}
                      <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 p-1">
                        {productImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={productImage}
                            alt={product.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                {product.name}
                              </h3>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getCategoryBadgeClass(
                                  product.category
                                )}`}
                              >
                                {product.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              SKU: {product.sku}
                            </p>
                          </div>

                          {/* 3-dots button */}
                          <button
                            type="button"
                            onClick={(e) => openEditModal(product, e)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Row: Total Stock & Barcode */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-end justify-between gap-3">
                    {/* Total Stock */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Total Stock
                      </p>
                      <p className="text-2xl font-black text-slate-900 mt-0.5">
                        {product.totalStock}
                        <span className="text-xs font-normal text-slate-500 ml-1.5">
                          {product.uom}
                        </span>
                      </p>

                      {/* Out of Stock Alert or Stock Bar */}
                      {isOutOfStock ? (
                        <div className="mt-2 space-y-1.5">
                          <div className="h-1.5 w-full bg-rose-100 rounded-full" />
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-[11px] font-bold text-rose-600">
                            <svg className="w-3 h-3 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>Out of Stock</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Barcode & Edit Button */}
                    <div className="flex items-end gap-2 shrink-0">
                      {product.barcode ? (
                        <div className="flex flex-col items-center">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider self-start mb-0.5">
                            Barcode
                          </p>
                          <Barcode value={product.barcode} />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider self-start mb-0.5">
                            Barcode
                          </p>
                          <Barcode value="4901234567890" />
                        </div>
                      )}

                      <button
                        onClick={(e) => openEditModal(product, e)}
                        className="p-2 rounded-xl bg-blue-50/70 hover:bg-blue-100 text-blue-600 border border-blue-100 transition-colors cursor-pointer mb-1 shadow-2xs"
                        title="Edit product"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* ── Product Stock Ledger Drawer (Detail Inspection) ── */}
      {inspectProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-lg h-full bg-white shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getCategoryBadgeClass(inspectProduct.category)}`}>
                    {inspectProduct.category}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {inspectProduct.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">SKU: {inspectProduct.sku}</p>
                </div>
                <button
                  onClick={() => setInspectProduct(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Product Visual Wayfinding & Stock Summary */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 overflow-hidden shrink-0">
                  {inspectProduct.image_data || inspectProduct.imageData ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={inspectProduct.image_data || inspectProduct.imageData || ""} alt={inspectProduct.name} className="w-full h-full object-contain" />
                  ) : (
                    <span>📦</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Dynamic Ledger Stock</p>
                  <p className="text-2xl font-black text-slate-900">
                    {inspectProduct.totalStock} <span className="text-sm font-normal text-slate-500">{inspectProduct.uom}</span>
                  </p>
                  {inspectProduct.barcode && (
                    <p className="text-xs font-mono text-slate-500 mt-0.5">Barcode: {inspectProduct.barcode}</p>
                  )}
                </div>
              </div>

              {/* Double-Entry Ledger Movement History */}
              <div>
                <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">
                  Double-Entry Ledger Movements ({movesData?.data?.length || 0})
                </h3>

                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {movesData?.data && movesData.data.length > 0 ? (
                    movesData.data.map((move) => (
                      <div
                        key={move.id}
                        className="p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors flex items-center justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800">
                            {move.fromLocation.name} → {move.toLocation.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatDateTime(move.movedAt)}
                          </p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                          +{move.quantity} {inspectProduct.uom}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No ledger moves recorded for this product yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Close Drawer Button */}
            <div className="pt-4 border-t border-slate-100 mt-6">
              <button
                onClick={() => setInspectProduct(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 sm:p-8 my-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate(formData);
              }}
              className="space-y-4"
            >
              {/* Product Photo Uploader with Compression */}
              <CompressedImageUpload
                label="Product Photo (Visual Wayfinding)"
                helperText="Auto-compressed to WebP (max 800px, ~150KB) for instant loading"
                value={formData.image_data}
                onChange={(base64) => setFormData((prev) => ({ ...prev, image_data: base64 }))}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Steel Widget"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                    placeholder="e.g. WDG-001"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
                    placeholder="e.g. 4901234567890"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="COMPONENTS">COMPONENTS</option>
                    <option value="FASTENERS">FASTENERS</option>
                    <option value="SEALS">SEALS</option>
                    <option value="ELECTRICAL">ELECTRICAL</option>
                    <option value="FILTERS">FILTERS</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Unit of Measure (UoM)
                </label>
                <input
                  type="text"
                  value={formData.uom}
                  onChange={(e) => setFormData((prev) => ({ ...prev, uom: e.target.value }))}
                  placeholder="e.g. Units, Meters, Kg"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Product specs, notes, or storage conditions..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saveMutation.isPending ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
