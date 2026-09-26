// StockSense — Location Detail API
// GET /api/locations/:id — Get location with stock
// PUT /api/locations/:id — Update location
// DELETE /api/locations/:id — Soft-delete location

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { updateLocationSchema } from "@/lib/validators";
import { apiResponse, apiError } from "@/lib/utils";
import { getStockByLocation } from "@/lib/ledger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        children: { where: { isActive: true } },
        parent: { select: { id: true, name: true } },
      },
    });

    if (!location) {
      return apiError("Location not found", 404);
    }

    // Get current stock at this location
    const stock = await getStockByLocation(location.id);

    return apiResponse({
      ...location,
      imageData: location.image_data,
      photoBase64: location.image_data,
      currentStock: stock,
    });
  } catch (error) {
    console.error("Get location error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateLocationSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { imageData, photoBase64, ...rest } = parsed.data;
    const finalData: Record<string, unknown> = { ...rest };
    if (
      parsed.data.image_data !== undefined ||
      imageData !== undefined ||
      photoBase64 !== undefined
    ) {
      finalData.image_data =
        parsed.data.image_data !== undefined
          ? parsed.data.image_data
          : (imageData !== undefined ? imageData : photoBase64);
    }

    const location = await prisma.location.update({
      where: { id },
      data: finalData,
    });

    return apiResponse({
      ...location,
      imageData: location.image_data,
      photoBase64: location.image_data,
    });
  } catch (error) {
    console.error("Update location error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.location.update({
      where: { id },
      data: { isActive: false },
    });

    return apiResponse({ message: "Location deleted" });
  } catch (error) {
    console.error("Delete location error:", error);
    return apiError("Internal server error", 500);
  }
}
