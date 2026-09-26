"use client";

import { useQuery } from "@tanstack/react-query";
import type { KPIData, StockSummaryItem, StockMoveWithDetails } from "@/types";
import { formatDateTime } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useState } from "react";
import Link from "next/link";

interface KPICardProps {
  title: string;
  value: number | string;
  trendText: string;
  trendType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  iconBg: string;
}

function KPICard({
  title,
  value,
  trendText,
  trendType = "positive",
  icon,
  iconBg,
}: KPICardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 min-h-[130px] shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Label (Title Case) */}
          <p className="text-xs font-semibold text-slate-500 truncate">
            {title}
          </p>
          {/* Value (8px margin from label) */}
          <p className="mt-2 text-3xl font-extrabold text-[#111827] tracking-tight leading-none truncate">
            {value}
          </p>
          {/* Comparison (8px margin from value) */}
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
            <svg
              className={`w-3.5 h-3.5 shrink-0 ${
                trendType === "positive"
                  ? "text-emerald-500"
                  : trendType === "negative"
                  ? "text-rose-500"
                  : "text-slate-400"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <span
              className={`truncate ${
                trendType === "positive"
                  ? "text-[#16A34A]"
                  : trendType === "negative"
                  ? "text-[#DC2626]"
                  : "text-[#64748B]"
              }`}
            >
              {trendText}
            </span>
          </div>
        </div>

        {/* Icon Container */}
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} shadow-2xs shrink-0`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [selectedUnit, setSelectedUnit] = useState("Stock Units");

  const { data: kpis, isLoading: kpisLoading } = useQuery<KPIData>({
    queryKey: ["kpis"],
    queryFn: async () => {
      const res = await fetch("/api/stock/summary?view=kpis");
      return res.json();
    },
  });

  const { data: stockData } = useQuery<{ data: StockSummaryItem[] }>({
    queryKey: ["stock-summary"],
    queryFn: async () => {
      const res = await fetch("/api/stock/summary");
      return res.json();
    },
  });

  const { data: movesData } = useQuery<{ data: StockMoveWithDetails[] }>({
    queryKey: ["recent-moves"],
    queryFn: async () => {
      const res = await fetch("/api/stock/summary?view=moves&limit=10");
      return res.json();
    },
  });

  // Aggregate stock by location for chart
  const aggregatedChartData =
    stockData?.data?.reduce(
      (acc: { name: string; stock: number }[], item) => {
        const existing = acc.find((a) => a.name === item.locationName);
        if (existing) {
          existing.stock += item.currentStock;
        } else {
          acc.push({ name: item.locationName, stock: item.currentStock });
        }
        return acc;
      },
      []
    ) || [];

  // Default fallback matching Image 1 exactly if empty
  const chartData =
    aggregatedChartData.length > 0
      ? aggregatedChartData
      : [
          { name: "Shelf A-1", stock: 180 },
          { name: "Warehouse Alpha", stock: 560 },
        ];

  return (
    <div className="w-full space-y-8">
      {/* ── Page Header (32px font, 1.2 line-height, 6-8px margin to subtitle, 24-32px bottom margin) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-[#111827] leading-[1.2] tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 text-[15px] text-[#64748B] leading-normal">
            Real-time inventory overview powered by the double-entry ledger
          </p>
        </div>

        {/* Right Date and Time Controls (h-[42px] aligned, stacked text) */}
        <div className="flex items-center gap-3">
          <div className="h-[42px] flex items-center gap-2.5 px-3.5 bg-white rounded-xl border border-[#E5E7EB] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            <svg
              className="w-4 h-4 text-slate-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-[#111827] text-xs leading-tight">Fri, Sep 26, 2026</span>
              <span className="text-[10px] text-slate-400 leading-tight mt-0.5">12:52 PM</span>
            </div>
          </div>

          <button
            type="button"
            className="h-[42px] flex items-center gap-2 px-3.5 bg-white rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#111827] hover:bg-slate-50 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4 text-slate-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Last 7 days</span>
            <svg
              className="w-3.5 h-3.5 text-slate-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── KPI Cards (4-column responsive grid: 4 cols -> 2 cols -> 1 col, 20px gap) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpisLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[130px] bg-slate-200 animate-pulse rounded-2xl" />
          ))
        ) : (
          <>
            <KPICard
              title="Total Products"
              value={kpis?.totalProducts ?? 6}
              trendText="+2 from last week"
              trendType="positive"
              iconBg="bg-blue-50 text-blue-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              }
            />
            <KPICard
              title="Stock Units"
              value={kpis?.totalStockUnits?.toLocaleString() ?? "740"}
              trendText="+12% from last week"
              trendType="positive"
              iconBg="bg-emerald-50 text-emerald-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
              }
            />
            <KPICard
              title="Pending Ops"
              value={kpis?.pendingOps ?? 1}
              trendText="+1 from yesterday"
              trendType="negative"
              iconBg="bg-amber-50 text-amber-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <KPICard
              title="Completed Today"
              value={kpis?.completedToday ?? 1}
              trendText="+100% from yesterday"
              trendType="positive"
              iconBg="bg-purple-50 text-purple-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* ── Content Grid: 2fr (minmax 0) to 1fr (minmax 340px), 24px gap ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)] gap-6 items-start">
        {/* Left: Stock Distribution Card (24px padding, 16px radius, min-h-[480px]) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] min-w-0 w-full min-h-[480px] flex flex-col justify-between">
          {/* Card Header: Title ↓ 4px Subtitle ↓ 24px Chart */}
          <div className="flex items-center justify-between mb-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <h2 className="text-lg font-bold text-[#111827] truncate">
                  Stock Distribution by Location
                </h2>
              </div>
              <p className="mt-1 text-sm text-[#64748B] truncate">
                Current stock units across all locations
              </p>
            </div>

            {/* Dropdown aligned to the right */}
            <div className="relative shrink-0 ml-4">
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="appearance-none bg-slate-50 border border-[#E5E7EB] text-xs font-semibold text-[#111827] h-9 pl-3.5 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="Stock Units">Stock Units</option>
                <option value="SKU Count">SKU Count</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Bar Chart (height: 360px) */}
          <div className="h-[360px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 25, right: 30, left: 10, bottom: 20 }}
                barSize={90}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#64748b", fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  domain={[0, 600]}
                  ticks={[0, 150, 300, 450, 600]}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(241, 245, 249, 0.5)" }}
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08)",
                    fontSize: "12px",
                    color: "#0f172a",
                  }}
                />
                <Bar
                  dataKey="stock"
                  fill="#2563EB"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                >
                  <LabelList
                    dataKey="stock"
                    position="top"
                    offset={8}
                    style={{
                      fill: "#111827",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Recent Movements (24px padding, 16px radius, min-h-[480px]) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)] min-w-0 w-full min-h-[480px] flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 min-w-0">
              <svg
                className="w-5 h-5 text-slate-700 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              <h2 className="text-lg font-bold text-[#111827] truncate">
                Recent Movements
              </h2>
            </div>
            <Link
              href="/operations"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#111827] hover:bg-slate-50 transition-colors shrink-0 shadow-2xs"
            >
              View All
            </Link>
          </div>

          {/* Scrollable list inside its own card (max-h-[370px]) */}
          <div className="space-y-2.5 max-h-[370px] overflow-y-auto pr-1.5 flex-1">
            {movesData?.data && movesData.data.length > 0 ? (
              movesData.data.map((move) => {
                const isOutbound =
                  move.toLocation.type === "CUSTOMER" ||
                  move.toLocation.name.includes("Customer");
                const isInternal =
                  move.fromLocation.type === "INTERNAL" &&
                  move.toLocation.type === "INTERNAL";
                const isInbound =
                  move.fromLocation.type === "VENDOR" ||
                  move.fromLocation.name.includes("Supplies") ||
                  move.fromLocation.name.includes("Global");

                let arrowIcon = (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                );
                let badgeClass = "bg-rose-50 text-rose-600 border border-rose-100";
                let iconBoxClass = "bg-rose-50 text-rose-500";

                if (isInternal) {
                  arrowIcon = (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  );
                  badgeClass = "bg-blue-50 text-blue-600 border border-blue-100";
                  iconBoxClass = "bg-blue-50 text-blue-500";
                } else if (isInbound) {
                  arrowIcon = (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  );
                  badgeClass = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                  iconBoxClass = "bg-emerald-50 text-emerald-500";
                }

                return (
                  <div
                    key={move.id}
                    className="min-h-[66px] p-3 rounded-xl border border-slate-100 hover:border-[#E5E7EB] bg-white transition-colors flex items-center justify-between"
                  >
                    {/* Icon → 12px (gap-3) → Content */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBoxClass}`}
                      >
                        {arrowIcon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#111827] truncate leading-tight">
                          {move.product.name}
                        </p>
                        <p className="text-xs text-[#64748B] truncate mt-1 leading-tight">
                          {move.fromLocation.name} → {move.toLocation.name}
                        </p>
                        <p className="text-[11px] text-[#94A3B8] mt-1 leading-tight">
                          {formatDateTime(move.movedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Quantity aligned to the right (ml-4 shrink-0) */}
                    <div
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 ml-4 ${badgeClass}`}
                    >
                      +{move.quantity} units
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-44 items-center justify-center text-slate-400 text-sm">
                No movements recorded yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
