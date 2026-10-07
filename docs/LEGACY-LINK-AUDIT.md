# Legacy link and form audit

Read-only main WordPress audit on 2026-10-07. No source posts, forms, files, entries or donation configuration were changed.

## Native capabilities

| Capability          | Source                                                     | Required native behavior                                                                                        |
| ------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Contact             | Gravity Forms 2 (5 fields)                                 | Name/initials, email, subject, optional message; replace CAPTCHA with new-site spam protection                  |
| Matchmaking         | Gravity Forms 44 (7 fields)                                | Required name, email, gender and year of birth; optional phone/address; private staff inbox                     |
| Follow-up           | Gravity Forms 56 (24 fields)                               | Photo upload, choice/list fields and long answers; controlled native form with private uploads and staff review |
| Newsletter          | WishList Level 1 shortcode plus Constant Contact campaigns | Native signup/opt-in; provider delivery requires an integration rather than an invented subscription success    |
| Calendar            | courses/calendar term 352, twelve month children 353–364   | Reuse native month/holiday library hierarchy; source is not an event-calendar iframe                            |
| Weekly/live classes | Public Zoom and GoToMeeting destinations                   | Native schedule page retaining genuine public join links and archival library navigation                        |
| Accounts            | WishList login/registration/status pages                   | Native account flows and explanations                                                                           |
| Administration      | Published team-management page                             | Authenticated /admin; never expose staff management as public content                                           |

## Export artifacts

content/page-links.json maps each original page slug to sanitized {label,href} anchors. Original lesson/taxonomy/page destinations are rewritten to native routes. content/page-aliases.json maps original hierarchical page paths to native destinations. Unknown main-site routes and original media/folder paths fall back to native contact rather than disclose protected locations. Historical document/image references are listed below; final disposition is documented in the native navigation update.
data/main-forms.json contains three sanitized field definitions (0600, ignored private directory); no entries, notifications, recipient addresses, billing configuration or API credentials were queried/exported.

## Intentional external providers

Established donation checkout on donate.breslovtorah.com remains the payment service until a separately verified payment migration. Hosted newsletter campaigns on conta.cc remain publisher content. Public Zoom/GoToMeeting links retain the published joining data; query values are deliberately omitted from this audit document. Approved Vimeo/YouTube embeds remain provider media.
No external newsletter subscription action was present in the source signup page: it used [wlm_register "Level 1"]. Do not mistake the conta.cc campaign link for a signup endpoint.

## Page hierarchy and route coverage

