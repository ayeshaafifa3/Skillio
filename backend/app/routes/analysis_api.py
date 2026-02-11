from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import SessionLocal
from app.models.user import User
from app.models.resume import Resume
from app.models.analysis import AnalysisHistory
from app.utils.security import get_current_user
from app.utils.skill_analyzer import analyze_skill_gap
from app.utils.analysis_explainer import generate_explanation


class SkillGapRequest(BaseModel):
    job_description: str

# Optional AI import
try:
    from app.utils.ai.jd_intelligence import analyze_job_description
    AI_ENABLED = True
except Exception:
    AI_ENABLED = False

router = APIRouter(tags=["Analysis"])


# -----------------------------
# Database Dependency
# -----------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# Run Skill Gap Analysis
# -----------------------------
@router.post("/skill-gap")
def run_skill_gap_analysis(
    request: SkillGapRequest,
    email: str = Security(get_current_user),
    db: Session = Depends(get_db)
):
    job_description = request.job_description
    # Fetch user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch latest resume
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == user.id)
        .order_by(Resume.uploaded_at.desc())
        .first()
    )

    if not resume:
        raise HTTPException(status_code=400, detail="No resume found. Upload resume first.")

    # Optional AI JD enrichment
    jd_context = job_description
    if AI_ENABLED:
        try:
            jd_context = analyze_job_description(job_description)
        except Exception as e:
            print(f">>> JD AI FAILED: {e}")

    # Run rule-based skill analysis
    skill_result = analyze_skill_gap(
        resume_text=resume.extracted_text,
        jd_text=jd_context
    )

    # Generate explanation
    explanation = generate_explanation(skill_result)

    # Save analysis history
    try:
        analysis_record = AnalysisHistory(
            user_id=user.id,
            confidence_score=skill_result["summary"].get("confidence_score", 0),
            fit_level=skill_result["summary"].get("fit_level", "Unknown"),
            matched_skills=", ".join(skill_result["skills"].get("matched_skills", [])),
            missing_skills=", ".join(skill_result["skills"].get("missing_skills", []))
        )

        db.add(analysis_record)
        db.commit()
        print(f">>> ANALYSIS SAVED FOR USER {user.id} <<<")

    except Exception as e:
        db.rollback()
        print(f">>> ERROR SAVING ANALYSIS: {e}")

    # Final response
    return {
        "summary": skill_result.get("summary", {}),
        "skills": skill_result.get("skills", {}),
        "skill_categories": skill_result.get("skill_categories", {}),
        "recommendations": skill_result.get("recommendations", {}),
        "explanation": explanation
    }


# -----------------------------
# Get Analysis History
# -----------------------------
@router.get("/history")
def get_analysis_history(
    email: str = Security(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    records = (
        db.query(AnalysisHistory)
        .filter(AnalysisHistory.user_id == user.id)
        .order_by(AnalysisHistory.created_at.desc())
        .all()
    )

    return [
        {
            "id": r.id,
            "confidence_score": r.confidence_score,
            "fit_level": r.fit_level,
            "matched_skills": r.matched_skills,
            "missing_skills": r.missing_skills,
            "created_at": r.created_at
        }
        for r in records
    ]
