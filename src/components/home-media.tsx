"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Play, Pause, Headphones, ExternalLink } from "lucide-react";
import { useMedia, type PublicTrack } from "./media-provider";
export type { PublicTrack } from "./media-provider";
export type FeaturedItem = {
  id: string;
  title: string;
  speaker: string;
  duration: string;
  poster: string;
  videoEmbedUrl: string;
  videoPageUrl: string;
  audio?: PublicTrack;
  pageUrl: string;
};
export function FeaturedTeaching({ item }: { item: FeaturedItem }) {
  const media = useMedia();
  const [tab, setTab] = useState<"watch" | "listen">("watch");
  const id = useId();
  const videoVisible = tab === "watch" && media.activeVideo === item.id;
  function selectTab(next: "watch" | "listen") {
    setTab(next);
    if (next === "listen") media.stopVideo();
  }
  function tabKeys(event: KeyboardEvent<HTMLButtonElement>) {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const next =
        event.key === "Home"
          ? "watch"
          : event.key === "End"
            ? "listen"
            : tab === "watch"
              ? "listen"
              : "watch";
      selectTab(next);
      document.getElementById(`${id}-${next}`)?.focus();
    }
  }
  return (
    <div className="featured-teaching">
      {item.audio && (
        <div className="media-tabs" role="tablist" aria-label="Teaching format">
          <button
            type="button"
            role="tab"
            id={`${id}-watch`}
            aria-controls={`${id}-panel`}
            aria-selected={tab === "watch"}
            tabIndex={tab === "watch" ? 0 : -1}
            onKeyDown={tabKeys}
            onClick={() => selectTab("watch")}
          >
            Watch
          </button>
          <button
            type="button"
            role="tab"
            id={`${id}-listen`}
            aria-controls={`${id}-panel`}
            aria-selected={tab === "listen"}
            tabIndex={tab === "listen" ? 0 : -1}
            onKeyDown={tabKeys}
            onClick={() => {
              selectTab("listen");
              if (item.audio) media.playAudio(item.audio);
            }}
          >
            Listen
          </button>
        </div>
      )}
      <div
        id={`${id}-panel`}
        role={item.audio ? "tabpanel" : undefined}
        aria-labelledby={item.audio ? `${id}-${tab}` : undefined}
        className="feature-player"
      >
        <div className="feature-poster">
          {videoVisible ? (
            <iframe
              src={item.videoEmbedUrl}
              title={`${item.title} — video`}
              width="640"
              height="360"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <>
              <img src={item.poster} alt="" />
              <button
                type="button"
                className="feature-play"
                aria-label={
                  tab === "listen"
                    ? `Listen to ${item.title}`
                    : `Play video: ${item.title}`
                }
                onClick={() => {
                  if (tab === "listen" && item.audio)
                    media.playAudio(item.audio);
                  else media.startVideo(item.id);
                }}
              >
                {tab === "listen" ? (
                  <Headphones size={30} />
                ) : (
                  <Play size={30} />
                )}
                <span>
                  {tab === "listen" ? "Listen to teaching" : "Play video"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
      <div className="featured-meta">
        <div>
          <h3>{item.title}</h3>
          <p>
            {item.speaker} <span aria-hidden="true">·</span>{" "}
            {tab === "listen" && item.audio
              ? item.audio.duration
              : item.duration}
          </p>
        </div>
        <a href={tab === "watch" ? item.videoPageUrl : item.pageUrl} target="_blank" rel="noreferrer">
          {tab === "watch" ? "Open video" : "Original lesson"} <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
export function ShortClips({ items }: { items: PublicTrack[] }) {
  const media = useMedia();
  return (
    <div className="short-clips">
      {items.map((item) => (
        <article key={item.id} className="clip-card">
          <button
            type="button"
            className="clip-play"
            aria-label={`${media.track?.id === item.id && media.playing ? "Pause" : "Play"} ${item.title}`}
            onClick={() => {
              if (media.track?.id === item.id && media.playing)
                media.pauseAudio();
              else media.playAudio(item);
            }}
          >
            {media.track?.id === item.id && media.playing ? (
              <Pause size={18} />
            ) : (
              <Play size={18} />
            )}
          </button>
          <div>
            <h3>{item.title}</h3>
            <p>{item.speaker}</p>
            <span className="meta">
              <Headphones size={12} /> Audio <span aria-hidden="true">·</span>{" "}
              {item.duration}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
