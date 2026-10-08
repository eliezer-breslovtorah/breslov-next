"use client";

import {
  createContext,
  useContext,
  useEffect,
  type CSSProperties,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  Pause,
  Play,
  X,
  ExternalLink,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import "../app/playback-controls.css";

export const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

export type PublicTrack = {
  id: string;
  title: string;
  speaker: string;
  duration: string;
  audioSrc: string;
  pageUrl: string;
  fallbackUrl?: string;
};
type MediaContextValue = {
  track: PublicTrack | null;
  playing: boolean;
  activeVideo: string | null;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  playAudio: (track: PublicTrack) => void;
  startVideo: (id: string) => void;
  pauseAudio: () => void;
  stopVideo: () => void;
};
const MediaContext = createContext<MediaContextValue | null>(null);
export function useMedia() {
  const value = useContext(MediaContext);
  if (!value) throw new Error("Media controls must be inside MediaProvider");
  return value;
}
function timeLabel(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}
export function MediaProvider({
  children,
  signedIn = false,
}: {
  children: ReactNode;
  signedIn?: boolean;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const player = useRef<HTMLElement>(null);
  const [playerHeight, setPlayerHeight] = useState(0);
  const request = useRef(0);
  const lastSaved = useRef(0);
  const [track, setTrack] = useState<PublicTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [playbackRate, updatePlaybackRate] = useState(1);
  function setPlaybackRate(rate: number) {
    if (!PLAYBACK_SPEEDS.some((speed) => speed === rate)) return;
    updatePlaybackRate(rate);
    if (audio.current) audio.current.playbackRate = rate;
  }
  function seekTo(value: number) {
    const element = audio.current;
    if (
      !element ||
      !Number.isFinite(element.duration) ||
      element.duration <= 0 ||
      !Number.isFinite(value)
    )
      return;
    const next = Math.min(element.duration, Math.max(0, value));
    element.currentTime = next;
    setPosition(next);
  }
  useEffect(() => {
    const element = player.current;
    if (!track || !element) return;
    const measure = () =>
      setPlayerHeight(Math.ceil(element.getBoundingClientRect().height));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [track]);
  function persistProgress(force = false) {
    if (
      !signedIn ||
      !track ||
      !audio.current ||
      !track.id.match(/^(wp-|[a-f0-9]{8}-)/)
    )
      return;
    if (!force && Date.now() - lastSaved.current < 15000) return;
    lastSaved.current = Date.now();
    void fetch("/api/account/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId: track.id,
        position: audio.current.currentTime,
      }),
    }).catch(() => {});
  }
  function attemptPlay() {
    const element = audio.current;
    if (!element) return;
    const current = ++request.current;
    setError("");
    element.playbackRate = playbackRate;
    element.play().catch(() => {
      if (request.current === current) {
        setPlaying(false);
        setError(
          "This recording could not play here. Open the original lesson to listen.",
        );
      }
    });
  }
  function playAudio(next: PublicTrack) {
    const element = audio.current;
    if (!element) return;
    setActiveVideo(null);
    if (element.getAttribute("src") !== next.audioSrc) {
      ++request.current;
      element.pause();
      element.src = next.audioSrc;
      element.load();
      setPosition(0);
      setDuration(0);
    }
    setTrack(next);
    attemptPlay();
  }
  function pauseAudio() {
    ++request.current;
    audio.current?.pause();
    setPlaying(false);
  }
  function startVideo(id: string) {
    pauseAudio();
    setActiveVideo(id);
  }
  function close() {
    ++request.current;
    audio.current?.pause();
    audio.current?.removeAttribute("src");
    audio.current?.load();
    setTrack(null);
    setPlaying(false);
    setError("");
    setPosition(0);
    setDuration(0);
  }
  return (
    <MediaContext.Provider
      value={{
        track,
        playing,
        activeVideo,
        playbackRate,
        setPlaybackRate,
        playAudio,
        startVideo,
        pauseAudio,
        stopVideo: () => setActiveVideo(null),
      }}
    >
      <div
        className={track ? "media-layout has-audio-player" : "media-layout"}
        style={
          track && playerHeight
            ? ({
                "--audio-player-height": `${playerHeight}px`,
              } as CSSProperties)
            : undefined
        }
      >
        {children}
        <audio
          ref={audio}
          preload="none"
          onLoadedMetadata={() => {
            if (audio.current) audio.current.playbackRate = playbackRate;
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => {
            setPlaying(false);
            persistProgress(true);
          }}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={() => {
            setPosition(audio.current?.currentTime ?? 0);
            persistProgress();
          }}
          onDurationChange={() => {
            const value = audio.current?.duration ?? 0;
            setDuration(Number.isFinite(value) ? value : 0);
          }}
          onError={() => {
            if (audio.current?.getAttribute("src")) {
              setPlaying(false);
              setError(
                "This recording could not play here. Open the original lesson to listen.",
              );
            }
          }}
        />
        {track && (
          <section
            ref={player}
            className="sticky-player"
            aria-label="Audio player"
          >
            <div className="sticky-copy">
              <span>Now listening</span>
              <Link href={track.pageUrl}>{track.title}</Link>
              <small>{track.speaker}</small>
            </div>
            <div className="player-controls">
              <button
                type="button"
                aria-label="Back 15 seconds"
                disabled={!duration}
                onClick={() => seekTo((audio.current?.currentTime ?? 0) - 15)}
              >
                <RotateCcw size={20} />
                <span className="skip-seconds">15</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (playing) {
                    pauseAudio();
                  } else {
                    setActiveVideo(null);
                    attemptPlay();
                  }
                }}
                aria-label={
                  playing ? `Pause ${track.title}` : `Resume ${track.title}`
                }
              >
                {playing ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                type="button"
                aria-label="Forward 15 seconds"
                disabled={!duration}
                onClick={() => seekTo((audio.current?.currentTime ?? 0) + 15)}
              >
                <RotateCw size={20} />
                <span className="skip-seconds">15</span>
              </button>
            </div>
            <label className="playback-speed">
              <span className="sr-only">Playback speed</span>
              <select
                aria-label="Playback speed"
                value={playbackRate}
                onChange={(event) =>
                  setPlaybackRate(Number(event.target.value))
                }
              >
                {PLAYBACK_SPEEDS.map((speed) => (
                  <option key={speed} value={speed}>
                    {speed === 1
                      ? "1.0"
                      : speed.toFixed(speed === 2 ? 1 : speed === 1.5 ? 1 : 2)}
                    ×
                  </option>
                ))}
              </select>
            </label>
            <div className="player-seek">
              <span>{timeLabel(position)}</span>
              <input
                aria-label="Seek audio"
                type="range"
                min={0}
                max={duration || 1}
                step={1}
                value={Math.min(position, duration || 0)}
                disabled={!duration}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  seekTo(value);
                }}
              />
              <span>{duration ? timeLabel(duration) : track.duration}</span>
            </div>
            <Link href={track.pageUrl} aria-label="Open lesson">
              <ExternalLink size={18} />
            </Link>
            <button
              type="button"
              onClick={close}
              aria-label="Close audio player"
            >
              <X size={20} />
            </button>
            {error && (
              <p className="media-error" role="alert">
                {error}{" "}
                <Link
                  href={`/contact?subject=${encodeURIComponent(`Recording help: ${track.title}`)}`}
                >
                  Ask for recording help
                </Link>
              </p>
            )}
          </section>
        )}
      </div>
    </MediaContext.Provider>
  );
}
