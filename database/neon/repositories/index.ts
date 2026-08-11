/**
 * Neon repositories index — single entry point for all content data access.
 *
 * Import pattern:
 *   import { RemediesRepo, RubricsRepo, BooksRepo, SearchRepo } from '@/database/neon/repositories';
 *
 * Each repository is a namespace object with typed methods.
 * None of these repositories ever touch user-specific data.
 */
import * as RemediesRepo from './remedies';
import * as RubricsRepo from './rubrics';
import * as BooksRepo from './books';
import * as SearchRepo from './search';

export { RemediesRepo, RubricsRepo, BooksRepo, SearchRepo };
export { cached, invalidate, invalidateAll } from './base';
