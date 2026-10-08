import Link from "next/link";
import { notFound } from "next/navigation";
import { getLesson, getLessons, getMedia } from "@/lib/catalog";
import { getCurrentUser, canAccessMembers } from "@/lib/auth";
import { LessonTags } from "@/components/lesson-tags";
import { LessonCard } from "@/components/lesson-card";
import { BookmarkButton } from "@/components/account-forms";
import { getLessonMediaAvailability } from "@/lib/media-availability";
import { LessonPlayback } from "@/components/lesson-playback";
import { getLessonSeries } from "@/lib/lesson-series";
import "@/app/lesson-series.css";
import "@/app/lesson-text.css";
import { lessonTextParagraphs, lessonTextPreview } from "@/lib/lesson-text";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const l = getLesson(slug);
  return {
    title: l?.title || "Teaching",
    description: l?.description.slice(0, 160),
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ seriesPage?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const lesson = getLesson(slug);
  if (!lesson) notFound();
  const about = lessonTextPreview(
    lessonTextParagraphs(lesson.bodyText || lesson.description),
  );
  const series = getLessonSeries(
    lesson,
    typeof query.seriesPage === "string" ? query.seriesPage : undefined,
  );
  const seriesHref = (page: number) =>
    `/lessons/${encodeURIComponent(lesson.slug)}?seriesPage=${page}#lesson-series`;
  const user = await getCurrentUser();
  const media = lesson.id ? getMedia(lesson.id) : undefined;
  const effectiveAccess = lesson.access || media?.access || "legacy";
  const availability = lesson.id
    ? await getLessonMediaAvailability(lesson.id)
    : "missing";
  const native =
    availability === "available" &&
    media &&
    effectiveAccess !== "legacy" &&
    (effectiveAccess === "public" || canAccessMembers(user)) &&
    media.access !== "legacy" &&
    (media.access === "public" || canAccessMembers(user));
  const track = {
    id: lesson.id || lesson.slug,
    title: lesson.title,
    speaker: lesson.speaker,
    duration: lesson.duration || "",
    audioSrc: `/api/media/${encodeURIComponent(lesson.id || lesson.slug)}`,
    pageUrl: `/lessons/${encodeURIComponent(lesson.slug)}`,
  };
  const related = getLessons({ teacher: lesson.speaker, pageSize: 5 })
    .items.filter((l) => l.slug !== lesson.slug)
    .slice(0, 4);
  return (
    <div className="page-wrap">
      <nav className="breadcrumb">
        <Link href="/library">Library</Link>
        <span>/</span>
        <span>{lesson.collection}</span>
      </nav>
      <section className="detail-grid">
        <div>
          <p className="eyebrow">{lesson.collection}</p>
          <h1>{lesson.title}</h1>
          <p className="detail-teacher">{lesson.speaker}</p>
          <div className="meta">
            <span>{lesson.format}</span>
            {lesson.duration && <span>{lesson.duration}</span>}
            {lesson.publishedAt && (
              <time dateTime={lesson.publishedAt}>
                {new Date(lesson.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            )}
          </div>
          <LessonTags categories={lesson.categories} />
          {lesson.dedication && (
            <aside className="lesson-dedication">
              <h2>Dedication</h2>
              <p>{lesson.dedication}</p>
            </aside>
          )}
          {lesson.videoEmbedUrl &&
          (effectiveAccess === "public" ||
            (effectiveAccess === "members" && canAccessMembers(user))) ? (
            <LessonPlayback
              track={track}
              videoEmbedUrl={lesson.videoEmbedUrl}
            />
          ) : native ? (
            <LessonPlayback
              track={track}
              videoSrc={lesson.format === "Video" ? track.audioSrc : undefined}
            />
          ) : (
            <div className="playback-panel">
              <h2>
                {effectiveAccess === "members"
                  ? "Member teaching"
                  : "Listen to this teaching"}
              </h2>
              <p>
                {effectiveAccess === "members"
                  ? "Sign in with an active membership to play this recording."
                  : availability !== "available"
                    ? "This recording is currently unavailable. Ask our team for help finding or restoring it."
                    : "This recording needs an access review. Contact our team for help."}
              </p>
              <div className="native-play-actions">
                {effectiveAccess === "members" && (
                  <Link
                    className="button"
                    href={`/account?next=${encodeURIComponent(`/lessons/${lesson.slug}`)}`}
                  >
                    Sign in to listen
                  </Link>
                )}
                <Link
                  className="button button-secondary"
                  href={`/contact?subject=${encodeURIComponent(`Recording help: ${lesson.title}`)}`}
                >
                  Ask for recording help
                </Link>
              </div>
            </div>
          )}
          <article className="prose">
            <h2>About this lesson</h2>
            <div className="lesson-description">
              {about.visible.map((paragraph, index) => (
                <p key={index} dir="auto">
                  {paragraph}
                </p>
              ))}
              {about.more.length > 0 && (
                <details className="lesson-description-more">
                  <summary>Read more about this lesson</summary>
                  <div>
                    {about.more.map((paragraph, index) => (
                      <p key={index} dir="auto">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </article>
        </div>
        <aside className="lesson-aside">
          <img src={lesson.image} alt={lesson.speaker} />
          <div>
            <h2>Share the light of Torah</h2>
            <p>Honor someone special by sponsoring a teaching.</p>
            <Link
              className="button"
              href={`/donate/torah-shiur?lesson=${encodeURIComponent(lesson.title)}`}
            >
              Dedicate this lesson
            </Link>
            <p>
              {user && lesson.id ? (
                <BookmarkButton lessonId={lesson.id} />
              ) : (
                <Link href="/account">Sign in to save this lesson →</Link>
              )}
            </p>
          </div>
        </aside>
      </section>
      {series && (
        <section
          className="section lesson-series"
          id="lesson-series"
          aria-labelledby="lesson-series-title"
        >
          <div className="lesson-series-header">
            <div>
              <p className="eyebrow">More from this series</p>
              <h2 id="lesson-series-title">{series.collection.title}</h2>
              <p>{series.total} lessons · Oldest first</p>
            </div>
            <Link
              href={`/courses/${encodeURIComponent(series.collection.slug)}`}
            >
              Browse this series →
            </Link>
          </div>
          {(series.previous || series.next) && (
            <nav
              className="lesson-series-neighbors"
              aria-label="Continue this series"
            >
              {series.previous && (
                <Link
                  href={`/lessons/${encodeURIComponent(series.previous.slug)}`}
                >
                  <small>← Previous lesson</small>
                  <strong>{series.previous.title}</strong>
                </Link>
              )}
              {series.next && (
                <Link href={`/lessons/${encodeURIComponent(series.next.slug)}`}>
                  <small>Next lesson →</small>
                  <strong>{series.next.title}</strong>
                </Link>
              )}
            </nav>
          )}
          <ol
            className="lesson-series-list"
            start={(series.page - 1) * series.pageSize + 1}
          >
            {series.items.map((item, index) => (
              <li
                key={item.slug}
                className={item.slug === lesson.slug ? "is-current" : undefined}
              >
                <Link
                  href={
                    item.slug === lesson.slug
                      ? "#lesson-series"
                      : `/lessons/${encodeURIComponent(item.slug)}`
                  }
                  aria-current={item.slug === lesson.slug ? "page" : undefined}
                >
                  <span className="lesson-series-number" aria-hidden="true">
                    {(series.page - 1) * series.pageSize + index + 1}
                  </span>
                  <span className="lesson-series-copy">
                    <strong>{item.title}</strong>
                    <small>
                      {item.speaker} · {item.format}
                      {item.duration ? ` · ${item.duration}` : ""}
                    </small>
                  </span>
                  {item.slug === lesson.slug && (
                    <span className="lesson-series-current">
                      Current lesson
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
          {series.pages > 1 && (
            <nav
              className="lesson-series-pagination"
              aria-label="Series lesson pages"
            >
              {series.page > 1 && (
                <Link href={seriesHref(series.page - 1)}>
                  ← Previous lessons
                </Link>
              )}
              <span>
                Page {series.page} of {series.pages}
              </span>
              {series.page < series.pages && (
                <Link href={seriesHref(series.page + 1)}>Next lessons →</Link>
              )}
              {series.page !== series.currentPage && (
                <Link href={seriesHref(series.currentPage)}>
                  Back to current lesson
                </Link>
              )}
            </nav>
          )}
        </section>
      )}
      <section className="section">
        <div className="section-heading">
          <h2>Continue exploring</h2>
          <Link href="/library">Browse the library →</Link>
        </div>
        <div className="card-grid">
          {related.map((l) => (
            <LessonCard key={l.slug} lesson={l} />
          ))}
        </div>
      </section>
    </div>
  );
}
