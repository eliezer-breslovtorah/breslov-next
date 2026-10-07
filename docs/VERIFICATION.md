# Verification — 2026-10-07

Next.js 16.3.8 / Node.js 22.23.3 production compilation and TypeScript checks passed for the full app. A clean source-archive install is also verified independently; no node_modules, build outputs, private database or migration manifests are included in the archive.

## Public browser checks

32 checks cover 1440×1000, 768×1024, 390×844 and 320×740: sixteen public/account page layouts per viewport; horizontal overflow and image loading; menus; library search, format/teacher filters, empty states and pagination; course pagination with preserved filters and oldest-first guided lessons; homepage audio, controls, persistence and video embedding; full-library original-file audio playback and HTTP ranges.

The public HTTPS preview passed these checks across the four widths. Two mobile checks failed during the initial post-restart/account import window; both passed on focused rerun, and the full twelve responsive checks subsequently passed together. Forty repeated course requests returned 200. Initial owner/account import should be completed before announcing a fresh deployment.

Four additional isolated browser checks cover signed-in staff dashboard, new lesson editor, membership management, category/teacher editor and account pages at all four widths. Screenshots were captured and visually reviewed. Fixes include mobile search sizing, category-selector overflow, dark-panel control contrast and duplicate lesson excerpts.

## Isolated backend checks

Two desktop integration tests verify one-time administrator setup and replay rejection; legacy WordPress password compatibility and local hash upgrades; signup/login/logout; administrator-only uploads; drafts excluded from public pages/playback; publishing without rebuilding; public and protected media; current/expired membership access; bookmarks and listening history; category and teacher creation; single-use password recovery with session invalidation; CSRF rejection; sanitized search input.

These checks use synthetic accounts and recordings in a separate localhost database. Writable tests are intentionally skipped against the public preview.

## Storage and import checks

The full catalog contains 7,243 lessons, 384 collections, five teachers and 47 source pages. Utility/staff/status pages are excluded from the public directory. The private account import contains 2,313 identities and 90 active member accounts; no WordPress administrator roles are imported.

All four homepage originals passed real HEAD/range requests. All 58 typed collision redirects passed. Protected guest requests are rejected and search responses omit private media paths and nonpublic embed URLs. Temporary fixture checks cover traversal, symlink escape, invalid ranges, empty files, and 120 abort/cancellation races without unhandled errors. Missing originals retain their metadata and original-site links.

WordPress main and donation homepages still return HTTP 200. No original content, media, database, plugin, theme or WordPress configuration was modified by this feature build.

## Deployment limits

Chromium emulation was tested; actual Safari/Firefox and real tablets still require team validation. Vimeo playback depends on the external provider and browser settings. Existing Gravity Forms payment flows are reused; no live charges or payment submission were made during QA. New billing-to-membership synchronization is not included. Password recovery is staff assisted; outbound email is not configured. Docker and managed-service templates are provided but not executed here. The preview is a detached process and requires restart after a server reboot. Final production domain cutover remains separate from the preview deployment.

## Native navigation and live search (2026-10-07)

The complete isolated-browser suite passed 49 checks across desktop, tablet, mobile, and 320px small mobile; 23 tests requiring explicit write-test authorization were skipped. Separate isolated contact/newsletter and matchmaking submission checks passed, including private attachment access and invalid-image rejection. Visual screenshots were reviewed for articles and newsletter layouts. The newsletter honeypot was explicitly hidden after screenshot review.

A rapid filter regression check also covers changing two selectors in succession, retaining the search, clearing the page number, and returning through browser history. It exposed a selective-format FTS query plan; full-text queries now begin with matching FTS rows before joining lessons. The portable package was installed with npm ci, typechecked and built successfully in a fresh directory outside the original workspace.

Final clean-build checks passed autocomplete and rapid filter/history interactions at all four viewport sizes. The combined Maimon + Video + oldest search decreased from about 5.3 seconds to under one second during local verification. The tested clean standalone build was installed on the isolated preview; original WordPress and donation homepages continued returning HTTP 200.

Public HTTPS preview verification completed: **53 passed, 23 skipped**, across desktop (1440px), tablet (768px), mobile (390px), and small mobile (320px). Skipped tests require isolated writes or authenticated staff fixtures. No automated form submissions were sent to the shared preview.
