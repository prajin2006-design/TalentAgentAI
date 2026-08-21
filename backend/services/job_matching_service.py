import json
import logging
from database import execute_query

logger = logging.getLogger(__name__)

def normalize_skill(name: str) -> str:
    """Normalizes skill names to handle common variations (e.g. ReactJS vs React)."""
    if not name:
        return ""
    n = name.lower().strip()
    
    # React variations
    if n in ['react', 'react.js', 'react js', 'reactjs']:
        return 'react'
        
    # JavaScript variations
    if n in ['javascript', 'javascript.js', 'js', 'es6']:
        return 'javascript'
        
    # UI/UX variations
    if n in ['ui/ux', 'ui/ux design', 'ui ux', 'ux/ui', 'ux ui', 'user experience', 'user interface', 'user experience design']:
        return 'ui/ux design'
        
    # Node.js variations
    if n in ['node', 'node.js', 'node js', 'nodejs']:
        return 'node.js'
        
    # Python variations
    if n in ['python', 'py']:
        return 'python'
        
    # AWS variations
    if n in ['aws', 'amazon web services']:
        return 'aws'
        
    # HTML/CSS variations
    if n in ['css', 'css3']:
        return 'css'
    if n in ['html', 'html5']:
        return 'html'

    return n

def calculate_job_matches_for_user(user_id: int):
    """
    Computes real match scores between the candidate's actual profile & skills
    and all active jobs in the database.
    """
    # 1. Fetch user profile, skills, and experience
    profile = execute_query(
        "SELECT * FROM candidate_profiles WHERE user_id = %s",
        (user_id,),
        fetchone=True
    )
    skills_rows = execute_query(
        "SELECT skill_name FROM candidate_skills WHERE user_id = %s",
        (user_id,),
        fetchall=True
    )
    user_skills = {normalize_skill(s['skill_name']) for s in (skills_rows or []) if s.get('skill_name')}
    years_experience = float(profile.get('years_experience') or 0) if profile else 0
    preferred_location = (profile.get('preferred_location') or profile.get('location') or '').lower().strip() if profile else ''
    preferred_work_mode = (profile.get('preferred_work_mode') or 'Hybrid').lower().strip() if profile else 'hybrid'
    target_role = (profile.get('preferred_role') or '').lower().strip() if profile else ''

    # Fetch education details
    education_rows = execute_query(
        "SELECT id FROM candidate_education WHERE user_id = %s",
        (user_id,),
        fetchall=True
    ) or []

    # Clean up stale matches for non-active/paused/archived jobs
    execute_query(
        "DELETE FROM job_matches WHERE job_id IN (SELECT id FROM jobs WHERE (status != 'ACTIVE' AND status IS NOT NULL) OR is_active = %s)",
        (False,),
        commit=True
    )

    # 2. Fetch all active jobs ONLY
    jobs = execute_query(
        "SELECT * FROM jobs WHERE (status = 'ACTIVE' OR status IS NULL) AND is_active = %s",
        (True,),
        fetchall=True
    )

    if not jobs:
        return []

    matches_result = []

    for job in jobs:
        raw_req_skills = job['required_skills']
        if isinstance(raw_req_skills, str):
            try:
                required_skills = json.loads(raw_req_skills)
            except Exception:
                required_skills = [s.strip() for s in raw_req_skills.split(',') if s.strip()]
        else:
            required_skills = raw_req_skills or []

        # Find matching and missing skills
        matching = []
        missing = []

        for req in required_skills:
            req_normalized = normalize_skill(req)
            if req_normalized in user_skills:
                matching.append(req)
            else:
                missing.append(req)

        # ---------------------------------------------------------
        # DETERMINISTIC SCORING SYSTEM (Total: 100%)
        # ---------------------------------------------------------
        # 1. Skill Match (50% max)
        total_req = max(len(required_skills), 1)
        skill_score = (len(matching) / total_req) * 50.0

        # 2. Experience Match (20% max)
        experience_required = str(job.get('experience_required') or '0-2 Years')
        required_years = 0.0
        try:
            # Parse lower bound (e.g. '3-5 Years' -> 3.0)
            required_years = float(experience_required.split('-')[0].strip().split()[0])
        except Exception:
            pass
        
        if years_experience >= required_years:
            experience_score = 20.0
        elif years_experience >= (required_years - 1.0):
            experience_score = 10.0
        else:
            experience_score = 0.0

        # 3. Education Match (10% max)
        education_score = 10.0 if len(education_rows) > 0 else 5.0

        # 4. Work Mode / Location Preference Match (10% max)
        pref_work_score = 0.0
        job_work_mode = str(job.get('work_mode') or 'Hybrid').lower().strip()
        if preferred_work_mode == job_work_mode:
            pref_work_score += 5.0
            
        job_location = str(job.get('location') or '').lower().strip()
        if preferred_location and (preferred_location in job_location or job_location in preferred_location):
            pref_work_score += 5.0
            
        preference_score = min(10.0, pref_work_score)

        # 5. Role/Title Alignment (10% max)
        job_title_lower = job['title'].lower().strip()
        role_score = 0.0
        if target_role:
            if target_role in job_title_lower or job_title_lower in target_role:
                role_score = 10.0
            elif any(part in job_title_lower for part in target_role.split()):
                role_score = 5.0

        match_pct = int(min(100, max(0, round(skill_score + experience_score + education_score + preference_score + role_score))))

        # Formulate tailored recommendation explanation
        if not required_skills:
            why = 'No required skills are recorded for this job, so a reliable skills match cannot be calculated.'
        elif missing:
            why = f"Matches {len(matching)} of {len(required_skills)} required skills; address {len(missing)} recorded gap(s) before applying."
        else:
            why = f"Matches all {len(required_skills)} recorded required skills, with role and profile compatibility included."

        # Save/Update in job_matches table
        existing_match = execute_query(
            "SELECT id FROM job_matches WHERE user_id = %s AND job_id = %s",
            (user_id, job['id']),
            fetchone=True
        )

        matching_json = json.dumps(matching)
        missing_json = json.dumps(missing)

        if existing_match:
            execute_query(
                """
                UPDATE job_matches
                SET match_percentage = %s, matching_skills = %s, missing_skills = %s, why_recommended = %s, calculated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """,
                (match_pct, matching_json, missing_json, why, existing_match['id']),
                commit=True
            )
        else:
            execute_query(
                """
                INSERT INTO job_matches (user_id, job_id, match_percentage, matching_skills, missing_skills, why_recommended)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (user_id, job['id'], match_pct, matching_json, missing_json, why),
                commit=True
            )

        matches_result.append({
            'job_id': job['id'],
            'title': job['title'],
            'company': job['company'],
            'department': job.get('department', 'Engineering'),
            'location': job['location'],
            'work_mode': job['work_mode'],
            'salary': job.get('salary', 'Competitive'),
            'description': job['description'],
            'match_percentage': match_pct,
            'matching_skills': matching,
            'missing_skills': missing,
            'why_recommended': why
        })

    # Sort matches by percentage descending
    matches_result.sort(key=lambda m: m['match_percentage'], reverse=True)

    # 3. Generate Prioritized Skill Gaps
    generate_skill_gaps_for_user(user_id, matches_result)

    return matches_result

def generate_skill_gaps_for_user(user_id: int, matches: list):
    """
    Computes prioritized skill gaps based on recurring missing skills in high-match jobs.
    """
    # Count frequency of missing skills across actual job matches.
    missing_freq = {}
    for m in matches[:4]: # top 4 matches
        for skill in m['missing_skills']:
            missing_freq[skill] = missing_freq.get(skill, 0) + 1

    # Clear old gaps
    execute_query("DELETE FROM skill_gaps WHERE user_id = %s", (user_id,), commit=True)

    # Insert only missing skills that occur in real active job requirements.
    for index, (skill_name, frequency) in enumerate(sorted(missing_freq.items(), key=lambda item: item[1], reverse=True)):
        priority = 'HIGH PRIORITY' if index < 2 else ('MEDIUM' if index < 5 else 'LOW')
        impact = frequency
        desc = f'Recorded as a missing requirement in {frequency} active job match(es).'
        why = 'This requirement recurs in the candidate\'s current target job set.'
        path = [f'Learn the fundamentals of {skill_name}', f'Build and document a project using {skill_name}', f'Update the profile and reassess job matches']
        hours = 10
        execute_query(
            """
            INSERT INTO skill_gaps (user_id, skill_name, priority, impact_pct, status, description, why_needed, learning_path, estimated_hours)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (user_id, skill_name, priority, impact, 'Not Started', desc, why, json.dumps(path), hours),
            commit=True
        )
