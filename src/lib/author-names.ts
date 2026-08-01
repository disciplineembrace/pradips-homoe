/**
 * Author display name mapping.
 * Internal author field (in remedies.json) stays as the short name for API filtering.
 * Display name is what's shown to users in the UI.
 */

const AUTHOR_DISPLAY_NAMES: Record<string, string> = {
  'Murphy': 'Robin Murphy',
  'Boericke': 'Boericke',
  'Phatak': 'Phatak',
  'Kent': 'Kent',
  'Allen': 'Allen',
  'Sankaran': 'Sankaran',
  'Farrington': 'E. A. Farrington',
  'Boeger': 'C. M. Boger',
  'Mathur': 'Mathur',
  'Dubey': 'Dubey',
};

export function getAuthorDisplayName(author: string): string {
  return AUTHOR_DISPLAY_NAMES[author] || author;
}

export function getAuthorInternalName(displayName: string): string {
  for (const [internal, display] of Object.entries(AUTHOR_DISPLAY_NAMES)) {
    if (display === displayName) return internal;
  }
  return displayName;
}
