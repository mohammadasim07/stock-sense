// StockSense — Product Detail API
// GET /api/products/:id — Get product with stock per location
// PUT /api/products/:id — Update product
// DELETE /api/products/:id — Soft-delete product

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { updateProductSchema } from "@/lib/validators";
import { apiResponse, apiError } from "@/lib/utils";
import { getStockAtLocation } from "@/lib/ledger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return apiError("Product not found", 404);
    }

    // Get stock at each internal location
    const locations = await prisma.location.findMany({
      where: { type: "INTERNAL", isActive: true },
    });

    const stockByLocation = await Promise.all(
      locations.map(async (loc) => ({
        locationId: loc.id,
        locationName: loc.name,
        currentStock: await getStockAtLocation(product.id, loc.id),
      }))
    );

    return apiResponse({
      ...product,
      imageData: product.image_data,
      stockByLocation: stockByLocation.filter((s) => s.currentStock !== 0),
      totalStock: stockByLocation.reduce((sum, s) => sum + s.currentStock, 0),
    });
  } catch (error) {
    console.error("Get product error:", error);
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
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { imageData, ...rest } = parsed.data;
    const finalData: Record<string, unknown> = { ...rest };
    if (parsed.data.image_data !== undefined || imageData !== undefined) {
      finalData.image_data = parsed.data.image_data !== undefined ? parsed.data.image_data : imageData;
    }

    const product = await prisma.product.update({
      where: { id },
      data: finalData,
    });

    return apiResponse({ ...product, imageData: product.image_data });
  } catch (error) {
    console.error("Update product error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return apiResponse({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete product error:", error);
    return apiError("Internal server error", 500);
  }
}
