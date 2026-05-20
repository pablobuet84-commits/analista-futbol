'use client'

import { useRef, useState } from 'react'
import type { AnalysisStatus } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Props {
  onFileSelected: (file: File) => void
  onYoutubeUrl: (url: string) => void
  status: AnalysisStatus
}

export default function FileUploader({ onFileSelected, onYoutubeUrl, status }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cookiesRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [cookiesMsg, setCookiesMsg] = useState('')
  const isWorking = status === 'uploading' || status === 'processing'

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setYoutubeUrl('')
    onFileSelected(file)
  }

  function handleYoutubeSubmit() {
    const trimmed = youtubeUrl.trim()
    if (!trimmed) return
    setFileName(trimmed)
    setYoutubeUrl('')
    onYoutubeUrl(trimmed)
  }

  async function handleCookiesUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCookiesMsg('Subiendo cookies...')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/upload/cookies`, { method: 'POST', body: formData })
      if (res.ok) {
        setCookiesMsg('✅ Cookies guardadas')
      } else {
        setCookiesMsg('❌ Error al guardar cookies')
      }
    } catch {
      setCookiesMsg('❌ Error de conexión')
    }
  }

  return (
    <div style={styles.wrapper}>
      <input
        ref={inputRef}
        type="file"
        accept=".mp4,.mov,.avi,.mkv"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isWorking}
        style={styles.button}
      >
        {isWorking ? 'Procesando...' : 'Subir partido'}
      </button>
      <span style={styles.separator}>o</span>
      <input
        type="text"
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        placeholder="Link de YouTube..."
        disabled={isWorking}
        style={styles.youtubeInput}
        onKeyDown={(e) => { if (e.key === 'Enter') handleYoutubeSubmit() }}
      />
      <button
        type="button"
        onClick={handleYoutubeSubmit}
        disabled={isWorking || !youtubeUrl.trim()}
        style={styles.button}
      >
        Cargar
      </button>
      <input
        ref={cookiesRef}
        type="file"
        accept=".txt"
        onChange={handleCookiesUpload}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => cookiesRef.current?.click()}
        style={styles.cookiesBtn}
        title="Subir cookies.txt para YouTube"
      >
        🍪
      </button>
      {cookiesMsg && <span style={styles.cookiesMsg}>{cookiesMsg}</span>}
      {fileName && <span style={styles.label}>{fileName}</span>}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  button: {
    padding: '0.5rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    border: 'none',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--accent)',
    color: '#fff',
    cursor: 'pointer',
  },
  separator: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
  },
  youtubeInput: {
    padding: '0.5rem',
    fontSize: '0.875rem',
    border: '0.0625rem solid var(--border)',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    width: '14rem',
    outline: 'none',
  },
  label: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '16rem',
  },
  cookiesBtn: {
    padding: '0.5rem 0.75rem',
    fontSize: '1rem',
    border: '0.0625rem solid var(--border)',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg-secondary)',
    cursor: 'pointer',
  },
  cookiesMsg: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
}
