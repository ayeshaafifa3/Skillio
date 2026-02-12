import os
import shutil
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import SessionLocal, Base, engine
from app.models.resume import Resume
from app.models.user import User
from app.models.job_description import JobDescription
from app.utils.security import get_current_user
from app.utils.resume_parser import (
    extract_text_from_pdf,
    extract_text_from_docx
)

router = APIRouter()

Base.metadata.create_all(bind=engine)

UPLOAD_DIR = "uploads"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload")
def upload_resume(
    file: UploadFile = File(...),
    email: str = Depends(get_current_user),
    request: Request = None,
    db: Session = Depends(get_db)
):
    # Log incoming Authorization header for debugging 401s
    try:
        auth_hdr = request.headers.get("authorization") if request is not None else None
        print(f"[resume_api] Authorization header received: {auth_hdr}")
    except Exception:
        pass
    if not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed"
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_folder = os.path.join(UPLOAD_DIR, f"user_{user.id}")
    os.makedirs(user_folder, exist_ok=True)

    file_path = os.path.join(user_folder, file.filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}"
        )

    # 🔍 Extract text in REAL TIME
    try:
        if file.filename.lower().endswith(".pdf"):
            extracted_text = extract_text_from_pdf(file_path)
        else:
            extracted_text = extract_text_from_docx(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract text from file: {str(e)}"
        )

    if not extracted_text:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from resume"
        )

    try:
        resume = Resume(
            user_id=user.id,
            filename=file.filename,
            file_path=file_path,
            extracted_text=extracted_text
        )

        db.add(resume)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save resume to database: {str(e)}"
        )

    return {
        "message": "Resume uploaded and processed successfully",
        "filename": file.filename,
        "text_length": len(extracted_text)
    }


@router.get("/history")
def get_resume_history(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all previously uploaded resumes for the current user"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    resumes = db.query(Resume).filter(Resume.user_id == user.id).order_by(Resume.uploaded_at.desc()).all()
    
    return {
        "resumes": [
            {
                "id": resume.id,
                "filename": resume.filename,
                "content": resume.extracted_text,
                "uploaded_at": resume.uploaded_at.isoformat() if resume.uploaded_at else None
            }
            for resume in resumes
        ]
    }


@router.post("/job-description/upload")
def upload_job_description(
    title: str,
    file: UploadFile = File(...),
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a job description file"""
    if not file.filename.lower().endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX, and TXT files are allowed"
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Extract text from uploaded file
    try:
        if file.filename.lower().endswith(".pdf"):
            content = extract_text_from_pdf(file.file)
        elif file.filename.lower().endswith(".txt"):
            content = file.file.read().decode('utf-8')
        else:
            content = extract_text_from_docx(file.file)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract text from file: {str(e)}"
        )

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from job description"
        )

    try:
        jd = JobDescription(
            user_id=user.id,
            title=title,
            filename=file.filename,
            content=content
        )
        db.add(jd)
        db.commit()
        db.refresh(jd)
        
        return {
            "message": "Job description uploaded successfully",
            "id": jd.id,
            "title": jd.title,
            "filename": jd.filename
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save job description: {str(e)}"
        )


@router.post("/job-description/text")
def save_job_description_text(
    title: str,
    content: str,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a job description from text input"""
    if not content or not content.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description content cannot be empty"
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        jd = JobDescription(
            user_id=user.id,
            title=title,
            filename=f"jd_{title.replace(' ', '_')}.txt",
            content=content
        )
        db.add(jd)
        db.commit()
        db.refresh(jd)
        
        return {
            "message": "Job description saved successfully",
            "id": jd.id,
            "title": jd.title
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save job description: {str(e)}"
        )


@router.get("/job-description/history")
def get_job_description_history(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all previously saved job descriptions for the current user"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    jds = db.query(JobDescription).filter(JobDescription.user_id == user.id).order_by(JobDescription.uploaded_at.desc()).all()
    
    return {
        "job_descriptions": [
            {
                "id": jd.id,
                "title": jd.title,
                "filename": jd.filename,
                "content": jd.content,
                "uploaded_at": jd.uploaded_at.isoformat() if jd.uploaded_at else None
            }
            for jd in jds
        ]
    }


@router.get("/job-description/{jd_id}")
def get_job_description(
    jd_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific job description"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    jd = db.query(JobDescription).filter(
        JobDescription.id == jd_id,
        JobDescription.user_id == user.id
    ).first()
    
    if not jd:
        raise HTTPException(status_code=404, detail="Job description not found")
    
    return {
        "id": jd.id,
        "title": jd.title,
        "filename": jd.filename,
        "content": jd.content,
        "uploaded_at": jd.uploaded_at.isoformat() if jd.uploaded_at else None
    }


@router.get("/{resume_id}")
def get_resume(
    resume_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific resume"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == user.id
    ).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return {
        "id": resume.id,
        "filename": resume.filename,
        "content": resume.extracted_text,
        "uploaded_at": resume.uploaded_at.isoformat() if resume.uploaded_at else None
    }


@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific resume"""
    print(f"[DELETE RESUME] Attempting to delete resume {resume_id} for user {email}")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"[DELETE RESUME] User not found: {email}")
        raise HTTPException(status_code=404, detail="User not found")
    
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == user.id
    ).first()
    
    if not resume:
        print(f"[DELETE RESUME] Resume {resume_id} not found for user {user.id}")
        raise HTTPException(status_code=404, detail="Resume not found")
    
    try:
        print(f"[DELETE RESUME] Found resume, file path: {resume.file_path}")
        # Delete file if it exists
        if os.path.exists(resume.file_path):
            os.remove(resume.file_path)
            print(f"[DELETE RESUME] File deleted from disk")
        
        # Delete from database
        db.delete(resume)
        db.commit()
        print(f"[DELETE RESUME] Successfully deleted from database")
        
        return {
            "message": "Resume deleted successfully"
        }
    except Exception as e:
        print(f"[DELETE RESUME] Exception: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete resume: {str(e)}"
        )


@router.delete("/job-description/{jd_id}")
def delete_job_description(
    jd_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific job description"""
    print(f"[DELETE JD] Attempting to delete JD {jd_id} for user {email}")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"[DELETE JD] User not found: {email}")
        raise HTTPException(status_code=404, detail="User not found")
    
    jd = db.query(JobDescription).filter(
        JobDescription.id == jd_id,
        JobDescription.user_id == user.id
    ).first()
    
    if not jd:
        print(f"[DELETE JD] JD {jd_id} not found for user {user.id}")
        raise HTTPException(status_code=404, detail="Job description not found")
    
    try:
        print(f"[DELETE JD] Found JD, deleting from database")
        db.delete(jd)
        db.commit()
        print(f"[DELETE JD] Successfully deleted from database")
        
        return {
            "message": "Job description deleted successfully"
        }
    except Exception as e:
        print(f"[DELETE JD] Exception: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete job description: {str(e)}"
        )

print(">>> RESUME API LOADED <<<")
