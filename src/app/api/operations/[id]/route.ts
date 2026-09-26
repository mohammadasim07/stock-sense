// StockSense — Operation Detail API
// GET /api/operations/:id — Get operation with full details

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const operation = await prisma.operation.findUnique({
      where: { id },
      include: {
        sourceLocation: true,
        destLocation: true,
        createdBy: { select: { id: true, name: true, email: true } },
        lines: {
          include: {
            product: true,
          },
        },
        stockMoves: {
          include: {
            product: { select: { name: true, sku: true, image_data: true } },
            fromLocation: { select: { name: true, type: true, image_data: true } },
            toLocation: { select: { name: true, type: true, image_data: true } },
          },
          orderBy: { movedAt: "desc" },
        },
      },
    });

    if (!operation) {
      return apiError("Operation not found", 404);
    }

    const enriched = {
      ...operation,
      sourceLocation: {
        ...operation.sourceLocation,
        imageData: operation.sourceLocation.image_data,
        photoBase64: operation.sourceLocation.image_data,
      },
      destLocation: {
        ...operation.destLocation,
        imageData: operation.destLocation.image_data,
        photoBase64: operation.destLocation.image_data,
      },
      lines: operation.lines.map((line) => ({
        ...line,
        product: {
          ...line.product,
          imageData: line.product.image_data,
        },
      })),
      stockMoves: operation.stockMoves?.map((sm) => ({
        ...sm,
        product: {
          ...sm.product,
          imageData: sm.product.image_data,
        },
        fromLocation: {
          ...sm.fromLocation,
          imageData: sm.fromLocation.image_data,
          photoBase64: sm.fromLocation.image_data,
        },
        toLocation: {
          ...sm.toLocation,
          imageData: sm.toLocation.image_data,
          photoBase64: sm.toLocation.image_data,
        },
      })),
    };

    return apiResponse(enriched);
  } catch (error) {
    console.error("Get operation error:", error);
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

    const operation = await prisma.operation.findUnique({
      where: { id },
    });

    if (!operation) {
      return apiError("Operation not found", 404);
    }

    if (operation.state !== "DRAFT") {
      return apiError("Can only edit operations in DRAFT state", 400);
    }

    // Update operation fields and lines
    const updated = await prisma.operation.update({
      where: { id },
      data: {
        scheduledDate: body.scheduledDate
          ? new Date(body.scheduledDate)
          : undefined,
        notes: body.notes,
      },
      include: {
        sourceLocation: { select: { id: true, name: true, type: true, image_data: true } },
        destLocation: { select: { id: true, name: true, type: true, image_data: true } },
        lines: {
          include: {
            product: { select: { id: true, name: true, sku: true, image_data: true } },
          },
        },
      },
    });

    // Update lines if provided
    if (body.lines && Array.isArray(body.lines)) {
      // Delete existing lines and recreate
      await prisma.operationLine.deleteMany({
        where: { operationId: id },
      });

      await prisma.operationLine.createMany({
        data: body.lines.map(
          (line: { productId: string; quantityPlanned: number; quantityDone?: number }) => ({
            operationId: id,
            productId: line.productId,
            quantityPlanned: line.quantityPlanned,
            quantityDone: line.quantityDone || 0,
          })
        ),
      });
    }

    return apiResponse(updated);
  } catch (error) {
    console.error("Update operation error:", error);
    return apiError("Internal server error", 500);
  }
}
