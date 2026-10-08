"use client";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import { PLAYBACK_SPEEDS, useMedia, type PublicTrack } from "./media-provider";
export function LessonPlayback({
  track,
  videoEmbedUrl,
  videoSrc,
}: {
  track: PublicTrack;
  videoEmbedUrl?: string;
  videoSrc?: string;
}) {
  let embedSource = videoEmbedUrl;
  if (videoEmbedUrl) {
    const url = new URL(videoEmbedUrl);
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("playsinline", "1");
    embedSource = url.toString();
  }
  const media = useMedia();
  const [opened, setOpened] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  function skipVideo(seconds: number) {
    const element = video.current;
    if (!element || !Number.isFinite(element.duration) || element.duration <= 0)
      return;
    element.currentTime = Math.min(
      element.duration,
      Math.max(0, element.currentTime + seconds),
    );
  }
  useEffect(() => {
    if (video.current) video.current.playbackRate = media.playbackRate;
  }, [media.playbackRate]);
  useEffect(() => {
    if (media.activeVideo !== track.id) video.current?.pause();
  }, [media.activeVideo, track.id]);
  if (videoEmbedUrl || videoSrc)
    return (
      <div className="playback-panel">
        <h2>Watch this teaching</h2>
        {opened && media.activeVideo === track.id ? (
          videoEmbedUrl ? (
            <iframe
              className="lesson-video"
              title={track.title}
              src={embedSource}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <video
                className="lesson-video"
                ref={video}
                src={videoSrc}
                controls
                autoPlay
                playsInline
                preload="metadata"
                onLoadedMetadata={() => {
                  if (video.current) {
                    video.current.playbackRate = media.playbackRate;
                    setVideoReady(
                      Number.isFinite(video.current.duration) &&
                        video.current.duration > 0,
                    );
                  }
                }}
                onPlay={() => media.startVideo(track.id)}
              />
              <div className="native-video-controls">
                <button
                  type="button"
                  aria-label="Back 15 seconds"
                  disabled={!videoReady}
                  onClick={() => skipVideo(-15)}
                >
                  <RotateCcw size={20} />
                  15 sec
                </button>
                <button
                  type="button"
                  aria-label="Forward 15 seconds"
                  disabled={!videoReady}
                  onClick={() => skipVideo(15)}
                >
                  <RotateCw size={20} />
                  15 sec
                </button>
                <label className="playback-speed">
                  <span className="sr-only">Playback speed</span>
                  <select
                    aria-label="Playback speed"
                    value={media.playbackRate}
                    onChange={(event) =>
                      media.setPlaybackRate(Number(event.target.value))
                    }
                  >
                    {PLAYBACK_SPEEDS.map((speed) => (
                      <option key={speed} value={speed}>
                        {speed === 1 || speed === 2 ? speed.toFixed(1) : speed}×
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )
        ) : (
          <button
            className="button"
            onClick={() => {
              setOpened(true);
              media.startVideo(track.id);
            }}
          >
            Play video
          </button>
        )}
        {videoEmbedUrl && (
          <a href={videoEmbedUrl} target="_blank" rel="noreferrer">
            Open video ↗
          </a>
        )}
      </div>
    );
  return (
    <div className="playback-panel">
      <h2>Listen to this teaching</h2>
      <div className="native-play-actions">
        <button
          className="button"
          onClick={() => {
            if (media.track?.id === track.id && media.playing)
              media.pauseAudio();
            else media.playAudio(track);
          }}
        >
          {media.track?.id === track.id && media.playing
            ? "Pause teaching"
            : "Play teaching"}
        </button>
        <a
          className="button button-secondary"
          href={`${track.audioSrc}?download=1`}
        >
          Download audio
        </a>
      </div>
      <p>Keep listening as you explore the library.</p>
    </div>
  );
}