| Original canonical path                                                                             | Native target                                                                                            | Page                                                                                                    |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| /home/                                                                                              | /                                                                                                        | Home                                                                                                    |
| /contact/                                                                                           | /contact                                                                                                 | Contact Rabbi Nasan Maimon                                                                              |
| /rabbi-maimon-media-library/                                                                        | /teachers/nasan-maimon                                                                                   | Rabbi Nasan Maimon's Library of Breslov Shiurim                                                         |
| /rabbi-rosenfeld/                                                                                   | /teachers/zvi-aryeh-rosenfeld                                                                            | R' Zvi Aryeh Ben-Zion Rosenfeld - Media Library                                                         |
| /courses/calendar/                                                                                  | /calendar                                                                                                | Calendar                                                                                                |
| /error-message/                                                                                     | /account                                                                                                 | Error Message                                                                                           |
| /courses/                                                                                           | /courses                                                                                                 | Courses                                                                                                 |
| /topics/                                                                                            | /library                                                                                                 | Breslov Topics                                                                                          |
| /about-us/                                                                                          | /about                                                                                                   | About Us                                                                                                |
| /become-a-member/                                                                                   | /account/signup                                                                                          | Becoming a Member of BreslovTorah.com                                                                   |
| /parsha/                                                                                            | /library?topic=Parsha                                                                                    | Parsha                                                                                                  |
| /rabbi-maimon-likutey-moharan-live-online/                                                          | /pages/rabbi-maimon-likutey-moharan-live-online                                                          | Live Shiurim                                                                                            |
| /log-in/                                                                                            | /account                                                                                                 | Log In                                                                                                  |
| /this-content-is-for-premium-members-only/                                                          | /account                                                                                                 | This Content is for Breslov Torah Members                                                               |
| /membership-cancelled/                                                                              | /account                                                                                                 | Membership Cancelled                                                                                    |
| /oops-wrong-membership-level/                                                                       | /account                                                                                                 | Oops! Wrong Membership Level                                                                            |
| /welcome-new-member/                                                                                | /account                                                                                                 | Welcome!                                                                                                |
| /free-registration/                                                                                 | /account/signup                                                                                          | Free Registration                                                                                       |
| /about-us/our-mission/                                                                              | /about                                                                                                   | Our Mission                                                                                             |
| /parsha-email-the-breslov-bridge/                                                                   | /newsletter                                                                                              | Parsha Email - The Breslov Bridge                                                                       |
| /about-us/rabbi-nasan-maimons-weekly-class-schedule/                                                | /pages/rabbi-nasan-maimons-weekly-class-schedule                                                         | Rabbi Nasan Maimon's Ongoing Weekly Classes - Open to the Public                                        |
| /blog/                                                                                              | /pages/blog                                                                                              | Blog                                                                                                    |
| /hilkhos-matanos-laevyonim/                                                                         | /pages/hilkhos-matanos-laevyonim                                                                         | Hilkhos Matanos l'Evyonim (Gifts to the Poor) on Purim                                                  |
| /join-our-mailing-list/                                                                             | /newsletter                                                                                              | Join Our Mailing List                                                                                   |
| /a-parents-prayer-for-erev-rosh-chodesh-sivan/                                                      | /pages/a-parents-prayer-for-erev-rosh-chodesh-sivan                                                      | Tefilas HaSheLaH HaKadosh - A Parent's Prayer - Erev Rosh Chodesh Sivan                                 |
| /parsha/parsha-newsletter-the-breslov-bridge-archive/                                               | /newsletter                                                                                              | Parsha Newsletter - The Breslov Bridge                                                                  |
| /parsha/audio-shiurim/                                                                              | /library?topic=Parsha                                                                                    | Parsha Audio Shiurim                                                                                    |
| /kosher-kitchen-tevilas-keilim-mikveh-immersion-of-dining-and-food-preparation-utensils-guidelines/ | /pages/kosher-kitchen-tevilas-keilim-mikveh-immersion-of-dining-and-food-preparation-utensils-guidelines | Kosher Kitchen - Tevilas Keilim (Mikveh Immersion of Dining and Food Preparation Utensils) - Guidelines |
| /עברית/                                                                                             | /pages/%D7%A2%D7%91%D7%A8%D7%99%D7%AA                                                                    | עברית                                                                                                   |
| /the-matchmakers-chair/                                                                             | /community/matchmaking                                                                                   | Matchmaker's Chair                                                                                      |
| /prayer-for-a-beautiful-esrog/                                                                      | /pages/prayer-for-a-beautiful-esrog                                                                      | Prayer for a Beautiful Esrog                                                                            |
| /privacy-policy/                                                                                    | /pages/privacy-policy                                                                                    | Privacy Policy                                                                                          |
| /special-prayers-for-you-your-loved-ones/                                                           | /pages/special-prayers-for-you-your-loved-ones                                                           | Lag B'Omer 5785 - Pidyon Nefesh For You & Your Loved Ones                                               |
| /thank-you-matchmakers-chair/                                                                       | /community/matchmaking                                                                                   | Thank You - Matchmaker's Chair                                                                          |
| /rabbi-rosenfeld-zl-yahrzeit-commemoration-rsvp/                                                    | /pages/rabbi-rosenfeld-zl-yahrzeit-commemoration-rsvp                                                    | Rabbi Rosenfeld z"l Yahrzeit Commemoration 5786 (2025)                                                  |
| /rabbi-rosenfeld-zl-yahrzeit-commemoration-sponsorship-opportunities/                               | /donate                                                                                                  | Rabbi Rosenfeld z”l Yahrzeit Commemoration: Sponsorship Opportunities                                   |
| /matchmaker-follow-up-questionnaire/                                                                | /community/matchmaking/follow-up                                                                         | Matchmaker - Follow-Up Questionnaire                                                                    |
| /emergency-fund-for-ukrainian-jews/                                                                 | /donate                                                                                                  | Emergency Fund for Ukrainian Jews                                                                       |
| /sponsorship/                                                                                       | /donate                                                                                                  | Sponsor R' Nasan Maimon's Shiur @ Shapell's!                                                            |
| /sichos-haran-001-beyond-words/                                                                     | /pages/sichos-haran-001-beyond-words                                                                     | Sichos HaRan 1 - Beyond Words                                                                           |
| /food-for-the-soul-nourishing-the-joy-of-healthy-living-spiritually-and-physically-5-minute-clips/  | /pages/food-for-the-soul-nourishing-the-joy-of-healthy-living-spiritually-and-physically-5-minute-clips  | Food for the Soul - Nourishing the Joy of Healthy Living - Spiritually and Physically (5-Minute Clips)  |
| /rabbi-yechiel-michel-dorfman-zal/                                                                  | /teachers/michel-dorfman                                                                                 | R' Dorfman                                                                                              |
| /uman-rosh-hashanah/                                                                                | /pages/uman-rosh-hashanah                                                                                | Uman Rosh HaShanah                                                                                      |
| /rav-michel-dorfman-zal-yahrzeit/                                                                   | /pages/rav-michel-dorfman-zal-yahrzeit                                                                   | Join Us in Honoring the Legacy of Rabbi Yechiel Michel Dorfman zal                                      |
| /new-courses-page/                                                                                  | /courses                                                                                                 | New Courses Page                                                                                        |
| /wishlist-member/                                                                                   | /account                                                                                                 | WishList Member                                                                                         |
| /team-management/                                                                                   | /admin                                                                                                   | Team Management                                                                                         |

