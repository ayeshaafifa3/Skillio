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
- Adjust difficulty based on level provided.
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

def _get_beginner_hr_prompt():
    """Beginner level HR interview prompt guidelines."""
    return """
Focus on basic ice-breaker and foundational questions:
- Tell me about yourself
- Why are you interested in this role
- What are your strengths
- Tell me about a project you worked on
- Basic teamwork and collaboration questions
Start with warm, conversational ice-breaker questions suitable for someone entering the workforce or changing careers. Keep it simple and approachable.
"""

def _get_intermediate_hr_prompt():
    """Intermediate level HR interview prompt guidelines."""
    return """
Focus on scenario-based and behavioral questions:
- STAR method questions (Situation, Task, Action, Result)
- How you handled challenges and conflicts
- Teamwork and communication in complex situations
- Problem-solving approaches
- Learning from failures
- Motivation and career goals
Ask questions that require specific examples and deeper thinking. Expect candidates to use real-world experiences.
"""

def _get_advanced_hr_prompt():
    """Advanced level HR interview prompt guidelines."""
    return """
Focus on leadership, ownership, and strategic thinking:
- Leadership and decision-making in high-stakes situations
- Conflict resolution with peers or supervisors
- Taking ownership and accountability
- Driving change and innovation
- Mentoring and team development
- Strategic career thinking and industry perspective
- Handling ambiguity and uncertainty
Ask challenging questions expecting mature thinking, strategic approach, and demonstration of leadership qualities.
"""

def generate_hr_opening_question(resume_text: str, jd_text: str, level: str = "beginner") -> str:
    """Generate the opening HR interview question based on resume and JD."""
    level_guidelines = ""
    if level == "intermediate":
        level_guidelines = _get_intermediate_hr_prompt()
    elif level == "advanced":
        level_guidelines = _get_advanced_hr_prompt()
    else:
        level_guidelines = _get_beginner_hr_prompt()
    
    prompt = f"""
{level_guidelines}

Candidate Resume:
{resume_text}

Job Description:
{jd_text}

Start an HR/behavioral interview at {level} level naturally. Ask the candidate an opening question to understand them better. Keep it warm and conversational. This should be an appropriate ice-breaker for the {level} level.
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
    jd_text: str,
    level: str = "beginner"
) -> str:
    """Generate a follow-up HR question based on candidate's answer."""
    level_guidelines = ""
    if level == "intermediate":
        level_guidelines = _get_intermediate_hr_prompt()
    elif level == "advanced":
        level_guidelines = _get_advanced_hr_prompt()
    else:
        level_guidelines = _get_beginner_hr_prompt()
    
    prompt = f"""
{level_guidelines}

Previous question:
{previous_question}

Candidate answer:
{candidate_answer}

Candidate Resume:
{resume_text}

Job Description:
{jd_text}

Evaluate the answer naturally. Ask a thoughtful follow-up question to understand the candidate better at {level} level. Focus on:
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
    level: str = "beginner",
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
            jd_text=job_description,
            level=level
        )
    else:
        return generate_hr_opening_question(
            resume_text=resume_text,
            jd_text=job_description,
            level=level
        )
