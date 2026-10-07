# Preview hosting

Preview URL: https://preview.breslovtorah.com
DNS: A record to 167.71.95.192, DNS only, managed by Cloudflare.

The isolated cPanel subdomain uses /home/newbreslovtorah/public_html/preview-public as its document root. Preview-only Apache includes are /etc/apache2/conf.d/userdata/{std,ssl}/2_4/newbreslovtorah/preview.breslovtorah.com/next-preview.conf. They proxy to the standalone Next.js server on 127.0.0.1:3001; /.well-known/ stays available for AutoSSL validation. The main WordPress virtual hosts are unchanged apart from cPanel-generated whitespace/alias ordering.

A trusted Let’s Encrypt certificate was issued through cPanel AutoSSL on 2026-10-04. AutoSSL is enabled for preview.breslovtorah.com; www.preview.breslovtorah.com remains excluded. Responses include X-Robots-Tag: noindex, nofollow.

The preview server is currently a detached process, not an installed boot service. Logs and PID are under .tools/preview-server.log and .tools/preview-processes.txt. The full-app preview uses `NEXT_OUTPUT_DIR=.next`, `PORT=3001`, `APP_ORIGIN=https://preview.breslovtorah.com`, `MEDIA_ROOT=/home/newbreslovtorah/public_html`, and absolute `APP_DATA_DIR`, `CATALOG_SEED_PATH`, and `MEDIA_MANIFEST_PATH` values rooted in `/home/breslov-next`. Supply these when restarting with `npm start` after a reboot. The preview now uses the standard `.next` build output, validated from a clean source extraction. The local Node runtime is .tools/node-v22.23.3-linux-x64/bin/node, but it is not needed when the team has Node.js 22 installed. The previous temporary Cloudflare tunnel is no longer needed.

Verification: trusted TLS and hostname validation passed; HTTPS homepage/library returned 200; tablet-sized Chromium rendered assets and exercised search without request or JavaScript errors; existing WordPress homepage returned 200.

Public homepage audio: `/audio/` bypasses the Next.js proxy. Four exact AliasMatch mappings read original recordings from `/home/newbreslovtorah/public_html/media`. The portable template is `deploy/public-audio-apache.conf`; the aliases belong only to the preview virtual hosts. WordPress .htaccess files and originals remain unchanged.
