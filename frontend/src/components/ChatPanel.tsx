'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Message } from '@/types'
import { parseTimestamps, formatTime } from '@/lib/timestamps'

interface Props {
  messages: Message[]
  onSend: (text: string) => void
  onSeek?: (seconds: number) => void
  disabled?: boolean
}

export default function ChatPanel({ messages, onSend, onSeek, disabled }: Props) {
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || disabled) return
    onSend(text)
    setInput('')
  }

  const handleTimestampClick = useCallback((seconds: number) => {
    onSeek?.(seconds)
  }, [onSeek])

  return (
    <aside style={styles.panel}>
      <header style={styles.header}>
        <h2 style={styles.title}>Análisis táctico</h2>
      </header>

      <div ref={listRef} style={styles.list}>
        {messages.length === 0 && (
          <p style={styles.empty}>
            Hacé una pregunta sobre el partido.{' '}
            <br />
            Ej: <em>"seguí al 9"</em> o <em>"contá los centros"</em>
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.message,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor:
                msg.role === 'user'
                  ? 'var(--accent)'
                  : 'var(--bg-tertiary)',
            }}
          >
            {msg.role === 'assistant' ? (
              <p style={styles.messageText}>
                {parseTimestamps(msg.text).map((seg) =>
                  seg.type === 'ts' ? (
                    <button
                      key={seg.key}
                      onClick={() => handleTimestampClick(seg.seconds!)}
                      style={styles.timestamp}
                      title={`Ir al momento ${formatTime(seg.seconds!)}`}
                    >
                      {seg.value}
                    </button>
                  ) : (
                    <span key={seg.key}>{seg.value}</span>
                  )
                )}
              </p>
            ) : (
              <p style={styles.messageText}>{msg.text}</p>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Preguntale al asistente..."
          disabled={disabled}
          style={styles.input}
        />
        <button type="submit" disabled={disabled || !input.trim()} style={styles.button}>
          Enviar
        </button>
      </form>
    </aside>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius)',
    overflow: 'hidden',
  },
  header: {
    padding: '1rem',
    borderBottom: '0.0625rem solid var(--border)',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: 600,
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  empty: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    textAlign: 'center',
    marginTop: '2rem',
  },
  message: {
    maxWidth: '85%',
    padding: '0.625rem 1rem',
    borderRadius: 'var(--radius)',
  },
  messageText: {
    fontSize: '0.9375rem',
    lineHeight: 1.5,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    margin: 0,
  },
  timestamp: {
    display: 'inline',
    padding: '0.125rem 0.375rem',
    margin: '0 0.125rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.15)',
    border: '0.0625rem solid rgba(255,255,255,0.15)',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    color: 'inherit',
    transition: 'background-color 0.15s',
  },
  form: {
    display: 'flex',
    gap: '0.5rem',
    padding: '0.75rem',
    borderTop: '0.0625rem solid var(--border)',
  },
  input: {
    flex: 1,
    padding: '0.625rem 0.875rem',
    fontSize: '0.9375rem',
    border: '0.0625rem solid var(--border)',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  button: {
    padding: '0.625rem 1.25rem',
    fontSize: '0.9375rem',
    fontWeight: 600,
    border: 'none',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--accent)',
    color: '#fff',
    cursor: 'pointer',
  },
}
