# Analista Fútbol

App de análisis táctico de videos para Directores Técnicos.

## Estructura

```
analista-futbol/
├── frontend/          Next.js 14 + React + TypeScript
│   └── src/
│       ├── app/       page.tsx, layout.tsx, globals.css
│       ├── components/ VideoPlayer, ChatPanel, FileUploader, Timeline
│       ├── lib/        firebase.ts, analisis-service.ts, timestamps.ts, use-responsive.ts
│       └── types/      index.ts
└── backend/           FastAPI + Gemini
    ├── main.py        POST /upload, POST /ask, GET /status
    ├── gemini_service.py  Conexión con Gemini API
    ├── requirements.txt
    └── .env.example
```

## Features implementadas

1. **Subida de videos** — Frontend sube al backend, backend guarda localmente
2. **Gemini IA** — Analiza videos con preguntas tácticas (requiere API key)
3. **Timestamps clickeables** — [MM:SS] en respuestas, click para saltar en el video
4. **Timeline visual** — Barra de progreso con marcadores de todos los momentos
5. **Firebase** — Historial de análisis guardado en Firestore
6. **Selector de velocidad** — 0.5x, 1x, 1.5x, 2x
7. **Playlist automática** — Botón ▶ para reproducir todos los momentos seguidos
8. **Responsive** — Se adapta a mobile/tablet (stack vertical)
9. **Prompt táctico** — Sistema experto en fútbol con detección de jugadores, eventos, formaciones

## Pendiente

- [ ] Configurar API key de Gemini (crear backend/.env con GEMINI_API_KEY)
- [ ] npm install en frontend
- [ ] Probar localmente (uvicorn + next dev)
- [ ] Subir a GitHub

## Cómo correr

```bash
# Backend
cd backend
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```
