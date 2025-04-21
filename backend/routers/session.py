from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models.db import AsyncSessionLocal, User, Session
from ..schemas.session import StartSessionRequest, StartSessionResponse, ContinueSessionRequest
from ..services.openai_service import get_system_prompt, stream_llm_response
from ..utils.greeting import get_greeting
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
import uuid
import json
import traceback
import logging # Added for logging
import os

router = APIRouter()
logger = logging.getLogger(__name__) # Setup logger

# In-memory session store for last played word (replace with DB for production)
session_last_word = {}

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# --- DB Update Function for Background Task ---
async def update_db_after_stream(
    session_id: str,
    user_id: str,
    user_message: str,
    assistant_response_buffer: str
):
    """
    Updates the User and Session tables after the LLM stream is complete.
    Saves both the user message and the assistant response.
    Runs as a background task.
    """
    print(f"Background task started for session {session_id}")
    async with AsyncSessionLocal() as db: # Create a new session for the background task
        try:
            # Load session
            result = await db.execute(select(Session).where(Session.id == session_id))
            session_obj = result.scalar_one_or_none()
            if not session_obj:
                print(f"Error in background task: Session {session_id} not found")
                return

            # Load user
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user:
                print(f"Error in background task: User {user_id} not found for session {session_id}")
                return

            # Append BOTH user message and assistant response
            new_message_history = list(session_obj.message_history) + [
                {"role": "user", "content": user_message},
                {"role": "assistant", "content": assistant_response_buffer}
            ]
            session_obj.message_history = new_message_history

            # Update user's word progress if applicable
            try:
                response_json = json.loads(assistant_response_buffer)
                # Validate if it's an error structure first
                if response_json.get("error"): # Check if the buffer itself is an error JSON from the streamer
                     logger.warning(f"Background task skipped for session {session_id} due to LLM stream error: {response_json.get('detail', 'Unknown stream error')}")
                     return # Don't update DB if the stream ended with an error

                word = response_json.get("currentWord")
                progress = response_json.get("currentWordProgress")

                if word:
                    # Ensure list/dict exist if they were None initially
                    if user.word_initiated is None: user.word_initiated = []
                    if user.word_progress is None: user.word_progress = {}

                    if word not in user.word_initiated:
                        # Use SQLAlchemy mutable extension helpers if needed, or just reassign
                        new_word_initiated = list(user.word_initiated) + [word]
                        user.word_initiated = new_word_initiated

                    new_word_progress = dict(user.word_progress)
                    new_word_progress[word] = progress
                    user.word_progress = new_word_progress

            except json.JSONDecodeError:
                # Log the error and the problematic buffer content
                logger.error(f"Background task error (session {session_id}): Failed to decode JSON from LLM buffer.", exc_info=True)
                logger.debug(f"Buffer content for {session_id}: {assistant_response_buffer[:500]}...") # Log more content for debugging
                # Optionally: Store the invalid buffer in a specific field/table for later inspection
                # Depending on requirements, you might want to still commit the user message if Option A was chosen
                await db.rollback() # Rollback if JSON is invalid
                return # Stop processing this background task
            except Exception as e:
                logger.error(f"Background task error (session {session_id}): {str(e)}", exc_info=True)
                await db.rollback() # Rollback on other errors
                return # Stop processing this background task

            # Commit all changes
            await db.commit()
            print(f"Background task finished for session {session_id}: DB updated. History length: {len(session_obj.message_history)}")

        except Exception as e:
            print(f"Error in background task (session {session_id}): {str(e)}")
            traceback.print_exc()
            await db.rollback() # Rollback on other errors


