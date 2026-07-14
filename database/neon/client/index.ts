/**
 * Neon client index — single entry point for all Neon database access.
 *
 * Import pattern:
 *   import { neonClient } from '@/database/neon/client';
 *
 * All repositories under /database/neon/repositories/* use this client.
 * No other code in the app should import PrismaClient directly.
 */
export { neonClient } from './neon-client';
export type { NeonClient } from './neon-client';
