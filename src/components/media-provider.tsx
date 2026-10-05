"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Pause, Play, X, ExternalLink } from "lucide-react";

export type PublicTrack = {
  id: string;
  title: string;
  speaker: string;
  duration: string;
  audioSrc: string;
  pageUrl: string;
};
type MediaContextValue = {
  track: PublicTrack | null;
  playing: boolean;
  activeVideo: string | null;
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
export function MediaProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const request = useRef(0);
  const [track, setTrack] = useState<PublicTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  function attemptPlay() {
    const element = audio.current;
    if (!element) return;
    const current = ++request.current;
    setError("");
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
        playAudio,
        startVideo,
        pauseAudio,
        stopVideo: () => setActiveVideo(null),
      }}
    >
      <div className={track ? "has-audio-player" : undefined}>
        {children}
        <audio
          ref={audio}
          preload="none"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={() => setPosition(audio.current?.currentTime ?? 0)}
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
          <section className="sticky-player" aria-label="Audio player">
            <div className="sticky-copy">
              <span>Now listening</span>
              <Link href={track.pageUrl}>{track.title}</Link>
              <small>{track.speaker}</small>
            </div>
            <div className="player-controls">
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
            </div>
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
                  if (audio.current) audio.current.currentTime = value;
                  setPosition(value);
                }}
              />
              <span>{duration ? timeLabel(duration) : track.duration}</span>
            </div>
            <a
              href={track.pageUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open original lesson"
            >
              <ExternalLink size={18} />
            </a>
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
                <a href={track.pageUrl} target="_blank" rel="noreferrer">
                  Open original lesson
                </a>
              </p>
            )}
          </section>
        )}
      </div>
    </MediaContext.Provider>
  );
}
