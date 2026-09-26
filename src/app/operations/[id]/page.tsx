"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import type { OperationWithDetails, TransitionResult } from "@/types";
import {
  getStateBadgeClass,
  getTypeBadgeClass,
  formatDate,
  formatDateTime,
  formatOperationType,
} from "@/lib/utils";

export default function OperationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const { data: operation, isLoading } = useQuery<OperationWithDetails>({
    queryKey: ["operation", id],
    queryFn: async () => {
      const res = await fetch(`/api/operations/${id}`);
      if (!res.ok) throw new Error("Operation not found");
      return res.json();
    },
  });

  const transitionMutation = useMutation({
    mutationFn: async (action: string) => {
      const res = await fetch(`/api/operations/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result: TransitionResult = await res.json();
      if (!result.success) {
        const detail = result.errors && result.errors.length > 0 ? `: ${result.errors.join("; ")}` : "";
        throw new Error(`${result.message || "Transition failed"}${detail}`);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operation", id] });
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      queryClient.invalidateQueries({ queryKey: ["stock-summary"] });
      queryClient.invalidateQueries({ queryKey: ["recent-moves"] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-10 w-48 bg-slate-200 animate-pulse rounded-xl" />
        <div className="h-44 bg-slate-200 animate-pulse rounded-2xl" />
        <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!operation) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-base font-semibold text-slate-700">Operation not found</p>
        <button
          onClick={() => router.push("/operations")}
          className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
        >
          Back to Operations
        </button>
      </div>
    );
  }

  const getNextAction = () => {
    switch (operation.state) {
      case "DRAFT":
        return {
          action: "confirm",
          label: "Confirm Operation",
          btnClass: "bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm",
          desc: "Lock quantities and move to Waiting state",
        };
      case "WAITING":
        return {
          action: "check_availability",
          label: "Check Availability",
          btnClass: "bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm",
          desc: "Verify sufficient stock at source location",
        };
      case "READY":
        return {
          action: "validate",
          label: "Validate & Commit Ledger ✓",
          btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md",
          desc: "ACID Transaction: commit permanent STOCK_MOVE entries",
        };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();
  const states = ["DRAFT", "WAITING", "READY", "DONE"];
  const stateIndex = states.indexOf(operation.state);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div>
        <button
          onClick={() => router.push("/operations")}
          className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#111827] transition-colors mb-3 cursor-pointer font-semibold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Operations
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[32px] font-bold text-[#111827] leading-[1.2] tracking-tight">
              {operation.reference}
            </h1>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${getTypeBadgeClass(operation.type)}`}>
              {formatOperationType(operation.type)}
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${getStateBadgeClass(operation.state)}`}>
              {operation.state}
            </span>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#111827] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Packing Slip
          </button>
        </div>
      </div>

      {/* ── Odoo-Style State Progress Ribbon ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {["Draft", "Waiting", "Ready", "Done"].map((state, i) => {
            const isCompleted = stateIndex > i;
            const isCurrent = stateIndex === i;

            return (
              <div key={state} className="flex items-center gap-2 flex-1 min-w-[120px]">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all shrink-0 ${
                    isCompleted
                      ? "bg-emerald-600 text-white shadow-sm"
                      : isCurrent
                      ? "bg-blue-600 text-white shadow-sm ring-4 ring-blue-100"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? "✓" : i + 1}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold truncate ${isCurrent ? "text-blue-600" : isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                    {state}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {i === 0 ? "Initial" : i === 1 ? "Check Stock" : i === 2 ? "Ready to Move" : "Committed"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── State Transition Action Bar ── */}
      {(nextAction || (operation.state !== "DONE" && operation.state !== "CANCELLED")) && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          {transitionMutation.isError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
              <strong className="font-bold">Error:</strong> {transitionMutation.error.message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {nextAction && (
              <button
                onClick={() => transitionMutation.mutate(nextAction.action)}
                disabled={transitionMutation.isPending}
                className={`flex-1 rounded-xl py-3 px-5 text-sm font-bold transition-colors cursor-pointer ${nextAction.btnClass}`}
              >
                {transitionMutation.isPending ? "Processing Transition..." : nextAction.label}
                <span className="block text-[11px] font-normal opacity-80 mt-0.5">
                  {nextAction.desc}
                </span>
              </button>
            )}

            {operation.state !== "DONE" && operation.state !== "CANCELLED" && (
              <button
                onClick={() => transitionMutation.mutate("cancel")}
                disabled={transitionMutation.isPending}
                className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                Cancel Operation
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Details Grid (Route & Meta Info) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Route Card with Visual Wayfinding */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4">
            Route & Wayfinding
          </h3>

          <div className="flex items-center gap-4">
            {/* Source */}
            <div className="flex-1 rounded-xl bg-slate-50 p-4 text-center border border-slate-100 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">From</span>
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden mb-2 shadow-2xs">
                {operation.sourceLocation.image_data || operation.sourceLocation.imageData || operation.sourceLocation.photoBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={operation.sourceLocation.image_data || operation.sourceLocation.imageData || operation.sourceLocation.photoBase64 || ""}
                    alt={operation.sourceLocation.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-600 bg-blue-50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-[#111827] truncate max-w-full">{operation.sourceLocation.name}</p>
              <span className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">{operation.sourceLocation.type}</span>
            </div>

            <svg className="w-6 h-6 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>

            {/* Destination */}
            <div className="flex-1 rounded-xl bg-slate-50 p-4 text-center border border-slate-100 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">To</span>
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden mb-2 shadow-2xs">
                {operation.destLocation.image_data || operation.destLocation.imageData || operation.destLocation.photoBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={operation.destLocation.image_data || operation.destLocation.imageData || operation.destLocation.photoBase64 || ""}
                    alt={operation.destLocation.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-emerald-600 bg-emerald-50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-[#111827] truncate max-w-full">{operation.destLocation.name}</p>
              <span className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">{operation.destLocation.type}</span>
            </div>
          </div>
        </div>

        {/* Operation Info Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] flex flex-col justify-between">
          <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4">
            Operation Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-xs text-slate-500">Created by</span>
              <span className="text-xs font-bold text-[#111827]">{operation.createdBy.name}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-xs text-slate-500">Scheduled Date</span>
              <span className="text-xs font-semibold text-[#111827]">{formatDate(operation.scheduledDate)}</span>
            </div>
            {operation.doneDate && (
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-xs text-slate-500">Completed On</span>
                <span className="text-xs font-bold text-emerald-600">{formatDateTime(operation.doneDate)}</span>
              </div>
            )}
            {operation.notes && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase">Instructions & Notes</p>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{operation.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Line Items Table ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-4">
          Line Items ({operation.lines.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="pb-3 px-3">Product</th>
                <th className="pb-3 px-3">SKU</th>
                <th className="pb-3 px-3 text-right">Planned Qty</th>
                <th className="pb-3 px-3 text-right">Done Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {operation.lines.map((line) => {
                const pImage = line.product.image_data || line.product.imageData;
                return (
                  <tr key={line.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {pImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={pImage} alt={line.product.name} className="w-full h-full object-contain p-0.5" />
                          ) : (
                            <span className="text-sm">📦</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111827]">{line.product.name}</p>
                          <p className="text-xs text-slate-400">{line.product.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-slate-500">{line.product.sku}</td>
                    <td className="py-3 px-3 text-sm text-right font-bold text-slate-700">
                      {line.quantityPlanned} <span className="text-xs font-normal text-slate-400">{line.product.uom}</span>
                    </td>
                    <td className="py-3 px-3 text-sm text-right font-extrabold text-blue-600">
                      {line.quantityDone} <span className="text-xs font-normal text-slate-400">{line.product.uom}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Stock Moves Audit Trail (Ledger Entries) ── */}
      {operation.stockMoves && operation.stockMoves.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Double-Entry Ledger Audit Trail (STOCK_MOVE)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Immutable ledger records created upon operation completion</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              LEDGER COMMITTED
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Product</th>
                  <th className="pb-3 px-3">Source Location</th>
                  <th className="pb-3 px-3">Destination Location</th>
                  <th className="pb-3 px-3 text-right">Quantity</th>
                  <th className="pb-3 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {operation.stockMoves.map((move) => (
                  <tr key={move.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 text-xs font-bold text-[#111827]">{move.product.name}</td>
                    <td className="py-3 px-3 text-xs text-slate-600">{move.fromLocation.name}</td>
                    <td className="py-3 px-3 text-xs text-slate-600">{move.toLocation.name}</td>
                    <td className="py-3 px-3 text-xs font-black text-emerald-600 text-right">+{move.quantity}</td>
                    <td className="py-3 px-3 text-xs text-slate-400 text-right">{formatDateTime(move.movedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
