# Migration status

The Next.js app now includes the full exported lesson catalog and a standalone SQLite publishing/account backend. See [WORDPRESS-AUDIT.md](WORDPRESS-AUDIT.md) for source inventory and [HANDOFF.md](HANDOFF.md) for installation, data migration, backup and cutover steps.

The original WordPress installations remain unchanged. Media is read in place through an explicit private manifest, with a separate writable directory for new uploads. Password hash compatibility permits imported identities to sign in; administrator access is provisioned separately.

Donation and dedication pages reuse the current Gravity Forms service rather than duplicating payment handling. Future payment-to-membership synchronization, email configuration and final live cutover need deployment configuration and review. Missing original recordings and unresolved legacy access are documented in the import report and remain linked to their original lessons.

Do not switch the production main domain until the team has tested its own accounts, membership policies, original media mounts, payment workflows, administrator access and backups on the new deployment. Keep donation hosting and original URL compatibility available throughout migration.
