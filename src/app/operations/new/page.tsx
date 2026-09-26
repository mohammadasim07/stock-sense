"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { LocationWithChildren, ProductWithStock, PaginatedResponse } from "@/types";

export default function NewOperationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    type: "RECEIPT" as "RECEIPT" | "DELIVERY" | "INTERNAL_TRANSFER",
    sourceLocationId: "",
    destLocationId: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [lines, setLines] = useState<{ productId: string; quantityPlanned: number }[]>([
    { productId: "", quantityPlanned: 1 },
  ]);

  const { data: locationsData } = useQuery<{ data: LocationWithChildren[] }>({
    queryKey: ["locations-flat"],
    queryFn: async () => {
      const res = await fetch("/api/locations?flat=true");
      return res.json();
    },
  });

  const { data: productsData } = useQuery<PaginatedResponse<ProductWithStock>>({
    queryKey: ["products-all"],
    queryFn: async () => {
      const res = await fetch("/api/products?limit=100");
      return res.json();
    },
  });

  const { data: stockSummaryData } = useQuery<{ data: Array<{ productId: string; locationId: string; currentStock: number }> }>({
    queryKey: ["stock-summary"],
    queryFn: async () => {
      const res = await fetch("/api/stock/summary");
      return res.json();
    },
  });

  const locations = locationsData?.data || [];
  const products = productsData?.data || [];

  // Filter locations based on operation type
  const sourceLocations = locations.filter((l) => {
    if (formData.type === "RECEIPT") return l.type === "VENDOR";
    if (formData.type === "DELIVERY") return l.type === "INTERNAL";
    if (formData.type === "INTERNAL_TRANSFER") return l.type === "INTERNAL";
    return true;
  });

  const destLocations = locations.filter((l) => {
    if (formData.type === "RECEIPT") return l.type === "INTERNAL";
    if (formData.type === "DELIVERY") return l.type === "CUSTOMER";
    if (formData.type === "INTERNAL_TRANSFER") return l.type === "INTERNAL";
    return true;
  });

  // Reset locations when type changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, sourceLocationId: "", destLocationId: "" }));
  }, [formData.type]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          lines: lines.filter((l) => l.productId),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create operation");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      router.push("/operations");
    },
  });

  const addLine = () => {
    setLines([...lines, { productId: "", quantityPlanned: 1 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: string, value: string | number) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const typeDetails = {
    RECEIPT: {
      label: "Receipt",
      desc: "Receive stock from vendor into warehouse",
      badgeClass: "bg-blue-50 text-blue-600 border-blue-200",
      activeClass: "border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm",
    },
    DELIVERY: {
      label: "Delivery",
      desc: "Ship stock from warehouse to customer",
      badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-200",
      activeClass: "border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm",
    },
    INTERNAL_TRANSFER: {
      label: "Internal Transfer",
      desc: "Relocate stock between racks or rooms",
      badgeClass: "bg-purple-50 text-purple-600 border-purple-200",
      activeClass: "border-purple-600 bg-purple-50/50 text-purple-900 shadow-sm",
    },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/operations")}
          className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#111827] transition-colors mb-3 cursor-pointer font-semibold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Kanban
        </button>
        <h1 className="text-[32px] font-bold text-[#111827] leading-[1.2] tracking-tight">
          New Operation
        </h1>
        <p className="mt-2 text-[15px] text-[#64748B] leading-normal">
          Plan an inventory movement. Follows strict state machine: Draft → Waiting → Ready → Done
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="space-y-6"
      >
        {/* Operation Type */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4">
            1. Select Operation Type
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {(["RECEIPT", "DELIVERY", "INTERNAL_TRANSFER"] as const).map((type) => {
              const isSelected = formData.type === type;
              const detail = typeDetails[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                    isSelected
                      ? detail.activeClass
                      : "border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <p className="text-sm font-bold text-[#111827] flex items-center justify-between">
                    <span>{detail.label}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </p>
                  <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                    {detail.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Locations with Visual Wayfinding */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4">
            2. Source & Destination Locations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Source */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5 uppercase tracking-wider">
                Source Location *
              </label>
              <select
                required
                value={formData.sourceLocationId}
                onChange={(e) => setFormData({ ...formData, sourceLocationId: e.target.value })}
                className="w-full rounded-xl border border-[#E5E7EB] bg-slate-50 py-2.5 px-3.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Select source location...</option>
                {sourceLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>

              {(() => {
                const loc = locations.find((l) => l.id === formData.sourceLocationId);
                const locImg = loc?.image_data || loc?.photoBase64 || loc?.imageData;
                if (!loc) return null;
                return (
                  <div className="mt-3 flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    {locImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={locImg} alt={loc.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] truncate">{loc.name}</p>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">{loc.address || "Visual Wayfinding Registered"}</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5 uppercase tracking-wider">
                Destination Location *
              </label>
              <select
                required
                value={formData.destLocationId}
                onChange={(e) => setFormData({ ...formData, destLocationId: e.target.value })}
                className="w-full rounded-xl border border-[#E5E7EB] bg-slate-50 py-2.5 px-3.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Select destination location...</option>
                {destLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>

              {(() => {
                const loc = locations.find((l) => l.id === formData.destLocationId);
                const locImg = loc?.image_data || loc?.photoBase64 || loc?.imageData;
                if (!loc) return null;
                return (
                  <div className="mt-3 flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    {locImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={locImg} alt={loc.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111827] truncate">{loc.name}</p>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5">{loc.address || "Visual Wayfinding Registered"}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Schedule & Notes */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5 uppercase tracking-wider">
                Scheduled Date *
              </label>
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full rounded-xl border border-[#E5E7EB] bg-slate-50 py-2.5 px-3.5 text-sm text-[#111827] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111827] mb-1.5 uppercase tracking-wider">
                Notes & Instructions
              </label>
              <input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Handle with care, verify pallet seal..."
                className="w-full rounded-xl border border-[#E5E7EB] bg-slate-50 py-2.5 px-3.5 text-sm text-[#111827] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                3. Line Items & Quantities
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Specify products and target quantities to move</p>
            </div>
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#111827] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Line
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, index) => {
              const prod = products.find((p) => p.id === line.productId);
              const prodImg = prod?.image_data || prod?.imageData;

              return (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  {/* Product Thumbnail */}
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {prodImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={prodImg} alt={prod?.name || "Product"} className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <span className="text-sm">📦</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <select
                      required
                      value={line.productId}
                      onChange={(e) => updateLine(index, "productId", e.target.value)}
                      className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2 px-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="">Select product...</option>
                      {products.map((p) => {
                        const locStock = stockSummaryData?.data?.find(
                          (s) => s.productId === p.id && s.locationId === formData.sourceLocationId
                        )?.currentStock ?? 0;

                        const stockLabel =
                          formData.type === "RECEIPT"
                            ? `Total Stock: ${p.totalStock} ${p.uom}`
                            : formData.sourceLocationId
                            ? `At Source: ${locStock} ${p.uom} (${p.totalStock} total in WH)`
                            : `Stock: ${p.totalStock} ${p.uom}`;

                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — {stockLabel}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="w-28 shrink-0">
                    <input
                      type="number"
                      min={1}
                      required
                      value={line.quantityPlanned}
                      onChange={(e) => updateLine(index, "quantityPlanned", parseInt(e.target.value) || 1)}
                      className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2 px-3 text-sm text-[#111827] text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Qty"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    disabled={lines.length <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 cursor-pointer shrink-0"
                    title="Remove line"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error notification */}
        {createMutation.isError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <strong className="font-bold">Error:</strong> {createMutation.error.message}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/operations")}
            className="flex-1 h-[44px] rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#111827] hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 h-[44px] rounded-xl bg-blue-600 text-xs font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)] hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {createMutation.isPending ? "Creating Operation..." : "Create Operation (Draft)"}
          </button>
        </div>
      </form>
    </div>
  );
}
