/**
 * User profile + preferences adapter (re-exported for direct import).
 *
 * This folder exists to mirror the structure of /auth/ and /storage/.
 * The actual implementation lives in /repositories/profile.ts.
 */
export {
  getProfile,
  upsertProfile,
  getPreferences,
  upsertPreferences,
} from '../repositories/profile';
export type {
  UserProfileRecord,
  UserPreferencesRecord,
} from '../repositories/profile';
