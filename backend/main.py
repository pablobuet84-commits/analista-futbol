from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uuid, os, subprocess, json, shutil, tempfile, requests
from dotenv import load_dotenv

from gemini_service import ask_about_video

load_dotenv()

app = FastAPI(title="Pitubot API")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
if CORS_ORIGINS == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=json.loads(CORS_ORIGINS),
        allow_methods=["*"],
        allow_headers=["*"],
    )

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

TASKS_FILE = os.path.join(UPLOAD_DIR, "tasks.json")

tasks: dict[str, dict] = {}

def _save_tasks():
    with open(TASKS_FILE, "w") as f:
        json.dump(tasks, f)

def _load_tasks():
    global tasks
    if os.path.exists(TASKS_FILE):
        with open(TASKS_FILE, "r") as f:
            tasks = json.load(f)
    else:
        tasks = {}

_load_tasks()


class AskRequest(BaseModel):
    task_id: str
    question: str
    storage_url: str = ""


class YoutubeRequest(BaseModel):
    url: str


class ChunkInitRequest(BaseModel):
    filename: str
    total_chunks: int


@app.post("/upload/init")
def init_chunked_upload(req: ChunkInitRequest):
    task_id = str(uuid.uuid4())
    ext = os.path.splitext(req.filename or "video.mp4")[1] or ".mp4"
    dest = os.path.join(UPLOAD_DIR, f"{task_id}{ext}")

    open(dest, "wb").close()

    tasks[task_id] = {
        "filename": req.filename,
        "status": "uploading",
        "path": dest,
        "total_chunks": req.total_chunks,
        "received_chunks": 0,
    }
    _save_tasks()

    return {"task_id": task_id, "filename": req.filename, "status": "uploading"}


@app.post("/upload/chunk/{task_id}")
async def upload_chunk(task_id: str, chunk_index: int = 0, file: UploadFile = File(...)):
    task = tasks.get(task_id)
    if not task:
        return {"error": "task not found"}

    dest = task["path"]
    content = await file.read()

    with open(dest, "ab") as f:
        f.write(content)

    task["received_chunks"] = task.get("received_chunks", 0) + 1

    if task["received_chunks"] >= task["total_chunks"]:
        task["status"] = "uploaded"
    _save_tasks()

    return {
        "task_id": task_id,
        "chunk_index": chunk_index,
        "received": task["received_chunks"],
        "total": task["total_chunks"],
        "status": task["status"],
    }


@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    task_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    dest = os.path.join(UPLOAD_DIR, f"{task_id}{ext}")

    with open(dest, "wb") as f:
        content = await file.read()
        f.write(content)

    tasks[task_id] = {
        "filename": file.filename,
        "status": "uploaded",
        "path": dest,
    }
    _save_tasks()

    return {"task_id": task_id, "filename": file.filename, "status": "uploaded"}


@app.post("/upload/cookies")
async def upload_cookies(file: UploadFile = File(...)):
    dest = os.path.join(UPLOAD_DIR, "cookies.txt")
    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)
    return {"status": "ok", "size": len(content)}

@app.post("/youtube")
def add_youtube(req: YoutubeRequest):
    task_id = str(uuid.uuid4())
    dest = os.path.join(UPLOAD_DIR, f"{task_id}.mp4")

    try:
        env = os.environ.copy()
        node_path = shutil.which("node") or "/opt/render/project/.node/bin/node"
        if os.path.exists(node_path):
            env["PATH"] = f"{os.path.dirname(node_path)}:{env.get('PATH', '')}"

        cookies_path = os.path.join(UPLOAD_DIR, "cookies.txt")
        cookies_arg = []
        if os.path.exists(cookies_path):
            cookies_arg = ["--cookies", cookies_path]

        # Intentar con player_client=android primero (no requiere cookies)
        result = subprocess.run(
            ["yt-dlp", "-f", "best[height<=720]", "-o", dest,
             "--js-runtimes", "node",
             "--retries", "15",
             "--sleep-interval", "3",
             "--extractor-args", "youtube:player_client=android,web",
             "--throttled-rate", "100K",
             "--concurrent-fragments", "1",
             *cookies_arg,
             req.url],
            capture_output=True, timeout=600, env=env,
        )
        if result.returncode != 0:
            error_text = (result.stderr or b"").decode(errors="replace")
            stdout_text = (result.stdout or b"").decode(errors="replace")

            # Si falló y tenemos cookies, reintentar sin extractor-args (usan las cookies)
            if os.path.exists(cookies_path) and "cookies" not in error_text.lower():
                result = subprocess.run(
                    ["yt-dlp", "-f", "best[height<=720]", "-o", dest,
                     "--js-runtimes", "node",
                     "--retries", "15",
                     "--sleep-interval", "3",
                     "--throttled-rate", "100K",
                     "--concurrent-fragments", "1",
                     "--cookies", cookies_path,
                     req.url],
                    capture_output=True, timeout=600, env=env,
                )

            if result.returncode != 0:
                error_text = (result.stderr or b"").decode(errors="replace")
                stdout_text = (result.stdout or b"").decode(errors="replace")[:200]

                if "cookies" in error_text.lower():
                    msg = ("YouTube bloquea las descargas en servidores. "
                           "Para solucionarlo:\n"
                           "1. Instalá en Chrome la extensión 'Open cookies.txt' (NO 'Get cookies.txt')\n"
                           "2. Andá a YouTube, logueate, click en la extensión → Export\n"
                           "3. Subí el archivo cookies.txt con el botón 🍪 en Pitubot\n"
                           "4. Reintentá pegar el link de YouTube")
                else:
                    msg = f"No se pudo descargar: {error_text[:400]}"
                return {"error": msg}
    except subprocess.TimeoutExpired:
        return {"error": "La descarga del video excedió el tiempo máximo (10 min)"}

    filename = f"YouTube - {task_id[:8]}.mp4"
    tasks[task_id] = {
        "filename": filename,
        "status": "uploaded",
        "path": dest,
    }
    _save_tasks()

    return {"task_id": task_id, "filename": filename, "status": "uploaded"}


@app.get("/video/{task_id}")
def get_video(task_id: str):
    task = tasks.get(task_id)
    if not task:
        return {"error": "task not found"}
    path = task["path"]
    if not os.path.exists(path):
        return {"error": "video file not found"}
    return FileResponse(path, media_type="video/mp4", filename=task["filename"])


@app.get("/status/{task_id}")
def get_status(task_id: str):
    task = tasks.get(task_id)
    if not task:
        return {"error": "task not found"}
    return task


@app.post("/ask")
def ask_question(req: AskRequest):
    task = tasks.get(req.task_id)
    if not task:
        return {"error": "task not found"}
    if task["status"] != "uploaded":
        return {"error": "video not ready"}

    video_path = task["path"]

    # Use local file if exists, otherwise download from storage_url
    temp_file = None
    if not os.path.exists(video_path) and req.storage_url:
        try:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
            r = requests.get(req.storage_url, stream=True, timeout=300)
            r.raise_for_status()
            for chunk in r.iter_content(chunk_size=8192):
                temp_file.write(chunk)
            temp_file.close()
            video_path = temp_file.name
        except Exception as e:
            if temp_file:
                os.unlink(temp_file.name)
            return {"error": f"Error al descargar el video: {str(e)}"}

    try:
        answer = ask_about_video(req.task_id, video_path, req.question)
        return {"task_id": req.task_id, "question": req.question, "answer": answer}
    finally:
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
