# Original media watcher

The watcher reads original files and adds new filenames to the Next.js library. It never copies, changes, moves, or deletes source recordings, and never accesses the WordPress database. It is a separate Node.js 22 process, so app deployments do not interrupt monitoring.

The requested `/home/newbreslovtorah/media` directory does not exist on this server. The actual recordings are at `/home/newbreslovtorah/public_html/media`, which is the configured watch directory. Do not create or move directories in WordPress to satisfy the example path. Configure `MEDIA_WATCH_DIR` to the actual directory, inside the app's existing `MEDIA_ROOT`.

## Operation

Every 30 seconds the watcher recursively inventories supported files. New files must have an unchanged size and modification time across scans and be at least 30 seconds old before publication. Temporary extensions, hidden files, zero-byte uploads, and symbolic links are ignored. Supported formats: MP3, M4A, AAC, OGG, WAV, FLAC, MP4, WebM, MOV, and M4V. Usually a completed upload appears within 30–60 seconds; uploads changing between checks wait longer.

On the first successful scan, existing filenames become a baseline. Existing recordings are not bulk-imported again. Subsequent new files, including files uploaded while the watcher is stopped, are imported exactly once by path. State is stored in the app's SQLite database (`media_watch_roots` and `media_watch_files`). An existing media registration also prevents a duplicate entry. Renamed/copied files with new paths are considered new files; this is not a content-hash deduplicator. Backup the entire app data directory to preserve this state.

New entries appear in the library and search index. Titles come from filenames. Known top-level rabbi directories identify the teacher; other files use “Speaker to be confirmed”. Unclassified recordings use “New recordings”, with a description inviting the team to finish the metadata. Staff edit these entries through the normal lesson administration screen. Later scans do not overwrite staff edits or publication/access settings. Missing files do not delete lessons.

New recordings default to **member-only playback**, with public lesson metadata. Existing access rules are unchanged. The team can set a recording to public in administration or configure an explicit directory rule. No private physical source paths enter page props.

## Run on another server

Initialize the app first, then run `npm run media:watch` from the source project with the same `APP_DATA_DIR` and `MEDIA_ROOT` as the app. The watcher retries unavailable directories or an uninitialized database on later scans and logs errors. `npm run media:watch -- --once` performs one scan and exits; a new pending file needs a later scan after the stability interval.

Environment variables are listed in `.env.example`. Optional `MEDIA_WATCH_RULES_PATH` points to a private JSON array, for example:

```json
[
  {
    "prefix": "rabbi-maimon/new-series",
    "speaker": "Rabbi Nasan Maimon",
    "collectionSlug": "series-r-nasan-maimon-likutey-moharan-1",
    "access": "members"
  }
]
```

Replace the example collection slug with an existing collection from administration. Rules match exact directory boundaries; the longest matching prefix wins. An empty prefix matches every watched file. Rules are loaded when the watcher starts; restart after edits. Invalid collections/policies stop configuration from importing incorrect metadata.

Install `deploy/breslov-media-watcher.service` after adjusting its app path, Node path, service user, environment file, and `ReadWritePaths` to the actual app data directory. Its filesystem restrictions make the original media read-only. Enable the dedicated service with systemd. The watcher only needs read access to recordings and write access to the private Next.js data directory.

On this preview server the dedicated service is `breslov-media-watcher.service`, with settings in `/home/breslov-next/.tools/media-watcher.env`. Logs are available through `journalctl -u breslov-media-watcher`. The service is enabled at boot and independent of the detached preview web process.

Run `npm run test:media-watch` for synthetic isolated tests. Do not create test recordings in the real media directory.
