/**
 * Helper: detect errors that should fall back to local-only mode.
 *
 * Multiple failure modes are handled gracefully so the UI never shows a
 * 500 error to end users:
 *
 *  1. Schema not applied — Supabase env vars are set but the SQL schema
 *     (001_user_features.sql) has not been applied yet. Errors look like:
 *       - "Could not find the table 'public.bookmarks' in the schema cache"
 *       - "relation \"public.bookmarks\" does not exist"
 *       - PGRST205 (PostgREST schema cache error code)
 *
 *  2. Network / connection errors — Supabase URL is invalid, unreachable,
 *     DNS failure, TLS failure, timeout, etc. Errors look like:
 *       - "fetch failed"
 *       - "ECONNREFUSED"
 *       - "ENOTFOUND"
 *       - "ETIMEDOUT"
 *       - "UND_ERR_CONNECT_TIMEOUT"
 *       - "Network request failed"
 *       - "Failed to fetch"
 *
 *  3. Auth/permission errors — Supabase keys are invalid or RLS blocks access.
 *
 * In all of these cases, we gracefully fall back to localStorage mode so the
 * UI continues working without any visible error.
 */
export function isSchemaNotAppliedError(e: any): boolean {
  const msg = String(e?.message || e);
  return (
    // Schema not applied errors
    msg.includes('Could not find the table') ||
    msg.includes('schema cache') ||
    (msg.includes('relation') && msg.includes('does not exist')) ||
    msg.includes('PGRST205') ||
    msg.includes('PGRST204') ||
    // Network / connection errors
    msg.includes('fetch failed') ||
    msg.includes('Failed to fetch') ||
    msg.includes('Network request failed') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ECONNRESET') ||
    msg.includes('EHOSTUNREACH') ||
    msg.includes('UND_ERR_CONNECT_TIMEOUT') ||
    msg.includes('UND_ERR_SOCKET') ||
    msg.includes('socket hang up') ||
    msg.includes('getaddrinfo ENOTFOUND') ||
    msg.includes('invalid URL') ||
    // Auth / permission errors (treat as not configured so UI degrades gracefully)
    msg.includes('Invalid API key') ||
    msg.includes('Invalid login credentials') ||
    (msg.includes('JWT') && msg.includes('invalid')) ||
    msg.includes('permission denied')
  );
}

/**
 * Helper: detect any recoverable error (schema not applied OR network error).
 * Alias for isSchemaNotAppliedError for clarity at call sites.
 */
export function isRecoverableError(e: any): boolean {
  return isSchemaNotAppliedError(e);
}
