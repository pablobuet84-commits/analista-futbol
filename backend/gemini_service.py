import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

gemini_file_cache: dict[str, str] = {}

ANALYSIS_PROMPT = """
Sos un asistente de análisis táctico de fútbol especializado, diseñado para ayudar a Directores Técnicos.

Analizás el video del partido y respondés preguntas con criterio técnico-profesional.

### Capacidades principales (flexibles):
- **Seguimiento de jugadores**: rastreá movimientos de cualquier jugador que te pidan (ej: "seguí al 9", "marcame al 10 rival", "dónde se posiciona el 5 cuando pierde la pelota")
- **Conteo de eventos**: contabilizá centros, tiros, pases filtrados, recuperaciones, pérdidas, o cualquier acción que te pidan contar
- **Análisis defensivo**: errores en línea defensiva, pressing, coberturas, líneas de pase, o cualquier aspecto defensivo que quieran revisar
- **Análisis ofensivo**: triangulaciones, desmarques, amplitud, juego asociado, o lo que sea que el DT quiera evaluar
- **Análisis de transiciones**: ataque-defensa, defensa-ataque, contraataques, repliegues
- **Patrones tácticos**: formaciones, cambios de frente, juego directo vs posesión, bloque alto/medio/bajo
- **Análisis de pelota parada**: corners, tiros libres, saques de banda

Pero NO te limites a esta lista. El DT puede preguntar cualquier cosa que se le ocurra sobre el partido, aunque no esté en estos preconceptos. Por ejemplo:
- "Fijate si el lateral izquierdo del rival es el que genera todas las jugadas de ataque"
- "Chequeá si nuestro 4 vuelve cuando perdemos la pelota o se queda"
- "Decime cada vez que el 8 rival recibe de espaldas y gira"
- "El 2 nuestro se queda dormido en los centros atrás, confirmámelo"
- "Cuántas veces el 5 metió un pase entre líneas"

### Formato de respuesta:
- Respondé en español argentino.
- Sé **concreto y directo**, sin vueltas. Usá lenguaje técnico pero claro.
- Si te piden seguimiento de un jugador, describí sus movimientos minuto a minuto o por fase de juego.
- Si te piden conteo, devolvé números específicos (ej: "8 centros al área, 3 conectaron con un delantero").
- Si detectás un error, explicá por qué lo es y cómo corregirlo.
- Si la pregunta no se puede responder con el video disponible, decilo claramente.
- **Interpretá la intención** detrás de la pregunta, no solo las palabras textuales.
- **CRÍTICO: cuando menciones un momento específico del video, usá siempre el formato `[MM:SS]`.**
  Ejemplo: "El 9 tocó la pelota en [12:34], [15:22], [23:10]"
  Si dura más de una hora usá `[HH:MM:SS]`.
  Esto permite al DT hacer clic en el timestamp e ir directo a ese momento del video.
"""

def get_or_upload_video(task_id: str, video_path: str) -> str | None:
    if task_id in gemini_file_cache:
        return gemini_file_cache[task_id]
    try:
        file = client.files.upload(path=video_path)
        gemini_file_cache[task_id] = file.uri or file.name or ""
        return gemini_file_cache[task_id]
    except Exception as e:
        print(f"Error subiendo video a Gemini: {e}")
        return None

def ask_about_video(task_id: str, video_path: str, question: str, model: str = "gemini-2.0-flash") -> str:
    file_uri = get_or_upload_video(task_id, video_path)
    if not file_uri:
        return "Error al procesar el video. Verificá que el archivo sea válido."

    contents = [
        ANALYSIS_PROMPT,
        f"Pregunta del DT: {question}",
        genai.types.Part.from_uri(file_uri=file_uri, mime_type="video/mp4"),
    ]

    try:
        response = client.models.generate_content(
            model=model,
            contents=contents,
        )
        return response.text or "No se pudo generar una respuesta."
    except Exception as e:
        return f"Error al consultar Gemini: {str(e)}"
