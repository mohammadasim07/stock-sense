// StockSense — Stock Summary API
// GET /api/stock/summary — Current stock per product×location

import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/utils";
import { getFullStockSummary, getDashboardKPIs, getRecentMoves } from "@/lib/ledger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "summary"; // summary | kpis | moves

    if (view === "kpis") {
      const kpis = await getDashboardKPIs();
      return apiResponse(kpis);
    }

    if (view === "moves") {
      const limit = parseInt(searchParams.get("limit") || "20", 10);
      const moves = await getRecentMoves(limit);
      return apiResponse({ data: moves });
    }

    // Default: full stock summary
    const summary = await getFullStockSummary();
    return apiResponse({ data: summary });
  } catch (error) {
    console.error("Stock summary error:", error);
    return apiError("Internal server error", 500);
  }
}
