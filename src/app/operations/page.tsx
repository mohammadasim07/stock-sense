"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import type { OperationWithDetails, PaginatedResponse } from "@/types";
import {
  getTypeBadgeClass,
  formatDate,
  formatOperationType,
} from "@/lib/utils";

interface KanbanColDef {
  key: string;
  label: string;
  headerBg: string;
  textColor: string;
  badgeBg: string;
  icon: React.ReactNode;
  emptyIcon: React.ReactNode;
  emptySubtitle: string;
}

const KANBAN_COLUMNS: KanbanColDef[] = [
  {
    key: "DRAFT",
    label: "Draft",
    headerBg: "bg-slate-100",
    textColor: "text-slate-800",
    badgeBg: "bg-slate-200 text-slate-700",
    icon: (
      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    emptyIcon: (
      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    emptySubtitle: "Operations in draft state will appear here.",
  },
  {
    key: "WAITING",
    label: "Waiting",
    headerBg: "bg-amber-100/70",
    textColor: "text-amber-900",
    badgeBg: "bg-amber-200 text-amber-800",
    icon: (
      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    emptyIcon: (
      <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-500 shadow-2xs">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    emptySubtitle: "Operations waiting for availability check will appear here.",
  },
  {
    key: "READY",
    label: "Ready",
    headerBg: "bg-emerald-100/70",
    textColor: "text-emerald-900",
    badgeBg: "bg-emerald-200 text-emerald-800",
    icon: (
      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    emptyIcon: (
      <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-500 shadow-2xs">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    emptySubtitle: "Operations ready for validation will appear here.",
  },
  {
    key: "DONE",
    label: "Done",
    headerBg: "bg-purple-100/70",
    textColor: "text-purple-900",
    badgeBg: "bg-purple-200 text-purple-800",
    icon: (
      <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center">
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    emptyIcon: (
      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    emptySubtitle: "Completed operations will appear here.",
  },
];

export default function OperationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("");
  const [transitioning, setTransitioning] = useState<string | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<OperationWithDetails>>({
    queryKey: ["operations", filter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (filter) params.set("type", filter);
      const res = await fetch(`/api/operations?${params}`);
      return res.json();
    },
  });

  const transitionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      setTransitioning(id);
      const res = await fetch(`/api/operations/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (!result.success) {
        const detail = result.errors && result.errors.length > 0 ? `: ${result.errors.join("; ")}` : "";
        throw new Error(`${result.message || "Transition failed"}${detail}`);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      queryClient.invalidateQueries({ queryKey: ["stock-summary"] });
      queryClient.invalidateQueries({ queryKey: ["recent-moves"] });
      setTransitioning(null);
    },
    onError: () => {
      setTransitioning(null);
    },
  });

  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const allOperations = data?.data || [];
  const operations = allOperations.filter((op) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      op.reference.toLowerCase().includes(query) ||
      op.sourceLocation.name.toLowerCase().includes(query) ||
      op.destLocation.name.toLowerCase().includes(query) ||
      (op.notes && op.notes.toLowerCase().includes(query))
    );
  });

  const getNextAction = (state: string) => {
    switch (state) {
      case "DRAFT":
        return {
          action: "confirm",
          label: "Confirm",
          btnClass: "bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs",
        };
      case "WAITING":
        return {
          action: "check_availability",
          label: "Check Availability",
          btnClass: "bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs",
        };
      case "READY":
        return {
          action: "validate",
          label: "Validate ✓",
          btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs",
        };
      default:
        return null;
    }
  };

  const counts = {
    all: allOperations.length,
    receipts: allOperations.filter((o) => o.type === "RECEIPT").length,
    transfers: allOperations.filter((o) => o.type === "INTERNAL_TRANSFER").length,
    deliveries: allOperations.filter((o) => o.type === "DELIVERY").length,
  };

  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] leading-[1.2] tracking-tight">
            Operations
          </h1>
          <p className="mt-2 text-[15px] text-[#64748B] leading-normal">
            Manage receipts, transfers, and deliveries with visual wayfinding and double-entry validation
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Kanban / Table View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white text-blue-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Kanban Board View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-blue-600 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Table List View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>List</span>
            </button>
          </div>

          <Link
            href="/operations/new"
            className="h-[42px] flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_2px_8px_rgba(37,99,235,0.2)] hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Operation
          </Link>
        </div>
      </div>

      {/* Filter Bar: Operation Types & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "", label: "All Operations", count: counts.all },
            { id: "RECEIPT", label: "Receipts", count: counts.receipts },
            { id: "INTERNAL_TRANSFER", label: "Transfers", count: counts.transfers },
            { id: "DELIVERY", label: "Deliveries", count: counts.deliveries },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                filter === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filter === tab.id
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
            placeholder="Search by reference, route..."
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

      {/* Error notification */}
      {transitionMutation.isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between">
          <span>
            <strong className="font-bold">Error:</strong> {transitionMutation.error.message}
          </span>
          <button
            onClick={() => transitionMutation.reset()}
            className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Table View (Odoo-Style List) */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Source $\to$ Destination</th>
                  <th className="py-3.5 px-4">Scheduled Date</th>
                  <th className="py-3.5 px-4 text-center">Items</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {operations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No operations match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  operations.map((op) => {
                    const nextAction = getNextAction(op.state);
                    return (
                      <tr key={op.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/operations/${op.id}`}
                            className="font-bold text-blue-600 hover:underline"
                          >
                            {op.reference}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getTypeBadgeClass(
                              op.type
                            )}`}
                          >
                            {formatOperationType(op.type)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{op.sourceLocation.name}</span>
                            <span className="text-slate-400">$\to$</span>
                            <span className="font-semibold text-slate-900">{op.destLocation.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {formatDate(op.scheduledDate)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs font-semibold">
                            {op.lines.length} lines
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              op.state === "DONE"
                                ? "bg-purple-100 text-purple-700"
                                : op.state === "READY"
                                ? "bg-emerald-100 text-emerald-700"
                                : op.state === "WAITING"
                                ? "bg-amber-100 text-amber-700"
                                : op.state === "CANCELLED"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {op.state}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {nextAction && (
                              <button
                                onClick={() =>
                                  transitionMutation.mutate({ id: op.id, action: nextAction.action })
                                }
                                disabled={transitioning === op.id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${nextAction.btnClass}`}
                              >
                                {transitioning === op.id ? "Processing..." : nextAction.label}
                              </button>
                            )}
                            <Link
                              href={`/operations/${op.id}`}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kanban Board matching Image 4 */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 min-w-0">
        {KANBAN_COLUMNS.map((column) => {
          const columnOps = operations.filter((op) => op.state === column.key);
          const isEmpty = !isLoading && columnOps.length === 0;

          return (
            <div
              key={column.key}
              className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 min-w-0 flex flex-col justify-start"
            >
              {/* Column Header */}
              <div
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl mb-3.5 ${column.headerBg}`}
              >
                <div className="flex items-center gap-2">
                  {column.icon}
                  <h3 className={`text-sm font-bold tracking-wide ${column.textColor}`}>
                    {column.label}
                  </h3>
                </div>
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${column.badgeBg}`}
                >
                  {columnOps.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1 min-w-0">
                {isLoading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-44 bg-slate-200 animate-pulse rounded-xl" />
                  ))
                ) : columnOps.length > 0 ? (
                  columnOps.map((op) => {
                    const nextAction = getNextAction(op.state);
                    const isDone = op.state === "DONE";

                    return (
                      <div
                        key={op.id}
                        className="rounded-2xl border border-slate-100 bg-white p-4 hover:shadow-md transition-shadow group shadow-2xs min-w-0 overflow-hidden flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Header: Reference + Type Badge + 3-dots */}
                          <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
                            <Link
                              href={`/operations/${op.id}`}
                              className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors truncate min-w-0"
                            >
                              {op.reference}
                            </Link>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getTypeBadgeClass(
                                  op.type
                                )}`}
                              >
                                {formatOperationType(op.type)}
                              </span>

                              <button
                                type="button"
                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Route with Location Thumbnails & Roles */}
                          <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 mb-3 space-y-2 min-w-0">
                            {/* Source Location */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                                  {op.sourceLocation.name}
                                </p>
                                <p className="text-[10px] text-slate-400 leading-tight">
                                  From ({op.sourceLocation.type === "VENDOR" ? "Vendor" : op.sourceLocation.type === "INTERNAL" ? "Warehouse" : "Location"})
                                </p>
                              </div>
                            </div>

                            {/* Destination Location */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                                  {op.destLocation.name}
                                </p>
                                <p className="text-[10px] text-slate-400 leading-tight">
                                  To ({op.destLocation.type === "CUSTOMER" ? "Customer" : op.destLocation.type === "INTERNAL" ? "Warehouse" : "Location"})
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Line Items Preview with Thumbnails */}
                          <div className="mb-3 space-y-1.5 min-w-0">
                            {op.lines.slice(0, 2).map((line) => {
                              const pImage = line.product.image_data || line.product.imageData;
                              return (
                                <div
                                  key={line.id}
                                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg border border-slate-100 bg-white min-w-0"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                      {pImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={pImage}
                                          alt={line.product.name}
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <span className="text-[10px]">📦</span>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                                        {line.product.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-mono leading-tight">
                                        {line.product.sku}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-slate-700 shrink-0">
                                    ×{line.quantityPlanned}
                                  </span>
                                </div>
                              );
                            })}

                            {op.lines.length > 2 && (
                              <p className="text-[11px] text-blue-600 font-semibold text-right pt-0.5">
                                +{op.lines.length - 2} more items
                              </p>
                            )}
                          </div>

                          {/* Summary Row */}
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 px-0.5">
                            <span>{op.lines.length} total items</span>
                            <span>{formatDate(op.scheduledDate)}</span>
                          </div>
                        </div>

                        {/* Action buttons (Confirm / Cancel) */}
                        {!isDone && (
                          <div className="space-y-2 mt-1">
                            {nextAction && (
                              <button
                                onClick={() =>
                                  transitionMutation.mutate({ id: op.id, action: nextAction.action })
                                }
                                disabled={transitioning === op.id}
                                className={`w-full rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer ${nextAction.btnClass}`}
                              >
                                {transitioning === op.id ? (
                                  <span className="flex items-center justify-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Processing...
                                  </span>
                                ) : (
                                  nextAction.label
                                )}
                              </button>
                            )}

                            {op.state !== "CANCELLED" && (
                              <button
                                onClick={() =>
                                  transitionMutation.mutate({ id: op.id, action: "cancel" })
                                }
                                className="w-full rounded-xl border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : null}

                {/* Illustrated Empty State matching Image 4 */}
                {isEmpty && (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="mb-3">{column.emptyIcon}</div>
                    <p className="text-sm font-bold text-slate-800">No operations</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[200px]">
                      {column.emptySubtitle}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
