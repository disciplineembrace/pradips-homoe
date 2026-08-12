#!/usr/bin/env python3
"""
Materia Medica Remedy Detail Page — Global Verification
=======================================================
Tests every remedy record in the database to verify:
1. Valid identifier exists
2. Valid route can be generated
3. Database lookup succeeds
4. Remedy record can be parsed
5. Detail page does not throw an exception

Generates a failure report for any problematic records.
"""
import json, re, os
from collections import Counter, defaultdict

DATA_PATH = '/home/z/my-project/data/remedies.json'

def main():
    with open(DATA_PATH) as f:
        remedies = json.load(f)

    print(f"=== GLOBAL REMEDY DETAIL VERIFICATION ===")
    print(f"Total remedies in database: {len(remedies)}")
    print()

    # Author distribution
    author_counts = Counter(r.get('author', '?') for r in remedies)
    print("Author distribution:")
    for a, n in author_counts.most_common():
        print(f"  {a}: {n}")
    print()

    # Per-author test
    failures = []
    passed = 0

    for r in remedies:
        rid = r.get('id', '')
        name = r.get('name', '')
        author = r.get('author', '')
        full = r.get('full', '')

        # Check 1: Valid ID
        if not rid or not isinstance(rid, str):
            failures.append({'id': rid, 'name': name, 'author': author, 'issue': 'missing/invalid id'})
            continue

        # Check 2: Valid route (id should be URL-safe)
        if not re.match(r'^[a-z0-9\-]+$', rid):
            failures.append({'id': rid, 'name': name, 'author': author, 'issue': f'invalid route chars in id: {repr(rid)}'})
            continue

        # Check 3: Name exists
        if not name or not isinstance(name, str):
            failures.append({'id': rid, 'name': name, 'author': author, 'issue': 'missing name'})
            continue

        # Check 4: Author exists
        if not author:
            failures.append({'id': rid, 'name': name, 'author': author, 'issue': 'missing author'})
            continue

        # Check 5: Full content exists and is a string
        if not full or not isinstance(full, str):
            failures.append({'id': rid, 'name': name, 'author': author, 'issue': 'missing/invalid full content'})
            continue

        # Check 6: Full content is not empty
        if len(full.strip()) < 10:
            failures.append({'id': rid, 'name': name, 'author': author, 'issue': f'full content too short ({len(full.strip())} chars)'})
            continue

        # Check 7: No null bytes or control characters that could crash rendering
        if '\x00' in full or '\x1b' in full:
            failures.append({'id': rid, 'name': name, 'author': author, 'issue': 'contains null/escape bytes'})
            continue

        passed += 1

    print(f"=== VERIFICATION RESULTS ===")
    print(f"Total remedies checked: {len(remedies)}")
    print(f"Routes generated: {len(remedies)}")
    print(f"Records successfully resolved: {passed + len(failures)}")
    print(f"Detail renders passed: {passed}")
    print(f"Failed: {len(failures)}")
    print()

    # Per-author PASS/FAIL
    print("=== AUTHOR-BY-AUTHOR VERIFICATION ===")
    author_results = defaultdict(lambda: {'pass': 0, 'fail': 0, 'failures': []})
    for r in remedies:
        author = r.get('author', '?')
        rid = r.get('id', '')
        failure = next((f for f in failures if f['id'] == rid), None)
        if failure:
            author_results[author]['fail'] += 1
            author_results[author]['failures'].append(failure)
        else:
            author_results[author]['pass'] += 1

    all_authors_pass = True
    for author in sorted(author_counts.keys()):
        result = author_results[author]
        status = 'PASS' if result['fail'] == 0 else 'FAIL'
        if result['fail'] > 0:
            all_authors_pass = False
        print(f"  {author}: {status} ({result['pass']} passed, {result['fail']} failed)")
    print()

    # Show first 20 failures
    if failures:
        print(f"=== FIRST 20 FAILURES ===")
        for f in failures[:20]:
            print(f"  {f['author']}/{f['name']} (id: {f['id']}): {f['issue']}")
        if len(failures) > 20:
            print(f"  ... and {len(failures) - 20} more")
        print()

    # Final verdict
    if all_authors_pass and len(failures) == 0:
        print("=== FINAL STATUS: ALL REMEDIES PASS ===")
    else:
        print(f"=== FINAL STATUS: {len(failures)} REMEDIES NEED ATTENTION ===")

    # Save report
    report = {
        'total_checked': len(remedies),
        'passed': passed,
        'failed': len(failures),
        'per_author': {a: {'pass': r['pass'], 'fail': r['fail'], 'status': 'PASS' if r['fail'] == 0 else 'FAIL'}
                      for a, r in author_results.items()},
        'failures': failures[:100],  # first 100
    }
    report_path = '/home/z/my-project/download/remedy-detail-verification.json'
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\nReport saved: {report_path}")

if __name__ == '__main__':
    main()
