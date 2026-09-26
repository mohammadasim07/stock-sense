// StockSense — Mock OTP Request Endpoint
// POST /api/auth/request-otp

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requestOtpSchema } from "@/lib/validators";
import { apiResponse, apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestOtpSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return apiResponse({ message: "If the email exists, an OTP has been sent." });
    }

    // Mock OTP — always set to "123456"
    const mockOtp = process.env.MOCK_OTP || "123456";
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: mockOtp,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    console.log(`[MOCK OTP] OTP for ${email}: ${mockOtp}`);

    return apiResponse({
      message: "If the email exists, an OTP has been sent.",
      // Include OTP in dev for easy testing
      ...(process.env.NODE_ENV === "development" ? { otp: mockOtp } : {}),
    });
  } catch (error) {
    console.error("Request OTP error:", error);
    return apiError("Internal server error", 500);
  }
}
