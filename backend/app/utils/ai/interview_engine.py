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
You are a strict senior technical interviewer at a top product company.

You are conducting a TECHNICAL interview.

IMPORTANT RULES:
- Do NOT ask HR or behavioral questions.
- Do NOT ask for code writing, live coding, or programming problems.
- Ask ONLY about technical concepts: system design, architecture, database design, scaling, caching, concurrency, etc.
- Ask scenario-based, practical, engineering-level questions and mainly theoretical questions.
- One question at a time.
- No bullet points.
- No JSON.
- Plain text only.
- Speak naturally like a real senior engineer interviewing a candidate.
- Evaluate answers strictly - expect solid reasoning and technical depth.
- Follow up with deeper questions based on their understanding level.
"""

def _get_beginner_prompt():
    """Beginner level interview prompt guidelines - Technical Concepts."""
    return """
BEGINNER LEVEL: Ask questions about:
- Core fundamentals (data structures, algorithms basics)
- Debugging approaches
- Time complexity and space complexity
- OOP concepts (inheritance, polymorphism, encapsulation)
- REST APIs and HTTP basics
- Database basics (schemas, queries, indexing)
Start with foundational questions. Assess their understanding of basic technical concepts.
"""

def _get_intermediate_prompt():
    """Intermediate level interview prompt guidelines - Technical Concepts."""
    return """
INTERMEDIATE LEVEL: Ask questions about:
- System design basics (load balancing, caching)
- Concurrency and threading
- API scaling and rate limiting
- Caching strategies (Redis, Memcached)
- Database indexing and query optimization
- Architecture trade-offs (monolith vs microservices)
Ask questions requiring understanding of design decisions and trade-offs in real systems.
"""

def _get_advanced_prompt():
    """Advanced level interview prompt guidelines - Technical Concepts."""
    return """
ADVANCED LEVEL: Ask questions about:
- Distributed systems theory (CAP theorem scenarios)
- Consistency models and trade-offs
- Rate limiting and throttling strategies
- Microservices failure handling and resilience
- Real production problems and complex scenarios
- Advanced scaling patterns
- Event-driven architectures and streaming
Ask challenging questions expecting deep, production-grade understanding of complex systems.
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
