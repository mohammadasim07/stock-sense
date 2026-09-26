import { PrismaClient } from "@prisma/client";
import { fallbackPrisma } from "./mock-client";
import net from "net";

const globalForPrisma = globalThis as unknown as {
  prisma: any;
  postgresAvailable?: boolean;
};

// Check if PostgreSQL port is active
function checkPostgresPort(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(250);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    try {
      socket.connect(5432, "127.0.0.1");
    } catch {
      resolve(false);
    }
  });
}

// Create real Prisma client
let realPrisma: PrismaClient | null = null;
try {
  realPrisma = new PrismaClient({
    log: ["error"],
  });
} catch {
  realPrisma = null;
}

let isFallback = false;

// Probe once
if (globalForPrisma.postgresAvailable === undefined) {
  checkPostgresPort().then((available) => {
    globalForPrisma.postgresAvailable = available;
    isFallback = !available;
    if (isFallback) {
      console.log("⚡ [StockSense] Local PostgreSQL not detected on 5432. Active mode: In-Memory / JSON Demo Database with full ledger support.");
    }
  });
} else {
  isFallback = !globalForPrisma.postgresAvailable;
}

/**
 * Smart Prisma Proxy:
 * Dispatches to real Prisma if PostgreSQL is available;
 * seamlessly and immediately falls back to fallbackPrisma if database is unreachable.
 */
export const prisma: PrismaClient = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (prop === "$transaction") {
        return async (cbOrList: any) => {
          if (isFallback || !realPrisma) {
            return fallbackPrisma.$transaction(cbOrList);
          }
          try {
            return await (realPrisma as any).$transaction(cbOrList);
          } catch (err: any) {
            if (err?.message?.includes("Can't reach database") || err?.code === "P1001") {
              isFallback = true;
              globalForPrisma.postgresAvailable = false;
              return fallbackPrisma.$transaction(cbOrList);
            }
            throw err;
          }
        };
      }

      if (prop === "$disconnect") {
        return async () => {
          if (realPrisma) await realPrisma.$disconnect().catch(() => {});
          return fallbackPrisma.$disconnect();
        };
      }

      // Model dispatch (user, product, location, operation, operationLine, stockMove)
      return new Proxy(
        {},
        {
          get(_mTarget, method: string) {
            return async (...args: any[]) => {
              if (isFallback || !realPrisma) {
                const fallbackModel = (fallbackPrisma as any)[prop];
                if (fallbackModel && typeof fallbackModel[method] === "function") {
                  return fallbackModel[method](...args);
                }
                throw new Error(`Method ${prop}.${method} not implemented on fallback`);
              }

              try {
                const realModel = (realPrisma as any)[prop];
                return await realModel[method](...args);
              } catch (err: any) {
                if (err?.message?.includes("Can't reach database") || err?.code === "P1001" || err?.message?.includes("connect")) {
                  isFallback = true;
                  globalForPrisma.postgresAvailable = false;
                  console.log(`⚡ [StockSense] Switching ${prop}.${method} to demo fallback database.`);
                  const fallbackModel = (fallbackPrisma as any)[prop];
                  if (fallbackModel && typeof fallbackModel[method] === "function") {
                    return fallbackModel[method](...args);
                  }
                }
                throw err;
              }
            };
          },
        }
      );
    },
  }
) as unknown as PrismaClient;

export default prisma;
