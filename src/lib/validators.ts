// StockSense — Zod Validators
// Shared validation schemas for API routes and forms

import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────────────

export const requestOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR"]).optional(),
});

// ── Products ──────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional().nullable(),
  category: z.string().default("General"),
  uom: z.string().default("Units"),
  description: z.string().optional().nullable(),
  image_data: z.string().optional().nullable(),
  imageData: z.string().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

// ── Locations ─────────────────────────────────────────────────────────

export const createLocationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  type: z.enum(["VENDOR", "INTERNAL", "CUSTOMER", "VIRTUAL"]),
  address: z.string().optional().nullable(),
  image_data: z.string().optional().nullable(),
  imageData: z.string().optional().nullable(),
  photoBase64: z.string().optional().nullable(),
  parentId: z.string().min(1, "Invalid parent location").optional().nullable(),
});

export const updateLocationSchema = createLocationSchema.partial();

// ── Operations ────────────────────────────────────────────────────────

export const createOperationSchema = z.object({
  type: z.enum(["RECEIPT", "DELIVERY", "INTERNAL_TRANSFER"]),
  sourceLocationId: z.string().min(1, "Invalid source location"),
  destLocationId: z.string().min(1, "Invalid destination location"),
  scheduledDate: z.string().or(z.date()),
  notes: z.string().optional().nullable(),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1, "Invalid product"),
        quantityPlanned: z.number().int().positive("Quantity must be positive"),
      })
    )
    .min(1, "At least one line item is required"),
});

export const updateOperationSchema = z.object({
  scheduledDate: z.string().or(z.date()).optional(),
  notes: z.string().optional().nullable(),
  lines: z
    .array(
      z.object({
        id: z.string().min(1).optional(), // existing line
        productId: z.string().min(1, "Invalid product"),
        quantityPlanned: z.number().int().positive("Quantity must be positive"),
        quantityDone: z.number().int().min(0).optional(),
      })
    )
    .optional(),
});

// ── Transition ────────────────────────────────────────────────────────

export const transitionSchema = z.object({
  action: z.enum(["confirm", "check_availability", "validate", "cancel"]),
});

// ── Types ─────────────────────────────────────────────────────────────

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type CreateOperationInput = z.infer<typeof createOperationSchema>;
export type UpdateOperationInput = z.infer<typeof updateOperationSchema>;
export type TransitionInput = z.infer<typeof transitionSchema>;
