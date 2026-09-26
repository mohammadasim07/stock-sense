// StockSense — Database Seed Script
// Creates demo users, products, locations for hackathon

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function makePlaceholderBase64(title: string, color: string, iconText: string): string {
  const cleanId = title.replace(/[^a-zA-Z0-9]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="g_${cleanId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" rx="28" fill="url(#g_${cleanId})"/>
    <circle cx="100" cy="85" r="42" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="2"/>
    <text x="100" y="94" font-size="28" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="bold">${iconText}</text>
    <text x="100" y="156" font-size="13" fill="#cbd5e1" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="600">${title}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function main() {
  console.log("🌱 Seeding StockSense database...\n");

  // ── Users ────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@stocksense.io" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@stocksense.io",
      password: "$2b$10$placeholder", // mock hashed password
      role: "ADMIN",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@stocksense.io" },
    update: {},
    create: {
      name: "Sarah Manager",
      email: "manager@stocksense.io",
      password: "$2b$10$placeholder",
      role: "MANAGER",
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: "operator@stocksense.io" },
    update: {},
    create: {
      name: "John Operator",
      email: "operator@stocksense.io",
      password: "$2b$10$placeholder",
      role: "OPERATOR",
    },
  });

  console.log("✅ Users created:", admin.name, manager.name, operator.name);

  // ── Locations ────────────────────────────────────────────────────────
  const vendorAcme = await prisma.location.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Acme Supplies",
      type: "VENDOR",
      address: "123 Supplier Ave, Industrial District",
      image_data: makePlaceholderBase64("Acme Supplies", "#f59e0b", "🏭"),
    },
  });

  const vendorGlobal = await prisma.location.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Global Parts Ltd",
      type: "VENDOR",
      address: "456 Import Blvd, Port Area",
      image_data: makePlaceholderBase64("Global Parts", "#3b82f6", "🌐"),
    },
  });

  const warehouseA = await prisma.location.upsert({
    where: { id: "00000000-0000-0000-0000-000000000010" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000010",
      name: "Warehouse Alpha",
      type: "INTERNAL",
      address: "100 Storage Rd, Building A",
      image_data: makePlaceholderBase64("WH Alpha", "#10b981", "🏬"),
    },
  });

  const warehouseB = await prisma.location.upsert({
    where: { id: "00000000-0000-0000-0000-000000000011" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000011",
      name: "Warehouse Beta",
      type: "INTERNAL",
      address: "200 Storage Rd, Building B",
      image_data: makePlaceholderBase64("WH Beta", "#06b6d4", "🏢"),
    },
  });

  const shelfA1 = await prisma.location.upsert({
    where: { id: "00000000-0000-0000-0000-000000000012" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000012",
      name: "Shelf A-1",
      type: "INTERNAL",
      parentId: warehouseA.id,
      image_data: makePlaceholderBase64("Shelf A-1", "#8b5cf6", "📦"),
    },
  });

  const shelfA2 = await prisma.location.upsert({
    where: { id: "00000000-0000-0000-0000-000000000013" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000013",
      name: "Shelf A-2",
      type: "INTERNAL",
      parentId: warehouseA.id,
      image_data: makePlaceholderBase64("Shelf A-2", "#ec4899", "📦"),
    },
  });

  const customerRetail = await prisma.location.upsert({
    where: { id: "00000000-0000-0000-0000-000000000020" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000020",
      name: "Retail Customers",
      type: "CUSTOMER",
      image_data: makePlaceholderBase64("Retail Store", "#14b8a6", "🛍️"),
    },
  });

  const customerWholesale = await prisma.location.upsert({
    where: { id: "00000000-0000-0000-0000-000000000021" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000021",
      name: "Wholesale Customers",
      type: "CUSTOMER",
      image_data: makePlaceholderBase64("Wholesale", "#f97316", "🛒"),
    },
  });

  const virtualLoss = await prisma.location.upsert({
    where: { id: "00000000-0000-0000-0000-000000000030" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000030",
      name: "Inventory Loss",
      type: "VIRTUAL",
      image_data: makePlaceholderBase64("Loss / Damaged", "#ef4444", "⚠️"),
    },
  });

  console.log("✅ Locations created:", [
    vendorAcme.name,
    vendorGlobal.name,
    warehouseA.name,
    warehouseB.name,
    shelfA1.name,
    shelfA2.name,
    customerRetail.name,
    customerWholesale.name,
    virtualLoss.name,
  ].join(", "));

  // ── Products ─────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: "WDG-001" },
      update: {},
      create: {
        name: "Steel Widget",
        sku: "WDG-001",
        barcode: "4901234567890",
        category: "Components",
        uom: "Units",
        description: "High-grade steel widget for assembly",
        image_data: makePlaceholderBase64("Steel Widget", "#6366f1", "⚙️"),
      },
    }),
    prisma.product.upsert({
      where: { sku: "BLT-002" },
      update: {},
      create: {
        name: "Titanium Bolt M8",
        sku: "BLT-002",
        barcode: "4901234567891",
        category: "Fasteners",
        uom: "Units",
        description: "M8 titanium hex bolt, 40mm",
        image_data: makePlaceholderBase64("Titanium Bolt", "#64748b", "🔩"),
      },
    }),
    prisma.product.upsert({
      where: { sku: "GKT-003" },
      update: {},
      create: {
        name: "Rubber Gasket",
        sku: "GKT-003",
        barcode: "4901234567892",
        category: "Seals",
        uom: "Units",
        description: "Industrial rubber gasket, 50mm diameter",
        image_data: makePlaceholderBase64("Rubber Gasket", "#ef4444", "⭕"),
      },
    }),
    prisma.product.upsert({
      where: { sku: "CBL-004" },
      update: {},
      create: {
        name: "Power Cable 3m",
        sku: "CBL-004",
        barcode: "4901234567893",
        category: "Electrical",
        uom: "Meters",
        description: "Heavy-duty power cable, 3-meter length",
        image_data: makePlaceholderBase64("Power Cable", "#eab308", "🔌"),
      },
    }),
    prisma.product.upsert({
      where: { sku: "BRG-005" },
      update: {},
      create: {
        name: "Ball Bearing 6205",
        sku: "BRG-005",
        barcode: "4901234567894",
        category: "Components",
        uom: "Units",
        description: "Deep groove ball bearing, 25x52x15mm",
        image_data: makePlaceholderBase64("Ball Bearing", "#0ea5e9", "🔘"),
      },
    }),
    prisma.product.upsert({
      where: { sku: "FLT-006" },
      update: {},
      create: {
        name: "Oil Filter HF-204",
        sku: "FLT-006",
        barcode: "4901234567895",
        category: "Filters",
        uom: "Units",
        description: "High-flow oil filter for industrial machinery",
        image_data: makePlaceholderBase64("Oil Filter", "#84cc16", "🛢️"),
      },
    }),
    prisma.product.upsert({
      where: { sku: "PNL-007" },
      update: {},
      create: {
        name: "Aluminium Panel 600x400",
        sku: "PNL-007",
        barcode: "4901234567896",
        category: "Panels",
        uom: "Sheets",
        description: "Brushed aluminium panel, 600x400x2mm",
        image_data: makePlaceholderBase64("Alu Panel", "#a855f7", "📋"),
      },
    }),
    prisma.product.upsert({
      where: { sku: "SCR-008" },
      update: {},
      create: {
        name: "Stainless Screw M4x20",
        sku: "SCR-008",
        barcode: "4901234567897",
        category: "Fasteners",
        uom: "Box (100)",
        description: "M4x20 Phillips head stainless steel screws, box of 100",
        image_data: makePlaceholderBase64("Screw Box", "#14b8a6", "🗜️"),
      },
    }),
  ]);

  console.log("✅ Products created:", products.map((p) => p.name).join(", "));

  // ── Sample Operations (to show Kanban) ───────────────────────────────
  // 1. A completed receipt
  const receipt1 = await prisma.operation.create({
    data: {
      reference: "REC/001",
      type: "RECEIPT",
      state: "DONE",
      sourceLocationId: vendorAcme.id,
      destLocationId: warehouseA.id,
      createdById: admin.id,
      scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      doneDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      notes: "Initial stock receipt from Acme",
      lines: {
        create: [
          { productId: products[0].id, quantityPlanned: 100, quantityDone: 100 },
          { productId: products[1].id, quantityPlanned: 500, quantityDone: 500 },
          { productId: products[2].id, quantityPlanned: 200, quantityDone: 200 },
          { productId: products[4].id, quantityPlanned: 50, quantityDone: 50 },
        ],
      },
    },
  });

  // Create corresponding stock moves for the completed receipt
  await prisma.stockMove.createMany({
    data: [
      { operationId: receipt1.id, productId: products[0].id, fromLocationId: vendorAcme.id, toLocationId: warehouseA.id, quantity: 100, movedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { operationId: receipt1.id, productId: products[1].id, fromLocationId: vendorAcme.id, toLocationId: warehouseA.id, quantity: 500, movedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { operationId: receipt1.id, productId: products[2].id, fromLocationId: vendorAcme.id, toLocationId: warehouseA.id, quantity: 200, movedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { operationId: receipt1.id, productId: products[4].id, fromLocationId: vendorAcme.id, toLocationId: warehouseA.id, quantity: 50, movedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
  });

  // 2. A receipt in WAITING state
  await prisma.operation.create({
    data: {
      reference: "REC/002",
      type: "RECEIPT",
      state: "WAITING",
      sourceLocationId: vendorGlobal.id,
      destLocationId: warehouseB.id,
      createdById: manager.id,
      scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      notes: "Incoming shipment from Global Parts",
      lines: {
        create: [
          { productId: products[3].id, quantityPlanned: 75 },
          { productId: products[5].id, quantityPlanned: 30 },
        ],
      },
    },
  });

  // 3. An internal transfer in DRAFT
  await prisma.operation.create({
    data: {
      reference: "INT/001",
      type: "INTERNAL_TRANSFER",
      state: "DRAFT",
      sourceLocationId: warehouseA.id,
      destLocationId: warehouseB.id,
      createdById: operator.id,
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: "Redistribute stock to Warehouse Beta",
      lines: {
        create: [
          { productId: products[0].id, quantityPlanned: 30 },
          { productId: products[1].id, quantityPlanned: 100 },
        ],
      },
    },
  });

  // 4. A delivery in READY state
  await prisma.operation.create({
    data: {
      reference: "DEL/001",
      type: "DELIVERY",
      state: "READY",
      sourceLocationId: warehouseA.id,
      destLocationId: customerRetail.id,
      createdById: manager.id,
      scheduledDate: new Date(),
      notes: "Customer order #1042",
      lines: {
        create: [
          { productId: products[0].id, quantityPlanned: 10 },
          { productId: products[2].id, quantityPlanned: 25 },
        ],
      },
    },
  });

  console.log("✅ Sample operations created with stock moves\n");
  console.log("🎉 Seed complete! Database is ready.\n");
  console.log("📊 Current stock at Warehouse Alpha:");
  console.log("   - Steel Widget: 100 units");
  console.log("   - Titanium Bolt M8: 500 units");
  console.log("   - Rubber Gasket: 200 units");
  console.log("   - Ball Bearing 6205: 50 units");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
