// StockSense — Operations API
// GET /api/operations — List operations with filters
// POST /api/operations — Create a new operation (in DRAFT state)

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { createOperationSchema } from "@/lib/validators";
import { apiResponse, apiError } from "@/lib/utils";
import { generateReference } from "@/lib/state-machine";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const state = searchParams.get("state") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (state) where.state = state;

    const [operations, total] = await Promise.all([
      prisma.operation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          sourceLocation: { select: { id: true, name: true, type: true, image_data: true } },
          destLocation: { select: { id: true, name: true, type: true, image_data: true } },
          createdBy: { select: { id: true, name: true } },
          lines: {
            include: {
              product: { select: { id: true, name: true, sku: true, image_data: true } },
            },
          },
          _count: { select: { stockMoves: true } },
        },
      }),
      prisma.operation.count({ where }),
    ]);

    const enriched = operations.map((op) => ({
      ...op,
      sourceLocation: {
        ...op.sourceLocation,
        imageData: op.sourceLocation.image_data,
        photoBase64: op.sourceLocation.image_data,
      },
      destLocation: {
        ...op.destLocation,
        imageData: op.destLocation.image_data,
        photoBase64: op.destLocation.image_data,
      },
      lines: op.lines.map((line) => ({
        ...line,
        product: {
          ...line.product,
          imageData: line.product.image_data,
        },
      })),
    }));

    return apiResponse({
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List operations error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createOperationSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
        400
      );
    }

    const { type, sourceLocationId, destLocationId, scheduledDate, notes, lines } =
      parsed.data;

    // Validate locations exist
    const [sourceLoc, destLoc] = await Promise.all([
      prisma.location.findUnique({ where: { id: sourceLocationId } }),
      prisma.location.findUnique({ where: { id: destLocationId } }),
    ]);

    if (!sourceLoc || !destLoc) {
      return apiError("Source or destination location not found", 404);
    }

    // Validate location types match operation type
    if (type === "RECEIPT" && sourceLoc.type !== "VENDOR") {
      return apiError("Receipt source must be a VENDOR location", 400);
    }
    if (type === "DELIVERY" && destLoc.type !== "CUSTOMER") {
      return apiError("Delivery destination must be a CUSTOMER location", 400);
    }
    if (type === "INTERNAL_TRANSFER") {
      if (sourceLoc.type !== "INTERNAL" || destLoc.type !== "INTERNAL") {
        return apiError("Internal transfer must be between INTERNAL locations", 400);
      }
    }

    // Validate all products exist
    const productIds = lines.map((l) => l.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      return apiError("One or more products not found", 404);
    }

    // Generate reference
    const reference = await generateReference(type);

    // We need a user ID — for hackathon, use first admin or first user
    let userId: string;
    const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (firstUser) {
      userId = firstUser.id;
    } else {
      return apiError("No users found. Please seed the database.", 400);
    }

    // Create operation with lines
    const operation = await prisma.operation.create({
      data: {
        reference,
        type,
        state: "DRAFT",
        sourceLocationId,
        destLocationId,
        createdById: userId,
        scheduledDate: new Date(scheduledDate),
        notes,
        lines: {
          create: lines.map((line) => ({
            productId: line.productId,
            quantityPlanned: line.quantityPlanned,
          })),
        },
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

    return apiResponse(
      {
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
      },
      201
    );
  } catch (error) {
    console.error("Create operation error:", error);
    return apiError("Internal server error", 500);
  }
}
