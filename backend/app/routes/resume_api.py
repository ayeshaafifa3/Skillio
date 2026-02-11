import os
import shutil
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import SessionLocal, Base, engine
from app.models.resume import Resume
from app.models.user import User
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

print(">>> RESUME API LOADED <<<")
