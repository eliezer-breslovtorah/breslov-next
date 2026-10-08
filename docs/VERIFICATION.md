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

## Mobile navigation, compact tags, and lesson series (2026-10-08)

The corrected reference https://breslov.therapidcaster.com was reviewed in mobile Chromium, including its five-tab bottom navigation and a lesson's series continuation list. Reference screenshot: `qa/references/rapidcaster-mobile.png`.

Three agents produced separate feature commits for tags, mobile navigation, and series lists. New checks cover tag deduplication and keyboard expansion, five accessible mobile tabs and search focus, player/menu stacking, footer visibility, exact series membership, chronological previous/next links, current lesson highlighting, and pagination beyond 100 lessons. A series test's accessible-name selector was corrected to account for whitespace between text blocks; all twelve targeted menu/series checks then passed across desktop, tablet, mobile, and small mobile.

Final public HTTPS preview suite: **69 passed, 23 skipped** across 1440px desktop, 768px tablet, 390px mobile, and 320px small mobile. Tests requiring isolated writes or authenticated staff fixtures remain skipped on the shared preview. A fresh archive extraction passed npm ci, typecheck, production build, and all 16 new feature checks. Application sources matched the deployed clean build. Reviewed screenshots include player/menu stacking, expanded tags, and series lists. Original WordPress still returned HTTP 200.

## Original media watcher (2026-10-08)

Ten isolated Node/SQLite tests passed: stable uploads, growing/empty files, restart recovery, edited metadata preservation, supported extensions, rules, exact-path deduplication, concurrent watcher instances, and symlink/root bounds. The dedicated live service baselined 6,392 existing media files and then completed a second scan with zero additions; the existing library remained at 7,243 lessons. Originals and WordPress were not modified. The service is enabled at boot, with original storage explicitly read-only under systemd.

## Lesson notes, playback controls, and header tag search (2026-10-08)

Final public HTTPS verification: **101 passed, 27 skipped** across desktop (1440px), tablet (768px), mobile (390px), and small mobile (320px). Skipped checks require isolated authenticated/write fixtures or a synthetic native video. Four native-video control checks passed separately against an isolated localhost database; enable those checks with `QA_NATIVE_VIDEO_SLUG` pointing to a local fixture. No fixture was added to the public catalog.

Screenshots and browser checks cover cleaned lesson paragraphs, preserved full text behind Read more, long single-paragraph notes, 15-second seek controls, all five playback speeds, header tag autocomplete, keyboard navigation, selected tag labels, and dropdown/player stacking on narrow screens. Less common tags remain visible in the library filter even when absent from its initial facet list. Vimeo continues to use its provider controls.

A fresh source extraction passed npm ci, typecheck, production build, and all ten watcher tests. Application sources match the deployed clean standalone build. The original WordPress homepage returned HTTP 200, and the independently managed media watcher remained active.
