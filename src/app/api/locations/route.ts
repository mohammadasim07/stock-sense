// StockSense — Locations API
// GET /api/locations — List locations
// POST /api/locations — Create a new location (with optional photo)

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { createLocationSchema } from "@/lib/validators";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const flat = searchParams.get("flat") === "true";

    const where: Record<string, unknown> = { isActive: true };

    if (type) {
      where.type = type;
    }

    if (!flat) {
      // Return tree structure (top-level only, with children)
      where.parentId = null;
    }

    const locations = await prisma.location.findMany({
      where,
      include: flat
        ? undefined
        : {
            children: {
              where: { isActive: true },
              include: {
                children: { where: { isActive: true } },
              },
            },
          },
      orderBy: { name: "asc" },
    });

    const enriched = locations.map((loc) => ({
      ...loc,
      imageData: loc.image_data,
      photoBase64: loc.image_data,
    }));

    return apiResponse({ data: enriched });
  } catch (error) {
    console.error("List locations error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createLocationSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { imageData, photoBase64, ...rest } = parsed.data;
    const finalData = {
      ...rest,
      image_data: parsed.data.image_data || imageData || photoBase64 || null,
    };

    const location = await prisma.location.create({
      data: finalData,
    });

    return apiResponse(
      {
        ...location,
        imageData: location.image_data,
        photoBase64: location.image_data,
      },
      201
    );
  } catch (error) {
    console.error("Create location error:", error);
    return apiError("Internal server error", 500);
  }
}
