// StockSense — Verify OTP & Authenticate Endpoint
// POST /api/auth/verify-otp

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return apiError("Email and OTP code are required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return apiError("No account found with this email", 404);
    }

    // Mock OTP verification: accept "123456" or the user's stored OTP
    const mockOtp = process.env.MOCK_OTP || "123456";
    const isValid = otp === mockOtp || (user.otp && otp === user.otp);

    if (!isValid) {
      return apiError("Invalid OTP code. Please use 123456 for the demo.", 401);
    }

    // Clear OTP after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpiry: null },
    });

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const response = apiResponse({
      success: true,
      message: "Authentication successful",
      user: sessionUser,
    });

    // Set cookie for persistence across pages
    response.headers.set(
      "Set-Cookie",
      `stocksense_session=${encodeURIComponent(JSON.stringify(sessionUser))}; Path=/; SameSite=Lax; Max-Age=2592000`
    );

    return response;
  } catch (error) {
    console.error("Verify OTP error:", error);
    return apiError("Internal server error during verification", 500);
  }
}
