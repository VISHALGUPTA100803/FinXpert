// make the call to our db

import { PrismaClient } from "@prisma/client";
/**
 * @type {PrismaClient}
 */

const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

export { db };

// globalThis.prisma: This global variable ensures that the Prisma client instance is
// reused across hot reloads during development. Without this, each time your application
// reloads, a new instance of the Prisma client would be created, potentially leading
// to connection issues.

// PrismaClient is the class you use to talk to your database (db.user.findMany(), etc.).

// export const db = globalThis.prisma || new PrismaClient();
// If there is already a Prisma client stored in globalThis.prisma, reuse it.

// Otherwise, create a new PrismaClient() instance.

// This prevents creating multiple DB connections when the app hot-reloads (common in Next.js/React dev mode).

// 🔹 3. Store Prisma globally (only in dev)
// ts
// Copy code
// if (process.env.NODE_ENV !== "production") {
//     globalThis.prisma = db;
// }
// In development, when the app refreshes or reloads files, new instances of PrismaClient would normally be created each time. That can crash your DB with too many open connections.

// So here, we store the client in the global object (globalThis), which persists between reloads.

// In production, we don’t do this, because:

// Production doesn’t hot-reload,

// and storing things globally is unnecessary there.