@router.post("/session/start", response_model=StartSessionResponse)
async def start_session(data: StartSessionRequest, db: AsyncSession = Depends(get_db)):
    try:
        # Find or create user
        result = await db.execute(select(User).where(User.user_name == data.user_name))
        user = result.scalar_one_or_none()
        # if not user:

        if user:  # Existing user found
            # Update user's languages if they already exist
            user.source_language = data.source_language
            user.target_language = data.target_language
            await db.commit()           
            await db.refresh(user)      
        else:         
            user = User(
                user_name=data.user_name,
                source_language=data.source_language,
                target_language=data.target_language,
                word_initiated=[], # Ensure default is list
                word_progress={},  # Ensure default is dict
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
    except Exception as e: # Catch potential DB errors during user creation/lookup
        logger.error(f"Database error during user lookup/creation for {data.user_name}: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="Database error processing user.")

    try:
        # Use user's global word progress for greeting
        greeting = get_greeting(user.user_name, user.target_language, user.word_initiated or [], user.word_progress or {})
        # Create new session
        session_id = str(uuid.uuid4())
        session_obj = Session(
            id=session_id,
            user_id=user.id,
            message_history=[{"role": "assistant", "content": greeting}]
        )
        db.add(session_obj)
        await db.commit()
    except Exception as e: # Catch potential DB errors during session creation
        logger.error(f"Database error during session creation for user {user.id}: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="Database error creating session.")

    return StartSessionResponse(session_id=session_id, greeting=greeting)

@router.post("/session/continue")
async def continue_session(
    data: ContinueSessionRequest,
    background_tasks: BackgroundTasks, # Inject BackgroundTasks
    db: AsyncSession = Depends(get_db)
):
    try:
        # Load session
        result = await db.execute(select(Session).where(Session.id == data.session_id))
        session_obj = result.scalar_one_or_none()
        if not session_obj:
            logger.warning(f"Attempted to continue non-existent session: {data.session_id}")
            raise HTTPException(status_code=404, detail="Session not found")

        user_id = session_obj.user_id # Get user_id to pass to background task

        # Prepare system prompt if not present
        # Note: We need the user message in the history for the LLM call, even if DB commit is deferred
        temp_message_history = list(session_obj.message_history)
        temp_message_history.append({"role": "user", "content": data.user_message})

        if not any(m["role"] == "system" for m in temp_message_history): # Check temp history
            user_result = await db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            if not user:
                 logger.error(f"User {user_id} not found for existing session {data.session_id}")
                 raise HTTPException(status_code=404, detail="User associated with session not found")

            user_info = {
                "name": user.user_name,
                "sourceLanguage": user.source_language,
                "targetLanguage": user.target_language,
            }
            system_prompt = get_system_prompt(user_info)
            # Insert into the temp history for the LLM call
            temp_message_history.insert(0, {"role": "system", "content": system_prompt})

        # Use the temporary history (with user message) for the LLM call
        current_message_history = temp_message_history

    except HTTPException as http_exc: # Re-raise HTTP exceptions
        raise http_exc
    except Exception as e: # Catch DB errors or other issues before streaming
        logger.error(f"Error preparing session {data.session_id} for continuation: {e}", exc_info=True)
        # Don't rollback here as no changes intended for commit yet (following Option B)
        raise HTTPException(status_code=500, detail="Internal server error preparing session.")

    # --- Generator that streams and triggers background task ---
    async def llm_stream_and_trigger_update():
        buffer = ""
        stream_has_error = False
        try:
            async for chunk in stream_llm_response(current_message_history):
                buffer += chunk
                # Check if the chunk *is* the error JSON payload yielded by the stream
                try:
                    chunk_json = json.loads(chunk) # Try to parse chunk as JSON
                    if isinstance(chunk_json, dict) and "error" in chunk_json:
                        stream_has_error = True
                        logger.warning(f"LLM stream for session {data.session_id} yielded an error chunk: {chunk_json.get('detail')}")
                        # Yield the error chunk itself so the client receives it
                        yield json.dumps(chunk_json) # Re-serialize if needed, or yield chunk directly if already string
                        # Optionally break here if you don't want further processing, though the streamer should stop yielding anyway
                        break
                except json.JSONDecodeError:
                    # This is expected for normal, non-error chunks which are partial JSON strings
                    pass
                except Exception as e:
                    # Catch unexpected errors during chunk processing
                    logger.error(f"Error processing chunk for session {data.session_id}: {e}", exc_info=True)
                    # Fallback error message if chunk processing fails
                    yield json.dumps({"error": "Internal Server Error", "detail": "Error processing response stream."}) 
                    stream_has_error = True # Mark as error to prevent DB update
                    break # Stop streaming on unexpected chunk processing error

                # Yield normal chunk if no error detected in it
                if not stream_has_error:
                     yield chunk # Pass the valid chunk along

            # Stream finished (or broke due to error), schedule the background task
            # The background task itself will check the buffer for the error flag before updating DB
            if buffer: # Only schedule if we received *something*
                logger.info(f"LLM stream finished for session {data.session_id}. Scheduling DB update.")
                background_tasks.add_task(
                    update_db_after_stream,
                    session_id=data.session_id,
                    user_id=user_id,
                    user_message=data.user_message,
                    assistant_response_buffer=buffer # Pass the potentially error-containing buffer
                )
            else:
                logger.warning(f"LLM stream for session {data.session_id} produced no output. DB update skipped.")

        except Exception as e:
            # This catches errors during the *iteration* setup or unexpected generator exit
            logger.error(f"Error during LLM stream consumption for session {data.session_id}: {e}", exc_info=True)
            # Yield a generic error if the stream fails unexpectedly
            yield json.dumps({"error": "Internal Server Error", "detail": "LLM streaming failed unexpectedly."}) 

    return StreamingResponse(llm_stream_and_trigger_update(), media_type="application/json") 

