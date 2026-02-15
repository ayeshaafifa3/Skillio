import re
from typing import Dict, List

def analyze_ats(resume_text: str, job_description: str) -> Dict:
    """
    Analyze ATS compatibility of resume against job description.
    
    Returns:
        {
            ats_score: int (0-100),
            level: str ("Strong" | "Moderate" | "Weak"),
            keyword_density: float,
            matched_keywords: List[str],
            missing_keywords: List[str],
            formatting_issues: List[str]
        }
    """
    
    if not resume_text or not job_description:
        return {
            "ats_score": 0,
            "level": "Weak",
            "keyword_density": 0.0,
            "matched_keywords": [],
            "missing_keywords": [],
            "formatting_issues": ["Resume or job description is empty"]
        }
    
    # Normalize text
    resume_lower = resume_text.lower()
    jd_lower = job_description.lower()
    
    # Extract keywords from job description
    jd_keywords = _extract_keywords(jd_lower)
    
    # Find matched keywords
    matched_keywords = []
    for keyword in jd_keywords:
        if keyword in resume_lower:
            matched_keywords.append(keyword)
    
    # Find missing keywords
    missing_keywords = [kw for kw in jd_keywords if kw not in matched_keywords]
    
    # Calculate keyword density
    keyword_density = _calculate_keyword_density(resume_lower, matched_keywords)
    
    # Detect formatting issues
    formatting_issues = _detect_formatting_issues(resume_text, resume_lower)
    
    # Calculate ATS score
    ats_score = _calculate_ats_score(
        matched_keywords,
        jd_keywords,
        keyword_density,
        formatting_issues,
        resume_text
    )
    
    # Determine level
    if ats_score > 75:
        level = "Strong"
    elif ats_score >= 50:
        level = "Moderate"
    else:
        level = "Weak"
    
    return {
        "ats_score": ats_score,
        "level": level,
        "keyword_density": round(keyword_density, 2),
        "matched_keywords": list(set(matched_keywords)),
        "missing_keywords": list(set(missing_keywords)),
        "formatting_issues": formatting_issues
    }


def _extract_keywords(text: str) -> List[str]:
    """Extract significant keywords from text."""
    # Remove common words and special characters
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'up', 'about', 'as', 'be', 'been', 'is',
        'are', 'was', 'were', 'have', 'has', 'had', 'do', 'does', 'did',
        'can', 'could', 'will', 'would', 'should', 'may', 'might', 'must',
        'shall', 'that', 'this', 'these', 'those', 'what', 'which', 'who',
        'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
        'through', 'during', 'before', 'after', 'above', 'below', 'between'
    }
    
    # Extract words
    words = re.findall(r'\b[a-z+#.]+\b', text)
    
    # Filter: remove stop words and keep only substantial keywords
    keywords = [
        w for w in words
        if len(w) > 2 and w not in stop_words
    ]
    
    # Remove duplicates and sort by frequency (most common first)
    from collections import Counter
    keyword_counts = Counter(keywords)
    
    # Return top keywords by frequency
    top_keywords = [kw for kw, count in keyword_counts.most_common(100)]
    
    return top_keywords


def _calculate_keyword_density(resume_text: str, matched_keywords: List[str]) -> float:
    """Calculate keyword density as percentage."""
    if not matched_keywords or not resume_text:
        return 0.0
    
    total_words = len(resume_text.split())
    match_count = sum(resume_text.count(kw) for kw in matched_keywords)
    
    if total_words == 0:
        return 0.0
    
    return (match_count / total_words) * 100


def _detect_formatting_issues(resume_text: str, resume_lower: str) -> List[str]:
    """Detect formatting issues in resume."""
    issues = []
    
    # Check word count
    word_count = len(resume_text.split())
    if word_count < 300:
        issues.append("Resume is too short (<300 words) - expand with accomplishments")
    
    # Check for measurable numbers
    number_pattern = r'\b\d+[%+x]?\b'
    has_numbers = bool(re.search(number_pattern, resume_text))
    if not has_numbers:
        issues.append("Missing quantifiable metrics (e.g., 25% improvement, $2M savings)")
    
    # Check for action verbs
    action_verbs = [
        'achieved', 'developed', 'implemented', 'managed', 'led', 'designed',
        'created', 'improved', 'increased', 'reduced', 'optimized', 'enhanced',
        'established', 'built', 'launched', 'coordinated', 'directed', 'oversaw',
        'spearheaded', 'championed', 'pioneered', 'accelerated', 'boosted'
    ]
    has_action_verbs = any(verb in resume_lower for verb in action_verbs)
    if not has_action_verbs:
        issues.append("Missing action verbs - use: achieved, developed, implemented, managed, led")
    
    # Check for technical keywords
    tech_keywords = [
        'api', 'database', 'sql', 'python', 'java', 'javascript', 'react',
        'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'monitoring',
        'analytics', 'ml', 'ai', 'machine learning', 'data science',
        'full stack', 'backend', 'frontend', 'devops', 'ci/cd'
    ]
    has_tech_keywords = any(tech in resume_lower for tech in tech_keywords)
    if not has_tech_keywords:
        issues.append("Missing technical keywords - add specific tools/technologies used")
    
    # Check for impact words
    impact_words = [
        'revenue', 'profit', 'growth', 'efficiency', 'productivity', 'quality',
        'performance', 'scalability', 'reliability', 'security', 'compliance',
        'market', 'customer', 'user', 'engagement', 'retention', 'acquisition'
    ]
    has_impact_words = any(word in resume_lower for word in impact_words)
    if not has_impact_words:
        issues.append("Missing business impact words - highlight ROI and business value")
    
    return issues if issues else ["No significant formatting issues detected"]


def _calculate_ats_score(
    matched_keywords: List[str],
    jd_keywords: List[str],
    keyword_density: float,
    formatting_issues: List[str],
    resume_text: str
) -> int:
    """Calculate final ATS score (0-100)."""
    
    score = 0
    
    # Keyword match percentage (40 points)
    if jd_keywords:
        match_ratio = len(matched_keywords) / len(jd_keywords)
        score += int(match_ratio * 40)
    
    # Keyword density (25 points) - optimal is 1-3%
    if 1 <= keyword_density <= 3:
        score += 25
    elif 0.5 <= keyword_density < 1:
        score += 15
    elif 3 < keyword_density <= 5:
        score += 15
    elif keyword_density > 5:
        score += 5  # Keyword stuffing penalty
    else:
        score += 5
    
    # Formatting quality (20 points)
    issue_count = len(formatting_issues)
    if issue_count == 1 and "No significant" in formatting_issues[0]:
        score += 20
    elif issue_count <= 2:
        score += 15
    elif issue_count <= 4:
        score += 10
    else:
        score += 0
    
    # Resume length (15 points)
    word_count = len(resume_text.split())
    if 300 <= word_count <= 1000:
        score += 15
    elif word_count > 1000:
        score += 10
    else:
        score += 5
    
    return min(100, max(0, score))
