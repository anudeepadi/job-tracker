"""
Skills analysis parser for extracting structured data from agent outputs.
"""

import re
import json
from typing import Dict, List, Optional, Any


def parse_skills_analysis(output: str) -> Dict[str, Any]:
    """
    Parse skills analysis from agent output text.
    
    Returns structured data with:
    - total_skills_identified
    - skills_by_category
    - priority_skills
    - quick_start_plan
    - long_term_plan
    """
    result = {
        "total_skills_identified": 0,
        "skills_by_category": {},
        "priority_skills": [],
        "quick_start_plan": None,
        "long_term_plan": None,
    }
    
    if not output:
        return result
    
    # Extract skills by category
    category_pattern = r'(?:##|###)\s*([^#\n]+?)\s*Skills?\s*:?\s*\n(.*?)(?=\n(?:##|###|$))'
    categories = re.findall(category_pattern, output, re.IGNORECASE | re.DOTALL)
    
    for category_name, skills_text in categories:
        category_name = category_name.strip()
        # Extract individual skills (bullet points, numbered lists, or lines)
        skills = re.findall(r'[-*•]\s*(.+?)(?=\n|$)', skills_text, re.MULTILINE)
        if not skills:
            # Try numbered list
            skills = re.findall(r'\d+[.)]\s*(.+?)(?=\n|$)', skills_text, re.MULTILINE)
        if not skills:
            # Try plain lines
            skills = [line.strip() for line in skills_text.split('\n') if line.strip() and not line.strip().startswith('#')]
        
        if skills:
            result["skills_by_category"][category_name] = [s.strip() for s in skills if s.strip()]
            result["total_skills_identified"] += len(result["skills_by_category"][category_name])
    
    # Extract priority skills
    priority_patterns = [
        r'(?:priority|high priority|essential|critical)\s*skills?[:\n](.*?)(?=\n(?:##|###|$))',
        r'top\s+\d+\s+skills?[:\n](.*?)(?=\n(?:##|###|$))',
    ]
    
    for pattern in priority_patterns:
        matches = re.findall(pattern, output, re.IGNORECASE | re.DOTALL)
        if matches:
            priority_text = matches[0]
            priority_skills = re.findall(r'[-*•]\s*(.+?)(?=\n|$)', priority_text, re.MULTILINE)
            if priority_skills:
                result["priority_skills"] = [s.strip() for s in priority_skills if s.strip()]
                break
    
    # Extract learning plans
    quick_start_match = re.search(
        r'(?:quick\s*start|immediate|short[\s-]term)\s*(?:plan|roadmap|steps?)[:\n](.*?)(?=\n(?:##|###|long[\s-]term|$))',
        output,
        re.IGNORECASE | re.DOTALL
    )
    
    if quick_start_match:
        result["quick_start_plan"] = quick_start_match.group(1).strip()
    
    long_term_match = re.search(
        r'(?:long[\s-]term|advanced|future)\s*(?:plan|roadmap|steps?)[:\n](.*?)(?=\n(?:##|###|$))',
        output,
        re.IGNORECASE | re.DOTALL
    )
    
    if long_term_match:
        result["long_term_plan"] = long_term_match.group(1).strip()
    
    return result


def extract_skills_from_text(text: str) -> List[str]:
    """Extract individual skill mentions from text."""
    # Common skill patterns
    skills = []
    
    # Technical skills (often capitalized or in quotes)
    tech_skills = re.findall(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b', text)
    skills.extend(tech_skills)
    
    # Skills in quotes or parentheses
    quoted = re.findall(r'["\']([^"\']+)["\']', text)
    skills.extend(quoted)
    
    # Skills after colons or dashes
    listed = re.findall(r'[-:]\s*([A-Za-z][^,\n]+)', text)
    skills.extend(listed)
    
    # Clean and deduplicate
    cleaned = [s.strip() for s in skills if len(s.strip()) > 2 and len(s.strip()) < 50]
    return list(set(cleaned))
