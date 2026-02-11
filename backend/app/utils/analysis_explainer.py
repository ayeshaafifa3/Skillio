def generate_explanation(analysis_result: dict) -> str:
    """
    Converts skill gap analysis output into a human-readable explanation
    """

    summary = analysis_result.get("summary", {})
    skills = analysis_result.get("skills", {})
    categories = analysis_result.get("skill_categories", {})
    recommendations = analysis_result.get("recommendations", {})

    confidence = summary.get("confidence_score", 0)
    resume_score = summary.get("resume_score", 0)
    hireability = summary.get("hireability_index", "Unknown")
    fit_level = summary.get("fit_level", "Unknown")

    matched = skills.get("matched_skills", [])
    missing = skills.get("missing_skills", [])
    bonus = skills.get("bonus_skills_detected", [])

    explanation = []

    # -----------------------------
    # Overall Evaluation
    # -----------------------------
    explanation.append(
        f"Your resume shows a **{fit_level}** for the given job description "
        f"with a resume score of **{resume_score}/100**."
    )

    explanation.append(
        f"Based on the analysis, your overall hireability is classified as **{hireability}**."
    )

    # -----------------------------
    # Skills Assessment
    # -----------------------------
    if matched:
        explanation.append(
            "You already demonstrate strong alignment with the job requirements, "
            f"particularly in the following areas: {', '.join(matched)}."
        )

    if missing:
        explanation.append(
            "However, there are some important skills missing that are expected for this role, "
            f"including: {', '.join(missing)}."
        )

    if bonus:
        explanation.append(
            f"You also have additional strengths that stand out, such as {', '.join(bonus)}, "
            "which give you an advantage over other candidates."
        )

    # -----------------------------
    # Category-wise Insight
    # -----------------------------
    core_missing = categories.get("core", {}).get("missing", [])
    system_missing = categories.get("system", {}).get("missing", [])
    cloud_missing = categories.get("cloud", {}).get("missing", [])

    if core_missing:
        explanation.append(
            "Strengthening your **core technical skills** "
            f"({', '.join(core_missing)}) will significantly improve your profile."
        )

    if system_missing:
        explanation.append(
            "Improving your understanding of **system-level concepts** "
            f"such as {', '.join(system_missing)} will help you meet industry expectations."
        )

    if cloud_missing:
        explanation.append(
            "Gaining hands-on experience with **cloud and DevOps tools** "
            f"like {', '.join(cloud_missing)} will further boost your employability."
        )

    # -----------------------------
    # Recommendations
    # -----------------------------
    resume_improvements = recommendations.get("resume_improvements", [])
    learning_suggestions = recommendations.get("learning_suggestions", [])

    if resume_improvements:
        explanation.append(
            "To improve your resume, consider the following actions: "
            + "; ".join(resume_improvements) + "."
        )

    if learning_suggestions:
        explanation.append(
            "Recommended next learning steps include: "
            + "; ".join(learning_suggestions) + "."
        )

    # -----------------------------
    # Final Encouragement
    # -----------------------------
    explanation.append(
        "With focused improvements and project-based learning, "
        "you can significantly increase your chances of clearing technical interviews."
    )

    return " ".join(explanation)
