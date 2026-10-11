#!/usr/bin/env python3
"""Remove Sara Wurtzel from shared-author records; retain sole-author records.
Run without --apply to inspect counts. Only Next.js metadata is changed.
"""
import argparse
import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--data-dir', type=Path, default=Path(os.environ.get('APP_DATA_DIR', root / 'data')))
parser.add_argument('--seed', type=Path, default=root / 'content/catalog.json')
parser.add_argument('--apply', action='store_true')
args = parser.parse_args()

def corrected(lesson):
    authors = [name.strip() for name in lesson['speaker'].split(',') if name.strip()]
    others = [name for name in authors if name.casefold() != 'sara wurtzel']
    if len(others) == len(authors) or not others:
        return None
    updated = dict(lesson, speaker=', '.join(others))
    updated['categories'] = [term for term in lesson.get('categories', [])
                             if not (term['taxonomy'] == 'authors' and
                                     (term['slug'] == 'sara-wurtzel' or term['title'].strip().casefold() == 'sara wurtzel'))]
    return updated

seed = json.loads(args.seed.read_text())
seed_changes = [(index, corrected(lesson)) for index, lesson in enumerate(seed['lessons'])]
seed_changes = [(index, lesson) for index, lesson in seed_changes if lesson]
path = args.data_dir / 'breslov.sqlite'
db = sqlite3.connect('file:' + str(path.resolve()) + '?mode=' + ('rw' if args.apply else 'ro'), uri=True, timeout=30)
changes = []
for id, payload in db.execute('SELECT id,payload FROM lessons'):
    lesson = corrected(json.loads(payload))
    if lesson:
        changes.append((id, lesson))
print(f'Shared-author corrections: database={len(changes)}, seed={len(seed_changes)}')
if args.apply:
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    backup_dir = args.data_dir / 'backups'
    backup_dir.mkdir(mode=0o700, exist_ok=True)
    backup_path = backup_dir / f'before-sara-author-correction-{stamp}.sqlite'
    with sqlite3.connect(backup_path) as backup:
        db.backup(backup)
    backup_path.chmod(0o600)
    try:
        db.execute('BEGIN IMMEDIATE')
        # Re-read inside the write transaction to preserve any concurrent staff edits.
        for id, _ in changes:
            current = json.loads(db.execute('SELECT payload FROM lessons WHERE id=?', (id,)).fetchone()[0])
            lesson = corrected(current)
            if not lesson:
                continue
            lesson['updatedAt'] = datetime.now(timezone.utc).isoformat()
            db.execute('UPDATE lessons SET speaker=?,payload=? WHERE id=?', (lesson['speaker'], json.dumps(lesson, ensure_ascii=False), id))
            db.execute("DELETE FROM lesson_terms WHERE lesson_id=? AND taxonomy='authors' AND (slug='sara-wurtzel' OR lower(trim(title))='sara wurtzel')", (id,))
            db.execute('DELETE FROM lesson_search WHERE lesson_id=?', (id,))
            category = ' '.join([lesson['collection'], lesson['topic'], *[t['title'] for t in lesson.get('categories', [])]])
            body = ' '.join(str(lesson.get(key) or '') for key in ['description', 'bodyText', 'dedication'])
            db.execute('INSERT INTO lesson_search VALUES (?,?,?,?,?)', (id, lesson['title'], lesson['speaker'], category, body))
            db.execute('INSERT INTO audit_log(at,actor,action,subject) VALUES (?,?,?,?)', (lesson['updatedAt'], 'metadata-correction', 'remove-sara-shared-author', id))
        db.commit()
    except Exception:
        db.rollback()
        raise
    for index, lesson in seed_changes:
        seed['lessons'][index] = lesson
    temporary = args.seed.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(seed, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(args.seed)
    print(f'Applied metadata corrections. Database backup: {backup_path}')
else:
    print('Dry run only. Use --apply to update metadata and the portable seed.')
db.close()
