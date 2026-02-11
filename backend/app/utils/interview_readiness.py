def calculate_interview_readiness(analysis_result: dict) -> dict:
    """
    Calculates overall interview readiness score and status
    """

    summary = analysis_result.get("summary", {})
    skills = analysis_result.get("skills", {})

    resume_score = summary.get("resume_score", 0)
    confidence_score = summary.get("confidence_score", 0)
    missing_skills = skills.get("missing_skills", [])

    # -----------------------------
    # Score Calculation
    # -----------------------------
    score = (
        (resume_score * 0.5)
        + (confidence_score * 100 * 0.3)
        - (len(missing_skills) * 2)
    )

    score = max(0, min(int(score), 100))

    # -----------------------------
    # Status Mapping
    # -----------------------------
    if score >= 80:
        status = "Interview Ready"
    elif score >= 65:
        status = "Ready with Minor Improvements"
    elif score >= 50:
        status = "Needs Improvement"
    else:
        status = "Not Interview Ready"

    return {
        "score": score,
        "status": status
    }
