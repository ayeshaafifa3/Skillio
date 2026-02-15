import re
from typing import Dict, List, Tuple

# Action verbs for powerful resumes
STRONG_ACTION_VERBS = [
    "Architected", "Optimized", "Automated", "Orchestrated", "Engineered",
    "Transformed", "Accelerated", "Streamlined", "Pioneered", "Spearheaded",
    "Amplified", "Elevated", "Revolutionized", "Catalyzed", "Maximized",
    "Collaborated", "Developed", "Implemented", "Designed", "Delivered",
    "Created", "Built", "Launched", "Deployed", "Integrated"
]

# Weak action verbs to replace
WEAK_ACTION_VERBS = {
    "worked on": "Engineered",
    "helped with": "Contributed to",
    "did": "Delivered",
    "made": "Developed",
    "was responsible for": "Owned",
    "was involved in": "Spearheaded",
    "used": "Leveraged",
    "had": "Possessed",
    "got": "Achieved",
    "tried": "Attempted",
    "sort of": "",
    "kind of": "",
    "somewhat": "",
    "pretty much": "",
    "basically": "",
    "literally": "",
    "really": "",
    "very": "",
    "just": "",
    "thing": "component",
    "stuff": "features",
    "a lot": "significantly",
}

# Impact metrics patterns to suggest
IMPACT_METRICS = [
    "% improvement",
    "% increase",
    "users",
    "performance",
    "efficiency",
    "time saved",
    "cost reduction",
    "revenue increase",
    "faster",
    "times faster"
]

def improve_resume(resume_text: str, job_description: str) -> Dict:
    """
    Powerful resume improvement engine that analyzes resume content
    and suggests impactful rewrites.
    
    Returns:
        {
            "total_suggestions": int,
            "improvement_score": float (0-100),
            "improvements": [
                {
                    "original": str,
                    "improved": str,
                    "category": str ("Action Verb" | "Weak Language" | "Missing Metrics" | "Keywords"),
                    "impact": str
                }
            ],
            "missing_keywords": [str],
            "summary": str
        }
    """
    
    improvements = []
    
    # Extract JD keywords
    jd_keywords = _extract_jd_keywords(job_description)
    
    # Extract resume bullets
    bullets = _extract_resume_bullets(resume_text)
    
    # Analyze each bullet
    for bullet in bullets:
        if len(bullet.strip()) < 5:
            continue
            
        # Check for weak action verbs
        weak_verb_improvements = _find_weak_verbs(bullet)
        improvements.extend(weak_verb_improvements)
        
        # Check for weak language
        weak_language_improvements = _find_weak_language(bullet)
        improvements.extend(weak_language_improvements)
        
        # Check for missing metrics
        metric_improvements = _suggest_metrics(bullet)
        improvements.extend(metric_improvements)
        
        # Check for missing keywords
        keyword_improvements = _find_missing_keywords(bullet, jd_keywords)
        improvements.extend(keyword_improvements)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_improvements = []
    for imp in improvements:
        key = (imp["original"], imp["improved"])
        if key not in seen:
            seen.add(key)
            unique_improvements.append(imp)
    
    # Calculate improvement score
    improvement_score = min(100, 50 + (len(unique_improvements) * 5))
    
    # Find missing keywords not in resume
    resume_lower = resume_text.lower()
    missing_keywords = [kw for kw in jd_keywords if kw.lower() not in resume_lower][:15]
    
    return {
        "total_suggestions": len(unique_improvements),
        "improvement_score": improvement_score,
        "improvements": unique_improvements[:20],  # Top 20 suggestions
        "missing_keywords": missing_keywords,
        "summary": _generate_summary(unique_improvements, missing_keywords)
    }


def _extract_resume_bullets(resume_text: str) -> List[str]:
    """Extract bullet points from resume."""
    lines = resume_text.split('\n')
    bullets = []
    
    for line in lines:
        line = line.strip()
        # Match common bullet patterns
        if re.match(r'^[-•*]\s+', line) or re.match(r'^\d+\.\s+', line):
            # Remove bullet marker
            content = re.sub(r'^[-•*]\s+|^\d+\.\s+', '', line)
            bullets.append(content)
        elif line and len(line) > 10:
            # Also include standalone sentences that look like accomplishments
            if any(verb in line.lower() for verb in ["developed", "created", "built", "led", "managed", "improved", "increased", "reduced"]):
                bullets.append(line)
    
    return bullets


def _find_weak_verbs(bullet: str) -> List[Dict]:
    """Find and suggest replacements for weak action verbs."""
    improvements = []
    
    for weak, strong in WEAK_ACTION_VERBS.items():
        pattern = r'\b' + re.escape(weak) + r'\b'
        if re.search(pattern, bullet, re.IGNORECASE):
            improved = re.sub(pattern, strong, bullet, flags=re.IGNORECASE, count=1)
            if improved != bullet:
                improvements.append({
                    "original": bullet,
                    "improved": improved,
                    "category": "Action Verb",
                    "impact": f"Replace '{weak}' with '{strong}' for more powerful language"
                })
                break
    
    return improvements


