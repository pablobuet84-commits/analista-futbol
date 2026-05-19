import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Analista Fútbol',
  description: 'Plataforma de análisis táctico de video para Directores Técnicos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
