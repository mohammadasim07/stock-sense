// StockSense — Shared TypeScript Types

export interface KPIData {
  totalProducts: number;
  totalLocations: number;
  pendingOps: number;
  completedToday: number;
  totalStockUnits: number;
  totalStockMoves: number;
}

export interface StockSummaryItem {
  productId: string;
  productName: string;
  sku: string;
  locationId: string;
  locationName: string;
  locationType: string;
  currentStock: number;
}

export interface OperationWithDetails {
  id: string;
  reference: string;
  type: "RECEIPT" | "DELIVERY" | "INTERNAL_TRANSFER";
  state: "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELLED";
  sourceLocation: {
    id: string;
    name: string;
    type: string;
    image_data?: string | null;
    imageData?: string | null;
    photoBase64?: string | null;
  };
  destLocation: {
    id: string;
    name: string;
    type: string;
    image_data?: string | null;
    imageData?: string | null;
    photoBase64?: string | null;
  };
  createdBy: { id: string; name: string };
  scheduledDate: string;
  doneDate: string | null;
  notes: string | null;
  createdAt: string;
  lines: OperationLineWithProduct[];
  stockMoves?: StockMoveWithDetails[];
  _count?: { stockMoves: number };
}

export interface OperationLineWithProduct {
  id: string;
  operationId: string;
  productId: string;
  quantityPlanned: number;
  quantityDone: number;
  product: {
    id: string;
    name: string;
    sku: string;
    category?: string;
    uom?: string;
    image_data?: string | null;
    imageData?: string | null;
  };
}

export interface StockMoveWithDetails {
  id: string;
  operationId: string;
  quantity: number;
  movedAt: string;
  product: {
    id?: string;
    name: string;
    sku: string;
    category?: string;
    uom?: string;
    image_data?: string | null;
    imageData?: string | null;
  };
  fromLocation: {
    id?: string;
    name: string;
    type: string;
    image_data?: string | null;
    imageData?: string | null;
  };
  toLocation: {
    id?: string;
    name: string;
    type: string;
    image_data?: string | null;
    imageData?: string | null;
  };
  operation: { reference: string; type: string };
}

export interface ProductWithStock {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  category: string;
  uom: string;
  description: string | null;
  image_data?: string | null;
  imageData?: string | null;
  isActive: boolean;
  createdAt: string;
  totalStock: number;
}

export interface LocationWithChildren {
  id: string;
  name: string;
  type: "VENDOR" | "INTERNAL" | "CUSTOMER" | "VIRTUAL";
  address: string | null;
  image_data?: string | null;
  imageData?: string | null;
  photoBase64?: string | null;
  parentId: string | null;
  isActive: boolean;
  children?: LocationWithChildren[];
  parent?: { id: string; name: string } | null;
  currentStock?: StockAtLocation[];
}

export interface StockAtLocation {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
}

export interface TransitionResult {
  success: boolean;
  newState: string;
  message: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
