from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.analysis import AnalysisHistory
from app.models.interview import InterviewHistory
from app.models.resume import Resume
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

# ------------------------
# Router
# ------------------------
router = APIRouter()

# ------------------------
# Schemas
# ------------------------
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

# ------------------------
# DB Dependency
# ------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ------------------------
# Routes
# ------------------------

@router.post("/signup", tags=["Auth"])
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        name=request.name,
        email=request.email,
        password=hash_password(request.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully"}

@router.post("/login", tags=["Auth"])
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.get("/me", tags=["Auth"])
def get_me(
    email: str = Security(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
    }

@router.get("/dashboard/stats", tags=["Auth"])
def get_dashboard_stats(
    email: str = Security(get_current_user),
    db: Session = Depends(get_db),
):
    """Get dashboard statistics for the current user"""
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Count skills analyzed
    skills_analyzed = db.query(AnalysisHistory).filter(
        AnalysisHistory.user_id == user.id
    ).count()

    # Count interviews taken
    interviews_taken = db.query(InterviewHistory).filter(
        InterviewHistory.user_id == user.id
    ).count()

    # Count resumes scanned
    resumes_scanned = db.query(Resume).filter(
        Resume.user_id == user.id
    ).count()

    return {
        "skills_analyzed": skills_analyzed,
        "interviews_taken": interviews_taken,
        "resumes_scanned": resumes_scanned,
    }