## Link inventory

| Host                   | Source occurrences |
| ---------------------- | -----------------: |
| www.breslovtorah.com   |                196 |
| conta.cc               |                107 |
| zoom.us                |                  1 |
| global.gotomeeting.com |                  1 |
| www.star-k.org         |                  1 |

Source anchors blocked for unsupported schemes/userinfo: 3. Native link groups: 47.

## Outstanding asset and route references

- home: missing-route /shiurim/bereishis-the-hidden-creation-of-water-clip/
- rabbi-maimon-media-library: missing-route /series/hilulas/
- rabbi-rosenfeld: missing-route /series/halakha-rabbi-rosenfeld-zl/
- courses: missing-route /courses/halakha-rabbi-rosenfeld-zl/
- topics: missing-route /shiurim/topic-21-prayer-ashrey-tehillim-helps-tshuvah-cm2-lesson-061a-clip-perika-uteenah-4-para-17b/
- topics: missing-route /shiurim/purim-lm1-lesson-039b-torah-010-para-1-4-mid/
- topics: missing-route /shiurim/parsha-06-toldos-bris-milah-and-eretz-yisrael-excerpt/
- topics: missing-route /videos/behar-bechukosai-the-kabbalah-of-business/
- topics: missing-route /shiurim/topic-cash-flow-and-netilas-yadayim-washing-hands-before-a-meal/
- topics: missing-route /shiurim/rabbi-maimon-parsha-08-vayishlach-tzadaka-charity-empowers/
- topics: missing-route /shiurim/rabbi-rosenfeld-ein-yaakov-lesson-091/
- topics: missing-route /shiurim/oc2-lesson-041-birkas-hamazon-5-para-5-9/
- topics: missing-route /shiurim/rabbi-rosenfeld-ein-yaakov-lesson-174b-avos-derav-nasan-28-eretz-yisrael/
- topics: missing-route /shiurim/ein-yaakov-lesson-091a-torah-education-naches-from-children/
- topics: missing-route /shiurim/nasan-maimon-parsha-53-haazeinu-suffering-and-recovery-from-illness/
- topics: missing-route /shiurim/rabbi-rosenfeld-ein-yaakov-lesson-174b-avos-derav-nasan-28-eretz-yisrael/
- topics: missing-route /shiurim/eh-lesson-040c-kidushin-1-part-1/
- topics: missing-route /shiurim/ein-yaakov-lesson-012a-clip-2-why-is-the-path-to-marriage-so-difficult/
- topics: missing-route /shiurim/rabbi-rosenfeld-ein-yaakov-lesson-106a-maseches-bavabasra-page-121/
- topics: missing-route /courses/parnassa/
- topics: missing-route /shiurim/LH5-26-lesson-278a-Aveylus-Part-1
- topics: missing-route /shiurim/nasan-maimon-parsha-53-haazeinu-suffering-and-recovery-from-illness/
- topics: missing-route /shiurim/purim-lm1-lesson-039b-torah-010-para-1-4-mid/
- topics: missing-route /shiurim/purim-lm1-lesson-039b-torah-010-para-1-4-mid/
- topics: missing-route /shiurim/eh-lesson-040b-ishus-4-para-19-to-end-2/
- topics: missing-route /shiurim/eh-lesson-040c-kidushin-1-part-1/
- topics: missing-route /shiurim/rabbi-rosenfeld-ein-yaakov-lesson-006a/
- topics: missing-route /shiurim/rabbi-rosenfeld-ein-yaakov-lesson-006a/
- topics: missing-route /shiurim/topics-uman-rescue-rabbi-nachman-and-the-30-thousand-jewish-martyrs-part-1/
- hilkhos-matanos-laevyonim: missing-route /campaign-matanos-levyonim-gifts-to-the-needy-distributed-for-purim/
- sponsorship: asset-transfer /wp-content/uploads/2022/07/Breslov-Torah-Our-Projects-Updated-July-2022.pdf
- uman-rosh-hashanah: asset-transfer /wp-content/uploads/2025/06/hotel-one.jpg
- new-courses-page: missing-route /courses/halakha-rabbi-rosenfeld-zl/
- new-courses-page: missing-route /courses/halakha-rabbi-rosenfeld-zl/

