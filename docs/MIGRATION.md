# Migration status

The Next.js app now includes the full exported lesson catalog and a standalone SQLite publishing/account backend. See [WORDPRESS-AUDIT.md](WORDPRESS-AUDIT.md) for source inventory and [HANDOFF.md](HANDOFF.md) for installation, data migration, backup and cutover steps.

The original WordPress installations remain unchanged. Media is read in place through an explicit private manifest, with a separate writable directory for new uploads. Password hash compatibility permits imported identities to sign in; administrator access is provisioned separately.

Donation and dedication pages reuse the current Gravity Forms service rather than duplicating payment handling. Future payment-to-membership synchronization, email configuration and final live cutover need deployment configuration and review. Missing original recordings and unresolved legacy access are documented in the import report and remain linked to their original lessons.

Do not switch the production main domain until the team has tested its own accounts, membership policies, original media mounts, payment workflows, administrator access and backups on the new deployment. Keep donation hosting and original URL compatibility available throughout migration.

## Native navigation update (2026-10-07)

The app now includes the 24 published articles, newsletter archives and subscription requests, native contact and matchmaking forms, twelve calendar topic collections, giving projects, and original public images served through an exact resource allowlist. Historical WordPress paths redirect to native destinations. Original recordings and images stay in their existing storage location. No WordPress configuration or data was changed.

Contact, matchmaking, and newsletter requests are private in `/admin/inquiries`. Newsletter subscriptions require staff to add the address to the existing mailing service; no automatic delivery integration is configured. Back up the entire private `APP_DATA_DIR`, including inquiry attachments. Payment forms continue using the existing secure donation service. Nine unresolved historical references point to Contact; the missing original project brochure points to Projects. One archived article has no original body and displays an honest archive notice.

Library filters update immediately, and typed search updates after a short debounce with keyboard-accessible lesson, teacher, and course suggestions.
