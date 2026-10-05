# Homepage editorial settings

Edit `content/homepage.json`, then rebuild and restart the app. It controls the featured teaching (video, optional matching audio, title/teacher/duration/poster), three short clips, highlighted course slugs, and explicitly known first lesson slugs. Select an actual first lesson only; collections without one show an Explore action. This is a source-file editing workflow, not a staff CMS.

The four public audio excerpts are served directly from their original files under `/home/newbreslovtorah/public_html/media`; there are no audio copies in this project. Their `/audio/*.mp3` URLs are mapped by preview-only Apache aliases. See `deploy/public-audio-apache.conf` for the four exact-file mappings. No directory-wide URL alias is provided, and no private media or member entitlements are exposed.

For deployment, include that template inside the app's Apache virtual host before the catch-all ProxyPass, substitute the existing media directory if it differs, validate Apache configuration, then reload gracefully. Both HTTP and HTTPS virtual hosts need the mappings. The template disables inherited WordPress .htaccess rules within the Next.js virtual host only; do not add it to the WordPress virtual host. Apache serves the files read-only and supports byte-range requests for seeking. Keep the existing recordings in place and backed up separately; the source ZIP does not include them. A direct localhost Next.js server has no Apache aliases, so audio testing should use the configured app virtual host. Another hosting server will need access to these originals or equivalent media hosting.

Current feature: Bereishis – The Hidden Creation of Water, Rabbi Nasan Maimon, Vimeo video 761745697 (3:22), matching audio clip (3:00). Thumbnail reused from the public Vimeo oEmbed response. Short clips: The First Step (1:45), You Are Not Alone (1:29), Every Good Thought Counts (1:10). Source-page URLs remain in the settings for verification and playback fallback.

The video iframe loads only after a Play click. Audio never autoplays on entry; it begins only through an explicit playback action. A single player persists through Next.js client navigation. Starting video pauses audio; starting audio unloads video. Player controls provide pause/resume, seeking, closing, and an error fallback to the original lesson.

Full library playback and staff authentication/editor migration remain separate from these public homepage excerpts.
