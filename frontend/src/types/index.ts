export interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: number
}

export interface VideoFile {
  name: string
  size: number
  url: string
}

export type AnalysisStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error'
