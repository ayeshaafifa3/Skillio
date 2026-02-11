import os
from app.utils.ai.groq_client import _get_client

print(">>> JD INTELLIGENCE (GROQ) LOADED <<<")


def generate_jd_ai_explanation(resume_text: str, jd_text: str, analysis: dict) -> str:
    prompt = f"""
You are a career advisor AI.

Resume summary:
{resume_text}

Job description:
{jd_text}

Matched skills:
{analysis["skills"]["matched_skills"]}

Missing skills:
{analysis["skills"]["missing_skills"]}

Explain clearly:
1. Overall fit
2. Why skills match
3. What skills to improve
4. Practical next steps
Use simple bullet points.
"""

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a professional career advisor."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=600
        )

        return response.choices[0].message.content
    except Exception as e:
        # Surface a clear message without crashing import-time
        return f"AI unavailable: {e}"
