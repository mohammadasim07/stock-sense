# StockSense — Intelligent Inventory Management System

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.3.6-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-v4-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

**A modular, Odoo-inspired Enterprise Inventory Management System (IMS) powered by an immutable Double-Entry Stock Ledger, strict Operation State Machine, Visual Wayfinding, and a Smart Prisma Proxy with Zero-Config Demo Fallback.**

</div>

---

## Table of Contents

1. [Executive Overview](#-executive-overview)
2. [Core Architectural Pillars](#-core-architectural-pillars)
   - [1. Immutable Double-Entry Stock Ledger](#1-immutable-double-entry-stock-ledger)
   - [2. Strict Operation State Machine & ACID Validation](#2-strict-operation-state-machine--acid-validation)
   - [3. Smart Prisma Proxy & Zero-Config Demo Fallback](#3-smart-prisma-proxy--zero-config-demo-fallback)
   - [4. Visual Wayfinding & Client-Side WebP Compression](#4-visual-wayfinding--client-side-webp-compression)
   - [5. Global Command Palette & Multi-Role OTP Auth](#5-global-command-palette--multi-role-otp-auth)
3. [System Architecture & Diagrams](#-system-architecture--diagrams)
   - [High-Level System Architecture](#high-level-system-architecture)
   - [Database Entity-Relationship Diagram (ERD)](#database-entity-relationship-diagram-erd)
   - [Operation Lifecycle State Machine](#operation-lifecycle-state-machine)
   - [Double-Entry Stock Flow Topology](#double-entry-stock-flow-topology)
4. [Tech Stack](#-tech-stack)
5. [Project Directory Structure](#-project-directory-structure)
6. [Database Schema & Data Model](#-database-schema--data-model)
7. [Complete REST API Reference](#-complete-rest-api-reference)
8. [Frontend Modules & User Workflows](#-frontend-modules--user-workflows)
9. [Pre-Seeded Demo Data & Personas](#-pre-seeded-demo-data--personas)
10. [Getting Started & Local Setup](#-getting-started--local-setup)
11. [Available Scripts](#-available-scripts)

---

## Executive Overview

**StockSense** reimagines warehouse and inventory management by combining the accounting rigor of **Odoo ERP's double-entry inventory system** with a modern, high-speed React 19 + Next.js App Router user experience.

Traditional inventory apps store a mutable `quantity` column on a product or warehouse table—an anti-pattern prone to race conditions, silent discrepancies, and lost audit history. **StockSense never stores stock as a mutable column.** Instead, every stock change is an immutable movement record (`StockMove`) between two locations, and all stock balances across the entire application are dynamically derived in real time from the ledger.

Additionally, StockSense features a **Smart Prisma Proxy** that probes local PostgreSQL availability on port `5432`. If PostgreSQL is running, it executes full relational queries and ACID transactions via Prisma. If PostgreSQL is not running, it transparently and instantaneously dispatches to an **In-Memory + JSON-Persisted Mock Prisma Engine** (`.stocksense-db.json`), allowing anyone to clone and run the full application with zero database setup.

---

## Core Architectural Pillars

### 1. Immutable Double-Entry Stock Ledger
Implemented in [`src/lib/ledger.ts`](src/lib/ledger.ts), StockSense treats every inventory movement like a financial accounting journal entry:
- **No Mutable Stock Columns**: Neither `Product` nor `Location` has a `stock` column in the database schema.
- **Real-Time Ledger Derivation**: Current stock for any product $p$ at any location $l$ is computed dynamically as:
  $$\text{Stock}(p, l) = \sum_{\text{toLocationId}=l} \text{quantity} - \sum_{\text{fromLocationId}=l} \text{quantity}$$
- **Unified Location Taxonomy**:
  - `VENDOR`: External supplier sources (treated as infinite supply during receipt availability checks).
  - `INTERNAL`: Physical warehouses, zones, racks, and shelves (`Warehouse Alpha`, `Warehouse Beta`, `Shelf A-1`, `Shelf A-2`). Supports hierarchical parent-child nesting (`parentId`).
  - `CUSTOMER`: External client destinations for outbound deliveries.
  - `VIRTUAL`: Counterpart locations for inventory loss, scrap, damaged goods, and stock adjustments.

### 2. Strict Operation State Machine & ACID Validation
Implemented in [`src/lib/state-machine.ts`](src/lib/state-machine.ts), every inventory operation (`RECEIPT`, `DELIVERY`, `INTERNAL_TRANSFER`) follows a deterministic lifecycle:
- **`DRAFT` → `WAITING` (`confirm`)**: Verifies the operation has at least one product line item and locks the draft for availability verification.
- **`WAITING` → `READY` (`check_availability`)**:
  - For `VENDOR` source locations, availability automatically succeeds.
  - For `INTERNAL` source locations, checks `getStockAtLocation(productId, sourceLocationId) >= requiredQty` for every line item.
  - **Cross-Location Stock Hints**: If a source location has insufficient stock, the state machine automatically queries all other active `INTERNAL` locations and appends actionable hints to the error response (e.g., `Insufficient stock for "Steel Widget": need 150, have 75 at Warehouse Alpha (Note: 30 units at Shelf A-1)`).
- **`READY` → `DONE` (`validate`)**:
  - Executes inside an atomic **`prisma.$transaction`**.
  - Creates immutable `StockMove` records for each `OperationLine`.
  - Automatically backfills `quantityDone = quantityPlanned` if `quantityDone` was `0`.
  - Sets the operation `state` to `DONE` and records the `doneDate` timestamp.
- **`DRAFT | WAITING | READY` → `CANCELLED` (`cancel`)**: Cancels pending operations prior to completion (`DONE` operations are immutable and cannot be cancelled).
- **Auto-Sequenced References**: Generates human-readable operation codes (`REC/00001`, `DEL/00001`, `INT/00001`) via `generateReference()`.

### 3. Smart Prisma Proxy & Zero-Config Demo Fallback
Implemented across [`src/lib/prisma.ts`](src/lib/prisma.ts), [`src/lib/mock-client.ts`](src/lib/mock-client.ts), and [`src/lib/mock-db.ts`](src/lib/mock-db.ts):
- At startup, `checkPostgresPort()` performs a fast `250ms` TCP socket probe against `127.0.0.1:5432`.
- `prisma` is exported as an ES6 `Proxy` wrapping both the real `@prisma/client` instance and `fallbackPrisma` (`MockPrismaClient`).
- If port `5432` is unreachable—or if any Prisma query throws `P1001` (`Can't reach database`)—the proxy seamlessly routes all model calls (`user`, `product`, `location`, `operation`, `operationLine`, `stockMove`, `$transaction`, `$disconnect`) to `MockPrismaClient`.
- `MockDatabase` persists all mutations to `.stocksense-db.json` and comes pre-populated with custom-crafted SVG product illustrations, location icons, and ledger movements.

### 4. Visual Wayfinding & Client-Side WebP Compression
Implemented in [`src/components/CompressedImageUpload.tsx`](src/components/CompressedImageUpload.tsx):
- Warehouse operators rely on visual recognition of parts and storage racks (**Visual Wayfinding**).
- Both **Products** and **Locations** support drag-and-drop photo uploads.
- Before upload, images are processed client-side in a Web Worker via `browser-image-compression`:
  - Converted to **`image/webp`** format
  - Constrained to **`800px`** max width/height
  - Compressed to **`~150KB`** target (`initialQuality: 0.7`)
- Displays live optimization metrics (e.g., `Optimized 84% (940KB → 148KB WebP)`) and stores the resulting Base64 data URI directly in `image_data`.

### 5. Global Command Palette & Multi-Role OTP Auth
- **Command Palette (`Ctrl+K` / `Cmd+K`)**: Implemented in [`src/components/shared/CommandPalette.tsx`](src/components/shared/CommandPalette.tsx), providing instant keyboard-driven search across Products (by name, SKU, barcode, category), Locations (by name, type, address), and Operations (by reference, type, state, route), plus quick-jump navigation tiles.
- **OTP Authentication & Instant Role Switcher**: Implemented in [`src/lib/auth.ts`](src/lib/auth.ts), [`src/lib/auth-context.tsx`](src/lib/auth-context.tsx), and [`src/app/login/page.tsx`](src/app/login/page.tsx). Supports passwordless email + 6-digit OTP login (default demo OTP: `123456`), NextAuth v5 JWT sessions, cookie persistence (`stocksense_session`), 1-click demo login cards, and a live account switcher in the sidebar.

---

## System Architecture & Diagrams

### High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Layer (React 19 + Next.js 16 App Router)"]
        UI_Dash["Dashboard Page\n(KPIs, Recharts BarChart, Recent Moves)"]
        UI_Prod["Products Catalog\n(Grid, Barcodes, CSV Export, Ledger Drawer)"]
        UI_Loc["Locations Map\n(Wayfinding Cards, Stock Drawer)"]
        UI_Ops["Operations Workspace\n(4-Col Kanban Board, Table View, Detail & Print)"]
        UI_Cmd["Command Palette (Ctrl+K)\n& CompressedImageUpload (WebP)"]
        RQ["TanStack React Query v5\n(Caching & Automatic Invalidation)"]
    end

    subgraph API["Next.js Route Handlers (/api/*)"]
        API_Auth["/api/auth/*\n(request-otp, verify-otp, logout, NextAuth)"]
        API_Prod["/api/products & /api/products/:id"]
        API_Loc["/api/locations & /api/locations/:id"]
        API_Ops["/api/operations, /:id, /:id/transition"]
        API_Stock["/api/stock/summary\n(views: summary | kpis | moves)"]
    end

    subgraph Core["Domain & Business Logic Layer (src/lib/*)"]
        ZOD["Zod v4 Schema Validators\n(validators.ts)"]
        SM["Operation State Machine\n(state-machine.ts)"]
        LEDGER["Double-Entry Ledger Engine\n(ledger.ts)"]
        PROXY["Smart Prisma Proxy\n(prisma.ts — TCP 5432 Probe)"]
    end

    subgraph Storage["Dual-Mode Persistence Layer"]
        PG[("PostgreSQL Database\n(Prisma Client)")]
        MOCK[("In-Memory + JSON Fallback\n(.stocksense-db.json)")]
    end

    UI_Dash & UI_Prod & UI_Loc & UI_Ops & UI_Cmd --> RQ
    RQ --> API_Auth & API_Prod & API_Loc & API_Ops & API_Stock
    API_Auth & API_Prod & API_Loc & API_Ops & API_Stock --> ZOD
    API_Ops --> SM
    API_Prod & API_Loc & API_Stock & SM --> LEDGER
    SM & LEDGER & API_Auth & API_Prod & API_Loc & API_Ops --> PROXY
    PROXY -->|"Port 5432 Active"| PG
    PROXY -->|"Port 5432 Unreachable"| MOCK
```

---

### Database Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ OPERATION : "creates (createdById)"
    LOCATION ||--o{ LOCATION : "parent/children (parentId)"
    LOCATION ||--o{ OPERATION : "source (sourceLocationId)"
    LOCATION ||--o{ OPERATION : "destination (destLocationId)"
    LOCATION ||--o{ STOCK_MOVE : "movesFrom (fromLocationId)"
    LOCATION ||--o{ STOCK_MOVE : "movesTo (toLocationId)"
    OPERATION ||--|{ OPERATION_LINE : "contains (operationId)"
    OPERATION ||--o{ STOCK_MOVE : "generates (operationId)"
    PRODUCT ||--o{ OPERATION_LINE : "referenced in (productId)"
    PRODUCT ||--o{ STOCK_MOVE : "moved in (productId)"

    USER {
        uuid id PK
        string name
        string email UK
        string password
        Role role "ADMIN | MANAGER | OPERATOR"
        string otp
        datetime otpExpiry
        datetime createdAt
        datetime updatedAt
    }

    PRODUCT {
        uuid id PK
        string name
        string sku UK
        string barcode UK
        string category "Default: General"
        string uom "Default: Units"
        text description
        text image_data "Base64 WebP / SVG"
        boolean isActive "Default: true"
        datetime createdAt
        datetime updatedAt
    }

    LOCATION {
        uuid id PK
        string name
        LocationType type "VENDOR | INTERNAL | CUSTOMER | VIRTUAL"
        string address
        text image_data "Base64 WebP / SVG"
        uuid parentId FK
        boolean isActive "Default: true"
        datetime createdAt
        datetime updatedAt
    }

    OPERATION {
        uuid id PK
        string reference UK "REC/00001 | DEL/00001 | INT/00001"
        OperationType type "RECEIPT | DELIVERY | INTERNAL_TRANSFER"
        OperationState state "DRAFT | WAITING | READY | DONE | CANCELLED"
        uuid sourceLocationId FK
        uuid destLocationId FK
        uuid createdById FK
        datetime scheduledDate
        datetime doneDate
        text notes
        datetime createdAt
        datetime updatedAt
    }

    OPERATION_LINE {
        uuid id PK
        uuid operationId FK
        uuid productId FK
        int quantityPlanned
        int quantityDone "Default: 0"
    }

    STOCK_MOVE {
        uuid id PK
        uuid operationId FK
        uuid productId FK
        uuid fromLocationId FK
        uuid toLocationId FK
        int quantity
        datetime movedAt
    }
```

---

### Operation Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT : POST /api/operations\n(Editable lines, schedule, notes)

    DRAFT --> WAITING : action = "confirm"\n(Requires >= 1 line item)
    WAITING --> READY : action = "check_availability"\n(Verifies source stock or VENDOR source)
    WAITING --> WAITING : Availability Check Failed\n(Returns per-item shortage + cross-location hints)
    READY --> DONE : action = "validate"\n(ACID Transaction: Creates StockMove rows & sets doneDate)

    DRAFT --> CANCELLED : action = "cancel"
    WAITING --> CANCELLED : action = "cancel"
    READY --> CANCELLED : action = "cancel"

    DONE --> [*]
    CANCELLED --> [*]
```

---

### Double-Entry Stock Flow Topology

```mermaid
flowchart LR
    V["🏭 VENDOR Location\n(e.g., Acme Supplies)"]
    W["🏬 INTERNAL Location\n(e.g., Warehouse Alpha)"]
    S["📦 INTERNAL Sub-Location\n(e.g., Shelf A-1)"]
    C["🛍️ CUSTOMER Location\n(e.g., Retail Customers)"]
    L["⚠️ VIRTUAL Location\n(e.g., Inventory Loss)"]

    V -->|"RECEIPT\n(+Qty to Warehouse, -Qty from Vendor)"| W
    W -->|"INTERNAL_TRANSFER\n(-Qty from WH Alpha, +Qty to Shelf A-1)"| S
    S -->|"INTERNAL_TRANSFER\n(-Qty from Shelf A-1, +Qty to WH Alpha)"| W
    W -->|"DELIVERY\n(-Qty from Warehouse, +Qty to Customer)"| C
    W -.->|"Scrap / Adjustment\n(-Qty from Warehouse, +Qty to Virtual)"| L
```

---

## Tech Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | [Next.js (App Router)](https://nextjs.org/) | `16.3.6` | Full-stack React framework, SSR, and REST API Route Handlers |
| **UI Library** | [React](https://react.dev/) | `19.2.8` | Component architecture, hooks, and concurrent rendering |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `^5` | End-to-end static typing across ORM, API, and UI |
| **ORM & Database** | [Prisma](https://www.prisma.io/) + PostgreSQL | `^6.19.3` | Relational schema, migrations, ACID transactions, and aggregations |
| **Fallback Engine** | Custom `MockPrismaClient` | Built-in | Zero-config in-memory + `.stocksense-db.json` persistence fallback |
| **Data Fetching** | [TanStack React Query](https://tanstack.com/query) | `^5.104.0` | Client-side caching, mutations, and automatic query invalidation |
| **Validation** | [Zod](https://zod.dev/) | `^4.6.5` | Runtime request payload parsing and schema validation |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^4` | Utility-first styling, custom animations, and responsive layout |
| **UI Primitives** | [Radix UI](https://www.radix-ui.com/) + Lucide | Latest | Accessible dialogs, dropdowns, popovers, tabs, and iconography |
| **Charts** | [Recharts](https://recharts.org/) | `^3.10.1` | Interactive Stock Distribution by Location bar chart |
| **Image Optimization** | `browser-image-compression` | `^2.0.2` | Client-side Web Worker image compression to WebP (~150KB) |
| **Authentication** | [NextAuth.js v5](https://authjs.dev/) + Custom OTP | `5.0.0-beta.32` | Passwordless email OTP verification, JWT & session cookies |

---

## Project Directory Structure

```text
Odoo/
└── stock-sense/
    ├── .env.example                     # Environment variables template
    ├── next.config.ts                   # Next.js configuration (10MB server actions body limit)
    ├── package.json                     # Dependencies, Prisma seed config, and npm scripts
    ├── postcss.config.mjs               # Tailwind CSS v4 PostCSS plugin setup
    ├── tsconfig.json                    # TypeScript configuration (@/* -> ./src/*)
    ├── prisma/
    │   ├── schema.prisma                # PostgreSQL database schema (6 models, 4 enums, indexes)
    │   └── seed.ts                      # Prisma database seeder for PostgreSQL environments
    └── src/
        ├── types/
        │   └── index.ts                 # Shared TypeScript interfaces (KPIs, Operations, Stock, Pagination)
        ├── lib/
        │   ├── prisma.ts                # Smart Prisma Proxy (auto-switches between PostgreSQL & MockDB)
        │   ├── mock-db.ts               # In-memory + .stocksense-db.json database with SVG generators
        │   ├── mock-client.ts           # Full Prisma Client interface implementation for MockDB
        │   ├── ledger.ts                # Double-Entry Stock Ledger calculation & aggregation functions
        │   ├── state-machine.ts         # Operation State Machine (confirm, check_availability, validate, cancel)
        │   ├── validators.ts            # Zod validation schemas for Auth, Products, Locations, Operations
        │   ├── auth.ts                  # NextAuth v5 CredentialsProvider (OTP Login) & JWT callbacks
        │   ├── auth-context.tsx         # Client-side AuthProvider, localStorage sync & account switcher
        │   └── utils.ts                 # Tailwind cn(), date formatters, badge color helpers, API responses
        ├── components/
        │   ├── Barcode.tsx              # Deterministic visual barcode generator component
        │   ├── CompressedImageUpload.tsx# Client-side WebP image compressor & drag-and-drop uploader
        │   └── shared/
        │       ├── AppLayout.tsx        # Master layout shell (Sidebar + TopHeader + Main viewport)
        │       ├── Sidebar.tsx          # Navigation sidebar with live Demo Account Switcher
        │       ├── TopHeader.tsx        # Sticky top bar with Ctrl+K search trigger & user pill
        │       └── CommandPalette.tsx   # Global Ctrl+K modal searching Products, Locations & Operations
        └── app/
            ├── globals.css              # Design tokens, card styles, shimmer & fadeInUp animations
            ├── layout.tsx               # Root HTML shell wrapping Providers and AppLayout
            ├── providers.tsx            # TanStack QueryClientProvider + AuthProvider wrapper
            ├── page.tsx                 # Root redirector (/ -> /dashboard or /login based on cookie)
            ├── login/
            │   └── page.tsx             # 2-step Email OTP login + 1-Click Demo Persona Login
            ├── dashboard/
            │   └── page.tsx             # Real-time KPIs, Recharts Stock Distribution chart & Recent Moves
            ├── products/
            │   └── page.tsx             # Product catalog grid, category filters, CSV export, Ledger drawer
            ├── locations/
            │   └── page.tsx             # Locations grid, type filters, Wayfinding photos, Stock breakdown drawer
            ├── operations/
            │   ├── page.tsx             # 4-Column Kanban Board & List Table view with inline transitions
            │   ├── new/
            │   │   └── page.tsx         # Operation builder with smart location filtering & live source stock
            │   └── [id]/
            │       └── page.tsx         # Operation detail view, state progress ribbon, packing slip print & audit trail
            └── api/
                ├── auth/
                │   ├── [...nextauth]/route.ts  # NextAuth GET/POST handler
                │   ├── request-otp/route.ts    # POST: Generate & store 6-digit OTP
                │   ├── verify-otp/route.ts     # POST: Verify OTP & set stocksense_session cookie
                │   └── logout/route.ts         # POST: Clear session cookie
                ├── products/
                │   ├── route.ts                # GET (paginated + enriched stock), POST (create product)
                │   └── [id]/route.ts           # GET (with stockByLocation), PUT (update), DELETE (soft-delete)
                ├── locations/
                │   ├── route.ts                # GET (tree or flat list), POST (create location)
                │   └── [id]/route.ts           # GET (with currentStock), PUT (update), DELETE (soft-delete)
                ├── operations/
                │   ├── route.ts                # GET (paginated list), POST (create DRAFT with type rules)
                │   └── [id]/
                │       ├── route.ts            # GET (full details + stockMoves), PUT (edit DRAFT operation)
                │       └── transition/route.ts # POST (execute state machine transition)
                └── stock/
                    └── summary/route.ts        # GET (?view=summary | kpis | moves)
```

---

## Database Schema & Data Model

Defined in [`prisma/schema.prisma`](prisma/schema.prisma), the data model consists of **4 Enums** and **6 Relational Models**:

### Enums
| Enum | Values | Description |
| :--- | :--- | :--- |
| `Role` | `ADMIN`, `MANAGER`, `OPERATOR` | User permission & persona tier |
| `LocationType` | `VENDOR`, `INTERNAL`, `CUSTOMER`, `VIRTUAL` | Classification of inventory locations |
| `OperationType` | `RECEIPT`, `DELIVERY`, `INTERNAL_TRANSFER` | Direction & nature of stock movement |
| `OperationState` | `DRAFT`, `WAITING`, `READY`, `DONE`, `CANCELLED` | Strict state machine stages |

### Models & Indexes
1. **`User` (`users`)**: Stores user profile (`id`, `name`, `email`, `password`, `role`) and temporary OTP fields (`otp`, `otpExpiry`).
2. **`Product` (`products`)**: Stores catalog metadata (`id`, `name`, `sku` unique, `barcode` unique, `category`, `uom`, `description`, `image_data`, `isActive`). Soft-deleted via `isActive = false`.
3. **`Location` (`locations`)**: Stores physical or logical zones (`id`, `name`, `type`, `address`, `image_data`, `parentId`, `isActive`). Supports self-referential tree hierarchy (`LocationHierarchy`) so shelves (`Shelf A-1`, `Shelf A-2`) belong to parent warehouses (`Warehouse Alpha`).
4. **`Operation` (`operations`)**: Header record for a stock movement batch (`id`, `reference` unique, `type`, `state`, `sourceLocationId`, `destLocationId`, `createdById`, `scheduledDate`, `doneDate`, `notes`).
5. **`OperationLine` (`operation_lines`)**: Individual product rows within an operation (`id`, `operationId` with `onDelete: Cascade`, `productId`, `quantityPlanned`, `quantityDone`).
6. **`StockMove` (`stock_moves`)**: The immutable double-entry ledger table (`id`, `operationId`, `productId`, `fromLocationId`, `toLocationId`, `quantity`, `movedAt`).
   - **Performance Indexes**:
     - `@@index([productId, fromLocationId])` — fast outgoing sum aggregation
     - `@@index([productId, toLocationId])` — fast incoming sum aggregation
     - `@@index([operationId])` — fast audit trail lookup per operation
     - `@@index([movedAt])` — chronological feed sorting

---

## Complete REST API Reference

All endpoints return JSON and validate payloads using Zod schemas in [`src/lib/validators.ts`](src/lib/validators.ts).

### Authentication Endpoints

| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/request-otp` | Generates a 10-minute OTP (`123456` in demo mode) for a registered email. | `{ "email": "admin@stocksense.io" }` | `200 OK`: `{ message, otp? }` |
| `POST` | `/api/auth/verify-otp` | Verifies the 6-digit OTP, clears it from DB, and sets `stocksense_session` cookie. | `{ "email": "admin@stocksense.io", "otp": "123456" }` | `200 OK`: `{ success: true, user }` + `Set-Cookie` |
| `POST` | `/api/auth/logout` | Clears the `stocksense_session` cookie (`Max-Age=0`). | None | `200 OK`: `{ success: true }` |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth v5 session & credentials handlers. | Standard NextAuth payloads | NextAuth JWT/Session JSON |

### Products Endpoints

| Method | Endpoint | Description | Query / Body Parameters | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Lists active products enriched with dynamically computed `totalStock`. | `?search=&category=&barcode=&page=1&limit=20` | `200 OK`: `{ data: ProductWithStock[], pagination }` |
| `POST` | `/api/products` | Creates a new product after checking SKU and barcode uniqueness. | `{ name, sku, barcode?, category?, uom?, description?, image_data? }` | `201 Created` or `409 Conflict` |
| `GET` | `/api/products/:id` | Retrieves product details plus `stockByLocation` breakdown across all internal locations. | Path param: `id` | `200 OK`: `{ ...product, stockByLocation, totalStock }` |
| `PUT` | `/api/products/:id` | Updates product metadata or compressed WebP photo. | Partial product fields | `200 OK`: Updated product |
| `DELETE` | `/api/products/:id` | Soft-deletes a product by setting `isActive: false`. | Path param: `id` | `200 OK`: `{ message: "Product deleted" }` |

### Locations Endpoints

| Method | Endpoint | Description | Query / Body Parameters | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/locations` | Lists active locations as a nested hierarchy (default) or flat list (`?flat=true`). | `?type=INTERNAL&flat=true` | `200 OK`: `{ data: LocationWithChildren[] }` |
| `POST` | `/api/locations` | Creates a new location with optional parent and wayfinding photo. | `{ name, type, address?, image_data?, parentId? }` | `201 Created` |
| `GET` | `/api/locations/:id` | Gets a location with its `parent`, `children`, and ledger-derived `currentStock` array. | Path param: `id` | `200 OK`: `{ ...location, currentStock }` |
| `PUT` | `/api/locations/:id` | Updates location details or wayfinding image. | Partial location fields | `200 OK`: Updated location |
| `DELETE` | `/api/locations/:id` | Soft-deletes a location by setting `isActive: false`. | Path param: `id` | `200 OK`: `{ message: "Location deleted" }` |

### Operations & State Machine Endpoints

| Method | Endpoint | Description | Query / Body Parameters | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/operations` | Lists operations with source/destination locations, product lines, and move counts. | `?type=RECEIPT&state=DRAFT&page=1&limit=50` | `200 OK`: `{ data: OperationWithDetails[], pagination }` |
| `POST` | `/api/operations` | Creates a new operation in `DRAFT` state with auto-generated reference (`REC/00001`, etc.). Enforces location-type rules: `RECEIPT` source must be `VENDOR`; `DELIVERY` destination must be `CUSTOMER`; `INTERNAL_TRANSFER` must be between `INTERNAL` locations. | `{ type, sourceLocationId, destLocationId, scheduledDate, notes?, lines: [{ productId, quantityPlanned }] }` | `201 Created` or `400 Bad Request` |
| `GET` | `/api/operations/:id` | Returns full operation details including line items and committed `stockMoves` audit trail. | Path param: `id` | `200 OK`: `OperationWithDetails` |
| `PUT` | `/api/operations/:id` | Updates `scheduledDate`, `notes`, and replaces `lines` (only allowed when `state === "DRAFT"`). | `{ scheduledDate?, notes?, lines? }` | `200 OK` or `400 Bad Request` |
| `POST` | `/api/operations/:id/transition` | Executes a state machine transition on the operation. | `{ "action": "confirm" \| "check_availability" \| "validate" \| "cancel" }` | `200 OK` (`TransitionResult`) or `422 Unprocessable Entity` (with shortage errors & hints) |

### Stock Ledger & Analytics Endpoints

| Method | Endpoint | Description | Query Parameters | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/stock/summary` | Queries real-time ledger aggregations depending on the `view` parameter. | `?view=summary` (default): Product × Location stock matrix<br>`?view=kpis`: Dashboard KPI counts<br>`?view=moves&limit=20`: Recent `StockMove` feed | `200 OK` |

---

## Frontend Modules & User Workflows

### 1. Login & Role Persona Switcher (`/login`)
- **Two-Step OTP Flow**: Enter email → receive 6-digit code (`123456` auto-fillable in demo) → verify & redirect to `/dashboard`.
- **1-Click Demo Login**: Instant sign-in buttons for **Alex Morgan** (`ADMIN`), **Sarah Manager** (`MANAGER`), and **John Operator** (`OPERATOR`).
- **Sidebar Account Switcher**: Switch active roles at any time from the bottom-left user profile menu without logging out.

### 2. Real-Time Dashboard (`/dashboard`)
- **4 Live KPI Cards**:
  1. **Total Products**: Count of active catalog SKUs.
  2. **Stock Units**: Total net inventory units across all `INTERNAL` locations.
  3. **Pending Ops**: Operations currently in `DRAFT`, `WAITING`, or `READY`.
  4. **Completed Today**: Operations transitioned to `DONE` since midnight.
- **Stock Distribution by Location Chart**: Interactive Recharts bar chart aggregating stock units across internal locations (e.g., `Shelf A-1: 180`, `Warehouse Alpha: 560`).
- **Recent Movements Feed**: Real-time stream of `StockMove` entries color-coded by movement direction (Inbound = Emerald, Internal Transfer = Blue, Outbound Delivery = Rose).

### 3. Products Catalog & Ledger Inspector (`/products`)
- **Category Filter Pills**: Filter instantaneously by `ALL`, `COMPONENTS`, `FASTENERS`, `SEALS`, `ELECTRICAL`, or `FILTERS`.
- **Visual Product Cards**: Displays WebP/SVG product thumbnail, category badge, SKU, description, dynamic stock progress bar (or `Out of Stock` alert badge), and a deterministic visual barcode (`<Barcode />`).
- **Slide-Over Product Ledger Drawer**: Clicking any product opens an inspection drawer displaying its total dynamic stock and every historical `StockMove` (`fromLocation → toLocation`, timestamp, and quantity).
- **One-Click CSV Export**: Exports the filtered catalog to `stocksense_catalog_YYYY-MM-DD.csv` with a UTF-8 Byte Order Mark (`\uFEFF`) for seamless Excel compatibility.

### 4. Locations & Wayfinding Map (`/locations`)
- **Type Filter Tabs with Live Counts**: Filter by `All Locations`, `Internal`, `Vendors`, `Customers`, or `Virtual / Scrap`.
- **Live Internal Stock Badges**: Internal locations display real-time unit counts and unique SKU counts derived from `/api/stock/summary`.
- **Slide-Over Location Inventory Drawer**: Clicking any location opens a detailed breakdown of all products currently stored there, its wayfinding reference photo, and a **New Transfer** button that deep-links to `/operations/new?source=<locationId>`.

### 5. Operations Kanban Board, List View & Packing Slips (`/operations`, `/operations/new`, `/operations/[id]`)
- **Dual View Modes**: Toggle between a **4-Column Kanban Board** (`Draft`, `Waiting`, `Ready`, `Done`) and an **Odoo-Style List Table**.
- **Inline State Transitions**: Advance operations directly from Kanban cards or table rows (`Confirm` → `Check Availability` → `Validate ✓` or `Cancel`).
- **Smart Operation Builder (`/operations/new`)**:
  - Selecting an operation type (`RECEIPT`, `DELIVERY`, `INTERNAL_TRANSFER`) automatically filters valid source and destination locations and displays their wayfinding thumbnails.
  - Product dropdowns display live stock at the selected source location (`At Source: X Units (Y total in WH)`).
- **Operation Detail & Printable Packing Slip (`/operations/[id]`)**:
  - Visual 4-step **Odoo-Style State Progress Ribbon** (`1. Draft` → `2. Waiting` → `3. Ready` → `4. Done`).
  - Route & Wayfinding comparison card (`From` → `To`).
  - Line Items table comparing `Planned Qty` vs. `Done Qty`.
  - **Double-Entry Ledger Audit Trail (`STOCK_MOVE`)**: Appears automatically once the operation is `DONE`, proving ledger commitment.
  - **Print Packing Slip**: Triggers `window.print()` for physical warehouse fulfillment sheets.

---

## Pre-Seeded Demo Data & Personas

When running in **Zero-Config Demo Mode** ([`src/lib/mock-db.ts`](src/lib/mock-db.ts)) or after seeding PostgreSQL ([`prisma/seed.ts`](prisma/seed.ts)), StockSense includes:

### Demo Accounts (OTP: `123456`)
| Name | Email | Role | Title / Responsibility |
| :--- | :--- | :--- | :--- |
| **Alex Morgan** | `admin@stocksense.io` | `ADMIN` | Warehouse Manager (Full System Access) |
| **Sarah Manager** | `manager@stocksense.io` | `MANAGER` | Operations Lead (Approvals & Transfers) |
| **John Operator** | `operator@stocksense.io` | `OPERATOR` | Stock Handler (Pick & Validate) |

### Pre-Seeded Locations
- **Vendors (`VENDOR`)**: `Acme Supplies`, `Global Parts Ltd`
- **Internal Warehouses & Shelves (`INTERNAL`)**: `Warehouse Alpha` (parent of `Shelf A-1` and `Shelf A-2`), `Warehouse Beta`
- **Customers (`CUSTOMER`)**: `Retail Customers`, `Wholesale Customers` (in Prisma seed)
- **Virtual (`VIRTUAL`)**: `Inventory Loss` (Scrap / Adjustment)

### Pre-Seeded Products & Initial Ledger Balances (Demo Fallback Mode)
| SKU | Product Name | Category | Barcode | UoM | Warehouse Alpha | Shelf A-1 | Total Internal Stock |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| `WDG-001` | **Steel Widget** | `COMPONENTS` | `4901234567890` | Units | 75 | 30 | **105** |
| `BLT-002` | **Titanium Bolt M8** | `FASTENERS` | `4901234567891` | Units | 200 | 150 | **350** |
| `GKT-003` | **Rubber Gasket** | `SEALS` | `4901234567892` | Units | 170 | 0 | **170** |
| `CBL-004` | **Power Cable 3m** | `ELECTRICAL` | `4901234567893` | Meters | 0 | 0 | **0** *(50 incoming in `WH/REC/00002`)* |
| `BRG-005` | **Ball Bearing 6205** | `COMPONENTS` | `4901234567894` | Units | 80 | 0 | **80** |
| `FLT-006` | **Oil Filter HF-204** | `FILTERS` | `4901234567895` | Units | 0 | 0 | **0** *(60 incoming in `WH/REC/00002`)* |

> **Note**: In Demo Fallback Mode, an extra historical outbound move (`sm-0010`) of 50 `BLT-002` units from `Warehouse Alpha` to `Retail Customers` brings total internal stock across `Warehouse Alpha` (525–560 units) and `Shelf A-1` (180 units) to **705–740 units**, with `WH/REC/00002` waiting in `DRAFT` state ready for live demonstration!

---

## Getting Started & Local Setup

### Prerequisites
- **Node.js**: `v18.18+` or `v20+`
- **npm** (or `yarn` / `pnpm` / `bun`)
- **PostgreSQL** *(Optional — StockSense automatically runs in Zero-Config In-Memory/JSON mode if PostgreSQL is not running on port `5432`)*

### 1. Clone & Install Dependencies

```bash
cd stock-sense
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/stocksense` | PostgreSQL connection string (optional if using Zero-Config Demo Mode) |
| `NEXTAUTH_SECRET` | `stocksense-hackathon-super-secret-key-2024` | Secret key used by NextAuth v5 to sign JWT session tokens |
| `NEXTAUTH_URL` | `http://localhost:3000` | Canonical base URL of the application |
| `MOCK_OTP` | `123456` | Universal 6-digit OTP code accepted during demo authentication |

### 3. Run the Application

#### Option A: Zero-Config Demo Mode (Instant Start — No Database Required)
Simply start the development server. StockSense will detect that PostgreSQL is not running on port `5432` and automatically activate the JSON-persisted demo database (`.stocksense-db.json`):

```bash
npm run dev
```

#### Option B: Full PostgreSQL Mode
If you have a local or remote PostgreSQL server running:

```bash
# 1. Push the Prisma schema to PostgreSQL
npm run db:push

# 2. Seed initial users, locations, products, operations, and stock moves
npm run db:seed

# 3. Start the Next.js development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Available Scripts

Run these commands from inside the `stock-sense/` directory:

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `next dev` | Starts the Next.js development server at `http://localhost:3000` |
| `npm run build` | `next build` | Builds the production application bundle |
| `npm run start` | `next start` | Starts the production Next.js server |
| `npm run lint` | `eslint` | Runs ESLint static code analysis |
| `npm run db:generate` | `npx prisma generate` | Generates the TypeScript Prisma Client (also runs automatically on `postinstall`) |
| `npm run db:push` | `npx prisma db push` | Syncs `prisma/schema.prisma` directly with the PostgreSQL database |
| `npm run db:migrate` | `npx prisma migrate dev` | Creates and applies SQL migrations in development |
| `npm run db:seed` | `npx tsx prisma/seed.ts` | Seeds PostgreSQL with demo users, locations, products, and ledger moves |
| `npm run db:studio` | `npx prisma studio` | Opens Prisma Studio GUI to inspect PostgreSQL tables |

---

<div align="center">
  <b>Built with precision for modern warehouse teams — Powered by Double-Entry Ledger Architecture.</b>
</div>
