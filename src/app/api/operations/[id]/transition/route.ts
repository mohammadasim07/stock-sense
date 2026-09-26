// StockSense — Operation State Transition API
// POST /api/operations/:id/transition
// Body: { action: "confirm" | "check_availability" | "validate" | "cancel" }

import { NextRequest } from "next/server";
import { transitionSchema } from "@/lib/validators";
import { transitionOperation } from "@/lib/state-machine";
import { apiResponse, apiError } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = transitionSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { action } = parsed.data;
    const result = await transitionOperation(id, action);

    if (!result.success) {
      return apiResponse(result, 422);
    }

    return apiResponse(result);
  } catch (error) {
    console.error("Transition error:", error);
    return apiError("Internal server error", 500);
  }
}
