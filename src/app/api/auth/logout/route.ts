// StockSense — Sign Out Endpoint
// POST /api/auth/logout

import { apiResponse } from "@/lib/utils";

export async function POST() {
  const response = apiResponse({ success: true, message: "Logged out successfully" });
  response.headers.set(
    "Set-Cookie",
    "stocksense_session=; Path=/; SameSite=Lax; Max-Age=0"
  );
  return response;
}
