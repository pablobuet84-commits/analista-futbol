export const TIMESTAMP_RE = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g

export interface TimestampSeg {
  key: string
  type: 'text' | 'ts'
  value: string
  seconds?: number
}

export function parseTimestamps(text: string): TimestampSeg[] {
  const segments: TimestampSeg[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  TIMESTAMP_RE.lastIndex = 0
  while ((match = TIMESTAMP_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ key: `t-${lastIndex}`, type: 'text', value: text.slice(lastIndex, match.index) })
    }
    const m = match[3]
      ? parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3])
      : parseInt(match[1]) * 60 + parseInt(match[2])
    segments.push({ key: `ts-${match.index}`, type: 'ts', value: match[0], seconds: m })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    segments.push({ key: `t-${lastIndex}`, type: 'text', value: text.slice(lastIndex) })
  }
  return segments
}

export function extractTimestamps(text: string): number[] {
  const seconds: number[] = []
  let match: RegExpExecArray | null
  TIMESTAMP_RE.lastIndex = 0
  while ((match = TIMESTAMP_RE.exec(text)) !== null) {
    const m = match[3]
      ? parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3])
      : parseInt(match[1]) * 60 + parseInt(match[2])
    seconds.push(m)
  }
  return seconds
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
