from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.database import SessionLocal
from app.models.user import User
from app.models.chat_history import InterviewSession, InterviewMessage
from app.utils.security import get_current_user
from app.utils.ai.interview_engine import generate_question
from app.utils.ai.hr_interview_engine import generate_hr_question

router = APIRouter(prefix="/interview", tags=["AI Interview"])


# ==================
# Pydantic Models
# ==================
class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    id: int
    mode: str
    difficulty: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class ChatStartRequest(BaseModel):
    job_description: str
    mode: str = "programming"  # "programming" or "hr"
    difficulty: str = "beginner"  # "beginner", "intermediate", "advanced"
    resume_text: str = ""
    title: str = "New Interview"


class MessageSendRequest(BaseModel):
    session_id: int
    message: str


# ==================
# Helper Functions
# ==================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_user_id(email: str, db: Session) -> int:
    """Get user_id from email."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user.id


def get_interview_response(
    session: InterviewSession,
    previous_messages: list,
    db: Session
) -> str:
    """Generate AI response based on session mode, difficulty and message history."""
    
    # Get last user message (most recent)
    user_message = previous_messages[-1].content if previous_messages else ""
    
    # Get last AI question (if exists)
    last_ai_question = ""
    for msg in reversed(previous_messages[:-1]):  # All except last (which is user)
        if msg.role == "ai":
            last_ai_question = msg.content
            break
    
    if session.mode.lower() == "hr":
        response = generate_hr_question(
            job_description=session.job_description,
            level=session.difficulty,
            previous_question=last_ai_question,
            user_answer=user_message,
            resume_text=session.resume_text
        )
    else:
        response = generate_question(
            job_description=session.job_description,
            level=session.difficulty,
            previous_question=last_ai_question,
            user_answer=user_message
        )
    
    return response


# =====================
# NEW CHAT ROUTES
# =====================

@router.post("/session/start", response_model=dict)
def start_chat_session(
    request: ChatStartRequest,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new chat interview session.
    
    Creates new session and generates opening question.
    Returns session ID and opening question.
    """
    try:
        user_id = get_user_id(email, db)
        
        # Create session
        session = InterviewSession(
            user_id=user_id,
            mode=request.mode,
            difficulty=request.difficulty,
            job_description=request.job_description,
            resume_text=request.resume_text,
            title=request.title
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        # Generate opening question
        if request.mode.lower() == "hr":
            question = generate_hr_question(
                job_description=request.job_description,
                level=request.difficulty,
                resume_text=request.resume_text
            )
        else:
            question = generate_question(
                job_description=request.job_description,
                level=request.difficulty
            )
        
        # Save opening question to DB
        ai_message = InterviewMessage(
            session_id=session.id,
            role="ai",
            content=question
        )
        db.add(ai_message)
        db.commit()
        
        return {
            "session_id": session.id,
            "opening_question": question,
            "mode": request.mode,
            "difficulty": request.difficulty
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/latest", response_model=dict)
def get_latest_session(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the most recent interview session for current user."""
    try:
        user_id = get_user_id(email, db)
        
        session = db.query(InterviewSession).filter(
            InterviewSession.user_id == user_id
        ).order_by(InterviewSession.created_at.desc()).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="No session found")
        
        messages = db.query(InterviewMessage).filter(
            InterviewMessage.session_id == session.id
        ).order_by(InterviewMessage.created_at.asc()).all()
        
        message_list = [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at
            }
            for msg in messages
        ]
        
        return {
            "session_id": session.id,
            "mode": session.mode,
            "difficulty": session.difficulty,
            "title": session.title,
            "job_description": session.job_description,
            "resume_text": session.resume_text,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "messages": message_list
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions", response_model=list)
def get_user_sessions(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all interview sessions for current user."""
    try:
        user_id = get_user_id(email, db)
        
        sessions = db.query(InterviewSession).filter(
            InterviewSession.user_id == user_id
        ).order_by(InterviewSession.created_at.desc()).all()
        
        result = []
        for session in sessions:
            message_count = db.query(InterviewMessage).filter(
                InterviewMessage.session_id == session.id
            ).count()
            
            result.append({
                "id": session.id,
                "mode": session.mode,
                "title": session.title,
                "created_at": session.created_at,
                "updated_at": session.updated_at,
                "message_count": message_count
            })
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}", response_model=dict)
def get_session_messages(
    session_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all messages in a specific session."""
    try:
        user_id = get_user_id(email, db)
        
        # Verify session belongs to user
        session = db.query(InterviewSession).filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        messages = db.query(InterviewMessage).filter(
            InterviewMessage.session_id == session_id
        ).order_by(InterviewMessage.created_at.asc()).all()
        
        message_list = [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at
            }
            for msg in messages
        ]
        
        return {
            "session_id": session.id,
            "mode": session.mode,
            "title": session.title,
            "messages": message_list
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/message")
def send_message(
    request: MessageSendRequest,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a user message and get AI response."""
    try:
        user_id = get_user_id(email, db)
        
        # Verify session belongs to user
        session = db.query(InterviewSession).filter(
            InterviewSession.id == request.session_id,
            InterviewSession.user_id == user_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Save user message
        user_msg = InterviewMessage(
            session_id=request.session_id,
            role="user",
            content=request.message
        )
        db.add(user_msg)
        db.commit()
        
        # Get all messages so far
        all_messages = db.query(InterviewMessage).filter(
            InterviewMessage.session_id == request.session_id
        ).order_by(InterviewMessage.created_at.asc()).all()
        
        # Generate AI response
        ai_response = get_interview_response(
            session,
            all_messages,
            db
        )
        
        # Save AI response
        ai_msg = InterviewMessage(
            session_id=request.session_id,
            role="ai",
            content=ai_response
        )
        db.add(ai_msg)
        db.commit()
        db.refresh(ai_msg)
        
        return {
            "role": ai_msg.role,
            "content": ai_msg.content,
            "created_at": ai_msg.created_at
        }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/session/{session_id}", response_model=dict)
def delete_session(
    session_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an interview session and all its messages.
    
    Verifies session belongs to logged-in user before deleting.
    """
    try:
        user_id = get_user_id(email, db)
        
        # Verify session belongs to user
        session = db.query(InterviewSession).filter(
            InterviewSession.id == session_id,
            InterviewSession.user_id == user_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Delete all messages first
        db.query(InterviewMessage).filter(
            InterviewMessage.session_id == session_id
        ).delete()
        
        # Delete session
        db.delete(session)
        db.commit()
        
        return {"message": "Session deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ========================
# LEGACY ROUTES (Backwards Compatibility)
# ========================

@router.post("/start", response_class=Response)
def start_interview(
    job_description: str,
    mode: str = "programming",
    resume_text: str = "",
    email: str = Depends(get_current_user)
):
    """LEGACY: Direct interview without session storage.
    
    Use /session/start and /message for chat history.
    """
    try:
        if mode.lower() == "hr":
            question = generate_hr_question(
                job_description=job_description,
                level="basic",
                resume_text=resume_text
            )
        else:
            question = generate_question(
                job_description=job_description,
                level="basic"
            )
        
        return Response(content=question, media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/follow-up", response_class=Response)
def follow_up_question(
    job_description: str,
    previous_question: str,
    answer: str,
    mode: str = "programming",
    level: str = "basic",
    resume_text: str = "",
    email: str = Depends(get_current_user)
):
    """LEGACY: Direct follow-up without session storage.
    
    Use /message for chat history.
    """
    try:
        if mode.lower() == "hr":
            question = generate_hr_question(
                job_description=job_description,
                level=level,
                previous_question=previous_question,
                user_answer=answer,
                resume_text=resume_text
            )
        else:
            next_level = level
            if level == "basic":
                next_level = "intermediate"
            elif level == "intermediate":
                next_level = "advanced"

            question = generate_question(
                job_description=job_description,
                level=next_level,
                previous_question=previous_question,
                user_answer=answer
            )

        return Response(content=question, media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
