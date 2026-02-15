from fastapi import APIRouter, Depends, HTTPException, Security, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import SessionLocal
from app.models.user import User
from app.models.resume import Resume
from app.models.analysis import AnalysisHistory
from app.models.job_description import JobDescription
from app.utils.security import get_current_user
from app.utils.skill_analyzer import analyze_skill_gap
from app.utils.analysis_explainer import generate_explanation
from app.utils.ats_analyzer import analyze_ats
from app.utils.resume_improver import improve_resume


class SkillGapRequest(BaseModel):
    job_description: str = None  # Optional: can pass text directly
    resume_id: int = None  # Optional: if provided, use this specific resume
    job_description_id: int = None  # Optional: if provided, fetch from database

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
    # Fetch user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get job description from ID or direct text
    if request.job_description_id:
        jd = db.query(JobDescription).filter(
            JobDescription.id == request.job_description_id,
            JobDescription.user_id == user.id
        ).first()
        if not jd:
            raise HTTPException(status_code=404, detail="Job description not found")
        job_description = jd.content
    elif request.job_description:
        job_description = request.job_description
    else:
        raise HTTPException(status_code=400, detail="Job description must be provided (either as text or ID)")

    # Fetch resume - either specified or latest
    if request.resume_id:
        resume = db.query(Resume).filter(
            Resume.id == request.resume_id,
            Resume.user_id == user.id
        ).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
    else:
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
# Get Resumes List
# -----------------------------
@router.get("/resumes")
def get_resumes_list(
    email: str = Security(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of user's resumes for selection in analysis"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    resumes = db.query(Resume).filter(
        Resume.user_id == user.id
    ).order_by(Resume.uploaded_at.desc()).all()
    
    return {
        "resumes": [
            {
                "id": r.id,
                "filename": r.filename,
                "uploaded_at": r.uploaded_at.isoformat() if r.uploaded_at else None
            }
            for r in resumes
        ]
    }


# -----------------------------
# Get Job Descriptions List
# -----------------------------
@router.get("/job-descriptions")
def get_job_descriptions_list(
    email: str = Security(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of user's job descriptions for selection in analysis"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    jds = db.query(JobDescription).filter(
        JobDescription.user_id == user.id
    ).order_by(JobDescription.uploaded_at.desc()).all()
    
    return {
        "job_descriptions": [
            {
                "id": jd.id,
                "title": jd.title,
                "uploaded_at": jd.uploaded_at.isoformat() if jd.uploaded_at else None
            }
            for jd in jds
        ]
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


# -----------------------------
# Delete Analysis Record
# -----------------------------
@router.delete("/history/{analysis_id}")
def delete_analysis(
    analysis_id: int,
    email: str = Security(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an analysis record.
    
    Verifies analysis belongs to logged-in user before deleting.
    """
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify analysis belongs to user
        analysis = db.query(AnalysisHistory).filter(
            AnalysisHistory.id == analysis_id,
            AnalysisHistory.user_id == user.id
        ).first()
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        # Delete analysis
        db.delete(analysis)
        db.commit()
        
        return {"message": "Analysis deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# ATS Score Simulation
# -----------------------------
@router.post("/ats-score")
def calculate_ats_score(
    job_description: str = Query(...),
    email: str = Security(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate ATS score for latest user resume against job description.
    Returns text format result.
    """
    try:
        if not job_description:
            raise HTTPException(status_code=400, detail="Job description is required")
        
        # Fetch user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get latest resume
        resume = db.query(Resume).filter(
            Resume.user_id == user.id
        ).order_by(Resume.uploaded_at.desc()).first()
        
        if not resume:
            raise HTTPException(status_code=404, detail="No resume found. Please upload a resume first.")
        
        # Analyze ATS
        result = analyze_ats(resume.extracted_text, job_description)
        
        # Format as text
        text_result = _format_ats_result_text(result)
        
        return {"result": text_result}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _format_ats_result_text(result: dict) -> str:
    """Format ATS result as readable text."""
    lines = []
    
    # Header
    lines.append(f"=== ATS SCORE ANALYSIS ===\n")
    
    # Score and Level
    lines.append(f"ATS Score: {result['ats_score']}/100")
    lines.append(f"Level: {result['level']}\n")
    
    # Keyword Density
    lines.append(f"Keyword Density: {result['keyword_density']}%\n")
    
    # Matched Keywords
    lines.append(f"Matched Keywords ({len(result['matched_keywords'])}):")
    if result['matched_keywords']:
        lines.append(", ".join(result['matched_keywords'][:20]))
        if len(result['matched_keywords']) > 20:
            lines.append(f"... and {len(result['matched_keywords']) - 20} more")
    else:
        lines.append("None")
    lines.append("")
    
    # Missing Keywords
    lines.append(f"Missing Keywords ({len(result['missing_keywords'])}):")
    if result['missing_keywords']:
        lines.append(", ".join(result['missing_keywords'][:15]))
        if len(result['missing_keywords']) > 15:
            lines.append(f"... and {len(result['missing_keywords']) - 15} more")
    else:
        lines.append("None")
    lines.append("")
    
    # Formatting Issues
    lines.append("Formatting Issues:")
    for issue in result['formatting_issues']:
        lines.append(f"• {issue}")
    
    return "\n".join(lines)


# -----------------------------
# Resume Improvement Engine
# -----------------------------
@router.post("/resume-improvement")
def analyze_resume_improvement(
    job_description: str = Query(...),
    email: str = Security(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Analyze resume and suggest powerful rewrites.
    Returns actionable improvement suggestions with before/after examples.
    """
    try:
        if not job_description:
            raise HTTPException(status_code=400, detail="Job description is required")
        
        # Fetch user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get latest resume
        resume = db.query(Resume).filter(
            Resume.user_id == user.id
        ).order_by(Resume.uploaded_at.desc()).first()
        
        if not resume:
            raise HTTPException(status_code=404, detail="No resume found. Please upload a resume first.")
        
        # Analyze and improve resume
        improvements = improve_resume(resume.extracted_text, job_description)
        
        return improvements
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
