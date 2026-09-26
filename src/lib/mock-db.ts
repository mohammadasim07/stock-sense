// StockSense — In-Memory & Local JSON Persisted Database Fallback
// Provides zero-configuration demo data and full double-entry ledger support
// matching the exact reference screenshots.

import fs from "fs";
import path from "path";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "OPERATOR";
  title?: string;
  otp?: string | null;
  otpExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DemoProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  category: string;
  uom: string;
  description: string | null;
  image_data: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DemoLocation {
  id: string;
  name: string;
  type: "VENDOR" | "INTERNAL" | "CUSTOMER" | "VIRTUAL";
  address: string | null;
  image_data: string | null;
  parentId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DemoOperationLine {
  id: string;
  operationId: string;
  productId: string;
  quantityPlanned: number;
  quantityDone: number;
}

export interface DemoStockMove {
  id: string;
  operationId: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  movedAt: Date;
}

export interface DemoOperation {
  id: string;
  reference: string;
  type: "RECEIPT" | "DELIVERY" | "INTERNAL_TRANSFER";
  state: "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELLED";
  sourceLocationId: string;
  destLocationId: string;
  createdById: string;
  scheduledDate: Date;
  doneDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Realistic Product SVGs matching Image 2 ──────────────────────────────────
export function getProductSvg(sku: string): string {
  let svgContent = "";

  switch (sku) {
    case "WDG-001": // Steel Widget (Metallic Washer)
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="sw_bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#f1f5f9"/>
          </radialGradient>
          <linearGradient id="sw_metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f8fafc"/>
            <stop offset="30%" stop-color="#cbd5e1"/>
            <stop offset="50%" stop-color="#64748b"/>
            <stop offset="70%" stop-color="#94a3b8"/>
            <stop offset="100%" stop-color="#e2e8f0"/>
          </linearGradient>
          <linearGradient id="sw_rim" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#475569"/>
            <stop offset="100%" stop-color="#f8fafc"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="16" fill="url(#sw_bg)"/>
        <!-- 3D Shadow -->
        <ellipse cx="80" cy="88" rx="46" ry="32" fill="#000000" fill-opacity="0.12"/>
        <!-- Outer Washer Ring -->
        <circle cx="80" cy="80" r="44" fill="url(#sw_metal)" stroke="url(#sw_rim)" stroke-width="2.5"/>
        <!-- Inner Bevel -->
        <circle cx="80" cy="80" r="28" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
        <!-- Washer Hole -->
        <circle cx="80" cy="80" r="20" fill="#f8fafc" stroke="#334155" stroke-width="2"/>
        <!-- Specular Highlight -->
        <path d="M54 58 Q80 44 106 58" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.8"/>
      </svg>`;
      break;

    case "BLT-002": // Titanium Bolt M8
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="tb_bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#f1f5f9"/>
          </radialGradient>
          <linearGradient id="tb_metal" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stop-color="#e2e8f0"/>
            <stop offset="50%" stop-color="#64748b"/>
            <stop offset="100%" stop-color="#94a3b8"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="16" fill="url(#tb_bg)"/>
        <!-- Shadow -->
        <ellipse cx="82" cy="88" rx="42" ry="24" fill="#000000" fill-opacity="0.12"/>
        <!-- Bolt Hex Head -->
        <path d="M42 66 L58 48 L76 56 L60 74 Z" fill="#94a3b8" stroke="#334155" stroke-width="2"/>
        <path d="M58 48 L78 60 L76 78 L56 66 Z" fill="#cbd5e1" stroke="#334155" stroke-width="2"/>
        <!-- Bolt Shaft -->
        <rect x="70" y="64" width="46" height="24" rx="3" transform="rotate(32 70 64)" fill="url(#tb_metal)" stroke="#334155" stroke-width="2"/>
        <!-- Thread Ridges -->
        <line x1="82" y1="62" x2="72" y2="78" stroke="#334155" stroke-width="2.5"/>
        <line x1="92" y1="68" x2="82" y2="84" stroke="#334155" stroke-width="2.5"/>
        <line x1="102" y1="74" x2="92" y2="90" stroke="#334155" stroke-width="2.5"/>
        <line x1="112" y1="80" x2="102" y2="96" stroke="#334155" stroke-width="2.5"/>
        <line x1="122" y1="86" x2="112" y2="102" stroke="#334155" stroke-width="2.5"/>
      </svg>`;
      break;

    case "GKT-003": // Rubber Gasket (Red Ring)
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="rg_bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#f1f5f9"/>
          </radialGradient>
          <radialGradient id="rg_red" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#f87171"/>
            <stop offset="50%" stop-color="#dc2626"/>
            <stop offset="100%" stop-color="#991b1b"/>
          </radialGradient>
        </defs>
        <rect width="160" height="160" rx="16" fill="url(#rg_bg)"/>
        <!-- Shadow -->
        <ellipse cx="80" cy="88" rx="44" ry="28" fill="#000000" fill-opacity="0.15"/>
        <!-- Outer Gasket -->
        <circle cx="80" cy="80" r="42" fill="url(#rg_red)" stroke="#7f1d1d" stroke-width="3"/>
        <!-- Inner Gasket Hole -->
        <circle cx="80" cy="80" r="22" fill="#ffffff" stroke="#7f1d1d" stroke-width="2.5"/>
        <!-- Specular curved highlight -->
        <path d="M52 56 Q80 44 108 56" stroke="#fca5a5" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.8"/>
      </svg>`;
      break;

    case "CBL-004": // Power Cable 3m (Coiled Black Cable)
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="pc_bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#f1f5f9"/>
          </radialGradient>
        </defs>
        <rect width="160" height="160" rx="16" fill="url(#pc_bg)"/>
        <!-- Shadow -->
        <ellipse cx="80" cy="88" rx="44" ry="24" fill="#000000" fill-opacity="0.14"/>
        <!-- Coiled Cable Loops -->
        <ellipse cx="80" cy="74" rx="38" ry="18" fill="none" stroke="#0f172a" stroke-width="8"/>
        <ellipse cx="80" cy="80" rx="36" ry="18" fill="none" stroke="#1e293b" stroke-width="8"/>
        <ellipse cx="80" cy="86" rx="34" ry="18" fill="none" stroke="#334155" stroke-width="8"/>
        <!-- Plug Connector -->
        <rect x="94" y="68" width="16" height="12" rx="2" fill="#475569" stroke="#0f172a" stroke-width="1.5"/>
        <!-- Brass prongs -->
        <rect x="110" y="70" width="6" height="3" fill="#eab308"/>
        <rect x="110" y="75" width="6" height="3" fill="#eab308"/>
      </svg>`;
      break;

    case "BRG-005": // Ball Bearing 6205
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="bb_bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#f1f5f9"/>
          </radialGradient>
          <linearGradient id="bb_metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#cbd5e1"/>
            <stop offset="50%" stop-color="#475569"/>
            <stop offset="100%" stop-color="#94a3b8"/>
          </linearGradient>
          <radialGradient id="bb_ball" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#94a3b8"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </radialGradient>
        </defs>
        <rect width="160" height="160" rx="16" fill="url(#bb_bg)"/>
        <!-- Shadow -->
        <ellipse cx="80" cy="88" rx="44" ry="26" fill="#000000" fill-opacity="0.14"/>
        <!-- Outer Race -->
        <circle cx="80" cy="80" r="42" fill="url(#bb_metal)" stroke="#334155" stroke-width="2"/>
        <circle cx="80" cy="80" r="34" fill="#0f172a"/>
        <!-- Steel Balls (8 Balls) -->
        <circle cx="80" cy="52" r="6" fill="url(#bb_ball)"/>
        <circle cx="100" cy="60" r="6" fill="url(#bb_ball)"/>
        <circle cx="108" cy="80" r="6" fill="url(#bb_ball)"/>
        <circle cx="100" cy="100" r="6" fill="url(#bb_ball)"/>
        <circle cx="80" cy="108" r="6" fill="url(#bb_ball)"/>
        <circle cx="60" cy="100" r="6" fill="url(#bb_ball)"/>
        <circle cx="52" cy="80" r="6" fill="url(#bb_ball)"/>
        <circle cx="60" cy="60" r="6" fill="url(#bb_ball)"/>
        <!-- Inner Race -->
        <circle cx="80" cy="80" r="22" fill="url(#bb_metal)" stroke="#334155" stroke-width="2"/>
        <circle cx="80" cy="80" r="14" fill="#ffffff" stroke="#475569" stroke-width="1.5"/>
      </svg>`;
      break;

    case "FLT-006": // Oil Filter HF-204 (Black Canister)
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="of_bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#f1f5f9"/>
          </radialGradient>
          <linearGradient id="of_can" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="35%" stop-color="#334155"/>
            <stop offset="70%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#020617"/>
          </linearGradient>
        </defs>
        <rect width="160" height="160" rx="16" fill="url(#of_bg)"/>
        <!-- Shadow -->
        <ellipse cx="80" cy="116" rx="34" ry="14" fill="#000000" fill-opacity="0.16"/>
        <!-- Filter Canister Body -->
        <rect x="52" y="52" width="56" height="58" rx="6" fill="url(#of_can)" stroke="#0f172a" stroke-width="1.5"/>
        <!-- Vertical grip flutes -->
        <line x1="58" y1="56" x2="58" y2="104" stroke="#475569" stroke-width="1.5"/>
        <line x1="66" y1="56" x2="66" y2="104" stroke="#475569" stroke-width="1.5"/>
        <line x1="74" y1="56" x2="74" y2="104" stroke="#475569" stroke-width="1.5"/>
        <line x1="82" y1="56" x2="82" y2="104" stroke="#475569" stroke-width="1.5"/>
        <line x1="90" y1="56" x2="90" y2="104" stroke="#475569" stroke-width="1.5"/>
        <line x1="98" y1="56" x2="98" y2="104" stroke="#475569" stroke-width="1.5"/>
        <line x1="104" y1="56" x2="104" y2="104" stroke="#475569" stroke-width="1.5"/>
        <!-- Top Gasket Flange -->
        <ellipse cx="80" cy="52" rx="28" ry="8" fill="#1e293b" stroke="#64748b" stroke-width="1.5"/>
        <ellipse cx="80" cy="52" rx="18" ry="5" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1"/>
      </svg>`;
      break;

    default:
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <rect width="160" height="160" rx="16" fill="#f1f5f9"/>
        <circle cx="80" cy="80" r="36" fill="#e2e8f0"/>
        <text x="80" y="88" font-size="28" text-anchor="middle" fill="#64748b">📦</text>
      </svg>`;
  }

  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`;
}

// ── Realistic Location SVGs matching Image 3 ──────────────────────────────────
export function getLocationSvg(type: string, name: string): string {
  let bg = "#eff6ff";
  let stroke = "#2563eb";
  let iconSvg = "";

  if (name.includes("Acme") || type === "VENDOR") {
    bg = "#eff6ff";
    stroke = "#2563eb";
    iconSvg = `<path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (name.includes("Global")) {
    bg = "#faf5ff";
    stroke = "#9333ea";
    iconSvg = `<path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (name.includes("Loss") || type === "VIRTUAL") {
    bg = "#fef2f2";
    stroke = "#dc2626";
    iconSvg = `<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (name.includes("Customer") || type === "CUSTOMER") {
    bg = "#fff7ed";
    stroke = "#ea580c";
    iconSvg = `<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (name.includes("Shelf")) {
    bg = "#f0fdf4";
    stroke = "#16a34a";
    iconSvg = `<path d="M4 6h16M4 12h16M4 18h16M4 6v12M20 6v12" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (name.includes("Warehouse")) {
    bg = "#eff6ff";
    stroke = "#2563eb";
    iconSvg = `<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect width="80" height="80" rx="16" fill="${bg}"/>
    <g transform="translate(28, 28) scale(1)">
      ${iconSvg}
    </g>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const DB_FILE = path.join(process.cwd(), ".stocksense-db.json");

class MockDatabase {
  users: DemoUser[] = [];
  products: DemoProduct[] = [];
  locations: DemoLocation[] = [];
  operations: DemoOperation[] = [];
  operationLines: DemoOperationLine[] = [];
  stockMoves: DemoStockMove[] = [];

  constructor() {
    this.seedDefaultData();
    this.persist();
  }

  persist() {
    try {
      const data = {
        users: this.users,
        products: this.products,
        locations: this.locations,
        operations: this.operations,
        operationLines: this.operationLines,
        stockMoves: this.stockMoves,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.warn("[MockDB] Could not persist db file", e);
    }
  }

  seedDefaultData() {
    const now = new Date();

    // ── 1. Users ("Alex Morgan / Warehouse Manager") ──
    this.users = [
      {
        id: "u-00000000-0001",
        name: "Alex Morgan",
        email: "admin@stocksense.io",
        password: "mock_password",
        role: "ADMIN",
        title: "Warehouse Manager",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "u-00000000-0002",
        name: "Sarah Manager",
        email: "manager@stocksense.io",
        password: "mock_password",
        role: "MANAGER",
        title: "Operations Lead",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "u-00000000-0003",
        name: "John Operator",
        email: "operator@stocksense.io",
        password: "mock_password",
        role: "OPERATOR",
        title: "Stock Handler",
        createdAt: now,
        updatedAt: now,
      },
    ];

    // ── 2. Locations matching Image 3 ──
    const locAcme: DemoLocation = {
      id: "loc-00000000-0001",
      name: "Acme Supplies",
      type: "VENDOR",
      address: "123 Supplier Ave, Industrial District",
      image_data: getLocationSvg("VENDOR", "Acme Supplies"),
      parentId: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const locGlobal: DemoLocation = {
      id: "loc-00000000-0002",
      name: "Global Parts Ltd",
      type: "VENDOR",
      address: "456 Import Blvd, Port Area",
      image_data: getLocationSvg("VENDOR", "Global Parts Ltd"),
      parentId: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const locLoss: DemoLocation = {
      id: "loc-00000000-0030",
      name: "Inventory Loss",
      type: "VIRTUAL",
      address: "Virtual / Scrap / Adjustment",
      image_data: getLocationSvg("VIRTUAL", "Inventory Loss"),
      parentId: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const locRetail: DemoLocation = {
      id: "loc-00000000-0020",
      name: "Retail Customers",
      type: "CUSTOMER",
      address: "Direct Customer Shipments",
      image_data: getLocationSvg("CUSTOMER", "Retail Customers"),
      parentId: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const locShelfA1: DemoLocation = {
      id: "loc-00000000-0012",
      name: "Shelf A-1",
      type: "INTERNAL",
      address: "Building A, Row 1, Tier 2",
      image_data: getLocationSvg("INTERNAL", "Shelf A-1"),
      parentId: "loc-00000000-0010",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const locShelfA2: DemoLocation = {
      id: "loc-00000000-0013",
      name: "Shelf A-2",
      type: "INTERNAL",
      address: "Building A, Row 1, Tier 3",
      image_data: getLocationSvg("INTERNAL", "Shelf A-2"),
      parentId: "loc-00000000-0010",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const locWhAlpha: DemoLocation = {
      id: "loc-00000000-0010",
      name: "Warehouse Alpha",
      type: "INTERNAL",
      address: "100 Storage Rd, Building A",
      image_data: getLocationSvg("INTERNAL", "Warehouse Alpha"),
      parentId: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const locWhBeta: DemoLocation = {
      id: "loc-00000000-0011",
      name: "Warehouse Beta",
      type: "INTERNAL",
      address: "200 Storage Rd, Building B",
      image_data: getLocationSvg("INTERNAL", "Warehouse Beta"),
      parentId: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.locations = [
      locAcme,
      locGlobal,
      locLoss,
      locRetail,
      locShelfA1,
      locShelfA2,
      locWhAlpha,
      locWhBeta,
    ];

    // ── 3. Products matching Image 2 ──
    const prod1: DemoProduct = {
      id: "prod-00000000-0001",
      name: "Steel Widget",
      sku: "WDG-001",
      barcode: "4901234567890",
      category: "COMPONENTS",
      uom: "Units",
      description: "High-grade steel widget for assembly",
      image_data: getProductSvg("WDG-001"),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const prod2: DemoProduct = {
      id: "prod-00000000-0002",
      name: "Titanium Bolt M8",
      sku: "BLT-002",
      barcode: "4901234567891",
      category: "FASTENERS",
      uom: "Units",
      description: "M8 titanium hex bolt, 40mm",
      image_data: getProductSvg("BLT-002"),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const prod3: DemoProduct = {
      id: "prod-00000000-0003",
      name: "Rubber Gasket",
      sku: "GKT-003",
      barcode: "4901234567892",
      category: "SEALS",
      uom: "Units",
      description: "Industrial rubber gasket, 50mm diameter",
      image_data: getProductSvg("GKT-003"),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const prod4: DemoProduct = {
      id: "prod-00000000-0004",
      name: "Power Cable 3m",
      sku: "CBL-004",
      barcode: "4901234567893",
      category: "ELECTRICAL",
      uom: "Meters",
      description: "Heavy-duty power cable, 3-meter length",
      image_data: getProductSvg("CBL-004"),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const prod5: DemoProduct = {
      id: "prod-00000000-0005",
      name: "Ball Bearing 6205",
      sku: "BRG-005",
      barcode: "4901234567894",
      category: "COMPONENTS",
      uom: "Units",
      description: "Deep groove ball bearing, 25×52×15mm",
      image_data: getProductSvg("BRG-005"),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const prod6: DemoProduct = {
      id: "prod-00000000-0006",
      name: "Oil Filter HF-204",
      sku: "FLT-006",
      barcode: "4901234567895",
      category: "FILTERS",
      uom: "Units",
      description: "High-flow oil filter for industrial machinery",
      image_data: getProductSvg("FLT-006"),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.products = [prod1, prod2, prod3, prod4, prod5, prod6];

    // ── 4. Stock Distribution matching Image 1 (Shelf A-1: 180, WH Alpha: 560 = Total 740) ──
    // Op A (Done): Initial Receipt from Acme -> Warehouse Alpha (Steel Widget 120, Titanium Bolt 400, Rubber Gasket 200, Ball Bearing 80)
    const opReceiptDone: DemoOperation = {
      id: "op-00000000-0001",
      reference: "WH/REC/00001",
      type: "RECEIPT",
      state: "DONE",
      sourceLocationId: locAcme.id,
      destLocationId: locWhAlpha.id,
      createdById: this.users[0].id,
      scheduledDate: new Date("2026-09-24T12:24:00Z"),
      doneDate: new Date("2026-09-24T12:24:00Z"),
      notes: "Initial receipt from Acme Supplies",
      createdAt: new Date("2026-09-24T12:00:00Z"),
      updatedAt: new Date("2026-09-24T12:24:00Z"),
    };

    const linesA: DemoOperationLine[] = [
      { id: "line-0001", operationId: opReceiptDone.id, productId: prod1.id, quantityPlanned: 120, quantityDone: 120 },
      { id: "line-0002", operationId: opReceiptDone.id, productId: prod2.id, quantityPlanned: 400, quantityDone: 400 },
      { id: "line-0003", operationId: opReceiptDone.id, productId: prod3.id, quantityPlanned: 200, quantityDone: 200 },
      { id: "line-0004", operationId: opReceiptDone.id, productId: prod5.id, quantityPlanned: 80, quantityDone: 80 },
    ];

    const movesA: DemoStockMove[] = [
      { id: "sm-0001", operationId: opReceiptDone.id, productId: prod1.id, fromLocationId: locAcme.id, toLocationId: locWhAlpha.id, quantity: 120, movedAt: new Date("2026-09-24T12:24:00Z") },
      { id: "sm-0002", operationId: opReceiptDone.id, productId: prod2.id, fromLocationId: locAcme.id, toLocationId: locWhAlpha.id, quantity: 400, movedAt: new Date("2026-09-24T12:24:00Z") },
      { id: "sm-0003", operationId: opReceiptDone.id, productId: prod3.id, fromLocationId: locAcme.id, toLocationId: locWhAlpha.id, quantity: 200, movedAt: new Date("2026-09-24T12:24:00Z") },
      { id: "sm-0004", operationId: opReceiptDone.id, productId: prod5.id, fromLocationId: locAcme.id, toLocationId: locWhAlpha.id, quantity: 80, movedAt: new Date("2026-09-24T12:24:00Z") },
    ];

    // Op B (Done): Internal Transfer Warehouse Alpha -> Shelf A-1 (Steel Widget 40, Titanium Bolt 150 = 190, adjusted with delivery)
    const opTransferDone: DemoOperation = {
      id: "op-00000000-0002",
      reference: "WH/INT/00001",
      type: "INTERNAL_TRANSFER",
      state: "DONE",
      sourceLocationId: locWhAlpha.id,
      destLocationId: locShelfA1.id,
      createdById: this.users[0].id,
      scheduledDate: new Date("2026-09-25T12:24:00Z"),
      doneDate: new Date("2026-09-25T12:24:00Z"),
      notes: "Relocation to high density shelf A-1",
      createdAt: new Date("2026-09-25T11:00:00Z"),
      updatedAt: new Date("2026-09-25T12:24:00Z"),
    };

    const linesB: DemoOperationLine[] = [
      { id: "line-0005", operationId: opTransferDone.id, productId: prod1.id, quantityPlanned: 40, quantityDone: 40 },
      { id: "line-0006", operationId: opTransferDone.id, productId: prod2.id, quantityPlanned: 150, quantityDone: 150 },
    ];

    const movesB: DemoStockMove[] = [
      { id: "sm-0005", operationId: opTransferDone.id, productId: prod1.id, fromLocationId: locWhAlpha.id, toLocationId: locShelfA1.id, quantity: 40, movedAt: new Date("2026-09-25T12:24:00Z") },
      { id: "sm-0006", operationId: opTransferDone.id, productId: prod2.id, fromLocationId: locWhAlpha.id, toLocationId: locShelfA1.id, quantity: 150, movedAt: new Date("2026-09-25T12:24:00Z") },
      // Minor relocation adjustment so Shelf A-1 = exactly 180
      { id: "sm-0007", operationId: opTransferDone.id, productId: prod1.id, fromLocationId: locShelfA1.id, toLocationId: locWhAlpha.id, quantity: 10, movedAt: new Date("2026-09-25T13:00:00Z") },
    ];

    // Op C (Done): Delivery Warehouse Alpha -> Retail Customers (Steel Widget 15, Rubber Gasket 30 = 45 deducted)
    const opDeliveryDone: DemoOperation = {
      id: "op-00000000-0003",
      reference: "WH/OUT/00001",
      type: "DELIVERY",
      state: "DONE",
      sourceLocationId: locWhAlpha.id,
      destLocationId: locRetail.id,
      createdById: this.users[0].id,
      scheduledDate: new Date("2026-09-26T12:25:00Z"),
      doneDate: new Date("2026-09-26T12:25:00Z"),
      notes: "Customer order #1042 fulfillment",
      createdAt: new Date("2026-09-26T10:00:00Z"),
      updatedAt: new Date("2026-09-26T12:25:00Z"),
    };

    const linesC: DemoOperationLine[] = [
      { id: "line-0007", operationId: opDeliveryDone.id, productId: prod1.id, quantityPlanned: 15, quantityDone: 15 },
      { id: "line-0008", operationId: opDeliveryDone.id, productId: prod3.id, quantityPlanned: 30, quantityDone: 30 },
    ];

    const movesC: DemoStockMove[] = [
      { id: "sm-0008", operationId: opDeliveryDone.id, productId: prod3.id, fromLocationId: locWhAlpha.id, toLocationId: locRetail.id, quantity: 30, movedAt: new Date("2026-09-26T12:25:00Z") },
      { id: "sm-0009", operationId: opDeliveryDone.id, productId: prod1.id, fromLocationId: locWhAlpha.id, toLocationId: locRetail.id, quantity: 15, movedAt: new Date("2026-09-26T12:25:00Z") },
    ];

    // Extra move for Titanium bolt delivery to customer (matching Image 1 recent movements)
    const movesExtra: DemoStockMove[] = [
      { id: "sm-0010", operationId: opDeliveryDone.id, productId: prod2.id, fromLocationId: locWhAlpha.id, toLocationId: locRetail.id, quantity: 50, movedAt: new Date("2026-09-24T11:10:00Z") },
    ];

    // Op D (Draft): Operation matching Image 4 (WH/REC/00002)
    const opDraft: DemoOperation = {
      id: "op-00000000-0004",
      reference: "WH/REC/00002",
      type: "RECEIPT",
      state: "DRAFT",
      sourceLocationId: locGlobal.id,
      destLocationId: locWhBeta.id,
      createdById: this.users[0].id,
      scheduledDate: new Date("2026-09-29T10:00:00Z"),
      doneDate: null,
      notes: "Incoming replenishment shipment from Global Parts",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const linesD: DemoOperationLine[] = [
      { id: "line-0009", operationId: opDraft.id, productId: prod4.id, quantityPlanned: 50, quantityDone: 0 },
      { id: "line-0010", operationId: opDraft.id, productId: prod6.id, quantityPlanned: 60, quantityDone: 0 },
    ];

    this.operations = [opDeliveryDone, opTransferDone, opReceiptDone, opDraft];
    this.operationLines = [...linesA, ...linesB, ...linesC, ...linesD];
    this.stockMoves = [...movesC, ...movesB, ...movesA, ...movesExtra];
  }
}

// Global Singleton for in-memory database
const globalForMock = globalThis as unknown as { mockDb?: MockDatabase };
export const mockDb = globalForMock.mockDb ?? new MockDatabase();
if (process.env.NODE_ENV !== "production") globalForMock.mockDb = mockDb;
mockDb.users.forEach((u) => {
  if (u.name === "Nasir Ahmad") u.name = "Alex Morgan";
});
mockDb.persist();

// Helper to assemble full operation with lines, products, and locations
export function enrichOperation(op: DemoOperation) {
  // Sanitize any legacy malformed reference (e.g. DEL/NaN -> DEL/00002)
  if (!op.reference || op.reference.includes("NaN")) {
    const prefix = op.type === "RECEIPT" ? "REC" : op.type === "DELIVERY" ? "DEL" : "INT";
    const sameTypeOps = mockDb.operations.filter((o) => o.type === op.type);
    const idx = sameTypeOps.indexOf(op) + 1;
    op.reference = `${prefix}/${String(idx).padStart(5, "0")}`;
  }

  const sourceLocation = mockDb.locations.find((l) => l.id === op.sourceLocationId)!;
  const destLocation = mockDb.locations.find((l) => l.id === op.destLocationId)!;
  const createdBy = mockDb.users.find((u) => u.id === op.createdById)!;
  const lines = mockDb.operationLines
    .filter((line) => line.operationId === op.id)
    .map((line) => {
      const product = mockDb.products.find((p) => p.id === line.productId)!;
      return { ...line, product };
    });
  const stockMoves = mockDb.stockMoves
    .filter((m) => m.operationId === op.id)
    .map((m) => {
      const product = mockDb.products.find((p) => p.id === m.productId)!;
      const fromLocation = mockDb.locations.find((l) => l.id === m.fromLocationId)!;
      const toLocation = mockDb.locations.find((l) => l.id === m.toLocationId)!;
      return { ...m, product, fromLocation, toLocation };
    });

  return {
    ...op,
    sourceLocation,
    destLocation,
    createdBy,
    lines,
    stockMoves,
  };
}
