"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { LocationWithChildren } from "@/types";
import { getLocationTypeClass } from "@/lib/utils";
import { CompressedImageUpload } from "@/components/CompressedImageUpload";

export default function LocationsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationWithChildren | null>(null);

  const initialFormData = {
    name: "",
    type: "INTERNAL" as "VENDOR" | "INTERNAL" | "CUSTOMER" | "VIRTUAL",
    address: "",
    image_data: null as string | null,
    parentId: null as string | null,
  };

  const [formData, setFormData] = useState(initialFormData);

  const { data, isLoading } = useQuery<{ data: LocationWithChildren[] }>({
    queryKey: ["locations"],
    queryFn: async () => {
      const res = await fetch("/api/locations?flat=true");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = editingLocation ? `/api/locations/${editingLocation.id}` : "/api/locations";
      const method = editingLocation ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save location");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      closeModal();
    },
  });

  const openCreateModal = () => {
    setEditingLocation(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const openEditModal = (location: LocationWithChildren) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      type: location.type,
      address: location.address || "",
      image_data: location.image_data || location.photoBase64 || location.imageData || null,
      parentId: location.parentId || null,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLocation(null);
    setFormData(initialFormData);
  };

  const getLocationIcon = (type: string, name: string) => {
    if (name.includes("Acme")) {
      return (
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      );
    }
    if (name.includes("Global")) {
      return (
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
    if (type === "VIRTUAL" || name.includes("Loss")) {
      return (
        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      );
    }
    if (type === "CUSTOMER" || name.includes("Customer")) {
      return (
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      );
    }
    if (name.includes("Shelf")) {
      return (
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16M6 6v12M18 6v12" />
          </svg>
        </div>
      );
    }
    // Warehouse Alpha / Beta
    return (
      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
    );
  };

  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inspectingLocation, setInspectingLocation] = useState<LocationWithChildren | null>(null);

  // Fetch stock summary for real-time location breakdown
  const { data: stockData } = useQuery<{ data: { productId: string; productName: string; sku: string; locationId: string; locationName: string; locationType: string; currentStock: number }[] }>({
    queryKey: ["stock-summary"],
    queryFn: async () => {
      const res = await fetch("/api/stock/summary");
      return res.json();
    },
  });

  const stockItems = stockData?.data || [];

  // Helper to get total stock units at a given location
  const getLocationStockCount = (locId: string) => {
    return stockItems
      .filter((item) => item.locationId === locId)
      .reduce((sum, item) => sum + item.currentStock, 0);
  };

  // Helper to get products stored at a given location
  const getProductsAtLocation = (locId: string) => {
    return stockItems.filter((item) => item.locationId === locId && item.currentStock > 0);
  };

  const filteredLocations = (data?.data || []).filter((loc) => {
    const matchesType = selectedType === "ALL" || loc.type === selectedType;
    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.address && loc.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const typeCounts = {
    ALL: data?.data?.length || 0,
    INTERNAL: (data?.data || []).filter((l) => l.type === "INTERNAL").length,
    VENDOR: (data?.data || []).filter((l) => l.type === "VENDOR").length,
    CUSTOMER: (data?.data || []).filter((l) => l.type === "CUSTOMER").length,
    VIRTUAL: (data?.data || []).filter((l) => l.type === "VIRTUAL").length,
  };

  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] leading-[1.2] tracking-tight">
            Locations
          </h1>
          <p className="mt-2 text-[15px] text-[#64748B] leading-normal">
            Vendor, warehouse, customer, and virtual locations with wayfinding photos & live ledger stock
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="h-[42px] flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.2)] hover:bg-blue-700 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Location
        </button>
      </div>

      {/* Filter Bar: Type Filter Pills & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "ALL", label: "All Locations", count: typeCounts.ALL },
            { id: "INTERNAL", label: "Internal", count: typeCounts.INTERNAL },
            { id: "VENDOR", label: "Vendors", count: typeCounts.VENDOR },
            { id: "CUSTOMER", label: "Customers", count: typeCounts.CUSTOMER },
            { id: "VIRTUAL", label: "Virtual / Scrap", count: typeCounts.VIRTUAL },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedType === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedType === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[38px] pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Locations Grid matching Image 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 bg-slate-200 animate-pulse rounded-2xl" />
            ))
          : filteredLocations.map((location) => {
              const locationImage =
                location.image_data || location.photoBase64 || location.imageData;
              const stockCount = getLocationStockCount(location.id);
              const storedProducts = getProductsAtLocation(location.id);

              return (
                <div
                  key={location.id}
                  onClick={() => setInspectingLocation(location)}
                  className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Top Row: Icon + Name + Badge + 3-dots */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Custom Icon or Uploaded Wayfinding Image */}
                        {locationImage && !locationImage.includes("data:image/svg+xml") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={locationImage}
                            alt={location.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          getLocationIcon(location.type, location.name)
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {location.name}
                            </h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getLocationTypeClass(
                                location.type
                              )}`}
                            >
                              {location.type}
                            </span>
                          </div>

                          {/* Live Stock Units Badge for Internal Locations */}
                          {location.type === "INTERNAL" && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs">
                              <span className="font-semibold text-slate-700">
                                {stockCount}{" "}
                                <span className="font-normal text-slate-400">units in stock</span>
                              </span>
                              {storedProducts.length > 0 && (
                                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-medium">
                                  {storedProducts.length} items
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* View Inventory action button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectingLocation(location);
                        }}
                        className="text-slate-400 hover:text-blue-600 p-1 rounded-md shrink-0 transition-colors"
                        title="View Location Inventory"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>

                    {/* Address with Map Pin icon */}
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                      <svg
                        className="w-3.5 h-3.5 text-slate-400 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="truncate">
                        {location.address || "Visual Wayfinding Registered"}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Green Wayfinding Dot + Edit Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>Visual wayfinding active</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(location);
                      }}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                      title="Edit location"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Location Stock Breakdown Drawer */}
      {inspectingLocation && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-slide-left border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
              <div className="flex items-center gap-3.5">
                {inspectingLocation.image_data && !inspectingLocation.image_data.includes("data:image/svg+xml") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inspectingLocation.image_data}
                    alt={inspectingLocation.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
                  />
                ) : (
                  getLocationIcon(inspectingLocation.type, inspectingLocation.name)
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">
                      {inspectingLocation.name}
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getLocationTypeClass(
                        inspectingLocation.type
                      )}`}
                    >
                      {inspectingLocation.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {inspectingLocation.address || "Wayfinding Zone Active"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectingLocation(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer Body: Stock Breakdown */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500">Current Stock</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {getLocationStockCount(inspectingLocation.id)}
                    <span className="text-xs font-normal text-slate-400 ml-1">units</span>
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500">Unique SKUs</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {getProductsAtLocation(inspectingLocation.id).length}
                    <span className="text-xs font-normal text-slate-400 ml-1">products</span>
                  </p>
                </div>
              </div>

              {/* Stored Products List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Products in Location (Double-Entry Ledger)
                </h3>
                {getProductsAtLocation(inspectingLocation.id).length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                    <p className="text-sm font-semibold">No stock stored here currently</p>
                    <p className="text-xs mt-1">Items move here when operations transition to Done.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {getProductsAtLocation(inspectingLocation.id).map((item) => (
                      <div
                        key={item.productId}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0 text-xs">
                            {item.sku.split("-")[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {item.productName}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">
                              SKU: {item.sku}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-slate-900">
                            {item.currentStock}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">units</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Wayfinding Photo Card */}
              {inspectingLocation.image_data && (
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                  <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Wayfinding Reference</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      Verified Photo
                    </span>
                  </div>
                  <div className="p-3 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={inspectingLocation.image_data}
                      alt={inspectingLocation.name}
                      className="max-h-48 rounded-lg object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
              <button
                onClick={() => {
                  const loc = inspectingLocation;
                  setInspectingLocation(null);
                  openEditModal(loc);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white transition-colors cursor-pointer text-center"
              >
                Edit Location
              </button>
              <a
                href={`/operations/new?source=${inspectingLocation.id}`}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer text-center"
              >
                New Transfer
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 sm:p-8 my-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingLocation ? "Edit Location" : "Add New Location"}
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
              {/* Photo Upload with CompressedImageUpload */}
              <CompressedImageUpload
                label="Location Rack / Zone Photo"
                helperText="Auto-compressed to WebP (max 800px, ~150KB) for fast warehouse lookup"
                value={formData.image_data}
                onChange={(base64) => setFormData((prev) => ({ ...prev, image_data: base64 }))}
              />

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Shelf A-1 or Warehouse Gamma"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Location Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value as "VENDOR" | "INTERNAL" | "CUSTOMER" | "VIRTUAL",
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="INTERNAL">INTERNAL (Warehouse, Shelf, Rack)</option>
                  <option value="VENDOR">VENDOR (Supplier source)</option>
                  <option value="CUSTOMER">CUSTOMER (Client destination)</option>
                  <option value="VIRTUAL">VIRTUAL (Inventory Loss, Scrap, Audit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Address / Wayfinding Details
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. Building A, Row 1, Tier 2"
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
                  {saveMutation.isPending ? "Saving..." : editingLocation ? "Update Location" : "Create Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
