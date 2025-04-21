from pydantic import BaseModel

class StartSessionRequest(BaseModel):
    user_name: str
    source_language: str
    target_language: str

class StartSessionResponse(BaseModel):
    session_id: str
    greeting: str

class ContinueSessionRequest(BaseModel):
    session_id: str
    user_message: str 