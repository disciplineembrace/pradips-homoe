/**
 * Neon PostgreSQL client — content database.
 *
 * This is the SINGLE source of truth for all educational/knowledge-base content:
 * books, materia medica, repertories, organon, pharmacy, remedies, rubrics,
 * chapters, OCR data, search index, AI analysis data, MCQs, etc.
 *
 * Currently, the project uses Prisma (configured in /prisma/schema.prisma) which
 * connects via DATABASE_URL. This file provides a thin re-export so all Neon
 * access goes through a single named import: `neonClient`.
 *
 * CRITICAL RULES:
 *   - This client MUST NEVER be used for user-feature writes (bookmarks, notes,
 *     history, etc.) — those belong in Supabase.
 *   - This client MUST NEVER be imported from /database/supabase/*.
 *   - All content writes go through /database/neon/repositories/*.
 *
 * Connection pooling: handled by Prisma internally (default pool size = num_cpus * 2 + 1,
 * capped at 10). On Vercel serverless, this is the recommended configuration.
 */
import { PrismaClient } from '@prisma/client';

const globalForNeon = globalThis as unknown as {
  __neonClient: PrismaClient | undefined;
};

export const neonClient =
  globalForNeon.__neonClient ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn'],
  });

// Prevent multiple PrismaClient instances during Next.js hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForNeon.__neonClient = neonClient;
}

export type NeonClient = typeof neonClient;
