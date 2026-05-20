'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import VideoPlayer from '@/components/VideoPlayer'
import ChatPanel from '@/components/ChatPanel'
import FileUploader from '@/components/FileUploader'
import type { Message, VideoFile, AnalysisStatus } from '@/types'
import { extractTimestamps } from '@/lib/timestamps'
import { createSession, addMessage, listSessions, getSession, deleteSession } from '@/lib/analisis-service'
import type { AnalisisSession } from '@/lib/analisis-service'
import { useIsMobile } from '@/lib/use-responsive'


const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const [video, setVideo] = useState<VideoFile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<AnalysisStatus>('idle')
  const [seekTime, setSeekTime] = useState<number | null>(null)
  const [sessions, setSessions] = useState<AnalisisSession[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const taskIdRef = useRef<string | null>(null)
  const isMobile = useIsMobile()
  const filenameRef = useRef<string>('')

  useEffect(() => { listSessions().then(setSessions).catch(() => {}) }, [])

  async function saveMessage(msg: Message) {
    if (!currentSessionId) return
    try { await addMessage(currentSessionId, msg) } catch {}
  }

  async function handleFileSelected(file: File) {
    const url = URL.createObjectURL(file)
    setVideo({ name: file.name, size: file.size, url })
    setShowHistory(false)
    setStatus('uploading')
    setMessages([])
    setCurrentSessionId(null)
    filenameRef.current = file.name

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      taskIdRef.current = data.task_id

      const sid = await createSession(file.name, data.task_id)
      setCurrentSessionId(sid)

      const welcomeMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: `⚽ Partido "${file.name}" recibido. Preguntame lo que quieras sobre el video.`,
        timestamp: Date.now(),
      }
      setMessages([welcomeMsg])
      await saveMessage(welcomeMsg)
      setStatus('done')
      listSessions().then(setSessions).catch(() => {})
    } catch {
      setStatus('error')
      setMessages([
        { id: crypto.randomUUID(), role: 'assistant', text: 'Error al subir el video. ¿Está corriendo el backend?', timestamp: Date.now() },
      ])
    }
  }

  async function handleYoutubeUrl(url: string) {
    setShowHistory(false)
    setStatus('uploading')
    setMessages([])
    setCurrentSessionId(null)
    filenameRef.current = url

    try {
      const res = await fetch(`${API_BASE}/youtube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) throw new Error('YouTube download failed')
      const data = await res.json()
      if (data.error) {
        setStatus('error')
        setMessages([{ id: crypto.randomUUID(), role: 'assistant', text: `Error: ${data.error}`, timestamp: Date.now() }])
        return
      }
      taskIdRef.current = data.task_id

      const videoUrl = `${API_BASE}/video/${data.task_id}`
      setVideo({ name: data.filename, size: 0, url: videoUrl })

      const sid = await createSession(data.filename, data.task_id)
      setCurrentSessionId(sid)

      const welcomeMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: `📹 Video de YouTube recibido. Preguntame lo que quieras sobre el partido.`,
        timestamp: Date.now(),
      }
      setMessages([welcomeMsg])
      await saveMessage(welcomeMsg)
      setStatus('done')
      listSessions().then(setSessions).catch(() => {})
    } catch {
      setStatus('error')
      setMessages([
        { id: crypto.randomUUID(), role: 'assistant', text: '⚠️ Error al descargar el video de YouTube. Descargalo manualmente (ej: con https://9convert.com) y subí el archivo .mp4 con "Subir partido".', timestamp: Date.now() },
      ])
    }
  }

  const handleSend = useCallback(
    async (text: string) => {
      const taskId = taskIdRef.current
      if (!taskId) return

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        text,
        timestamp: Date.now(),
      }
      const loadingMsg: Message = { id: crypto.randomUUID(), role: 'assistant', text: 'Analizando...', timestamp: Date.now() }
      setMessages((prev) => [...prev, userMsg, loadingMsg])
      await saveMessage(userMsg)

      try {
        const res = await fetch(`${API_BASE}/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: taskId, question: text }),
        })
        if (!res.ok) throw new Error('Ask failed')
        const data = await res.json()

        const answerMsg: Message = { id: crypto.randomUUID(), role: 'assistant', text: data.answer, timestamp: Date.now() }
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = answerMsg
          return updated
        })
        await saveMessage(answerMsg)
      } catch {
        const errMsg: Message = {
          id: crypto.randomUUID(), role: 'assistant',
          text: 'Error al consultar el análisis. ¿Está corriendo el backend y configurada la API key?',
          timestamp: Date.now(),
        }
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = errMsg
          return updated
        })
      }
    },
    [currentSessionId],
  )

  async function handleLoadSession(session: AnalisisSession) {
    setShowHistory(false)
    setCurrentSessionId(session.id)
    setMessages(session.messages)
    taskIdRef.current = session.taskId
    filenameRef.current = session.filename
    setVideo({ name: session.filename, size: 0, url: '' })
    setStatus('done')
  }

  async function handleDeleteSession(id: string) {
    await deleteSession(id)
    listSessions().then(setSessions).catch(() => {})
  }

  const markers = useMemo(() => {
    const all: number[] = []
    for (const msg of messages) {
      if (msg.role === 'assistant') {
        all.push(...extractTimestamps(msg.text))
      }
    }
    return all
  }, [messages])

  function handleSeek(seconds: number) {
    setSeekTime(seconds)
  }

  const layoutStyle = {
    ...styles.layout,
    flexDirection: isMobile ? 'column' as const : 'row' as const,
  }

  const videoColStyle = {
    ...styles.videoColumn,
    flex: isMobile ? 'none' as const : 3,
    padding: isMobile ? '0.5rem' : '1rem',
    maxHeight: isMobile ? '45vh' as const : 'none' as const,
  }

  const chatColStyle = {
    ...styles.chatColumn,
    flex: isMobile ? 1 : 2,
    padding: isMobile ? '0 0.5rem 0.5rem' : '1rem 1rem 1rem 0',
  }

  return (
    <main style={styles.page}>
      <header style={styles.toolbar}>
        <h1 style={styles.logo}>⚽ Pitubot</h1>
        <div style={styles.toolbarRight}>
          <button onClick={() => { listSessions().then(setSessions).catch(() => {}); setShowHistory(!showHistory) }} style={styles.historyBtn}>
            Historial
          </button>
          <FileUploader onFileSelected={handleFileSelected} onYoutubeUrl={handleYoutubeUrl} status={status} />
        </div>
      </header>

      <div style={layoutStyle}>
        {showHistory && (
          <aside style={{...styles.sidebar, width: isMobile ? '100%' : '16rem', maxHeight: isMobile ? '30vh' : 'none'}}>
            <h3 style={styles.sidebarTitle}>Historial de análisis</h3>
            {sessions.length === 0 && <p style={styles.sidebarEmpty}>Sin análisis guardados</p>}
            {sessions.map((s) => (
              <div key={s.id} style={styles.sessionCard}>
                <div style={styles.sessionInfo} onClick={() => handleLoadSession(s)}>
                  <strong style={styles.sessionName}>{s.filename}</strong>
                  <span style={styles.sessionDate}>{s.createdAt.toLocaleDateString()}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.id) }} style={styles.deleteBtn}>×</button>
              </div>
            ))}
          </aside>
        )}
        <div style={videoColStyle}>
          <VideoPlayer video={video} markers={markers} seekTime={seekTime} onSeek={handleSeek} />
        </div>
        <div style={chatColStyle}>
          <ChatPanel messages={messages} onSend={handleSend} onSeek={handleSeek} />
        </div>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxWidth: '100vw',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '0.0625rem solid var(--border)',
    flexShrink: 0,
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  historyBtn: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    border: '0.0625rem solid var(--border)',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--accent)',
  },
  layout: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: '16rem',
    flexShrink: 0,
    padding: '1rem',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '0.0625rem solid var(--border)',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sidebarTitle: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },
  sidebarEmpty: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
  },
  sessionCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0.75rem',
    backgroundColor: 'var(--bg-primary)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    gap: '0.5rem',
  },
  sessionInfo: {
    flex: 1,
    overflow: 'hidden',
  },
  sessionName: {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sessionDate: {
    display: 'block',
    fontSize: '0.6875rem',
    color: 'var(--text-secondary)',
    marginTop: '0.125rem',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '1.125rem',
    cursor: 'pointer',
    padding: '0 0.25rem',
  },
  videoColumn: {
    flex: 3,
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    gap: '1rem',
    minWidth: 0,
  },
  chatColumn: {
    flex: 2,
    padding: '1rem 1rem 1rem 0',
    minWidth: 0,
  },
}
