// StockSense — Mock Prisma Client Adapter
// Implements the exact Prisma client interface used by StockSense routes and services

import { mockDb, enrichOperation, DemoOperation, DemoStockMove, DemoProduct, DemoLocation, DemoUser } from "./mock-db";

export class MockPrismaClient {
  user = {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
      return (
        mockDb.users.find(
          (u) => (where.id && u.id === where.id) || (where.email && u.email === where.email)
        ) || null
      );
    },
    findFirst: async ({ orderBy }: { orderBy?: { createdAt?: "asc" | "desc" } } = {}) => {
      const list = [...mockDb.users];
      if (orderBy?.createdAt === "desc") {
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      } else {
        list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      }
      return list[0] || null;
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || `u-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const user: DemoUser = {
        id,
        name: data.name,
        email: data.email,
        password: data.password || "mock_hash",
        role: data.role || "OPERATOR",
        otp: data.otp || null,
        otpExpiry: data.otpExpiry || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb.users.push(user);
      mockDb.persist();
      return user;
    },
    update: async ({ where, data }: { where: { id?: string; email?: string }; data: any }) => {
      const user = mockDb.users.find(
        (u) => (where.id && u.id === where.id) || (where.email && u.email === where.email)
      );
      if (!user) throw new Error("User not found");
      Object.assign(user, data, { updatedAt: new Date() });
      mockDb.persist();
      return user;
    },
  };

  product = {
    findMany: async (args: { where?: any; skip?: number; take?: number; orderBy?: any } = {}) => {
      let list = [...mockDb.products];
      if (args.where) {
        if (args.where.isActive !== undefined) {
          list = list.filter((p) => p.isActive === args.where.isActive);
        }
        if (args.where.category) {
          list = list.filter((p) => p.category === args.where.category);
        }
        if (args.where.OR) {
          const searchTerms = args.where.OR;
          list = list.filter((p) =>
            searchTerms.some((term: any) => {
              if (term.name?.contains) {
                return p.name.toLowerCase().includes(term.name.contains.toLowerCase());
              }
              if (term.sku?.contains) {
                return p.sku.toLowerCase().includes(term.sku.contains.toLowerCase());
              }
              if (term.barcode?.contains) {
                return p.barcode?.toLowerCase().includes(term.barcode.contains.toLowerCase());
              }
              return false;
            })
          );
        }
      }
      if (args.orderBy?.name) {
        list.sort((a, b) =>
          args.orderBy.name === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        );
      } else {
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      const skip = args.skip || 0;
      const take = args.take || list.length;
      return list.slice(skip, skip + take);
    },
    count: async (args: { where?: any } = {}) => {
      const items = await this.product.findMany(args);
      return items.length;
    },
    findUnique: async ({ where }: { where: { id?: string; sku?: string } }) => {
      return (
        mockDb.products.find(
          (p) => (where.id && p.id === where.id) || (where.sku && p.sku === where.sku)
        ) || null
      );
    },
    findFirst: async ({ where }: { where: any }) => {
      if (!where) return mockDb.products[0] || null;
      if (where.OR) {
        return (
          mockDb.products.find((p) =>
            where.OR.some((term: any) => (term.sku && p.sku === term.sku) || (term.barcode && p.barcode === term.barcode))
          ) || null
        );
      }
      return (
        mockDb.products.find((p) => {
          for (const key of Object.keys(where)) {
            if ((p as any)[key] !== where[key]) return false;
          }
          return true;
        }) || null
      );
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const product: DemoProduct = {
        id,
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || null,
        category: data.category || "General",
        uom: data.uom || "Units",
        description: data.description || null,
        image_data: data.image_data || data.imageData || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb.products.unshift(product);
      mockDb.persist();
      return product;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const product = mockDb.products.find((p) => p.id === where.id);
      if (!product) throw new Error("Product not found");
      const normalizedData = { ...data };
      if (data.imageData !== undefined && data.image_data === undefined) {
        normalizedData.image_data = data.imageData;
      }
      delete normalizedData.imageData;
      Object.assign(product, normalizedData, { updatedAt: new Date() });
      mockDb.persist();
      return product;
    },
  };

  location = {
    findMany: async (args: { where?: any; include?: any; orderBy?: any } = {}) => {
      let list = [...mockDb.locations];
      if (args.where) {
        if (args.where.type) {
          list = list.filter((l) => l.type === args.where.type);
        }
        if (args.where.isActive !== undefined) {
          list = list.filter((l) => l.isActive === args.where.isActive);
        }
        if (args.where.parentId !== undefined) {
          list = list.filter((l) => l.parentId === args.where.parentId);
        }
      }
      list.sort((a, b) => a.name.localeCompare(b.name));

      return list.map((loc) => {
        const item: any = { ...loc };
        if (args.include?.parent && loc.parentId) {
          item.parent = mockDb.locations.find((p) => p.id === loc.parentId) || null;
        }
        if (args.include?.children) {
          item.children = mockDb.locations.filter((c) => c.parentId === loc.id);
        }
        return item;
      });
    },
    count: async (args: { where?: any } = {}) => {
      const items = await this.location.findMany(args);
      return items.length;
    },
    findUnique: async ({ where, include }: { where: { id: string }; include?: any }) => {
      const loc = mockDb.locations.find((l) => l.id === where.id);
      if (!loc) return null;
      const item: any = { ...loc };
      if (include?.parent && loc.parentId) {
        item.parent = mockDb.locations.find((p) => p.id === loc.parentId) || null;
      }
      if (include?.children) {
        item.children = mockDb.locations.filter((c) => c.parentId === loc.id);
      }
      return item;
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || `loc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const location: DemoLocation = {
        id,
        name: data.name,
        type: data.type,
        address: data.address || null,
        image_data: data.image_data || data.imageData || data.photoBase64 || null,
        parentId: data.parentId || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb.locations.unshift(location);
      mockDb.persist();
      return location;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const location = mockDb.locations.find((l) => l.id === where.id);
      if (!location) throw new Error("Location not found");
      const normalizedData = { ...data };
      if (data.imageData !== undefined && data.image_data === undefined) {
        normalizedData.image_data = data.imageData;
      }
      if (data.photoBase64 !== undefined && data.image_data === undefined) {
        normalizedData.image_data = data.photoBase64;
      }
      delete normalizedData.imageData;
      delete normalizedData.photoBase64;
      Object.assign(location, normalizedData, { updatedAt: new Date() });
      mockDb.persist();
      return location;
    },
  };

