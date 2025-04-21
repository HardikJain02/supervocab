from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from gtts import gTTS, gTTSError
import os
from pathlib import Path
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Directory to store generated audio files
temp_dir = Path("tmp")
temp_dir.mkdir(exist_ok=True)


def get_audio_path(word: str) -> Path:
    """
    Returns the path for the cached audio file for the given word (English only).
    """
    safe_word = word.lower()
    filename = f"{safe_word}_en.mp3"
    return temp_dir / filename


@router.get("/speech/{word}")
async def get_word_speech(word: str):
    """
    Generates (if needed) and serves an mp3 speech file for the given word in English.
    The word in the URL must be lowercase.
    """
    if not word:
        raise HTTPException(status_code=400, detail="Word is required.")

    word = word.lower()
    lang = "en"
    audio_path = get_audio_path(word)

    if not audio_path.exists():
        try:
            tts = gTTS(text=word, lang=lang)
            tts.save(str(audio_path))
        except (ValueError, gTTSError) as e:
            logger.error(f"gTTS error for word '{word}' and lang '{lang}': {e}")
            return JSONResponse(status_code=400, content={"error": "Speech synthesis failed", "detail": str(e)})
        except Exception as e:
            logger.error(f"Unexpected error during speech synthesis: {e}")
            return JSONResponse(status_code=500, content={"error": "Internal server error", "detail": str(e)})

    if not audio_path.exists():
        raise HTTPException(status_code=500, detail="Failed to generate audio file.")

    return FileResponse(
        path=audio_path,
        media_type="audio/mpeg",
        filename=audio_path.name
    ) 