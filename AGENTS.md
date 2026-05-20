# ⚽ Pitubot — Analista de Fútbol con IA

App de análisis táctico de videos de fútbol usando Gemini AI.

## Links

- **Frontend (Vercel):** https://frontend-rust-sigma-77.vercel.app
- **Backend (Render):** https://analista-futbol.onrender.com
- **GitHub:** https://github.com/pablobuet84-commits/analista-futbol

## Estado actual (20/5/2026)

### ✅ Funciona
- Subida de video a **Firebase Storage** directo desde el frontend (sin pasar por Render)
- Video player con timeline, marcadores de timestamps, velocidad, playlist
- Chat con preguntas tácticas a Gemini (descarga temporal de Firebase, analiza, borra)
- Historial en Firebase Firestore
- CORS abierto (`*`) para conexión frontend-backend
- `tasks.json` persistente en disco (no se pierden tareas al reiniciar Render)

### ❌ No funciona (pendiente de resolver)

#### 1. Subida a Firebase Storage: "Error al subir el video a Firebase"
**Causa probable:** Las reglas de Storage del nuevo proyecto `analista-futbol` no permiten escritura sin autenticación.

**Solución:**
1. Ir a https://console.firebase.google.com/project/analista-futbol/storage
2. Pestaña **"Reglas"**
3. Reemplazar con:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /videos/{allPaths=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```
4. **Publicar**

#### 2. YouTube bloqueado: "YouTube bloquea las descargas en servidores"
**Causa:** Render está en una IP bloqueada por YouTube. yt-dlp no puede descargar directo.

**Soluciones (probá en este orden):**

**A) Extensión Cookie-Editor**
1. Chrome Web Store → buscar "**Cookie-Editor**"
2. Ir a YouTube logueado → click Cookie-Editor → **Export** → formato **Netscape**
3. Subir el archivo con 🍪 en Pitubot
4. Pegar link de YouTube → Cargar

**B) Descargar local y subir manual**
```bash
# En tu PC (necesitás yt-dlp y Chrome)
yt-dlp -f "best[height<=720]" -o "partido.mp4" --cookies-from-browser chrome "URL_DE_YOUTUBE"
```
Después subí `partido.mp4` con **"Subir partido"** en Pitubot.

**C) Convertidor web + upload manual**
- https://9convert.com
- Descargás el .mp4 y lo subís con "Subir partido"

## Detalles técnicos

### Backend (`backend/`)
- `main.py` — FastAPI: `/upload/cookies`, `/youtube`, `/video/{task_id}`, `/ask`, `/status/{task_id}`
- `gemini_service.py` — Sube video a Gemini y pregunta con prompt táctico
- `render-build.sh` — Build script que hace `pip install` + descarga Node.js binario a `/opt/render/project/.node/`
- `requirements.txt` — Incluye `google-genai==2.4.0`, `requests`
- `Procfile` — `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend (`frontend/`)
- `src/app/page.tsx` — Upload a Firebase Storage, chat, historial
- `src/components/FileUploader.tsx` — Botón subir archivo, input YouTube, botón 🍪 cookies
- `src/components/VideoPlayer.tsx` — Player con timeline y marcadores
- `src/components/ChatPanel.tsx` — Chat con timestamps clickeables
- `src/lib/firebase.ts` — Config de Firebase (proyecto propio: `analista-futbol`)
- `src/lib/analisis-service.ts` — CRUD de sesiones en Firestore

### Variables de entorno
- **Vercel:** `NEXT_PUBLIC_API_URL=https://analista-futbol.onrender.com`
- **Render:** `GEMINI_API_KEY=AIzaSyBHhKOQ1qyvdYnTUxE4RJ_eCXKmKr0O3NE`, `CORS_ORIGINS=["https://frontend-rust-sigma-77.vercel.app"]`
- **Local:** `backend/.env` con `GEMINI_API_KEY`

## Próximos pasos (orden sugerido)

1. [ ] **Fix Firebase Storage rules** (ver sección 1 arriba)
2. [ ] Probar subida de video desde disco
3. [ ] Probar análisis Gemini
4. [ ] **YouTube**: probar Cookie-Editor o descarga local (ver sección 2)
5. [ ] Si todo funciona, mergear a main y deploy

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
