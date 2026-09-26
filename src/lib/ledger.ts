// StockSense — Double-Entry Ledger Engine
// Stock is NEVER stored as a column. It is always DERIVED from stock_moves.

import prisma from "./prisma";

/**
 * Get the current stock of a product at a specific location.
 * Calculated as: SUM(incoming qty) - SUM(outgoing qty)
 */
export async function getStockAtLocation(
  productId: string,
  locationId: string
): Promise<number> {
  const [incoming, outgoing] = await Promise.all([
    prisma.stockMove.aggregate({
      where: { productId, toLocationId: locationId },
      _sum: { quantity: true },
    }),
    prisma.stockMove.aggregate({
      where: { productId, fromLocationId: locationId },
      _sum: { quantity: true },
    }),
  ]);

  return (incoming._sum.quantity ?? 0) - (outgoing._sum.quantity ?? 0);
}

/**
 * Get stock summary for all products at a specific location.
 */
export async function getStockByLocation(locationId: string) {
  const moves = await prisma.stockMove.groupBy({
    by: ["productId"],
    where: {
      OR: [{ fromLocationId: locationId }, { toLocationId: locationId }],
    },
    _sum: { quantity: true },
  });

  // Need to calculate net for each product
  const products = await prisma.product.findMany({
    where: { isActive: true },
  });

  const result = [];
  for (const product of products) {
    const stock = await getStockAtLocation(product.id, locationId);
    if (stock !== 0) {
      result.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock: stock,
      });
    }
  }

  return result;
}

/**
 * Get full stock summary across all internal locations.
 * Returns: { productId, productName, locationId, locationName, currentStock }[]
 */
export async function getFullStockSummary() {
  const locations = await prisma.location.findMany({
    where: { type: "INTERNAL", isActive: true },
  });

  const products = await prisma.product.findMany({
    where: { isActive: true },
  });

  const result = [];
  for (const location of locations) {
    for (const product of products) {
      const stock = await getStockAtLocation(product.id, location.id);
      if (stock !== 0) {
        result.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          locationId: location.id,
          locationName: location.name,
          locationType: location.type,
          currentStock: stock,
        });
      }
    }
  }

  return result;
}

/**
 * Get total stock across all internal locations for a given product.
 */
export async function getTotalProductStock(productId: string): Promise<number> {
  const internalLocations = await prisma.location.findMany({
    where: { type: "INTERNAL", isActive: true },
    select: { id: true },
  });

  let total = 0;
  for (const loc of internalLocations) {
    total += await getStockAtLocation(productId, loc.id);
  }
  return total;
}

/**
 * Check if a location has enough stock of a product.
 */
export async function checkAvailability(
  productId: string,
  locationId: string,
  requiredQty: number
): Promise<{ available: boolean; currentStock: number }> {
  const currentStock = await getStockAtLocation(productId, locationId);
  return {
    available: currentStock >= requiredQty,
    currentStock,
  };
}

/**
 * Get recent stock movements with full details.
 */
export async function getRecentMoves(limit: number = 20) {
  return prisma.stockMove.findMany({
    take: limit,
    orderBy: { movedAt: "desc" },
    include: {
      product: { select: { name: true, sku: true } },
      fromLocation: { select: { name: true, type: true } },
      toLocation: { select: { name: true, type: true } },
      operation: { select: { reference: true, type: true } },
    },
  });
}

/**
 * Get dashboard KPIs
 */
export async function getDashboardKPIs() {
  const [
    totalProducts,
    totalLocations,
    pendingOps,
    completedToday,
    totalStockMoves,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.location.count({ where: { type: "INTERNAL", isActive: true } }),
    prisma.operation.count({
      where: { state: { in: ["DRAFT", "WAITING", "READY"] } },
    }),
    prisma.operation.count({
      where: {
        state: "DONE",
        doneDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.stockMove.count(),
  ]);

  // Total stock units across all internal locations
  const stockSummary = await getFullStockSummary();
  const totalStockUnits = stockSummary.reduce(
    (sum, item) => sum + item.currentStock,
    0
  );

  return {
    totalProducts,
    totalLocations,
    pendingOps,
    completedToday,
    totalStockUnits,
    totalStockMoves,
  };
}
