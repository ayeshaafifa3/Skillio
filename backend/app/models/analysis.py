from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    confidence_score = Column(Float)
    fit_level = Column(String)

    matched_skills = Column(String)
    missing_skills = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<AnalysisHistory user_id={self.user_id} score={self.confidence_score}>"
    
print(">>> ANALYSIS MODEL LOADED <<<")