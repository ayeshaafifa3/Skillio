from app.utils.ai.interview_engine import (
    generate_interview_question,
    evaluate_and_followup
)

def start_programming_interview(resume_text: str, jd_text: str) -> str:
    """
    Starts a new programming interview.
    Returns ONLY plain text (first question).
    """
    return generate_interview_question(
        resume_text=resume_text,
        jd_text=jd_text
    )


def continue_programming_interview(
    previous_question: str,
    candidate_answer: str,
    resume_text: str,
    jd_text: str
) -> str:
    """
    Evaluates the answer and returns the next follow-up question.
    Returns ONLY plain text.
    """
    return evaluate_and_followup(
        previous_question=previous_question,
        candidate_answer=candidate_answer,
        resume_text=resume_text,
        jd_text=jd_text
    )


def generate_question(
    resume_text: str,
    jd_text: str,
    mode: str = "programming",
    level: str = "basic",
    previous_question: str | None = None,
    user_answer: str | None = None,
) -> str:
    """Compatibility wrapper for the programming_interview_api route.
    
    Generates the first question or a follow-up based on previous answer.
    """
    if previous_question and user_answer:
        # Follow-up question
        return continue_programming_interview(
            previous_question=previous_question,
            candidate_answer=user_answer,
            resume_text=resume_text,
            jd_text=jd_text
        )
    else:
        # Initial question
        return start_programming_interview(
            resume_text=resume_text,
            jd_text=jd_text
        )