def _find_weak_language(bullet: str) -> List[Dict]:
    """Find and remove weak qualifiers."""
    improvements = []
    weakeners = ["sort of", "kind of", "somewhat", "pretty much", "basically", "literally", "really", "very", "just"]
    
    for weakener in weakeners:
        if weakener.lower() in bullet.lower():
            improved = re.sub(r'\b' + weakener + r'\b', '', bullet, flags=re.IGNORECASE)
            improved = re.sub(r'\s+', ' ', improved).strip()
            if improved and improved != bullet:
                improvements.append({
                    "original": bullet,
                    "improved": improved,
                    "category": "Weak Language",
                    "impact": f"Remove '{weakener}' — be more assertive and confident"
                })
                break
    
    return improvements


def _suggest_metrics(bullet: str) -> List[Dict]:
    """Suggest adding quantified metrics."""
    improvements = []
    
    # Check if bullet already has numbers/metrics
    has_metric = bool(re.search(r'\d+%|x\d+| \d+[KM]? |improved|increased|reduced|saved', bullet, re.IGNORECASE))
    
    if not has_metric and len(bullet) > 15:
        # Suggest adding metrics
        metric_suggestions = [
            " by 30%",
            " by 2x",
            " for 50+ users",
            " reducing time by 40%",
            " improving performance by 35%"
        ]
        
        for metric in metric_suggestions[:2]:
            improved = bullet.rstrip('.') + metric + "."
            improvements.append({
                "original": bullet,
                "improved": improved,
                "category": "Missing Metrics",
                "impact": f"Add quantified impact with metrics — '35% improvement' is more powerful than 'significant improvement'"
            })
    
    return improvements


def _find_missing_keywords(bullet: str, jd_keywords: List[str]) -> List[Dict]:
    """Identify missing job description keywords."""
    improvements = []
    bullet_lower = bullet.lower()
    
    missing_in_bullet = [kw for kw in jd_keywords if kw.lower() not in bullet_lower]
    
    if missing_in_bullet and len(bullet) > 20:
        relevant_keywords = [kw for kw in missing_in_bullet if _is_relevant_keyword(kw, bullet)][:2]
        
        if relevant_keywords:
            keyword_str = ", ".join(relevant_keywords)
            improved = bullet.rstrip('.') + f" (included {keyword_str})."
            improvements.append({
                "original": bullet,
                "improved": improved,
                "category": "Keywords",
                "impact": f"Incorporate job description keywords: {keyword_str}"
            })
    
    return improvements


def _extract_jd_keywords(jd_text: str) -> List[str]:
    """Extract important keywords from job description."""
    jd_lower = jd_text.lower()
    
    # Remove common words
    common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of', 'for', 'is', 'are', 'was', 'be', 'have', 'has', 'do', 'does', 'will', 'with', 'we', 'you', 'your', 'our', 'i', 'that', 'this', 'which', 'as', 'if', 'from', 'by', 'about', 'more', 'than', 'other', 'some', 'not', 'where', 'there', 'when', 'how', 'what', 'who', 'why', 'can', 'should', 'would', 'could', 'may', 'might', 'must', 'such', 'so', 'no', 'yes', 'up', 'out', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'along', 'among', 'around'}
    
    # Split and clean
    words = re.findall(r'\b[a-z]+(?:\s+[a-z]+)?\b', jd_lower)
    keywords = [w for w in words if w not in common_words and len(w) > 2]
    
    # Get frequency > 1
    from collections import Counter
    freq = Counter(keywords)
    top_keywords = [word for word, count in freq.most_common(30) if count > 0]
    
    return top_keywords[:25]


def _is_relevant_keyword(keyword: str, bullet: str) -> bool:
    """Check if keyword is relevant to the bullet."""
    bullet_lower = bullet.lower()
    
    # Technical keywords relevance
    tech_keywords = ['python', 'java', 'javascript', 'react', 'database', 'sql', 'api', 'rest', 'microservice']
    if any(tech in keyword.lower() for tech in tech_keywords):
        return True
    
    # Check if bullet context matches keyword context
    return len(bullet) > 15


def _generate_summary(improvements: List[Dict], missing_keywords: List[str]) -> str:
    """Generate a summary of improvements."""
    if not improvements:
        return "Your resume is already strong! 💪 No critical improvements needed."
    
    improvement_types = {}
    for imp in improvements:
        category = imp.get("category", "Other")
        improvement_types[category] = improvement_types.get(category, 0) + 1
    
    summary_parts = []
    summary_parts.append(f"Found {len(improvements)} improvement opportunities")
    
    for category, count in improvement_types.items():
        summary_parts.append(f"• {count} {category} suggestion(s)")
    
    if missing_keywords:
        summary_parts.append(f"• {len(missing_keywords)} missing job keywords")
    
    summary_parts.append("\nTop priorities: Replace weak verbs, add metrics, and incorporate key skills from the job description.")
    
    return "\n".join(summary_parts)

