from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import SessionLocal
from app.models.user import User
from app.models.resume import Resume
from app.utils.security import get_current_user
from app.utils.ai.programming_interview_engine import generate_question

router = APIRouter(
    prefix="/programming-interview",
    tags=["Programming Interview"]
)


# -----------------------------
# Health Check / Diagnostic
# -----------------------------
@router.get("/health")
def check_groq_health():
    """Check if Groq is properly configured."""
    try:
        from app.utils.ai.interview_engine import _get_client, _GROQ_AVAILABLE
        import os
        
        status = {
            "groq_package_installed": _GROQ_AVAILABLE,
            "api_key_set": bool(os.getenv("GROQ_API_KEY")),
            "status": "ok" if _GROQ_AVAILABLE and os.getenv("GROQ_API_KEY") else "not_configured"
        }
        
        if status["status"] == "ok":
            # Try to initialize client
            try:
                _get_client()
                status["client_initialized"] = True
            except Exception as e:
                status["client_initialized"] = False
                status["error"] = str(e)
        
        return status
    except Exception as e:
        return {"status": "error", "error": str(e)}


class StartInterviewRequest(BaseModel):
    job_description: str
    mode: str = "programming"
    level: str = "basic"


class AnswerRequest(BaseModel):
    job_description: str
    previous_question: str
    answer: str
    mode: str = "programming"
    level: str = "basic"


# -----------------------------
# DB
# -----------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# Start Interview
# -----------------------------
@router.post("/start", response_class=Response)
def start_interview(
    request: StartInterviewRequest,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start programming interview.
    
    Request body:
    {
        "job_description": "string",
        "mode": "programming",
        "level": "basic"
    }
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    resume = (
        db.query(Resume)
        .filter(Resume.user_id == user.id)
        .order_by(Resume.uploaded_at.desc())
        .first()
    )

    if not resume:
        raise HTTPException(status_code=400, detail="Upload resume first")

    try:
        question = generate_question(
            resume_text=resume.extracted_text,
            jd_text=request.job_description,
            mode=request.mode,
            level=request.level
        )
        return Response(content=question, media_type="text/plain")
    except RuntimeError as e:
        # Handle AI service errors (Groq not available, API key missing, etc.)
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f">>> PROGRAMMING INTERVIEW ERROR: {error_detail}")
        error_message = str(e)
        if "groq package not available" in error_message:
            error_message = "Groq AI package is not installed. Please install it with: pip install groq"
        elif "GROQ_API_KEY" in error_message:
            error_message = "Groq API key is not configured. Please set GROQ_API_KEY in your .env file. Get your key from https://console.groq.com/"
        raise HTTPException(status_code=503, detail=error_message)
    except Exception as e:
        # Handle other unexpected errors
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f">>> PROGRAMMING INTERVIEW ERROR: {error_detail}")
        raise HTTPException(status_code=503, detail=f"Failed to generate interview question: {str(e)}")


# -----------------------------
# Answer + Auto Evaluation
# -----------------------------
@router.post("/answer", response_class=Response)
def answer_question(
    request: AnswerRequest,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit answer and get follow-up question.
    
    Request body:
    {
        "job_description": "string",
        "previous_question": "string",
        "answer": "string",
        "mode": "programming",
        "level": "basic"
    }
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    resume = (
        db.query(Resume)
        .filter(Resume.user_id == user.id)
        .order_by(Resume.uploaded_at.desc())
        .first()
    )

    if not resume:
        raise HTTPException(status_code=400, detail="Upload resume first")

    try:
        question = generate_question(
            resume_text=resume.extracted_text,
            jd_text=request.job_description,
            mode=request.mode,
            level=request.level,
            previous_question=request.previous_question,
            user_answer=request.answer
        )
        return Response(content=question, media_type="text/plain")
    except RuntimeError as e:
        # Handle AI service errors (Groq not available, API key missing, etc.)
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f">>> PROGRAMMING INTERVIEW ANSWER ERROR: {error_detail}")
        error_message = str(e)
        if "groq package not available" in error_message:
            error_message = "Groq AI package is not installed. Please install it with: pip install groq"
        elif "GROQ_API_KEY" in error_message:
            error_message = "Groq API key is not configured. Please set GROQ_API_KEY in your .env file. Get your key from https://console.groq.com/"
        raise HTTPException(status_code=503, detail=error_message)
    except Exception as e:
        # Handle other unexpected errors
        import traceback
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        print(f">>> PROGRAMMING INTERVIEW ANSWER ERROR: {error_detail}")
        raise HTTPException(status_code=503, detail=f"Failed to generate interview question: {str(e)}")

