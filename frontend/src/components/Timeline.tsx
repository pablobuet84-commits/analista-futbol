'use client'

import { useMemo, useCallback } from 'react'
import { formatTime } from '@/lib/timestamps'

interface Props {
  markers: number[]
  duration: number
  currentTime: number
  onSeek: (seconds: number) => void
  onPlayAll?: () => void
  isPlayingAll?: boolean
}

export default function Timeline({ markers, duration, currentTime, onSeek, onPlayAll, isPlayingAll }: Props) {
  const uniqueMarkers = useMemo(() => [...new Set(markers)].sort((a, b) => a - b), [markers])

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    onSeek(Math.round(pct * duration))
  }, [duration, onSeek])

  if (duration === 0) return null

  return (
    <div style={styles.wrapper}>
      <div style={styles.barRow}>
        <div style={styles.bar} onClick={handleBarClick}>
          <div style={{ ...styles.progress, width: `${progressPct}%` }} />
          {uniqueMarkers.map((sec) => (
            <div
              key={sec}
              onClick={(e) => { e.stopPropagation(); onSeek(sec) }}
              style={{
                ...styles.marker,
                left: `${(sec / duration) * 100}%`,
              }}
              title={`${formatTime(sec)}`}
            />
          ))}
        </div>
        {uniqueMarkers.length > 1 && (
          <button onClick={onPlayAll} style={styles.playAllBtn} title="Reproducir todos los momentos">
            {isPlayingAll ? '■' : '▶'}
          </button>
        )}
      </div>
      <div style={styles.labels}>
        <span>{formatTime(0)}</span>
        <span>{uniqueMarkers.length > 0 ? `${uniqueMarkers.length} momentos` : formatTime(Math.round(duration))}</span>
      </div>
    </div>
  )
}

const SEGMENT_DURATION = 5

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    padding: '0.25rem 0',
  },
  barRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  bar: {
    position: 'relative',
    flex: 1,
    height: '0.5rem',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  progress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: 'var(--accent)',
    borderRadius: '0.25rem',
    pointerEvents: 'none',
    opacity: 0.6,
  },
  marker: {
    position: 'absolute',
    top: '50%',
    width: '0.625rem',
    height: '0.625rem',
    backgroundColor: 'var(--accent)',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    cursor: 'pointer',
    border: '0.125rem solid var(--bg-primary)',
    zIndex: 1,
  },
  playAllBtn: {
    width: '1.75rem',
    height: '1.75rem',
    fontSize: '0.75rem',
    border: '0.0625rem solid var(--accent)',
    borderRadius: '50%',
    backgroundColor: 'transparent',
    color: 'var(--accent)',
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.6875rem',
    color: 'var(--text-secondary)',
    marginTop: '0.25rem',
  },
}
