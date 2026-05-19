'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import type { VideoFile } from '@/types'
import Timeline from './Timeline'

interface Props {
  video: VideoFile | null
  markers: number[]
  seekTime?: number | null
  onSeek: (seconds: number) => void
  onDuration?: (seconds: number) => void
}

const SPEEDS = [0.5, 1, 1.5, 2]
const SEGMENT_DURATION = 5

export default function VideoPlayer({ video, markers, seekTime, onSeek, onDuration }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [playAllActive, setPlayAllActive] = useState(false)
  const [playAllIndex, setPlayAllIndex] = useState(-1)
  const playAllIdxRef = useRef(-1)
  const segmentStartTimeRef = useRef(0)

  useEffect(() => {
    if (seekTime != null && videoRef.current) {
      videoRef.current.currentTime = seekTime
      videoRef.current.play()
    }
  }, [seekTime])

  function handleLoadedMetadata() {
    const d = videoRef.current?.duration ?? 0
    setDuration(d)
    onDuration?.(d)
  }

  function handleTimeUpdate() {
    const t = videoRef.current?.currentTime ?? 0
    setCurrentTime(t)

    if (playAllActive) {
      if (t - segmentStartTimeRef.current >= SEGMENT_DURATION) {
        advancePlayAll()
      }
    }
  }

  function advancePlayAll() {
    const marks = [...new Set(markers)].sort((a, b) => a - b)
    const nextIdx = playAllIdxRef.current + 1
    if (nextIdx >= marks.length) {
      setPlayAllActive(false)
      setPlayAllIndex(-1)
      return
    }
    playAllIdxRef.current = nextIdx
    setPlayAllIndex(nextIdx)
    segmentStartTimeRef.current = marks[nextIdx]
    if (videoRef.current) {
      videoRef.current.currentTime = marks[nextIdx]
      videoRef.current.play()
    }
  }

  function handleTogglePlayAll() {
    if (playAllActive) {
      setPlayAllActive(false)
      setPlayAllIndex(-1)
      return
    }
    const marks = [...new Set(markers)].sort((a, b) => a - b)
    if (marks.length < 2) return
    playAllIdxRef.current = 0
    setPlayAllIndex(0)
    setPlayAllActive(true)
    segmentStartTimeRef.current = marks[0]
    if (videoRef.current) {
      videoRef.current.currentTime = marks[0]
      videoRef.current.play()
    }
  }

  function handleSpeedChange(speed: number) {
    setPlaybackRate(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }

  if (!video) {
    return (
      <section style={styles.placeholder}>
        <p style={styles.placeholderText}>Subí un partido para empezar</p>
      </section>
    )
  }

  return (
    <section style={styles.container}>
      <video
        ref={videoRef}
        src={video.url}
        controls
        style={styles.video}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
      />
      <div style={styles.controlsBar}>
        <div style={styles.speedRow}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              style={{
                ...styles.speedBtn,
                backgroundColor: playbackRate === s ? 'var(--accent)' : 'transparent',
                color: playbackRate === s ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
      <div style={styles.timelineWrapper}>
        <Timeline
          markers={markers}
          duration={duration}
          currentTime={currentTime}
          onSeek={onSeek}
          onPlayAll={handleTogglePlayAll}
          isPlayingAll={playAllActive}
        />
      </div>
    </section>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '100%',
    width: '100%',
    backgroundColor: '#000',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
  },
  video: {
    display: 'block',
    width: '100%',
    maxHeight: '60vh',
    objectFit: 'contain',
  },
  controlsBar: {
    padding: '0.375rem 1rem',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  speedRow: {
    display: 'flex',
    gap: '0.375rem',
  },
  speedBtn: {
    padding: '0.25rem 0.625rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '0.0625rem solid rgba(255,255,255,0.2)',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  timelineWrapper: {
    padding: '0.25rem 1rem 0.75rem',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  placeholder: {
    maxWidth: '100%',
    width: '100%',
    height: '50vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius)',
    border: '0.125rem dashed var(--border)',
  },
  placeholderText: {
    fontSize: '1.25rem',
    color: 'var(--text-secondary)',
  },
}
