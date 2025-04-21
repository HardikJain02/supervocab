from fastapi import FastAPI
from .session_routes import router as session_router
from .db import init_db
from fastapi.middleware.cors import CORSMiddleware
from .speech_routes import router as speech_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["*"] for all origins (not recommended for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session_router)
app.include_router(speech_router)

@app.on_event("startup")
async def on_startup():
    await init_db() 