# Team handoff

## Architecture

The app runs on Node.js 22 and Next.js with a private SQLite database. There is no required hosted build service, WordPress plugin, external CMS or cloud database. The public catalog seed ships with the source. Existing media is read in place; uploaded recordings are stored privately and served through the media API.

Donation, dedication, prayer and contact workflows reuse existing public forms. Payment credentials and card data remain with the existing donation service. Keep that service online while using this integration. Membership entitlements are an imported snapshot plus staff-managed changes: new payments and cancellations do not automatically update this app's membership table. A billing webhook integration is a separate deployment task.

## First installation

1. Install Node.js 22.13 or later within Node 22. Run `npm ci` in the source directory.
2. Create a writable private data directory outside any public web root, owned by the app service account. Supply `APP_DATA_DIR` as an absolute path.
3. Set `APP_ORIGIN` to the exact HTTPS origin, without a trailing slash. Set `CATALOG_SEED_PATH` to the supplied `content/catalog.json`.
4. To retain original recordings, securely transfer `import-media.json` into the private data directory and mount the original media tree read-only. Set `MEDIA_ROOT` to the directory containing `media/`, and `MEDIA_MANIFEST_PATH` to that private manifest.
5. To migrate accounts, securely transfer `import-users.json` into the private data directory before the first authentication request. It contains personal information and password hashes; never put it in Git, the source archive or the public document root. Imported identities receive learner/member roles, never administrator privileges.
6. Build with `npm run build`; run with `npm start` and the same environment. An empty database seeds itself once. Subsequent starts retain staff edits.
7. Provision the initial administrator using the one-time setup utility. Keep the generated link private and consume it promptly. Existing accounts can be promoted through this setup rather than creating a duplicate identity.
8. Configure an HTTPS reverse proxy and a managed service restart policy. Keep SQLite and uploads outside release directories so rebuilding does not remove them.

Do not reuse the preview's runtime database for automated tests. Use a separate `APP_DATA_DIR` and port. No migration step requires writing to the current WordPress sites.

## Original-source export

`scripts/export-live-wordpress.py` uses read-only WP-CLI queries against the main WordPress installation. The supplied donation-form directory was reviewed separately against the donation installation. Run `python3 scripts/export-live-wordpress.py --help` for its arguments. It writes public catalog/report files and separate private media/account manifests to the specified destinations. Review the report before importing.

The audited export includes 7,243 lessons, 384 collections, five teachers and 47 pages. Of 6,158 local media references, 396 referenced files were absent on the original server. These are source gaps; the new app retains their metadata and links to the original lesson. Explicitly protected or unresolved legacy access remains protected rather than being inferred as public.

Imports seed an empty database. Replacing a seed file does not reconcile an already-populated database. Take a backup and implement a reviewed merge before a later reimport, preserving staff edits, uploaded recordings and account changes.

## Staff workflow

Open `/admin` and sign in as an administrator. Create or edit lessons, descriptions, dedications, teachers and categories. Keep incomplete lessons as drafts, select public/member access explicitly, and upload the matching supported audio/video file. Publishing makes the lesson available immediately. Replacing media creates a new private upload; old unused upload files may require reviewed cleanup.

Use `/admin/members` to maintain membership access and expiry. Imported WordPress passwords continue to work and are upgraded in this app's database after successful login. Updating a password in one site does not update the other site.

Learners use `/account` to save teachings and view recent listening. Donation/dedication pages open the existing payment form and offer an embedded form when supported by the browser. Test an authorized sandbox payment before any production billing integration change.

## Security and backups

Keep the runtime data directory private (0700), manifests and backups readable only by the app/service administrators. Serve public files through the app or reverse proxy; never expose the database or uploads directory directly. Set the exact HTTPS `APP_ORIGIN`. Limit reverse-proxy request bodies to the supported upload size. The app validates media signatures and serves member recordings only after checking current session and membership access.

Back up the SQLite database using SQLite's online backup API, plus `uploads/`, configuration and the original-media manifest. Copying only the database file while WAL writes are active can lose changes; use an online backup or stop the app before copying the database and sidecars. Back up the original media tree separately. Test restore into an isolated directory before relying on a backup.

## Docker

Build `docker build -t breslov-torah .`. Run with `APP_ORIGIN`, a persistent writable volume at `/app/data`, and a read-only original-media mount. Supply the private manifests securely through that volume before first start. The runtime user is UID/GID 1001; volume ownership must permit access. Example:

```sh
docker run -p 127.0.0.1:3000:3000 \
  -e APP_ORIGIN=https://your-host.example \
  -e MEDIA_ROOT=/original \
  -e MEDIA_MANIFEST_PATH=/app/data/import-media.json \
  -v /secure/breslov-data:/app/data \
  -v /original/site-root:/original:ro \
  breslov-torah
```

Docker has not been run in the original development environment; validate it on the target server. Put HTTPS in front of the container and configure restart/health checks there.

## Cutover

The preview can run alongside WordPress. Before replacing the main site, verify accounts, membership expiry, original-media mounts, mail/recovery configuration, staff upload limits, all payment forms and old URL redirects. Preserve original URLs and donation hosting. Keep an original-site rollback plan and a final secure data export. Switching production DNS is outside the preview deployment.

## Initial administrator and recovery

Run `APP_DATA_DIR=/secure/breslov-data APP_ORIGIN=https://your-host.example node scripts/admin-setup.mjs` under the app service account. It prints a private setup URL valid for 30 minutes and refuses to run when an administrator already exists. Open that URL to claim administrator access. Never publish or commit it.

Staff can generate a password reset link from member administration, then send it to the verified account owner through their normal support channel. Reset links expire after 30 minutes, work once and invalidate existing sessions. Outbound password-recovery email is not configured by this release; recovery is staff assisted.

## Isolated backend tests

The writable backend suite is disabled by default. Start a separate app instance with a fresh private data directory and a localhost port, then run `QA_BASE_URL=http://127.0.0.1:3002 QA_DATA_DIR=/secure/test-data QA_ALLOW_WRITES=1 npx playwright test qa/backend.spec.ts --project=desktop`. The suite creates synthetic accounts, an owner and uploaded lessons. Run public catalog/responsive checks before this suite, because it intentionally changes the test catalog. Never enable it against production or the shared preview.

To regenerate the handoff archive, run `python3 scripts/package-source.py`. Its explicit source allowlist excludes private runtime data, credentials, node_modules and generated builds. Transfer private migration manifests and backups separately over a secure channel.

A sample managed service is provided in `deploy/breslov-next.service`. Adjust its user, Node path, project path and environment file on the destination server. The app user needs read access to original media and write access to its own data and standalone build directories. Keep the service account separate from the WordPress owner when possible. The development preview is still a detached process; this template is not installed there.
