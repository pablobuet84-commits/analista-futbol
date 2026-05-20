from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uuid, os, subprocess, json, shutil

from gemini_service import ask_about_video

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

tasks: dict[str, dict] = {}


class AskRequest(BaseModel):
    task_id: str
    question: str


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

    return {"task_id": task_id, "filename": file.filename, "status": "uploaded"}


@app.post("/youtube")
def add_youtube(req: YoutubeRequest):
    task_id = str(uuid.uuid4())
    dest = os.path.join(UPLOAD_DIR, f"{task_id}.mp4")

    try:
        env = os.environ.copy()
        node_path = shutil.which("node") or "/opt/render/project/.node/bin/node"
        if os.path.exists(node_path):
            env["PATH"] = f"{os.path.dirname(node_path)}:{env.get('PATH', '')}"

        subprocess.run(
            ["yt-dlp", "-f", "best[height<=720]", "-o", dest,
             "--extractor-args", "youtube:player_client=android",
             "--extractor-args", "youtube:skip=webpage",
             req.url],
            check=True, capture_output=True, timeout=300, env=env,
        )
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode()[:500] if e.stderr else "Error desconocido"
        return {"error": f"No se pudo descargar el video: {error_msg}"}
    except subprocess.TimeoutExpired:
        return {"error": "La descarga del video excedió el tiempo máximo (5 min)"}

    filename = f"YouTube - {task_id[:8]}.mp4"
    tasks[task_id] = {
        "filename": filename,
        "status": "uploaded",
        "path": dest,
    }

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

    answer = ask_about_video(req.task_id, task["path"], req.question)
    return {"task_id": req.task_id, "question": req.question, "answer": answer}
