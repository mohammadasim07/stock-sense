// StockSense — Operation State Machine
// Strict state flow: Draft → Waiting → Ready → Done
// Only on "Done" are stock_moves created via ACID transaction.

import prisma from "./prisma";
import { checkAvailability } from "./ledger";
import { OperationState } from "@prisma/client";

type TransitionAction = "confirm" | "check_availability" | "validate" | "cancel";

interface TransitionResult {
  success: boolean;
  newState: OperationState;
  message: string;
  errors?: string[];
}

// Valid transition map
const TRANSITIONS: Record<TransitionAction, { from: OperationState[]; to: OperationState }> = {
  confirm: {
    from: [OperationState.DRAFT],
    to: OperationState.WAITING,
  },
  check_availability: {
    from: [OperationState.WAITING],
    to: OperationState.READY,
  },
  validate: {
    from: [OperationState.READY],
    to: OperationState.DONE,
  },
  cancel: {
    from: [OperationState.DRAFT, OperationState.WAITING, OperationState.READY],
    to: OperationState.CANCELLED,
  },
};

/**
 * Execute a state transition on an operation.
 * The "validate" action (Ready → Done) triggers ACID stock_move creation.
 */
export async function transitionOperation(
  operationId: string,
  action: TransitionAction
): Promise<TransitionResult> {
  const transition = TRANSITIONS[action];
  if (!transition) {
    return {
      success: false,
      newState: OperationState.DRAFT,
      message: `Unknown action: ${action}`,
    };
  }

  const operation = await prisma.operation.findUnique({
    where: { id: operationId },
    include: {
      lines: { include: { product: true } },
      sourceLocation: true,
      destLocation: true,
    },
  });

  if (!operation) {
    return {
      success: false,
      newState: OperationState.DRAFT,
      message: "Operation not found",
    };
  }

  // Check current state is valid for this transition
  if (!transition.from.includes(operation.state)) {
    return {
      success: false,
      newState: operation.state,
      message: `Cannot ${action} from state ${operation.state}. Expected: ${transition.from.join(" or ")}`,
    };
  }

  // Validate operation has lines
  if (action !== "cancel" && operation.lines.length === 0) {
    return {
      success: false,
      newState: operation.state,
      message: "Operation must have at least one line item",
    };
  }

  // ── CONFIRM (Draft → Waiting) ──────────────────────────────────────
  if (action === "confirm") {
    await prisma.operation.update({
      where: { id: operationId },
      data: { state: OperationState.WAITING },
    });

    return {
      success: true,
      newState: OperationState.WAITING,
      message: "Operation confirmed and waiting for availability check",
    };
  }

  // ── CHECK AVAILABILITY (Waiting → Ready) ────────────────────────────
  if (action === "check_availability") {
    // For receipts from vendors, availability is always OK (vendor = infinite source)
    if (operation.sourceLocation.type !== "VENDOR") {
      const errors: string[] = [];

      for (const line of operation.lines) {
        const qty = line.quantityDone > 0 ? line.quantityDone : line.quantityPlanned;
        const result = await checkAvailability(
          line.productId,
          operation.sourceLocationId,
          qty
        );

        if (!result.available) {
          errors.push(
            `Insufficient stock for "${line.product.name}": need ${qty}, have ${result.currentStock} at ${operation.sourceLocation.name}`
          );
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          newState: operation.state,
          message: "Availability check failed",
          errors,
        };
      }
    }

    await prisma.operation.update({
      where: { id: operationId },
      data: { state: OperationState.READY },
    });

    return {
      success: true,
      newState: OperationState.READY,
      message: "Stock availability confirmed. Ready to validate.",
    };
  }

  // ── VALIDATE (Ready → Done) — ACID TRANSACTION ─────────────────────
  if (action === "validate") {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Create stock_move for each operation line
        for (const line of operation.lines) {
          const qty = line.quantityDone > 0 ? line.quantityDone : line.quantityPlanned;

          await tx.stockMove.create({
            data: {
              operationId: operation.id,
              productId: line.productId,
              fromLocationId: operation.sourceLocationId,
              toLocationId: operation.destLocationId,
              quantity: qty,
              movedAt: new Date(),
            },
          });

          // Update quantityDone if not already set
          if (line.quantityDone === 0) {
            await tx.operationLine.update({
              where: { id: line.id },
              data: { quantityDone: line.quantityPlanned },
            });
          }
        }

        // 2. Transition operation to DONE
        await tx.operation.update({
          where: { id: operationId },
          data: {
            state: OperationState.DONE,
            doneDate: new Date(),
          },
        });
      });

      return {
        success: true,
        newState: OperationState.DONE,
        message: "Operation validated. Stock moves created successfully.",
      };
    } catch (error) {
      return {
        success: false,
        newState: operation.state,
        message: `Transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  // ── CANCEL ──────────────────────────────────────────────────────────
  if (action === "cancel") {
    await prisma.operation.update({
      where: { id: operationId },
      data: { state: OperationState.CANCELLED },
    });

    return {
      success: true,
      newState: OperationState.CANCELLED,
      message: "Operation cancelled",
    };
  }

  return {
    success: false,
    newState: operation.state,
    message: "Unhandled action",
  };
}

/**
 * Generate the next reference number for an operation type.
 * Format: REC/001, DEL/002, INT/003
 */
export async function generateReference(type: "RECEIPT" | "DELIVERY" | "INTERNAL_TRANSFER"): Promise<string> {
  const prefix = type === "RECEIPT" ? "REC" : type === "DELIVERY" ? "DEL" : "INT";

  const lastOp = await prisma.operation.findFirst({
    where: { type },
    orderBy: { createdAt: "desc" },
    select: { reference: true },
  });

  let nextNum = 1;
  if (lastOp?.reference) {
    const parts = lastOp.reference.split("/");
    nextNum = parseInt(parts[1] || "0", 10) + 1;
  }

  return `${prefix}/${String(nextNum).padStart(3, "0")}`;
}
