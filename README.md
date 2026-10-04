# Breslov Torah

Standalone Next.js and TypeScript UI, portable to the team’s own servers. WordPress and a hosted build service are not required to run this project.

## Run locally

Use Node.js 22 LTS.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. For production:

```sh
npm run typecheck
npm run build
npm start
```

The start script serves Next.js standalone output and binds to localhost; place a reverse proxy in front of it. Set `PORT` and `APP_HOST` to override the listener. To expose it directly inside a container, use the Docker image below.

## Self-host with Docker

```sh
docker build -t breslov-torah .
docker run --rm -p 3000:3000 breslov-torah
```

Terminate HTTPS at your reverse proxy. The Docker image uses Next.js standalone output and includes static assets. No vendor deployment account is required.

## Code and content

- `src/app`: pages and global styles.
- `src/components`: reusable UI and interactions.
- `src/lib/content.ts`: initial typed public catalog metadata.
- `src/lib/catalog.ts`: server-only adapter for a reviewed import.
- `scripts/import-wordpress.py`: portable WordPress WXR metadata importer.
- `public/images`: assets reused from the existing project.
- `docs/MIGRATION.md`: production migration requirements and source notes.

This delivery contains an initial curated catalog, not the full WordPress database. Legacy links provide access to existing recordings and account services while backend migration is planned. No imported memberships, payment processing, protected streaming service, or staff CMS is claimed. Read the migration document before replacing the live site. Update content.ts to edit the initial catalog; a database or CMS adapter can later provide the same types without coupling UI components to WordPress.

## Verification

`npm run typecheck` validates TypeScript; `npm run build` verifies the production bundle. `npm run qa` runs browser QA when its browser dependencies are installed. Screenshots and verification notes supplied with the delivery describe the tested breakpoints.

## Browser checks and screenshots

Run the app in one terminal, then in another:

```sh
npx playwright install chromium
npm run qa
```

Set `QA_BASE_URL=http://127.0.0.1:3001` to test a production server on another port. QA covers 1440px, 768px, 390px, and 320px widths. Screenshots are written to `qa/screenshots/`. The included Dockerfile has not been executed in this environment.

## Import a reviewed catalog

```sh
python3 scripts/import-wordpress.py /secure/wordpress-export.xml --output ./data
CONTENT_CATALOG_PATH=./data/public-catalog.json npm run build
CONTENT_CATALOG_PATH=./data/public-catalog.json npm start
```

Review the migration report and resolve duplicate slugs, teacher mappings, collection URLs, and assets before building. The catalog is a build input, so rebuild after edits. Membership, protected playback, forms, and the complete staff editing workflow remain migration work; this app is a UI preview and must not yet replace production.
