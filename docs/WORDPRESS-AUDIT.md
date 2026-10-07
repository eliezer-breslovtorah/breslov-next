# WordPress feature and migration audit
Audited 2026-10-07 using read-only WP-CLI SQL/eval with plugins and themes skipped. The original main and donation installations were not changed.

## Imported inventory
The standalone catalog contains 6,913 published shiurim, 330 published videos, 47 published pages, 384 collection terms and five speakers. Private/draft content was excluded. Password-protected and explicitly protected published records retain catalog metadata with their bodies withheld.
Source inventory also includes 76 private shiurim, three private pages, 24 published ordinary posts and 22 draft dedications; these are recorded in the report rather than automatically published.

6,160 published PowerPress enclosure metadata records were found; 6,022 have duration metadata. 4,338 shiurim have body content and 1,936 contain timestamps. The catalog retains sanitized full text, excerpts, dedication text, source IDs, original slugs, dates and all term relationships. Eight published shiurim have passwords. Unsupported/no-enclosure media remains available through its original lesson bridge.

Taxonomy counts: courses42, series190, parshios59, types39, parshas54, authors5, tags10,364. Hierarchy contains151 child series,15 child courses and54 child parshios. The five teachers are Rabbi Nasan Maimon, Rabbi Zvi Aryeh Rosenfeld, Rabbi Michel Dorfman, Sara Wurtzel and Rabbi Aryeh Kaplan. The latter two use the existing logo until verified portraits are supplied.

## Extraction
```sh
python3 scripts/export-live-wordpress.py --wordpress /path/to/original-wordpress --output /path/to/breslov-next
```
Requires Python3, WP-CLI and administrative read access to the original database. It invokes WP-CLI with subprocess argument arrays, never shell interpolation. It queries core tables directly without loading plugins/themes. WordPress configuration and integrations are not copied. Output must be outside WordPress; only the new application output files are written.

Public files: content/catalog.json and content/import-report.json.
Private files: data/import-media.json and data/import-users.json, mode0600. Keep data/ out of Git, web-accessible files, Docker contexts and distributable source archives. The private identity file contains existing password hashes and account information solely for an authorized migration; never print it. The private media file contains relative original paths, MIME and access policy.

Descriptions/bodies are plain text. Executable HTML, embeds, paired shortcodes and media URLs are removed. Existing paired shortcode content is intentionally omitted rather than executing WordPress shortcodes. Protected/password bodies and dedications are withheld. Rich content, accordion layout, images and clickable timestamp structures still require dedicated content-block handling by the app. Original title/slug/destination relationships remain for redirect and reconciliation work.

## Access evidence and correction
There are6,016 published shiurim with numeric level assignments. Assignment alone is not protection: WishList protect() reads a special Protection row. There are21 explicitly protected published shiurim andtwo videos; protected taxonomy roots include Rosenfeld Topics and Hebrew/Yiddish. Default protection is off, individual file protection is off, and folder protection is enabled under /files. Ancestor taxonomy protection is conservatively included in the exporter.

The old template calls wlmapi_is_user_a_member(level_id,1). The plugin API defines the second argument as a user ID, not an active-status flag: this checks user1, not the current visitor. Therefore those calls do not prove that all original recordings require premium membership. This correction is important for faithful migration.

Anonymous guest HTTP verification found native PowerPress audio players on three representative unprotected recordings:
- wp-shiurim-38464, Rabbi Maimon, YD2 lesson028a (download link also visible).
- wp-shiurim-46309, Rabbi Rosenfeld, Torah79.
- wp-shiurim-43388, Sara Wurtzel, LM2 Torah7 (download link also visible).

Combined with the exact active protection rules, this supports public original streaming for valid local /media enclosures without password, post or inherited taxonomy protection. Unknown/protected recordings remain legacy, retaining the original service rather than gaining a new generic member entitlement. Safe public Vimeo/YouTube embeds are derived from public video fields; protected video embeds are not emitted.

Original media hotlink protection rejects empty/other-host referrers. That restriction is distinct from membership. The app should serve owned original media through its server-only manifest with range handling rather than expose protected source paths. Never use a caller-controlled path. Reconcile every private manifest record to its catalog lesson and enforce policy before serving bytes.

## Identity and premium membership snapshot
2,313 existing identities were privately exported without administrative privileges. Existing hash families are2,060 phpass ($P$) and253 WordPress bcrypt ($wp). The app must implement those exact verification formats and rehash only in the new application after successful authentication/password change.

Only Level2 (1518450894) and VIP/Lifetime (1529520606) can produce the new member role. Level1 (1498007018) remains user. Level2 expires afterone Year from its registration timestamp, clamped to the account registration timestamp; VIP has no configured expiry. Explicit expired, cancelled, unconfirmed, forapproval and scheduled activation/removal states are excluded conservatively; future cancellation caps access. The resulting snapshot has90 active premium accounts and41 inactive premium assignments. No admin role is imported.

This snapshot does not migrate payment providers, future renewals, email integrations, content-drip actions or membership lifecycle automations. The new app must reconcile subsequent renewals/cancellations; copied lifetime status must not override a later cancellation. WordPress plugin expiry filters are not executed during this read-only export. Existing special post/category policies remain legacy until their level-specific rules can be represented exactly.

## Staff publishing parity
ACF groups cover page banners, taxonomy banners/thumbnails/descriptions/Hebrew translations, video URLs, shiur dedications and nested accordion headings/content/audio. Staff tools need these fields plus title/body, speaker, all taxonomy relationships, ordering, source recording metadata, draft/publish status, thumbnails, timestamped descriptions and explicit playback policy. Keep payment/contact operations distinct from the public catalog importer.

## Verification and remaining review
The migration report records source counts, slug collisions, access counts and unresolved media locations. Collection slugs are taxonomy-prefixed except established homepage aliases (azamra, simcha, likutey-moharan-2, nach); source parent IDs remain intact. Hebrew vowel marks are preserved. Video/audio collisions receive distinct route suffixes while retaining original legacy destinations. Verify count parity, private-data exclusion from source bundles, actual byte-range playback, identity hash checks, policy denials, protected bodies and staff publishing before cutover.

## Original storage audit
The6158 manifest records resolve to5762 existing recordings and396 missing files. No paths escaped the original storage root and no existing files were empty. Existing recordings total148,945,196,488 bytes (about139GiB). The report includes missing media IDs, never media paths. The new player must handle missing originals with a clear unavailable state and original lesson fallback; hasMedia records source metadata, not guaranteed local file existence. Plan separate media transfer and checksum verification rather than bundling recordings in source archives.

The exporter refreshes JSON seeds only; it never opens or modifies the app database. Existing empty-only database initialization preserves staff edits on subsequent seed refreshes. A future merge/reimport must match stable source IDs, update only untouched imported revisions, preserve staff-created records and editor changes, and report conflicts for review. Do not reset an existing database to force a catalog refresh.
