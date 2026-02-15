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

SYSTEM_PROMPT = """
You are a senior software engineer conducting a programming interview.

Rules:
- Ask ONLY programming and DSA questions.
- Adjust difficulty based on level provided.
- Ask follow-up questions based on the candidate's answer.
- Evaluate the answer silently.
- If the answer is wrong, explain briefly and ask a follow-up.
- If the answer is correct, acknowledge briefly and go deeper.
- Ask ONE question at a time.
- DO NOT return JSON.
- DO NOT use bullet points.
- Speak like a real interviewer.
"""

def _get_beginner_prompt():
    """Beginner level interview prompt guidelines."""
    return """
Focus on foundational concepts:
- Basic arrays and loops
- Simple string manipulation
- Basic logic and conditionals
- Simple output prediction
- Easy data type operations
Start with very basic problems suitable for freshers. Ask clarifying questions to understand the candidate's thinking.
"""

def _get_intermediate_prompt():
    """Intermediate level interview prompt guidelines."""
    return """
Focus on building logic and problem-solving:
- Data structure selection and implementation
- Logic building and algorithm design
- Edge case handling
- Time and space complexity awareness
- Multi-step problems
Ask questions that require thinking through the approach. Expect reasonable solutions with consideration for edge cases.
"""

def _get_advanced_prompt():
    """Advanced level interview prompt guidelines."""
    return """
Focus on optimization and advanced concepts:
- Optimal complexity solutions
- Trade-offs and optimization techniques
- Tricky corner cases and edge cases
- Advanced data structures
- System design thinking for complex problems
- Discussion of alternative approaches
Ask challenging questions expecting deep thinking and optimal solutions.
"""

def generate_interview_question(resume_text: str, jd_text: str, level: str = "beginner") -> str:
    level_guidelines = ""
    if level == "intermediate":
        level_guidelines = _get_intermediate_prompt()
    elif level == "advanced":
        level_guidelines = _get_advanced_prompt()
    else:
        level_guidelines = _get_beginner_prompt()
    
    prompt = f"""
{level_guidelines}

Candidate Resume:
{resume_text}

Job Description:
{jd_text}

Start a programming interview at {level} level.
Begin with an appropriate DSA or logic question for this difficulty level.
"""

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_tokens=300
        )

        return response.choices[0].message.content.strip()
    except Exception as e:
        raise RuntimeError(f"AI unavailable: {e}")


def evaluate_and_followup(
    previous_question: str,
    candidate_answer: str,
    resume_text: str,
    jd_text: str,
    level: str = "beginner"
) -> str:
    level_guidelines = ""
    if level == "intermediate":
        level_guidelines = _get_intermediate_prompt()
    elif level == "advanced":
        level_guidelines = _get_advanced_prompt()
    else:
        level_guidelines = _get_beginner_prompt()
    
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

Evaluate the answer.
Respond naturally.
Ask the next programming question or follow-up at {level} difficulty level.
"""

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_tokens=350
        )

        return response.choices[0].message.content.strip()
    except Exception as e:
        raise RuntimeError(f"AI unavailable: {e}")


def generate_question(
    job_description: str,
    level: str = "beginner",
    previous_question: str | None = None,
    user_answer: str | None = None,
) -> str:
    """Wrapper for interview_api route compatibility."""
    if previous_question and user_answer:
        return evaluate_and_followup(
            previous_question=previous_question,
            candidate_answer=user_answer,
            resume_text="",
            jd_text=job_description,
            level=level
        )
    else:
        return generate_interview_question(
            resume_text="",
            jd_text=job_description,
            level=level
        )
