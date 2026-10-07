# Breslov Torah

A self-hosted Next.js app with the Breslov Torah teaching library, indexed search, original-file playback, accounts, and a staff publishing dashboard. SQLite keeps deployment simple. The existing WordPress sites remain unchanged.

## Run

Use Node.js 22 (22.13 or newer, below 23).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. For production, configure the environment, then:

```sh
npm run typecheck
npm run build
npm start
```

`npm start` binds to localhost by default. Put an HTTPS reverse proxy in front of it; set `PORT` and `APP_HOST` for another listener. Production environment variables must be supplied to the running process; the standalone start script does not load `.env.local` automatically.

## Included

- 7,243 lessons, descriptions and taxonomy; 384 collections; five teachers; 47 imported public pages.
- Server-side search, filters, pagination, courses and teacher browsing.
- Audio/video playback from original files, seeking and downloads; protected media requires the appropriate account access.
- Staff lesson publishing, media uploads, categories, teachers and membership management.
- Accounts, saved lessons and listening history, with compatibility for imported WordPress password hashes.
- Donation and dedication pages that reuse the existing Gravity Forms payment service.

Some original recordings are missing or require the existing site's access flow. The import report documents these gaps. Donation processing remains on `donate.breslovtorah.com`; this app does not create a replacement payment processor or automatically synchronize future subscription changes.

## Code and operations

- `src/app`: public pages, account/admin pages and API routes.
- `src/components`: shared UI and playback.
- `src/lib/store.ts`: SQLite catalog, search and persistence.
- `src/lib/auth.ts`: sessions, passwords and account access.
- `content/catalog.json`: public seed catalog, loaded once into an empty database.
- `content/homepage.json`: featured teaching, clips and guided paths.
- `data/`: private runtime database, uploads and optional migration manifests; excluded from Git and source packages.
- `scripts/export-live-wordpress.py`: read-only extraction from the existing installations.
- [Team handoff](docs/HANDOFF.md): configuration, migration, backups and deployment.
- [WordPress audit](docs/WORDPRESS-AUDIT.md): source inventory and migration findings.

Editing seed JSON does not overwrite an existing database. Staff edits persist without rebuilding. Homepage configuration and code changes require a rebuild.

## Verification

```sh
npm run typecheck
npm run build
npx playwright install chromium
QA_BASE_URL=http://127.0.0.1:3000 npm run qa
```

Browser checks cover desktop, tablet and mobile at 1440, 768, 390 and 320 pixels. The Dockerfile supports a persistent data volume; Docker execution must be verified on the destination server.
