from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy import Column, String, JSON, ForeignKey, DateTime, func
import uuid

DATABASE_URL = "sqlite+aiosqlite:///./db.sqlite3"

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_name = Column(String, unique=True, nullable=False)
    source_language = Column(String, nullable=False)
    target_language = Column(String, nullable=False)
    word_initiated = Column(JSON, default=list)  # list of words
    word_progress = Column(JSON, default=dict)   # word: progress
    sessions = relationship("Session", back_populates="user")

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    message_history = Column(JSON, default=list) # list of messages
    user = relationship("User", back_populates="sessions")

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all) 