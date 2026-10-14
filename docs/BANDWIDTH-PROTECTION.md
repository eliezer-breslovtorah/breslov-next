# Bandwidth protection

Apache crawler-protection.conf is installed in both HTTP and HTTPS cPanel userdata includes for preview.breslovtorah.com and app.breslovtorah.com. These virtual-host rules run before reverse proxying; .htaccess is disabled for preview. Keep these includes when configuring app hosting. The main WordPress .htaccess also blocks these user agents.

The media API preserves existing public/member/legacy permissions. GET requests are limited per connected client IP to 120 requests per 15 minutes and 20 full-file or explicit download requests per 15 minutes. Range playback remains supported. A denied request returns 429 with Retry-After: 900. Counters persist in SQLite and share across recordings. HEAD requests are exempt. Apache overwrites X-Breslov-Client-IP; keep application ports bound to loopback and preserve this trusted-header configuration in any new proxy.

The preview runs under breslov-preview.service on 127.0.0.1:3002, using .bandwidth-build/standalone. Its environment is retained privately in /root/breslov-preview-runtime.json. Apache configuration backups and the prior media route are in /root/bandwidth-protection-backup-20261013-113248. The prior server on port 3001 remains available for rollback.

These limits bound request volume, not total bytes, and do not prevent distributed clients or spoofed user agents. Shared client IPs share the limits.
