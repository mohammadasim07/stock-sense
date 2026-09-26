// StockSense — Products API
// GET /api/products — List products with filters
// POST /api/products — Create a new product

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { createProductSchema } from "@/lib/validators";
import { apiResponse, apiError } from "@/lib/utils";
import { getTotalProductStock } from "@/lib/ledger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const barcode = searchParams.get("barcode") || "";

    const where: Record<string, unknown> = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (barcode) {
      where.barcode = barcode;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    // Enrich with stock levels
    const enriched = await Promise.all(
      products.map(async (product) => ({
        ...product,
        imageData: product.image_data,
        totalStock: await getTotalProductStock(product.id),
      }))
    );

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
    console.error("List products error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    // Check unique constraints
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: parsed.data.sku },
          ...(parsed.data.barcode ? [{ barcode: parsed.data.barcode }] : []),
        ],
      },
    });

    if (existing) {
      return apiError("A product with this SKU or barcode already exists", 409);
    }

    const { imageData, ...rest } = parsed.data;
    const finalData = {
      ...rest,
      image_data: parsed.data.image_data || imageData || null,
    };

    const product = await prisma.product.create({
      data: finalData,
    });

    return apiResponse({ ...product, imageData: product.image_data }, 201);
  } catch (error) {
    console.error("Create product error:", error);
    return apiError("Internal server error", 500);
  }
}
