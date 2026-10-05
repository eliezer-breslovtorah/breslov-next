# Verification — 2026-10-05

Production Next.js 16.3.8 / Node.js 22.23.3 build passed, including TypeScript and 23 generated pages. The standalone production start command was exercised successfully on localhost:3001.

Playwright Chromium: all 20 tests passed on the production server. Viewports: 1440×1000, 768×1024, 390×844, 320×740. Eight page layouts per viewport were checked for horizontal overflow, loaded local images, and JavaScript errors. Mobile menu navigation, library search, format filtering, empty-state reset, and pagination were exercised. Responsive page and active-player screenshots are in `qa/screenshots`.

Screenshots were visually reviewed during development. Corrections included missing brand wordmark, portrait-caption contrast, tablet course-grid balance, and mobile related-lesson length. Rendered reference captures are in `qa/references`. Reference sites are design research, not app dependencies.

The 12 homepage media checks also passed against the public HTTPS preview after deployment.

Homepage checks verified real playback of all four public excerpts, persistent playback through client navigation, pause/resume, seek, close, keyboard format selection without autoplay, and on-demand video embedding. Vimeo embedding was checked; end-to-end video playback depends on the external provider. Homepage settings and media provenance are documented in `docs/HOMEPAGE.md`.

Importer synthetic checks passed for public/private/password-protected content handling, Hebrew text, taxonomy metadata, media URL removal, and overwrite refusal. Imported metadata still requires editorial review and a full-data trial.

Limits: Chromium only; Firefox, Safari, real-device touch testing, Docker execution, full data volume, membership, payments, full-library playback, and staff content editing have not been verified. The current catalog contains eight curated lessons, not the complete library. This is not ready to replace the production WordPress site.

Video follow-up: confirmed actual Vimeo video progress in desktop and tablet emulation. Added inline mobile playback parameters and an Open video link for browsers that cannot load the embedded player. The reported blank player on the user’s tablet still requires device confirmation.

Original-media switch: the four public preview responses were checked byte-for-byte against existing recordings, HTTP byte-range responses support seeking, and duplicate audio copies were removed from the app and standalone build. Preview aliases expose only the four configured URLs.
All 12 homepage media checks passed against the public preview after switching to originals, including real playback, persistence, pause/resume, seeking, and close across four breakpoints. WordPress homepage still returned HTTP 200.
