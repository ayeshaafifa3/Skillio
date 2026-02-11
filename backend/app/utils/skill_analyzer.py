import re
from typing import List, Dict


# --------------------------------------------------
# Skill Dictionaries (Single Source of Truth)
# --------------------------------------------------

CORE_SKILLS = {
    "python", "java", "c", "c++", "javascript",
    "data structures", "algorithms",
    "oops", "object oriented programming",
    "database", "sql", "backend", "frontend"
}

SYSTEM_SKILLS = {
    "operating systems", "os",
    "networking", "computer networks",
    "dbms", "system design"
}

CLOUD_SKILLS = {
    "docker", "kubernetes",
    "aws", "azure", "gcp",
    "cloud deployment", "devops"
}

BONUS_SKILLS = {
    "fastapi", "django", "flask",
    "machine learning", "deep learning",
    "react", "node", "microservices",
    "open source", "ci/cd"
}


# --------------------------------------------------
# Helpers
# --------------------------------------------------

def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return text


def extract_skills(text: str, skill_set: set) -> List[str]:
    found = []
    for skill in skill_set:
        if skill in text:
            found.append(skill)
    return sorted(list(set(found)))


# --------------------------------------------------
# Main Analyzer
# --------------------------------------------------

def analyze_skill_gap(resume_text: str, jd_text: str) -> Dict:
    resume_text = normalize_text(resume_text)
    jd_text = normalize_text(jd_text)

    # -----------------------------
    # Extract skills from Resume
    # -----------------------------
    resume_core = extract_skills(resume_text, CORE_SKILLS)
    resume_system = extract_skills(resume_text, SYSTEM_SKILLS)
    resume_cloud = extract_skills(resume_text, CLOUD_SKILLS)
    resume_bonus = extract_skills(resume_text, BONUS_SKILLS)

    # -----------------------------
    # Extract skills from JD
    # -----------------------------
    required_core = extract_skills(jd_text, CORE_SKILLS)
    required_system = extract_skills(jd_text, SYSTEM_SKILLS)
    required_cloud = extract_skills(jd_text, CLOUD_SKILLS)

    # -----------------------------
    # Skill Gap
    # -----------------------------
    matched_skills = sorted(
        set(resume_core + resume_system + resume_cloud)
        & set(required_core + required_system + required_cloud)
    )

    missing_skills = sorted(
        set(required_core + required_system + required_cloud)
        - set(resume_core + resume_system + resume_cloud)
    )

    bonus_skills = resume_bonus

    # -----------------------------
    # Step 7: Skill Categorization (UI-ready)
    # -----------------------------
    core_matched = sorted(set(required_core) & set(resume_core))
    core_missing = sorted(set(required_core) - set(resume_core))

    system_matched = sorted(set(required_system) & set(resume_system))
    system_missing = sorted(set(required_system) - set(resume_system))

    cloud_matched = sorted(set(required_cloud) & set(resume_cloud))
    cloud_missing = sorted(set(required_cloud) - set(resume_cloud))

    # -----------------------------
    # Scoring Logic
    # -----------------------------
    total_required = len(set(required_core + required_system + required_cloud))
    total_matched = len(matched_skills)

    confidence_score = round(
        total_matched / total_required, 2
    ) if total_required > 0 else 0.0

    resume_score = int(confidence_score * 100)

    if resume_score >= 80:
        hireability_index = "Excellent"
        fit_level = "Strong Match"
    elif resume_score >= 60:
        hireability_index = "Good"
        fit_level = "Moderate Match"
    elif resume_score >= 40:
        hireability_index = "Average"
        fit_level = "Weak Match"
    else:
        hireability_index = "Low"
        fit_level = "Poor Match"

    # -----------------------------
    # Recommendations
    # -----------------------------
    resume_improvements = [
        f"Add or highlight experience in {skill}"
        for skill in missing_skills[:3]
    ]

    learning_suggestions = []
    if "docker" in missing_skills:
        learning_suggestions.append("Build a Dockerized backend project")
    if "operating systems" in missing_skills:
        learning_suggestions.append("Revise OS fundamentals")
    if "networking" in missing_skills:
        learning_suggestions.append("Strengthen networking concepts")
    if "cloud deployment" in missing_skills:
        learning_suggestions.append("Deploy a project on AWS/GCP")

    # -----------------------------
    # Final Response
    # -----------------------------
    return {
        "summary": {
            "confidence_score": confidence_score,
            "resume_score": resume_score,
            "hireability_index": hireability_index,
            "fit_level": fit_level
        },
        "skills": {
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "bonus_skills_detected": bonus_skills
        },
        "skill_categories": {
            "core": {
                "matched": core_matched,
                "missing": core_missing
            },
            "system": {
                "matched": system_matched,
                "missing": system_missing
            },
            "cloud": {
                "matched": cloud_matched,
                "missing": cloud_missing
            },
            "bonus": bonus_skills
        },
        "recommendations": {
            "resume_improvements": resume_improvements,
            "learning_suggestions": learning_suggestions
        }
    }
