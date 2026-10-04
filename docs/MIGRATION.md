# Migration to a standalone application

## Delivery scope

The Next.js application runs independently of WordPress. Its initial catalog is deliberately curated public metadata. It is not an export of the 6,000-plus-class archive. Existing images have been reused; no audio access rights are inferred from a publicly indexed page. Recording and account links still point to the existing services.

## Source verification

Catalog titles, durations and destinations were checked against these public pages on 2026-10-04 (search caches may reflect earlier page versions):

- [Azamra archive](https://www.breslovtorah.com/courses/azamra-good-point/): five lesson titles and durations.
- [Azamra lesson 4](https://www.breslovtorah.com/shiurim/azamra-lesson-4-lm1-torah-282-part-4/): Rabbi Maimon attribution.
- [LM2 lesson 330](https://www.breslovtorah.com/shiurim/lm2-lesson-330-torah-001-para-02-binding-ones-soul-to-the-tzaddik/): title, speaker and duration.
- [Existing homepage](https://www.breslovtorah.com/): Copper Snake audio/video variants, speaker and durations.
- [Simcha](https://www.breslovtorah.com/courses/simcha/), [Rabbi Maimon](https://www.breslovtorah.com/rabbi-maimon-media-library/), [Rabbi Rosenfeld](https://www.breslovtorah.com/rabbi-rosenfeld/), [Rabbi Dorfman](https://www.breslovtorah.com/rabbi-yechiel-michel-dorfman-zal/): collection and teacher destinations.

Descriptions are short editorial summaries. Lesson portraits identify the speaker; they are not original recording thumbnails. Some individual source links failed in the research cache; the accessible collection page verified those lesson titles and durations. Confirm destinations during the full import.

## Content export

Export WordPress WXR and copy the media directory. Supplement WXR with a trusted, server-side export of ACF term/post metadata and PowerPress episode metadata. Preserve stable IDs, slugs, publication dates, descriptions, ordered collection relationships, tags, speaker attribution, Hebrew text, dedications and attachment references. Import into an owned database; expose only public metadata through the catalog adapter.

Existing WordPress models:

- Shiurim: title/body/thumbnail/author; hierarchical courses, series, parshios and authors; tags.
- Videos: title, ACF video_url; types and parshas.
- Term fields: banner_image, thumbnail_image, taxonomy_description, hebrew_translation, video.
- Pages: body content, banners, accordion content and audio; donation bottom_content.
- Dedications: global dedication posts and shiur_dedicationsponsor.

Use an idempotent importer with source IDs and a migration report. Compare source/import counts and media checksums; preserve parent/child order. Audit embedded WordPress shortcodes and replace them with supported app content blocks. Map every legacy route, add permanent redirects, and verify representative nested collections and Hebrew content.

## Audio and memberships

The old theme relies on PowerPress and WishList Member; membership checks appear in single-shiurim.php. Public catalog records must not contain protected enclosure URLs. Store media location and entitlement policy server-side. Check the signed-in user before issuing short-lived playback/download URLs; test anonymous, expired and authorized access, including range requests and cache behavior.

WXR does not migrate identities or membership configuration. Export user identities and entitlements through a secured administrative process. Choose a supported identity system; migrate compatible password hashes only after verification, otherwise send a password-reset flow. Reconcile free/premium plans, active/expired memberships and billing ownership. Test login, logout, password recovery and access expiry. Do not copy credential files or database dumps into the repository or public assets.

## Other integrations and operations

Replace or explicitly bridge Gravity Forms contact/signup flows, WishList account services, Relevanssi search, donation destinations and podcast feeds. The existing donation service can remain an external destination. A button must not claim successful signup/payment without a working backend. Select and document the staff editing workflow (owned CMS or admin UI) before the final cutover.

Before cutover: migrate content and accounts, run entitlement tests, verify feeds/redirects/forms, test audio on mobile browsers, take desktop/tablet/mobile screenshots, back up production, and establish rollback. Publish only after these checks. Keep imported media and database backups separate from the application package; document restore steps and environment variables for the chosen backend.

## Included WXR metadata importer

Python 3 is sufficient; no packages or WordPress runtime are needed.

```sh
python3 scripts/import-wordpress.py /secure/export.xml --output /secure/breslov-import-001
```

The output directory must not exist. The utility never modifies the export or the live site. It emits `public-catalog.json` (the app catalog contract), `public-pages.json` (page snippets), and `migration-report.json` (counts, original taxonomy relationships and unresolved mapping records). Configure the app’s `CONTENT_CATALOG_PATH` to the reviewed public catalog when the catalog adapter is enabled.

Only published, password-free shiurim, videos and pages are considered. Draft/private/protected posts, users, unsupported post types, postmeta and enclosure fields are excluded. The importer removes URLs from snippets and excludes embedded media/script/style content. Legacy destinations must be clean HTTP(S) page URLs. Percent-encoded post and term slugs are decoded to Unicode for Next.js route parameters. Slugs accept Unicode letters/numbers, underscore and hyphen, and reject slash/path characters. Legacy URLs remain unchanged. Taxonomy relationships are retained for redirect planning; collection destinations are generated and must be verified. Missing speaker attribution is reported rather than guessed. The generic portrait must be mapped to each verified speaker.

This is a metadata import, not full content or media migration. It discards full HTML, timestamps, shortcodes and embedded media rather than pretending to recreate them. A separate reviewed sanitizer/content-block migration is required for complete lesson bodies, followed by editorial review of snippets. Transfer recordings separately to controlled storage; classify access, reconcile entitlements and implement authorized streaming before enabling native playback. A public WordPress post is not evidence that its audio is unrestricted. Keep the source export, identity exports and protected media manifests outside public assets and the application package.

The migration report contains original taxonomy slugs and IDs for administrative review. Treat all imported text and identifiers as untrusted; render as text and use framework URL encoding for route segments. Review catalog entries, page destinations, collection URL collisions and teacher attribution before publishing.

The importer rejects duplicate lesson slugs across post types and duplicate collection slugs across taxonomies before creating output. Review these collisions and choose explicit route mappings in the source export rather than silently overwriting records. Invalid slugs also fail the import.
