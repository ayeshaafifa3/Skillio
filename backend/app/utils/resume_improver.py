def generate_resume_improvements(analysis_result: dict) -> dict:
    """
    Generates structured resume improvement suggestions
    based on skill gap analysis
    """

    skills = analysis_result.get("skills", {})
    summary = analysis_result.get("summary", {})

    missing = skills.get("missing_skills", [])
    matched = skills.get("matched_skills", [])
    bonus = skills.get("bonus_skills_detected", [])

    confidence = summary.get("confidence_score", 0)
    resume_score = summary.get("resume_score", 0)

    improvements = {
        "critical": [],
        "recommended": [],
        "optional": []
    }

    # -----------------------------
    # Critical Improvements
    # -----------------------------
    for skill in missing:
        improvements["critical"].append(
            f"Add hands-on experience or projects demonstrating {skill}"
        )

    if resume_score < 60:
        improvements["critical"].append(
            "Resume score is low — focus on core technical strengths and remove irrelevant content"
        )

    # -----------------------------
    # Recommended Improvements
    # -----------------------------
    if confidence < 0.7:
        improvements["recommended"].append(
            "Align resume keywords more closely with the job description"
        )

    improvements["recommended"].extend([
        "Quantify project impact using metrics (e.g., performance improvement, users served)",
        "Clearly mention your role and responsibilities in team projects",
        "Add a concise technical summary at the top of the resume"
    ])

    # -----------------------------
    # Optional Improvements
    # -----------------------------
    if not bonus:
        improvements["optional"].append(
            "Add bonus skills such as open-source contributions, certifications, or side projects"
        )

    improvements["optional"].extend([
        "Improve resume formatting for readability",
        "Add GitHub or portfolio links if available"
    ])

    return improvements
