import Link from "next/link";
import { notFound } from "next/navigation";
import { getLesson, getLessons, getMedia } from "@/lib/catalog";
import { getCurrentUser, canAccessMembers } from "@/lib/auth";
import { LessonCard } from "@/components/lesson-card";
import { BookmarkButton } from "@/components/account-forms";
import { getLessonMediaAvailability } from "@/lib/media-availability";
import { LessonPlayback } from "@/components/lesson-playback";
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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();
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
          <div className="lesson-category-list">
            {(lesson.categories || [])
              .filter((t) => t.taxonomy !== "authors")
              .map((t) => (
                <Link
                  key={`${t.taxonomy}-${t.id}`}
                  href={`/library?category=${encodeURIComponent(t.slug)}`}
                >
                  {t.title}
                </Link>
              ))}
          </div>
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
            {lesson.bodyText ? (
              <div className="lesson-body">{lesson.bodyText}</div>
            ) : (
              <p>{lesson.description}</p>
            )}
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
