# ⚽ Pitubot — Analista de Fútbol con IA

App de análisis táctico de videos de fútbol usando Gemini AI.

## Links

- **Frontend (Vercel):** https://frontend-rust-sigma-77.vercel.app
- **Backend (Render):** https://analista-futbol.onrender.com
- **GitHub:** https://github.com/pablobuet84-commits/analista-futbol

## Estado actual (19/5/2026)

### ✅ Funciona
- Subida de archivos por chunks (archivos > 5 MB → `/upload/init` + `/upload/chunk/{task_id}`)
- Subida directa (archivos ≤ 5 MB → `/upload`)
- Video upload con barra de progreso
- Video player con timeline, marcadores de timestamps, velocidad, playlist
- Chat con preguntas tácticas a Gemini
- Historial en Firebase Firestore
- CORS abierto (`*`) para conexión frontend-backend

### ❌ No funciona
1. **YouTube download** — `yt-dlp` recibe `429 Too Many Requests` y `Sign in to confirm you're not a bot` desde Render. La IP de Render está bloqueada por YouTube. Solución implementada: botón 🍪 para subir `cookies.txt` exportado del navegador (falta probar).
2. **Análisis Gemini** — Estaba roto por `google-genai==2.4.0` que cambió `path=` por `file=` en `client.files.upload()`. Ya fixeado pero falta redeployar + probar.

### 📦 Deploys pendientes
1. **Render** → Manual Deploy → Deploy Latest Commit (commit `7538ffc`)
2. **Vercel** → Redeploy frontend (para que aparezca botón 🍪 de cookies)

## Próximos pasos (orden sugerido)

1. [ ] Hacer deploy en Render (Manual Deploy → Latest Commit)
2. [ ] Hacer deploy en Vercel (para que aparezca 🍪)
3. [ ] Probar análisis Gemini con archivo subido (preguntar algo como "cuántas veces toca la pelota el 9")
4. [ ] Probar YouTube:
   - Exportar cookies.txt desde Chrome con extensión "Get cookies.txt" (en YouTube logueado)
   - Subir cookies con 🍪 en Pitubot
   - Pegar link de YouTube y "Cargar"
5. [ ] Si YouTube sigue fallando: implementar alternativa con YouTube Data API v3 (requiere API key de Google Cloud)

## Detalles técnicos

### Backend (`backend/`)
- `main.py` — FastAPI: `/upload`, `/upload/init`, `/upload/chunk/{task_id}`, `/upload/cookies`, `/youtube`, `/video/{task_id}`, `/ask`, `/status/{task_id}`
- `gemini_service.py` — Sube video a Gemini y pregunta con prompt táctico
- `render-build.sh` — Build script que hace `pip install` + descarga Node.js binario a `/opt/render/project/.node/`
- `requirements.txt` — Incluye `google-genai==2.4.0` (API: `client.files.upload(file=...)` no `path=...`)
- `Procfile` — `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend (`frontend/`)
- `src/app/page.tsx` — Chunked upload, chat, historial
- `src/components/FileUploader.tsx` — Botón subir archivo, input YouTube, botón 🍪 cookies
- `src/components/VideoPlayer.tsx` — Player con timeline y marcadores
- `src/components/ChatPanel.tsx` — Chat con timestamps clickeables

### Variables de entorno
- **Vercel:** `NEXT_PUBLIC_API_URL=https://analista-futbol.onrender.com`
- **Render:** `GEMINI_API_KEY=AIzaSyBHhKOQ1qyvdYnTUxE4RJ_eCXKmKr0O3NE`, `CORS_ORIGINS=["https://frontend-rust-sigma-77.vercel.app"]`
- **Local:** `backend/.env` con `GEMINI_API_KEY`

### Errores conocidos
- `google-genai==2.4.0`: `client.files.upload(path=X)` → debe ser `file=X`
- Render free tier: se apaga con inactividad, primer request tarda ~50s en responder
- YouTube: bloquea IPs de servidores, requiere cookies de navegador

## Cómo correr local

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```
