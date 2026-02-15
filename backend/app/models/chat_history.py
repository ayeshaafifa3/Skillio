"""
InterviewSession and InterviewMessage models for chat history.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class InterviewSession(Base):
    """Represents a complete interview session/conversation."""
    
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    mode = Column(String(50), default="programming")  # "programming" or "hr"
    difficulty = Column(String(20), default="beginner")  # "beginner", "intermediate", "advanced"
    job_description = Column(Text, nullable=False)
    resume_text = Column(Text, default="")
    
    title = Column(String(255), default="New Interview")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<InterviewSession(id={self.id}, user_id={self.user_id}, type={self.interview_type})>"


class InterviewMessage(Base):
    """Represents a single message in an interview conversation."""
    
    __tablename__ = "interview_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False, index=True)
    
    role = Column(String(10), nullable=False)  # "user" or "ai"
    content = Column(Text, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def __repr__(self):
        return f"<InterviewMessage(id={self.id}, session_id={self.session_id}, role={self.role})>"
