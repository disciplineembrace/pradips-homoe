#!/usr/bin/env python3
"""Replace Murphy entries in remedies.json with new clean extraction."""
import json
from pathlib import Path
from collections import Counter

WORK_DIR = Path("/home/z/my-project/work/murphy")
REMEDIES_JSON = Path("/home/z/my-project/data/remedies.json")
BACKUP_JSON = Path("/home/z/my-project/data/remedies_backup_pre_murphy_rebuild.json")


def main():
    print("=" * 70)
    print("REPLACE MURPHY ENTRIES IN remedies.json")
    print("=" * 70)
    
    # Load existing remedies.json
    with open(REMEDIES_JSON) as f:
        all_remedies = json.load(f)
    print(f"Loaded {len(all_remedies)} total remedies")
    
    authors_before = Counter(r.get('author', 'unknown') for r in all_remedies)
    print(f"\nAuthors (before):")
    for a, c in authors_before.most_common():
        print(f"  {a}: {c}")
    
    # Backup
    if not BACKUP_JSON.exists():
        with open(BACKUP_JSON, 'w') as f:
            json.dump(all_remedies, f, indent=2, ensure_ascii=False)
        print(f"\nBacked up to: {BACKUP_JSON}")
    
    # Load new Murphy remedies
    with open(WORK_DIR / "murphy_remedies.json") as f:
        new_murphy = json.load(f)
    print(f"\nLoaded {len(new_murphy)} new Murphy remedies")
    
    # Remove existing Murphy entries
    non_murphy = [r for r in all_remedies if r.get('author') != 'Murphy']
    print(f"Non-Murphy kept: {len(non_murphy)}")
    
    # Combine
    combined = non_murphy + new_murphy
    
    # Sort
    author_order = {'Allen': 1, 'Boericke': 2, 'Kent': 3, 'Phatak': 4, 'Dubey': 5,
                    'Murphy': 6, 'Boeger': 7, 'Farrington': 8, 'Mathur': 9, 'Sankaran': 10}
    combined.sort(key=lambda r: (author_order.get(r.get('author', 'ZZZ'), 99),
                                  r.get('name', '').lower()))
    
    print(f"\nCombined total: {len(combined)}")
    
    # Save
    with open(REMEDIES_JSON, 'w') as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)
    
    file_size = REMEDIES_JSON.stat().st_size
    print(f"Saved remedies.json ({file_size/1024/1024:.1f} MB)")
    
    # Verify
    with open(REMEDIES_JSON) as f:
        verify = json.load(f)
    authors_after = Counter(r.get('author') for r in verify)
    print(f"\nAuthors (after):")
    for a, c in authors_after.most_common():
        print(f"  {a}: {c}")
    
    # Verify other authors preserved
    print(f"\n=== Verification: Other authors preserved ===")
    for author in ['Allen', 'Boericke', 'Kent', 'Phatak', 'Boeger', 'Farrington', 'Mathur', 'Sankaran', 'Dubey']:
        before = authors_before.get(author, 0)
        after = authors_after.get(author, 0)
        status = "✓" if before == after else "✗"
        print(f"  {status} {author}: {before} → {after}")
    
    # Show Murphy samples
    murphy = [r for r in verify if r.get('author') == 'Murphy']
    print(f"\nMurphy remedies: {len(murphy)}")
    print(f"\n=== First 5 Murphy entries ===")
    for r in murphy[:5]:
        print(f"  {r['name']:40s} | id: {r['id']:35s} | full: {len(r['full'])} chars")
    print(f"\n=== Last 5 Murphy entries ===")
    for r in murphy[-5:]:
        print(f"  {r['name']:40s} | id: {r['id']:35s} | full: {len(r['full'])} chars")


if __name__ == "__main__":
    main()
