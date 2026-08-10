/**
 * Neon queries index — raw SQL / query builders for future use.
 *
 * Currently empty — the project uses Prisma (via neonClient) and JSON file
 * loaders. When content data migrates into Neon tables, raw SQL queries
 * (for batch inserts, complex joins, full-text search) will live here.
 *
 * Example future file:
 *   /database/neon/queries/remedy-queries.ts
 *   export const findRemediesByChapter = (chapter: string) =>
 *     neonClient.$queryRaw`SELECT * FROM remedies WHERE chapter = ${chapter}`;
 */
export {};
