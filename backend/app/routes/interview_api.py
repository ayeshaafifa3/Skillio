from fastapi import APIRouter, Depends, HTTPException, Response
from app.utils.security import get_current_user

router = APIRouter(prefix="/interview", tags=["AI Interview"])

from app.utils.ai.interview_engine import generate_question
from app.utils.ai.hr_interview_engine import generate_hr_question


# -----------------------------
# Start Interview
# -----------------------------
@router.post("/start", response_class=Response)
def start_interview(
    job_description: str,
    interview_type: str = "programming",
    resume_text: str = "",
    email: str = Depends(get_current_user)
):
    """Start interview with job description as query param or body text.
    
    Supports both programming and HR interviews via interview_type parameter.
    
    Args:
        job_description: Job description text
        interview_type: "programming" or "hr" (default: "programming")
        resume_text: Candidate's resume text (optional, used for HR interviews)
    
    Examples:
    POST /interview/start?job_description=Python+developer&interview_type=programming
    POST /interview/start?job_description=Sales+role&interview_type=hr&resume_text=...
    """
    try:
        # Route based on interview type
        if interview_type.lower() == "hr":
            question = generate_hr_question(
                job_description=job_description,
                level="basic",
                resume_text=resume_text
            )
        else:
            # Default to programming interview
            question = generate_question(
                job_description=job_description,
                level="basic"
            )
        
        return Response(content=question, media_type="text/plain")

    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


# -----------------------------
# Follow-up Question
# -----------------------------
@router.post("/follow-up", response_class=Response)
def follow_up_question(
    job_description: str,
    previous_question: str,
    answer: str,
    interview_type: str = "programming",
    level: str = "basic",
    resume_text: str = "",
    email: str = Depends(get_current_user)
):
    """Continue interview with follow-up question.
    
    Supports both programming and HR interviews via interview_type parameter.
    
    Args:
        job_description: Job description text
        previous_question: The previous question asked
        answer: The candidate's answer
        interview_type: "programming" or "hr" (default: "programming")
        level: Difficulty level (for programming interviews)
        resume_text: Candidate's resume text (optional, used for HR interviews)
    
    Examples:
    POST /interview/follow-up?job_description=...&previous_question=...&answer=...&interview_type=programming
    POST /interview/follow-up?job_description=...&previous_question=...&answer=...&interview_type=hr&resume_text=...
    """
    try:
        if interview_type.lower() == "hr":
            # HR interview - doesn't use level progression
            question = generate_hr_question(
                job_description=job_description,
                level=level,
                previous_question=previous_question,
                user_answer=answer,
                resume_text=resume_text
            )
        else:
            # Programming interview - progresses through levels
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