  operation = {
    findMany: async (args: { where?: any; skip?: number; take?: number; orderBy?: any; include?: any } = {}) => {
      let list = [...mockDb.operations];
      if (args.where) {
        if (args.where.type) {
          list = list.filter((o) => o.type === args.where.type);
        }
        if (args.where.state) {
          if (typeof args.where.state === "string") {
            list = list.filter((o) => o.state === args.where.state);
          } else if (args.where.state.in) {
            list = list.filter((o) => args.where.state.in.includes(o.state));
          }
        }
        if (args.where.sourceLocationId) {
          list = list.filter((o) => o.sourceLocationId === args.where.sourceLocationId);
        }
        if (args.where.destLocationId) {
          list = list.filter((o) => o.destLocationId === args.where.destLocationId);
        }
      }
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const skip = args.skip || 0;
      const take = args.take || list.length;
      return list.slice(skip, skip + take).map((op) => enrichOperation(op));
    },
    count: async (args: { where?: any } = {}) => {
      let list = [...mockDb.operations];
      if (args.where) {
        if (args.where.state) {
          if (typeof args.where.state === "string") {
            list = list.filter((o) => o.state === args.where.state);
          } else if (args.where.state.in) {
            list = list.filter((o) => args.where.state.in.includes(o.state));
          }
        }
        if (args.where.doneDate?.gte) {
          const gte = new Date(args.where.doneDate.gte).getTime();
          list = list.filter((o) => o.doneDate && o.doneDate.getTime() >= gte);
        }
      }
      return list.length;
    },
    findUnique: async ({ where }: { where: { id?: string; reference?: string } }) => {
      const op = mockDb.operations.find(
        (o) => (where.id && o.id === where.id) || (where.reference && o.reference === where.reference)
      );
      if (!op) return null;
      return enrichOperation(op);
    },
    findFirst: async ({ where, orderBy }: { where?: any; orderBy?: any } = {}) => {
      let list = [...mockDb.operations];
      if (where?.type) {
        list = list.filter((o) => o.type === where.type);
      }
      if (orderBy?.createdAt === "desc") {
        list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      const op = list[0];
      return op ? enrichOperation(op) : null;
    },
    create: async ({ data }: { data: any }) => {
      const id = data.id || `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const op: DemoOperation = {
        id,
        reference: data.reference,
        type: data.type,
        state: data.state || "DRAFT",
        sourceLocationId: data.sourceLocationId,
        destLocationId: data.destLocationId,
        createdById: data.createdById || mockDb.users[0].id,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : new Date(),
        doneDate: data.doneDate ? new Date(data.doneDate) : null,
        notes: data.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb.operations.unshift(op);

      if (data.lines?.create) {
        const createLines = Array.isArray(data.lines.create) ? data.lines.create : [data.lines.create];
        for (const l of createLines) {
          mockDb.operationLines.push({
            id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            operationId: op.id,
            productId: l.productId,
            quantityPlanned: l.quantityPlanned,
            quantityDone: l.quantityDone || 0,
          });
        }
      }

      mockDb.persist();
      return enrichOperation(op);
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const op = mockDb.operations.find((o) => o.id === where.id);
      if (!op) throw new Error("Operation not found");
      if (data.state !== undefined) op.state = data.state;
      if (data.doneDate !== undefined) op.doneDate = data.doneDate ? new Date(data.doneDate) : null;
      if (data.scheduledDate !== undefined) op.scheduledDate = new Date(data.scheduledDate);
      if (data.notes !== undefined) op.notes = data.notes;
      if (data.sourceLocationId !== undefined) op.sourceLocationId = data.sourceLocationId;
      if (data.destLocationId !== undefined) op.destLocationId = data.destLocationId;
      op.updatedAt = new Date();
      mockDb.persist();
      return enrichOperation(op);
    },
  };

  operationLine = {
    deleteMany: async ({ where }: { where: { operationId: string } }) => {
      const initial = mockDb.operationLines.length;
      mockDb.operationLines = mockDb.operationLines.filter((l) => l.operationId !== where.operationId);
      mockDb.persist();
      return { count: initial - mockDb.operationLines.length };
    },
    createMany: async ({ data }: { data: any[] }) => {
      for (const item of data) {
        mockDb.operationLines.push({
          id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          operationId: item.operationId,
          productId: item.productId,
          quantityPlanned: item.quantityPlanned,
          quantityDone: item.quantityDone || 0,
        });
      }
      mockDb.persist();
      return { count: data.length };
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const line = mockDb.operationLines.find((l) => l.id === where.id);
      if (!line) throw new Error("OperationLine not found");
      Object.assign(line, data);
      mockDb.persist();
      return line;
    },
    findMany: async ({ where }: { where?: any } = {}) => {
      let list = [...mockDb.operationLines];
      if (where?.operationId) {
        list = list.filter((l) => l.operationId === where.operationId);
      }
      return list;
    },
  };

  stockMove = {
    aggregate: async ({ where, _sum }: { where: { productId?: string; fromLocationId?: string; toLocationId?: string }; _sum: { quantity: boolean } }) => {
      let list = [...mockDb.stockMoves];
      if (where.productId) list = list.filter((m) => m.productId === where.productId);
      if (where.fromLocationId) list = list.filter((m) => m.fromLocationId === where.fromLocationId);
      if (where.toLocationId) list = list.filter((m) => m.toLocationId === where.toLocationId);
      const total = list.reduce((acc, curr) => acc + curr.quantity, 0);
      return { _sum: { quantity: total } };
    },
    groupBy: async ({ by, where }: { by: string[]; where?: any; _sum?: any }) => {
      const matched = mockDb.stockMoves.filter((m) => {
        if (!where) return true;
        if (where.OR) {
          return where.OR.some(
            (cond: any) =>
              (cond.fromLocationId && m.fromLocationId === cond.fromLocationId) ||
              (cond.toLocationId && m.toLocationId === cond.toLocationId)
          );
        }
        return true;
      });
      const productIds = Array.from(new Set(matched.map((m) => m.productId)));
      return productIds.map((pId) => ({
        productId: pId,
        _sum: {
          quantity: matched.filter((m) => m.productId === pId).reduce((a, b) => a + b.quantity, 0),
        },
      }));
    },
    findMany: async (args: { where?: any; take?: number; orderBy?: any; include?: any } = {}) => {
      let list = [...mockDb.stockMoves];
      if (args.where?.operationId) {
        list = list.filter((m) => m.operationId === args.where.operationId);
      }
      list.sort((a, b) => b.movedAt.getTime() - a.movedAt.getTime());
      const take = args.take || list.length;
      return list.slice(0, take).map((m) => {
        const item: any = { ...m };
        if (args.include?.product) {
          item.product = mockDb.products.find((p) => p.id === m.productId) || { name: "Unknown", sku: "N/A" };
        }
        if (args.include?.fromLocation) {
          item.fromLocation = mockDb.locations.find((l) => l.id === m.fromLocationId) || { name: "Unknown", type: "INTERNAL" };
        }
        if (args.include?.toLocation) {
          item.toLocation = mockDb.locations.find((l) => l.id === m.toLocationId) || { name: "Unknown", type: "INTERNAL" };
        }
        if (args.include?.operation) {
          item.operation = mockDb.operations.find((o) => o.id === m.operationId) || { reference: "N/A", type: "RECEIPT" };
        }
        return item;
      });
    },
    count: async () => {
      return mockDb.stockMoves.length;
    },
    create: async ({ data }: { data: any }) => {
      const move: DemoStockMove = {
        id: data.id || `sm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        operationId: data.operationId,
        productId: data.productId,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        quantity: data.quantity,
        movedAt: data.movedAt ? new Date(data.movedAt) : new Date(),
      };
      mockDb.stockMoves.unshift(move);
      mockDb.persist();
      return move;
    },
    createMany: async ({ data }: { data: any[] }) => {
      for (const d of data) {
        mockDb.stockMoves.unshift({
          id: d.id || `sm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          operationId: d.operationId,
          productId: d.productId,
          fromLocationId: d.fromLocationId,
          toLocationId: d.toLocationId,
          quantity: d.quantity,
          movedAt: d.movedAt ? new Date(d.movedAt) : new Date(),
        });
      }
      mockDb.persist();
      return { count: data.length };
    },
  };

  $transaction = async (fn: (tx: any) => Promise<any>) => {
    return fn(this);
  };

  $disconnect = async () => {
    return Promise.resolve();
  };
}

export const fallbackPrisma = new MockPrismaClient();
