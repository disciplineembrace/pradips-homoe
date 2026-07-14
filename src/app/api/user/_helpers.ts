/**
 * Helper: detect "table doesn't exist" errors from Supabase.
 *
 * When Supabase env vars are set but the SQL schema (001_user_features.sql)
 * has not been applied yet, queries will fail with errors like:
 *   - "Could not find the table 'public.bookmarks' in the schema cache"
 *   - "relation \"public.bookmarks\" does not exist"
 *
 * In these cases, we gracefully fall back to localStorage mode so the UI
 * continues working without any visible error.
 */
export function isSchemaNotAppliedError(e: any): boolean {
  const msg = String(e?.message || e);
  return (
    msg.includes('Could not find the table') ||
    msg.includes('schema cache') ||
    (msg.includes('relation') && msg.includes('does not exist')) ||
    msg.includes('PGRST205')  // PostgREST schema cache error code
  );
}
