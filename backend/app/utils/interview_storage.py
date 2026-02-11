from sqlalchemy import Column, Integer, Text, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class InterviewHistory(Base):
    __tablename__ = "interview_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    interview_type = Column(String(50), default="programming")

    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    ai_response = Column(Text, nullable=False)

    resume_text = Column(Text, nullable=False)
    jd_text = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