Do not replace historical class dates with invented current dates. Review retired campaigns and expired event notices. The source also has24 published ordinary posts; native blog/article coverage needs a separate content import if the blog remains in scope.

## Historical redirects recovered

Read-only published old-slug metadata added 6043 historical lesson aliases. Exact enabled URL redirects were reconciled against native destinations; regex or conditional redirects were not blindly replayed. 24 page-anchor fallbacks were resolved through those aliases. The artifact also includes current lesson/collection destinations for historical bookmarks. No users, entries or configuration secrets were queried.

Final link sanitation removed 14 bare conta.cc homepage placeholders rather than treating them as newsletters. 9 unresolved main-site source references still use native contact fallback. Provider links retain source labels; The hotel image is now served in place through the resource allowlist; the missing brochure links to Projects. Public link JSON contains no original recording/folder paths or WordPress UI destinations.

## Native navigation update (2026-10-07)

The app now includes the 24 published articles, newsletter archives and subscription requests, native contact and matchmaking forms, twelve calendar topic collections, giving projects, and original public images served through an exact resource allowlist. Historical WordPress paths redirect to native destinations. Original recordings and images stay in their existing storage location. No WordPress configuration or data was changed.

Contact, matchmaking, and newsletter requests are private in `/admin/inquiries`. Newsletter subscriptions require staff to add the address to the existing mailing service; no automatic delivery integration is configured. Back up the entire private `APP_DATA_DIR`, including inquiry attachments. Payment forms continue using the existing secure donation service. Nine unresolved historical references point to Contact; the missing original project brochure points to Projects. One archived article has no original body and displays an honest archive notice.

Library filters update immediately, and typed search updates after a short debounce with keyboard-accessible lesson, teacher, and course suggestions.
