def generate_mock_interview_questions(analysis_result: dict) -> dict:
    """
    Generates mock interview questions based on skill gap analysis
    """

    skills = analysis_result.get("skills", {})
    categories = analysis_result.get("skill_categories", {})

    matched = skills.get("matched_skills", [])
    missing = skills.get("missing_skills", [])
    bonus = skills.get("bonus_skills_detected", [])

    questions = {
        "technical_questions": [],
        "conceptual_questions": [],
        "project_questions": [],
        "behavioral_questions": [],
        "skill_gap_questions": []
    }

    # -----------------------------
    # Technical Questions (Matched Skills)
    # -----------------------------
    for skill in matched:
        questions["technical_questions"].append(
            f"Can you explain how you have used {skill} in your previous projects?"
        )

    # -----------------------------
    # Conceptual Questions
    # -----------------------------
    for skill in matched[:3]:
        questions["conceptual_questions"].append(
            f"What are the core concepts of {skill}, and where is it best applied?"
        )

    # -----------------------------
    # Project-Based Questions
    # -----------------------------
    questions["project_questions"].extend([
        "Walk me through one of the most challenging projects you worked on.",
        "How did you handle errors, scalability, or performance issues in your projects?",
        "If you had to redesign one of your projects today, what would you improve?"
    ])

    # -----------------------------
    # Skill Gap Questions (Missing Skills)
    # -----------------------------
    for skill in missing:
        questions["skill_gap_questions"].append(
            f"The job requires {skill}. How would you go about learning and applying it in a real project?"
        )

    # -----------------------------
    # Bonus Skill Questions
    # -----------------------------
    for skill in bonus:
        questions["technical_questions"].append(
            f"You mentioned {skill}. Can you explain a real-world use case where it provided value?"
        )

    # -----------------------------
    # Behavioral Questions
    # -----------------------------
    questions["behavioral_questions"].extend([
        "Tell me about a time you had to learn a new technology quickly.",
        "Describe a situation where you faced a technical roadblock and how you solved it.",
        "How do you handle feedback or code reviews?",
        "How do you prioritize tasks when working under tight deadlines?"
    ])

    return questions
