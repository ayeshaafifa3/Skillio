import os

try:
    from groq import Groq
    _GROQ_AVAILABLE = True
except Exception:
    Groq = None
    _GROQ_AVAILABLE = False

_client = None


def _get_client():
    global _client
    if not _GROQ_AVAILABLE:
        raise RuntimeError("groq package not available")
    
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY not set")
        _client = Groq(api_key=api_key)
    
    return _client

HR_SYSTEM_PROMPT = """
You are an experienced HR interviewer conducting a behavioral interview for a job position.

Rules:
- Ask ONLY behavioral and HR-related questions.
- Focus on communication skills, teamwork, problem-solving, and real-life scenarios.
- Start from VERY BASIC level (e.g., "Tell me about yourself", "Why do you want this job").
- Increase difficulty gradually to deeper behavioral scenarios.
- Ask follow-up questions based on the candidate's answer to understand their thinking better.
- Evaluate the answer silently based on the rubric.
- If the answer is incomplete, ask a clarifying follow-up naturally.
- If the answer is good, acknowledge and go deeper with behavioral details.
- Ask ONE question at a time.
- DO NOT return JSON.
- DO NOT use bullet points.
- Speak like a real HR interviewer - warm, conversational, and genuine.
- No technical jargon unless specifically relevant.
"""

def generate_hr_opening_question(resume_text: str, jd_text: str) -> str:
    """Generate the opening HR interview question based on resume and JD."""
    prompt = f"""
Candidate Resume:
{resume_text}

Job Description:
{jd_text}

Start an HR/behavioral interview naturally. Ask the candidate an opening question to understand them better. Keep it warm and conversational. This should be a basic ice-breaker question like "Tell me about yourself" or "What interests you in this role?".
"""

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": HR_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_tokens=250
        )

        return response.choices[0].message.content.strip()
    except Exception as e:
        raise RuntimeError(f"AI unavailable: {e}")


def evaluate_and_followup_hr(
    previous_question: str,
    candidate_answer: str,
    resume_text: str,
    jd_text: str
) -> str:
    """Generate a follow-up HR question based on candidate's answer."""
    prompt = f"""
Previous question:
{previous_question}

Candidate answer:
{candidate_answer}

Candidate Resume:
{resume_text}

Job Description:
{jd_text}

Evaluate the answer naturally. Ask a thoughtful follow-up question to understand the candidate better. Focus on:
- Communication clarity
- Teamwork and collaboration
- Problem-solving approach
- Strengths and growth areas
- Real-life examples and experiences
- Motivation and cultural fit

Keep the conversation flowing naturally. Ask ONE follow-up question.
"""

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": HR_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_tokens=300
        )

        return response.choices[0].message.content.strip()
    except Exception as e:
        raise RuntimeError(f"AI unavailable: {e}")


def generate_hr_question(
    job_description: str,
    level: str = "basic",
    previous_question: str | None = None,
    user_answer: str | None = None,
    resume_text: str = "",
) -> str:
    """Wrapper for interview_api route compatibility - HR interview."""
    if previous_question and user_answer:
        return evaluate_and_followup_hr(
            previous_question=previous_question,
            candidate_answer=user_answer,
            resume_text=resume_text,
            jd_text=job_description
        )
    else:
        return generate_hr_opening_question(
            resume_text=resume_text,
            jd_text=job_description
        )
