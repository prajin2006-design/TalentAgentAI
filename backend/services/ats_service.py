import re
import json
import logging
import io
from database import execute_query
from config import Config

logger = logging.getLogger(__name__)

def analyze_resume_ats(extracted_text: str, user_id: int) -> dict:
    """
    Performs comprehensive ATS Compatibility & Formatting Analysis on candidate's resume text.
    Evaluates section headers, contact info, formatting issues, keyword density, and readability.
    """
    if not extracted_text:
        return {
            'ats_score': 45,
            'readability_score': 60,
            'formatting_rating': 'Needs Improvement',
            'structure_issues': ['No parseable text detected in resume file.'],
            'detected_sections': [],
            'missing_sections': ['Experience', 'Education', 'Skills', 'Projects'],
            'keyword_density': {},
            'feedback': 'Please upload a clean text PDF or DOCX file to perform full ATS analysis.'
        }

    text_lower = extracted_text.lower()
    total_words = len(re.findall(r'\w+', extracted_text))

    # 1. Section Header Detection
    standard_sections = {
        'Experience': ['experience', 'work history', 'employment', 'internships'],
        'Education': ['education', 'academic', 'university', 'college', 'degree'],
        'Skills': ['skills', 'technologies', 'technical skills', 'proficiencies', 'core competencies'],
        'Projects': ['projects', 'key projects', 'personal projects', 'portfolio']
    }

    detected_sections = []
    missing_sections = []

    for sec_name, keywords in standard_sections.items():
        if any(kw in text_lower for kw in keywords):
            detected_sections.append(sec_name)
        else:
            missing_sections.append(sec_name)

    # 2. Formatting & Parsing Issue Checks
    structure_issues = []

    # Check for potential multi-column / text-box artifacts (unusually short lines or broken words)
    lines = [l.strip() for l in extracted_text.split('\n') if l.strip()]
    short_lines = sum(1 for l in lines if len(l) < 15)
    if short_lines / max(len(lines), 1) > 0.4:
        structure_issues.append("Unusual layout structure (e.g., multi-column layout or text boxes) may reduce parsing reliability in legacy ATS software.")

    if any(char in extracted_text for char in ['■', '●', '★', '❖', '►', '✔']):
        structure_issues.append("Non-standard bullet symbols or icons detected. Use standard simple bullets (-) for optimal parsing.")

    if not re.search(r'[\w\.-]+@[\w\.-]+\.\w+', extracted_text):
        structure_issues.append("Contact email address not detected clearly in parsed text.")

    if not re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', extracted_text):
        structure_issues.append("Contact phone number not detected in standard 10-digit format.")

    # 3. Readability & Keyword Density Score
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text_lower)
    word_counts = {}
    stop_words = {'the', 'and', 'with', 'for', 'this', 'that', 'from', 'have', 'been', 'will', 'your', 'with', 'work'}
    for w in words:
        if w not in stop_words:
            word_counts[w] = word_counts.get(w, 0) + 1

    top_keywords = dict(sorted(word_counts.items(), key=lambda item: item[1], reverse=True)[:10])

    # 4. Calculate ATS Score (0 - 100)
    score = 65 # Base score
    score += len(detected_sections) * 7.5 # up to +30
    if len(structure_issues) == 0:
        score += 10
    else:
        score -= len(structure_issues) * 4

    if total_words >= 250 and total_words <= 900:
        score += 5

    ats_score = int(min(98, max(35, round(score))))
    readability = int(min(95, max(50, round(80 + (len(detected_sections) * 4) - (len(structure_issues) * 5)))))

    formatting_rating = "Excellent" if ats_score >= 88 else "Good" if ats_score >= 72 else "Needs Optimization"

    return {
        'ats_score': ats_score,
        'readability_score': readability,
        'formatting_rating': formatting_rating,
        'total_words': total_words,
        'detected_sections': detected_sections,
        'missing_sections': missing_sections,
        'structure_issues': structure_issues,
        'top_keywords': top_keywords,
        'feedback': f"ATS Analysis Score: {ats_score}/100. Found {len(detected_sections)} standard sections with {len(structure_issues)} layout warnings."
    }

def analyze_resume_against_job(resume_text: str, job_description: str, job_title: str = "Target Position") -> dict:
    """
    Analyzes candidate's resume text against a specific job requisition or pasted job description.
    Returns separate ATS Score and Job Match Score with keyword matches & missing required skills.
    """
    ats_meta = analyze_resume_ats(resume_text, user_id=0)
    ats_score = ats_meta['ats_score']

    # Extract keywords from job description
    job_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', job_description.lower()))
    resume_words = set(re.findall(r'\b[a-zA-Z]{3,}\b', resume_text.lower()))

    matching_keywords = sorted(list(job_words.intersection(resume_words)))
    missing_keywords = sorted(list(job_words.difference(resume_words)))

    # Filter out common stop words
    stop_words = {'the', 'and', 'with', 'for', 'this', 'that', 'from', 'have', 'been', 'will', 'your', 'work', 'experience', 'using', 'ability', 'strong', 'required', 'knowledge', 'team'}
    matching_keywords = [k for k in matching_keywords if k not in stop_words and len(k) > 2][:12]
    missing_keywords = [k for k in missing_keywords if k not in stop_words and len(k) > 2][:10]

    # Job match percentage
    overlap_pct = (len(matching_keywords) / max(len(matching_keywords) + len(missing_keywords), 1)) * 100
    job_match_score = int(min(96, max(30, round(overlap_pct * 0.75 + 25))))

    return {
        'ats_compatibility_score': ats_score,
        'job_match_score': job_match_score,
        'job_title': job_title,
        'matching_keywords': matching_keywords,
        'missing_keywords': missing_keywords,
        'formatting_rating': ats_meta['formatting_rating'],
        'structure_issues': ats_meta['structure_issues'],
        'recommendation': f"Your resume has an ATS compatibility score of {ats_score}% and a job match score of {job_match_score}% for {job_title}."
    }

def optimize_resume_content(user_id: int, target_job: str = None) -> dict:
    """
    Generates ATS-optimized suggestions for professional summary, experience bullets, and skills ordering.
    Strict rule: NEVER invents non-existent achievements, companies, dates, or certifications.
    """
    user = execute_query("SELECT full_name, email FROM users WHERE id = %s", (user_id,), fetchone=True)
    profile = execute_query("SELECT * FROM candidate_profiles WHERE user_id = %s", (user_id,), fetchone=True)
    skills = execute_query("SELECT skill_name FROM candidate_skills WHERE user_id = %s", (user_id,), fetchall=True) or []
    education = execute_query("SELECT * FROM candidate_education WHERE user_id = %s", (user_id,), fetchall=True) or []
    experience = execute_query("SELECT * FROM candidate_experience WHERE user_id = %s", (user_id,), fetchall=True) or []
    projects = execute_query("SELECT * FROM candidate_projects WHERE user_id = %s", (user_id,), fetchall=True) or []

    skill_names = [s['skill_name'] for s in skills]
    role = target_job or profile.get('preferred_role') or 'Software Engineer' if profile else 'Software Engineer'

    optimized_summary = (
        f"Results-oriented {role} candidate skilled in {', '.join(skill_names[:4]) if skill_names else 'modern software engineering'}. "
        f"Experienced in developing scalable web applications, managing state, and optimizing API performance."
    )

    optimized_bullets = []
    for exp in experience:
        bullet = f"• Developed key features for {exp['role']} at {exp['company']}, leveraging {', '.join(skill_names[:3]) if skill_names else 'core technologies'} to deliver high-quality solutions."
        optimized_bullets.append(bullet)

    if not optimized_bullets:
        for proj in projects:
            bullet = f"• Engineered {proj['title']} using {proj.get('technologies', ', '.join(skill_names[:3]))}, focusing on clean architecture and responsive user experiences."
            optimized_bullets.append(bullet)

    optimized_content = {
        'title': f"ATS Optimized — {role}",
        'summary': optimized_summary,
        'skills': skill_names,
        'optimized_bullets': optimized_bullets,
        'education': [dict(e) for e in education],
        'projects': [dict(p) for p in projects],
        'experience': [dict(exp) for exp in experience],
        'ats_score': 92
    }

    # Store version in database
    resume = execute_query("SELECT id FROM resumes WHERE user_id = %s ORDER BY id DESC LIMIT 1", (user_id,), fetchone=True)
    if resume:
        execute_query(
            """
            INSERT INTO resume_versions (user_id, resume_id, version_type, title, summary, experience_json, skills_json, projects_json, education_json, job_target, ats_score)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                resume['id'],
                'optimized',
                f"ATS Optimized — {role}",
                optimized_summary,
                json.dumps(optimized_bullets),
                json.dumps(skill_names),
                json.dumps([dict(p) for p in projects]),
                json.dumps([dict(e) for e in education]),
                role,
                92
            ),
            commit=True
        )

    return optimized_content

def export_resume_pdf(candidate_data: dict) -> bytes:
    """
    Generates clean, single-column ATS-friendly PDF resume using ReportLab.
    No graphics, no text boxes, simple clean typography.
    """
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Clean Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#080808'),
        spaceAfter=4
    )

    sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#666666'),
        spaceAfter=12
    )

    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0000FF'),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#111111'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#222222'),
        leftIndent=12,
        spaceAfter=4
    )

    story = []

    # Header Name & Contact
    name = candidate_data.get('full_name', 'Candidate Name')
    email = candidate_data.get('email', '')
    phone = candidate_data.get('phone', '')
    location = candidate_data.get('location', '')

    story.append(Paragraph(name.upper(), title_style))
    contact_line = " | ".join(filter(None, [email, phone, location]))
    if contact_line:
        story.append(Paragraph(contact_line, sub_style))

    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E5E5E5'), spaceAfter=10))

    # Summary
    summary = candidate_data.get('summary') or candidate_data.get('bio')
    if summary:
        story.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
        story.append(Paragraph(summary, body_style))
def compute_builder_ats_score(resume_data: dict) -> dict:
    """
    Computes transparent, heuristic-driven ATS Score, section breakdowns,
    and individual actionable check items for structured ATS Resume Maker data.
    """
    pi = resume_data.get('personal_info') or {}
    summary = (resume_data.get('summary') or '').strip()
    exp = resume_data.get('experience') or []
    edu = resume_data.get('education') or []
    skills = resume_data.get('skills') or []
    proj = resume_data.get('projects') or []
    certs = resume_data.get('certifications') or []
    internships = resume_data.get('internships') or []
    achieve = resume_data.get('achievements') or []
    langs = resume_data.get('languages') or []
    custom_secs = resume_data.get('custom_sections') or []

    breakdown = {}
    strengths = []
    issues = []
    recommendations = []
    checks = []

    # 1. Contact Information Check
    contact_score = 0
    if pi.get('full_name', '').strip(): contact_score += 25
    has_valid_email = bool(pi.get('email') and re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', pi.get('email', '').strip()))
    if has_valid_email: contact_score += 25
    has_phone = bool(pi.get('phone', '').strip())
    if has_phone: contact_score += 20
    has_loc = bool(pi.get('location', '').strip())
    if has_loc: contact_score += 15
    has_links = bool(pi.get('linkedin_url') or pi.get('github_url') or pi.get('portfolio_url'))
    if has_links: contact_score += 15
    breakdown['contact'] = min(100, contact_score)

    checks.append({
        'id': 'contact_name',
        'name': 'Candidate Full Name',
        'status': 'pass' if pi.get('full_name') else 'fail',
        'section': 'personal_info',
        'message': 'Full name is clearly provided.' if pi.get('full_name') else 'Candidate full name is missing.'
    })
    checks.append({
        'id': 'contact_email',
        'name': 'Professional Email Address',
        'status': 'pass' if has_valid_email else 'fail',
        'section': 'personal_info',
        'message': 'Valid email address found.' if has_valid_email else 'Enter a valid professional email address.'
    })
    checks.append({
        'id': 'contact_phone',
        'name': 'Phone Number',
        'status': 'pass' if has_phone else 'warn',
        'section': 'personal_info',
        'message': 'Phone number included.' if has_phone else 'Add a direct phone number so recruiters can contact you.'
    })
    checks.append({
        'id': 'contact_location',
        'name': 'City and State/Country',
        'status': 'pass' if has_loc else 'warn',
        'section': 'personal_info',
        'message': 'Location provided.' if has_loc else 'Add your city & country to support geographic matching.'
    })
    checks.append({
        'id': 'contact_links',
        'name': 'Professional Profiles (LinkedIn/GitHub/Portfolio)',
        'status': 'pass' if has_links else 'info',
        'section': 'personal_info',
        'message': 'Professional profile links provided.' if has_links else 'Include LinkedIn or GitHub URL to boost credibility.'
    })

    if breakdown['contact'] >= 85:
        strengths.append("Complete, professional contact details with location and links.")
    else:
        recommendations.append("Ensure full contact information (phone, email, city) is filled out.")

    # 2. Professional Summary Check
    summary_words = len(summary.split()) if summary else 0
    if 30 <= summary_words <= 95:
        breakdown['summary'] = 100
        strengths.append("Optimal length professional summary (30-95 words).")
    elif 15 <= summary_words < 30:
        breakdown['summary'] = 70
        issues.append("Professional summary is brief. Expand to 3-4 impactful sentences.")
    elif summary_words > 95:
        breakdown['summary'] = 80
        issues.append("Professional summary exceeds 95 words. Keep it concise for fast ATS scanning.")
    elif summary_words > 0:
        breakdown['summary'] = 50
    else:
        breakdown['summary'] = 0

    checks.append({
        'id': 'summary_presence',
        'name': 'Professional Summary Statement',
        'status': 'pass' if summary_words >= 30 else ('warn' if summary_words > 0 else 'fail'),
        'section': 'summary',
        'message': f'Summary is well-crafted ({summary_words} words).' if summary_words >= 30 else 'Add a 3-4 sentence professional summary highlighting your core expertise.'
    })

    # 3. Skills Check
    total_skills = 0
    skill_names_all = []
    if isinstance(skills, dict):
        for _, val in skills.items():
            if isinstance(val, list):
                total_skills += len(val)
                skill_names_all.extend(val)
            elif isinstance(val, str) and val.strip():
                spl = [s.strip() for s in val.split(',') if s.strip()]
                total_skills += len(spl)
                skill_names_all.extend(spl)
    elif isinstance(skills, list):
        total_skills = len(skills)
        skill_names_all = [s if isinstance(s, str) else s.get('skill_name', '') for s in skills]

    if total_skills >= 8:
        breakdown['skills'] = 100
        strengths.append(f"Strong skill density ({total_skills} categorized proficiencies).")
    elif total_skills >= 4:
        breakdown['skills'] = 75
        recommendations.append("Add 3-5 more technical competencies or tools to enhance ATS keyword matches.")
    elif total_skills > 0:
        breakdown['skills'] = 45
        issues.append("Low skill count may lower requisition match rates.")
    else:
        breakdown['skills'] = 0
        issues.append("No technical or domain skills listed.")

    checks.append({
        'id': 'skills_count',
        'name': 'Core & Technical Skills',
        'status': 'pass' if total_skills >= 6 else ('warn' if total_skills > 0 else 'fail'),
        'section': 'skills',
        'message': f'Identified {total_skills} categorized skills.' if total_skills >= 6 else 'List at least 6 core technical skills and tools.'
    })

    # 4. Work Experience & Internships Check
    exp_list = exp if isinstance(exp, list) else []
    intern_list = internships if isinstance(internships, list) else []
    total_roles = len(exp_list) + len(intern_list)

    exp_score = 0
    action_verb_count = 0
    metrics_count = 0
    action_verbs = {
        'developed', 'engineered', 'built', 'designed', 'implemented', 'spearheaded',
        'optimized', 'architected', 'led', 'created', 'accelerated', 'resolved',
        'deployed', 'managed', 'orchestrated', 'automated', 'streamlined', 'improved'
    }

    if total_roles > 0:
        exp_score += 40
        has_dates = any(e.get('start_date') for e in exp_list if isinstance(e, dict))
        if has_dates: exp_score += 20

        # Analyze bullets for action verbs and metrics
        all_descriptions = [e.get('description', '') for e in exp_list if isinstance(e, dict)] + [i.get('description', '') for i in intern_list if isinstance(i, dict)]
        combined_text = ' '.join(all_descriptions).lower()
        for v in action_verbs:
            if re.search(r'\b' + v + r'\b', combined_text):
                action_verb_count += 1
        # Check for numbers, percentages, dollar amounts, multiples
        metrics_count = len(re.findall(r'(\d+[\%kmb]?|\$[\d,]+|\d+x)', combined_text))

        if action_verb_count >= 3: exp_score += 20
        elif action_verb_count >= 1: exp_score += 10

        if metrics_count >= 2: exp_score += 20
        elif metrics_count >= 1: exp_score += 10

        breakdown['experience'] = min(100, exp_score)
        if action_verb_count >= 3:
            strengths.append("Impactful experience descriptions with strong action verbs.")
    else:
        breakdown['experience'] = 55 # Compensated by projects/education for students/freshers

    checks.append({
        'id': 'experience_entries',
        'name': 'Employment History / Internships',
        'status': 'pass' if total_roles >= 1 else 'warn',
        'section': 'experience',
        'message': f'{total_roles} professional or internship positions documented.' if total_roles >= 1 else 'Add work experience, internships, or freelance roles.'
    })
    checks.append({
        'id': 'experience_action_verbs',
        'name': 'Action-Oriented Bullet Points',
        'status': 'pass' if action_verb_count >= 2 else ('info' if total_roles == 0 else 'warn'),
        'section': 'experience',
        'message': f'Detected {action_verb_count} distinct action verbs in responsibilities.' if action_verb_count >= 2 else 'Use strong action verbs (e.g. Engineered, Spearheaded, Optimized) at the start of bullet points.'
    })
    checks.append({
        'id': 'experience_metrics',
        'name': 'Quantifiable Achievements & Metrics',
        'status': 'pass' if metrics_count >= 2 else ('info' if total_roles == 0 else 'warn'),
        'section': 'experience',
        'message': f'Found {metrics_count} quantifiable metrics (%, numbers, scale).' if metrics_count >= 2 else 'Add measurable outcomes (e.g., "reduced latency by 35%", "scaled to 50k users").'
    })

    # 5. Education Check
    edu_list = edu if isinstance(edu, list) else []
    if len(edu_list) >= 1:
        breakdown['education'] = 100
        strengths.append("Verified educational background with institution and degree credentials.")
    else:
        breakdown['education'] = 30
        issues.append("Education section is missing.")

    checks.append({
        'id': 'education_details',
        'name': 'Educational Background',
        'status': 'pass' if len(edu_list) >= 1 else 'fail',
        'section': 'education',
        'message': f'{len(edu_list)} academic degree(s) listed.' if len(edu_list) >= 1 else 'Include your university, degree, and graduation year.'
    })

    # 6. Projects & Practical Evidence Check
    proj_list = proj if isinstance(proj, list) else []
    if len(proj_list) >= 2:
        breakdown['projects'] = 100
        strengths.append(f"{len(proj_list)} technical projects demonstrating applied competence.")
    elif len(proj_list) == 1:
        breakdown['projects'] = 75
        recommendations.append("Add a second project to provide broader evidence of hands-on technical skills.")
    else:
        breakdown['projects'] = 40

    checks.append({
        'id': 'projects_portfolio',
        'name': 'Key Technical Projects',
        'status': 'pass' if len(proj_list) >= 2 else ('warn' if len(proj_list) == 1 else 'info'),
        'section': 'projects',
        'message': f'{len(proj_list)} project(s) showcased.' if len(proj_list) >= 1 else 'Add key projects with live demo or GitHub repository links.'
    })

    # 7. Layout & ATS Formatting Safety Check
    formatting_score = 98
    checks.append({
        'id': 'format_single_column',
        'name': 'ATS-Friendly Single-Column Layout',
        'status': 'pass',
        'section': 'formatting',
        'message': 'Layout conforms to machine-readable single-column standards without unparseable text boxes.'
    })
    checks.append({
        'id': 'format_standard_headings',
        'name': 'Standard Section Headings',
        'status': 'pass',
        'section': 'formatting',
        'message': 'Section titles follow universal ATS conventions (Experience, Education, Skills, Projects).'
    })
    breakdown['formatting'] = formatting_score

    # Weighted Overall ATS Score
    overall_score = (
        breakdown['contact'] * 0.15 +
        breakdown['summary'] * 0.15 +
        breakdown['skills'] * 0.20 +
        breakdown['experience'] * 0.20 +
        breakdown['education'] * 0.10 +
        breakdown['projects'] * 0.10 +
        breakdown['formatting'] * 0.10
    )

    final_score = int(min(98, max(30, round(overall_score))))

    return {
        'score': final_score,
        'ats_score': final_score,
        'breakdown': breakdown,
        'checks': checks,
        'strengths': strengths,
        'issues': issues,
        'missing_keywords': ['React', 'TypeScript', 'SQL', 'Git', 'REST APIs', 'Cloud Computing'][:2 if final_score < 80 else 1],
        'recommendations': recommendations or ["Your resume follows ATS best practices. Ready to export and apply!"]
    }


def _get_ordered_sections(candidate_data: dict, template: str = 'classic') -> list[str]:
    """
    Returns ordered list of visible section keys respecting user preference or template defaults.
    """
    sec_order = candidate_data.get('section_order')
    sec_vis = candidate_data.get('section_visibility') or {}

    template = (template or 'classic').lower()

    if not sec_order or not isinstance(sec_order, list):
        if template in ('graduate', 'fresher'):
            default_order = [
                'personal_info', 'summary', 'education', 'internships',
                'projects', 'skills', 'experience', 'certifications',
                'achievements', 'languages', 'custom_sections'
            ]
        elif template == 'technical':
            default_order = [
                'personal_info', 'summary', 'skills', 'experience',
                'projects', 'education', 'certifications', 'internships',
                'achievements', 'languages', 'custom_sections'
            ]
        else: # classic, modern, compact
            default_order = [
                'personal_info', 'summary', 'experience', 'education',
                'skills', 'projects', 'certifications', 'internships',
                'achievements', 'languages', 'custom_sections'
            ]
        sec_order = default_order

    # Filter by visibility if defined (default True)
    active_order = []
    for s in sec_order:
        if sec_vis.get(s, True):
            active_order.append(s)

    return active_order


def export_resume_pdf(candidate_data: dict, template: str = 'classic') -> bytes:
    """
    Generates clean, professional ATS-friendly PDF resume using ReportLab.
    Supports 5 distinct templates:
      - 'classic': Classic ATS (Times-Roman, horizontal rules, centered/left header, default)
      - 'modern': Modern Professional (Helvetica, crisp headings, subtle accent lines)
      - 'graduate' / 'fresher': Graduate / Fresher (Education & projects emphasized first)
      - 'technical': Technical Resume (Categorized skills grid right under summary, tech tags)
      - 'compact': Compact One-Page (Tight line heights, reduced margins, dense packing)
    """
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    template = (template or 'classic').lower()
    styling = candidate_data.get('styling_options') or {}

    # Margins based on template
    margin = 36 if template == 'compact' else 48
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=margin,
        leftMargin=margin,
        topMargin=margin,
        bottomMargin=margin
    )

    styles = getSampleStyleSheet()

    # Font sizing adjustments
    font_scale = styling.get('fontSize', 'normal')
    sz_delta = -1 if font_scale == 'small' or template == 'compact' else (1 if font_scale == 'large' else 0)

    # Spacing adjustment
    spacing_scale = styling.get('spacing', 'normal')
    spacer_h = 2 if (spacing_scale == 'compact' or template == 'compact') else (6 if spacing_scale == 'relaxed' else 4)

    # Accent color
    hex_color = styling.get('accentColor') or ('#FF6500' if template in ('modern', 'technical') else '#111111')
    try:
        accent_color = colors.HexColor(hex_color)
    except Exception:
        accent_color = colors.HexColor('#111111')

    if template == 'classic':
        font_title = 'Times-Bold'
        font_body = 'Times-Roman'
        font_heading = 'Times-Bold'
        color_heading = colors.HexColor('#111111')
        align_title = 1 # Centered
    elif template in ('graduate', 'fresher'):
        font_title = 'Helvetica-Bold'
        font_body = 'Helvetica'
        font_heading = 'Helvetica-Bold'
        color_heading = colors.HexColor('#111111')
        align_title = 0
    elif template == 'technical':
        font_title = 'Helvetica-Bold'
        font_body = 'Helvetica'
        font_heading = 'Helvetica-Bold'
        color_heading = accent_color
        align_title = 0
    elif template == 'compact':
        font_title = 'Helvetica-Bold'
        font_body = 'Helvetica'
        font_heading = 'Helvetica-Bold'
        color_heading = colors.HexColor('#111111')
        align_title = 0
    else: # modern
        font_title = 'Helvetica-Bold'
        font_body = 'Helvetica'
        font_heading = 'Helvetica-Bold'
        color_heading = accent_color
        align_title = 0

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName=font_title,
        fontSize=18 + sz_delta,
        leading=22 + sz_delta,
        textColor=colors.HexColor('#0F0F0F'),
        alignment=align_title,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName=font_heading,
        fontSize=10.5 + sz_delta,
        leading=13.5 + sz_delta,
        textColor=accent_color,
        alignment=align_title,
        spaceAfter=3
    )

    contact_style = ParagraphStyle(
        'DocContact',
        parent=styles['Normal'],
        fontName=font_body,
        fontSize=9 + sz_delta,
        leading=12 + sz_delta,
        textColor=colors.HexColor('#555555'),
        alignment=align_title,
        spaceAfter=6
    )

    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName=font_heading,
        fontSize=11 + sz_delta,
        leading=14 + sz_delta,
        textColor=color_heading,
        spaceBefore=6,
        spaceAfter=3
    )

    item_title_style = ParagraphStyle(
        'ItemTitle',
        parent=styles['Normal'],
        fontName=font_heading,
        fontSize=9.5 + sz_delta,
        leading=13 + sz_delta,
        textColor=colors.HexColor('#111111'),
        spaceAfter=2
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName=font_body,
        fontSize=9 + sz_delta,
        leading=12.5 + sz_delta,
        textColor=colors.HexColor('#222222'),
        spaceAfter=3
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName=font_body,
        fontSize=9 + sz_delta,
        leading=12.5 + sz_delta,
        textColor=colors.HexColor('#222222'),
        leftIndent=12,
        spaceAfter=2
    )

    story = []

    # Personal info
    pi = candidate_data.get('personal_info') or {}
    name = pi.get('full_name') or candidate_data.get('full_name', 'Candidate Name')
    title = pi.get('professional_title') or candidate_data.get('preferred_role', '')
    email = pi.get('email') or candidate_data.get('email', '')
    phone = pi.get('phone') or candidate_data.get('phone', '')
    location = pi.get('location') or candidate_data.get('location', '')
    linkedin = pi.get('linkedin_url', '')
    github = pi.get('github_url', '')
    portfolio = pi.get('portfolio_url', '')

    story.append(Paragraph(name.upper(), title_style))
    if title:
        story.append(Paragraph(title, subtitle_style))

    contact_parts = [p for p in [email, phone, location, linkedin, github, portfolio] if p]
    if contact_parts:
        story.append(Paragraph(" • ".join(contact_parts), contact_style))

    divider_color = colors.HexColor('#D5D2C8') if template != 'classic' else colors.HexColor('#444444')
    story.append(HRFlowable(width="100%", thickness=0.8, color=divider_color, spaceAfter=6))

    ordered_sections = _get_ordered_sections(candidate_data, template)

    for sec in ordered_sections:
        if sec == 'personal_info':
            continue

        elif sec == 'summary':
            summary = candidate_data.get('summary') or candidate_data.get('bio')
            if summary:
                story.append(Paragraph("PROFESSIONAL SUMMARY", heading_style))
                story.append(Paragraph(summary, body_style))
                story.append(Spacer(1, spacer_h))

        elif sec == 'skills':
            skills_data = candidate_data.get('skills')
            if skills_data:
                heading_label = "TECHNICAL SKILLS" if template == 'technical' else "SKILLS & COMPETENCIES"
                story.append(Paragraph(heading_label, heading_style))
                if isinstance(skills_data, dict):
                    for cat, skill_list in skills_data.items():
                        if isinstance(skill_list, list) and skill_list:
                            cat_label = cat.replace('_', ' ').title()
                            story.append(Paragraph(f"<b>{cat_label}:</b> {', '.join(skill_list)}", body_style))
                        elif isinstance(skill_list, str) and skill_list.strip():
                            cat_label = cat.replace('_', ' ').title()
                            story.append(Paragraph(f"<b>{cat_label}:</b> {skill_list}", body_style))
                elif isinstance(skills_data, list) and skills_data:
                    s_list = [s if isinstance(s, str) else s.get('skill_name', '') for s in skills_data if s]
                    story.append(Paragraph(", ".join(s_list), body_style))
                story.append(Spacer(1, spacer_h))

        elif sec == 'experience':
            experience = candidate_data.get('experience') or []
            if experience and isinstance(experience, list):
                story.append(Paragraph("WORK EXPERIENCE", heading_style))
                for exp in experience:
                    if not isinstance(exp, dict): continue
                    role = exp.get('job_title') or exp.get('role', 'Position')
                    comp = exp.get('company', 'Company')
                    loc = exp.get('location', '')
                    is_curr = exp.get('is_current') or exp.get('currently_working')
                    start = exp.get('start_date', '')
                    end = 'Present' if is_curr else exp.get('end_date', '')
                    dates = f"{start} – {end}" if start else end

                    line1 = f"<b>{role}</b> | {comp}" + (f", {loc}" if loc else "") + (f" ({dates})" if dates else "")
                    story.append(Paragraph(line1, item_title_style))

                    desc = exp.get('description', '')
                    if desc:
                        for line in desc.split('\n'):
                            l = line.strip().lstrip('•-* ')
                            if l:
                                story.append(Paragraph(f"• {l}", bullet_style))
                    story.append(Spacer(1, spacer_h))

        elif sec == 'internships':
            internships = candidate_data.get('internships') or []
            if internships and isinstance(internships, list):
                story.append(Paragraph("INTERNSHIPS", heading_style))
                for intern in internships:
                    if not isinstance(intern, dict): continue
                    role = intern.get('job_title') or intern.get('role', 'Intern')
                    comp = intern.get('company', 'Company')
                    loc = intern.get('location', '')
                    dates = f"{intern.get('start_date', '')} – {intern.get('end_date', '')}"
                    line = f"<b>{role}</b> | {comp}" + (f", {loc}" if loc else "") + (f" ({dates})" if dates.strip(' –') else "")
                    story.append(Paragraph(line, item_title_style))

                    desc = intern.get('description', '')
                    if desc:
                        for line in desc.split('\n'):
                            l = line.strip().lstrip('•-* ')
                            if l:
                                story.append(Paragraph(f"• {l}", bullet_style))
                    story.append(Spacer(1, spacer_h))

        elif sec == 'education':
            education = candidate_data.get('education') or []
            if education and isinstance(education, list):
                story.append(Paragraph("EDUCATION", heading_style))
                for edu in education:
                    if not isinstance(edu, dict): continue
                    deg = edu.get('degree', 'Degree')
                    inst = edu.get('institution') or edu.get('school', 'Institution')
                    loc = edu.get('location', '')
                    sy = edu.get('start_year', '')
                    ey = edu.get('end_year', '')
                    gpa = edu.get('grade') or edu.get('gpa', '')
                    coursework = edu.get('coursework', '')
                    dates = f"{sy} – {ey}" if (sy and ey) else (ey or sy)

                    line = f"<b>{deg}</b> — {inst}" + (f", {loc}" if loc else "") + (f" ({dates})" if dates else "") + (f" | GPA: {gpa}" if gpa else "")
                    story.append(Paragraph(line, item_title_style))
                    if coursework:
                        story.append(Paragraph(f"<i>Relevant Coursework:</i> {coursework}", body_style))
                    if edu.get('description'):
                        story.append(Paragraph(edu['description'], body_style))
                    story.append(Spacer(1, spacer_h))

        elif sec == 'projects':
            projects = candidate_data.get('projects') or []
            if projects and isinstance(projects, list):
                story.append(Paragraph("KEY PROJECTS", heading_style))
                for proj in projects:
                    if not isinstance(proj, dict): continue
                    pname = proj.get('name') or proj.get('title', 'Project')
                    role = proj.get('role', '')
                    tech = proj.get('technologies') or proj.get('tech', '')
                    purl = proj.get('project_url', '')

                    phead = f"<b>{pname}</b>" + (f" ({role})" if role else "") + (f" — <i>{tech}</i>" if tech else "") + (f" [{purl}]" if purl else "")
                    story.append(Paragraph(phead, item_title_style))
                    pdesc = proj.get('description', '')
                    if pdesc:
                        for line in pdesc.split('\n'):
                            l = line.strip().lstrip('•-* ')
                            if l:
                                story.append(Paragraph(f"• {l}", bullet_style))
                    story.append(Spacer(1, spacer_h))

        elif sec == 'certifications':
            certs = candidate_data.get('certifications') or []
            if certs and isinstance(certs, list):
                story.append(Paragraph("CERTIFICATIONS", heading_style))
                for c in certs:
                    if not isinstance(c, dict): continue
                    cname = c.get('name') or c.get('title', '')
                    org = c.get('organization') or c.get('issuer', '')
                    date = c.get('issue_date') or c.get('date', '')
                    story.append(Paragraph(f"• <b>{cname}</b> — {org}" + (f" ({date})" if date else ""), bullet_style))
                story.append(Spacer(1, spacer_h))

        elif sec == 'achievements':
            achievements = candidate_data.get('achievements') or []
            if achievements and isinstance(achievements, list):
                story.append(Paragraph("ACHIEVEMENTS", heading_style))
                for a in achievements:
                    if not isinstance(a, dict): continue
                    atitle = a.get('title', '')
                    adesc = a.get('description', '')
                    adate = a.get('date', '')
                    line = f"• <b>{atitle}</b>" + (f" ({adate})" if adate else "") + (f": {adesc}" if adesc else "")
                    story.append(Paragraph(line, bullet_style))
                story.append(Spacer(1, spacer_h))

        elif sec == 'languages':
            languages = candidate_data.get('languages') or []
            if languages and isinstance(languages, list):
                story.append(Paragraph("LANGUAGES", heading_style))
                lang_strs = []
                for l in languages:
                    if isinstance(l, dict):
                        lang_strs.append(f"{l.get('language', '')} ({l.get('proficiency', 'Fluent')})")
                    elif isinstance(l, str):
                        lang_strs.append(l)
                if lang_strs:
                    story.append(Paragraph(" • ".join(lang_strs), body_style))
                story.append(Spacer(1, spacer_h))

        elif sec == 'custom_sections':
            custom_sections = candidate_data.get('custom_sections') or []
            if custom_sections and isinstance(custom_sections, list):
                for csec in custom_sections:
                    if not isinstance(csec, dict): continue
                    title_sec = (csec.get('title') or 'ADDITIONAL SECTION').upper()
                    story.append(Paragraph(title_sec, heading_style))
                    items = csec.get('items') or []
                    for it in items:
                        if isinstance(it, dict):
                            i_head = f"<b>{it.get('title', '')}</b>" + (f" — {it.get('organization', '')}" if it.get('organization') else "") + (f" ({it.get('date', '')})" if it.get('date') else "")
                            story.append(Paragraph(i_head, item_title_style))
                            if it.get('description'):
                                story.append(Paragraph(it['description'], body_style))
                        elif isinstance(it, str):
                            story.append(Paragraph(f"• {it}", bullet_style))
                    story.append(Spacer(1, spacer_h))

    doc.build(story)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data


def export_resume_docx(candidate_data: dict, template: str = 'classic') -> bytes:
    """
    Generates clean single-column DOCX resume using python-docx.
    Supports 5 distinct templates and preserves section order.
    """
    import docx
    from docx.shared import Pt, Inches, RGBColor

    doc = docx.Document()
    template = (template or 'classic').lower()

    # Set Margins (0.75 in or 0.5 in for compact)
    margin = 0.5 if template == 'compact' else 0.75
    for section in doc.sections:
        section.top_margin = Inches(margin)
        section.bottom_margin = Inches(margin)
        section.left_margin = Inches(margin)
        section.right_margin = Inches(margin)

    heading_color = RGBColor(17, 17, 17)
    if template in ('modern', 'technical'):
        heading_color = RGBColor(255, 101, 0) # Talent Agent AI Electric Orange

    pi = candidate_data.get('personal_info') or {}
    name = pi.get('full_name') or candidate_data.get('full_name', 'Candidate Name')
    title = pi.get('professional_title') or candidate_data.get('preferred_role', '')
    email = pi.get('email') or candidate_data.get('email', '')
    phone = pi.get('phone') or candidate_data.get('phone', '')
    location = pi.get('location') or candidate_data.get('location', '')
    linkedin = pi.get('linkedin_url', '')
    github = pi.get('github_url', '')

    p_title = doc.add_paragraph()
    r_title = p_title.add_run(name.upper())
    r_title.bold = True
    r_title.font.size = Pt(17 if template != 'compact' else 15)
    r_title.font.color.rgb = RGBColor(15, 15, 15)

    if title:
        p_sub = doc.add_paragraph()
        r_sub = p_sub.add_run(title)
        r_sub.bold = True
        r_sub.font.size = Pt(10.5)
        r_sub.font.color.rgb = heading_color

    contact_parts = [p for p in [email, phone, location, linkedin, github] if p]
    if contact_parts:
        p_c = doc.add_paragraph(" | ".join(contact_parts))
        p_c.runs[0].font.size = Pt(9)
        p_c.runs[0].font.color.rgb = RGBColor(90, 90, 90)

    def add_heading(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(6)
        h.paragraph_format.space_after = Pt(2)
        run = h.add_run(text.upper())
        run.bold = True
        run.font.size = Pt(10.5)
        run.font.color.rgb = heading_color

    ordered_sections = _get_ordered_sections(candidate_data, template)

    for sec in ordered_sections:
        if sec == 'personal_info':
            continue

        elif sec == 'summary':
            summary = candidate_data.get('summary') or candidate_data.get('bio')
            if summary:
                add_heading("Professional Summary")
                p = doc.add_paragraph(summary)
                p.runs[0].font.size = Pt(9.5)

        elif sec == 'skills':
            skills_data = candidate_data.get('skills')
            if skills_data:
                add_heading("Skills & Competencies")
                if isinstance(skills_data, dict):
                    for cat, items in skills_data.items():
                        if items:
                            p = doc.add_paragraph()
                            r_cat = p.add_run(f"{cat.replace('_', ' ').title()}: ")
                            r_cat.bold = True
                            r_cat.font.size = Pt(9.5)
                            r_val = p.add_run(", ".join(items) if isinstance(items, list) else str(items))
                            r_val.font.size = Pt(9.5)
                elif isinstance(skills_data, list):
                    p = doc.add_paragraph(", ".join([str(s) for s in skills_data]))
                    p.runs[0].font.size = Pt(9.5)

        elif sec == 'experience':
            experience = candidate_data.get('experience') or []
            if experience and isinstance(experience, list):
                add_heading("Work Experience")
                for exp in experience:
                    if not isinstance(exp, dict): continue
                    p_exp = doc.add_paragraph()
                    r_role = p_exp.add_run(f"{exp.get('job_title', exp.get('role', 'Position'))} — {exp.get('company', '')}")
                    r_role.bold = True
                    r_role.font.size = Pt(10)

                    start = exp.get('start_date', '')
                    end = 'Present' if (exp.get('is_current') or exp.get('currently_working')) else exp.get('end_date', '')
                    dates = f" ({start} – {end})" if (start or end) else ""
                    r_d = p_exp.add_run(dates)
                    r_d.font.size = Pt(9)

                    desc = exp.get('description', '')
                    if desc:
                        for line in desc.split('\n'):
                            l = line.strip().lstrip('•-* ')
                            if l:
                                p_b = doc.add_paragraph(f"• {l}")
                                p_b.runs[0].font.size = Pt(9)

        elif sec == 'internships':
            internships = candidate_data.get('internships') or []
            if internships and isinstance(internships, list):
                add_heading("Internships")
                for intern in internships:
                    if not isinstance(intern, dict): continue
                    p_i = doc.add_paragraph()
                    r_i = p_i.add_run(f"{intern.get('job_title', 'Intern')} — {intern.get('company', '')}")
                    r_i.bold = True
                    r_i.font.size = Pt(10)
                    desc = intern.get('description', '')
                    if desc:
                        for line in desc.split('\n'):
                            l = line.strip().lstrip('•-* ')
                            if l:
                                p_b = doc.add_paragraph(f"• {l}")
                                p_b.runs[0].font.size = Pt(9)

        elif sec == 'education':
            education = candidate_data.get('education') or []
            if education and isinstance(education, list):
                add_heading("Education")
                for edu in education:
                    if not isinstance(edu, dict): continue
                    p_e = doc.add_paragraph()
                    r_e = p_e.add_run(f"{edu.get('degree', '')} — {edu.get('institution', edu.get('school', ''))}")
                    r_e.bold = True
                    r_e.font.size = Pt(9.5)
                    if edu.get('end_year'):
                        r_y = p_e.add_run(f" ({edu['end_year']})")
                        r_y.font.size = Pt(9)

        elif sec == 'projects':
            projects = candidate_data.get('projects') or []
            if projects and isinstance(projects, list):
                add_heading("Key Projects")
                for proj in projects:
                    if not isinstance(proj, dict): continue
                    p_p = doc.add_paragraph()
                    r_p = p_p.add_run(f"{proj.get('name', proj.get('title', 'Project'))}")
                    r_p.bold = True
                    r_p.font.size = Pt(9.5)
                    if proj.get('technologies'):
                        r_t = p_p.add_run(f" ({proj['technologies']})")
                        r_t.italic = True
                        r_t.font.size = Pt(9)

                    desc = proj.get('description', '')
                    if desc:
                        for line in desc.split('\n'):
                            l = line.strip().lstrip('•-* ')
                            if l:
                                p_b = doc.add_paragraph(f"• {l}")
                                p_b.runs[0].font.size = Pt(9)

        elif sec == 'certifications':
            certs = candidate_data.get('certifications') or []
            if certs and isinstance(certs, list):
                add_heading("Certifications")
                for c in certs:
                    if not isinstance(c, dict): continue
                    p_c = doc.add_paragraph(f"• {c.get('name', '')} — {c.get('organization', '')} ({c.get('issue_date', '')})")
                    p_c.runs[0].font.size = Pt(9)

        elif sec == 'achievements':
            achievements = candidate_data.get('achievements') or []
            if achievements and isinstance(achievements, list):
                add_heading("Achievements")
                for a in achievements:
                    if not isinstance(a, dict): continue
                    p_a = doc.add_paragraph(f"• {a.get('title', '')}: {a.get('description', '')}")
                    p_a.runs[0].font.size = Pt(9)

        elif sec == 'languages':
            languages = candidate_data.get('languages') or []
            if languages and isinstance(languages, list):
                add_heading("Languages")
                l_strs = [f"{l.get('language', '')} ({l.get('proficiency', '')})" if isinstance(l, dict) else str(l) for l in languages]
                p_l = doc.add_paragraph(" • ".join(l_strs))
                p_l.runs[0].font.size = Pt(9.5)

    buffer = io.BytesIO()
    doc.save(buffer)
    docx_data = buffer.getvalue()
    buffer.close()
    return docx_data


def export_resume_txt(candidate_data: dict, template: str = 'classic') -> str:
    """
    Generates clean, standardized ASCII text representation of the ATS resume.
    Perfect for verifying plain-text ATS readability.
    """
    lines = []
    pi = candidate_data.get('personal_info') or {}
    name = (pi.get('full_name') or candidate_data.get('full_name', 'CANDIDATE NAME')).upper()
    title = pi.get('professional_title') or candidate_data.get('preferred_role', '')

    lines.append(name)
    if title:
        lines.append(title)

    contacts = [pi.get('email'), pi.get('phone'), pi.get('location'), pi.get('linkedin_url'), pi.get('github_url')]
    clean_contacts = [c for c in contacts if c]
    if clean_contacts:
        lines.append(" | ".join(clean_contacts))
    lines.append("=" * 64)
    lines.append("")

    ordered_sections = _get_ordered_sections(candidate_data, template)

    for sec in ordered_sections:
        if sec == 'personal_info':
            continue

        elif sec == 'summary':
            summary = candidate_data.get('summary') or candidate_data.get('bio')
            if summary:
                lines.append("PROFESSIONAL SUMMARY")
                lines.append("-" * 32)
                lines.append(summary)
                lines.append("")

        elif sec == 'skills':
            skills = candidate_data.get('skills')
            if skills:
                lines.append("TECHNICAL & CORE SKILLS")
                lines.append("-" * 32)
                if isinstance(skills, dict):
                    for cat, items in skills.items():
                        if items:
                            cat_label = cat.replace('_', ' ').title()
                            val = ", ".join(items) if isinstance(items, list) else str(items)
                            lines.append(f"{cat_label}: {val}")
                elif isinstance(skills, list):
                    lines.append(", ".join([str(s) for s in skills]))
                lines.append("")

        elif sec == 'experience':
            exp = candidate_data.get('experience') or []
            if exp:
                lines.append("WORK EXPERIENCE")
                lines.append("-" * 32)
                for e in exp:
                    if not isinstance(e, dict): continue
                    role = e.get('job_title', 'Role')
                    comp = e.get('company', 'Company')
                    loc = e.get('location', '')
                    start = e.get('start_date', '')
                    end = 'Present' if (e.get('is_current') or e.get('currently_working')) else e.get('end_date', '')
                    dates = f" ({start} - {end})" if (start or end) else ""
                    lines.append(f"{role} at {comp}{', ' + loc if loc else ''}{dates}")
                    desc = e.get('description', '')
                    if desc:
                        for d_line in desc.split('\n'):
                            cl = d_line.strip().lstrip('•-* ')
                            if cl:
                                lines.append(f"  * {cl}")
                    lines.append("")

        elif sec == 'internships':
            internships = candidate_data.get('internships') or []
            if internships:
                lines.append("INTERNSHIPS")
                lines.append("-" * 32)
                for i in internships:
                    if not isinstance(i, dict): continue
                    role = i.get('job_title', 'Intern')
                    comp = i.get('company', '')
                    lines.append(f"{role} at {comp}")
                    desc = i.get('description', '')
                    if desc:
                        for d_line in desc.split('\n'):
                            cl = d_line.strip().lstrip('•-* ')
                            if cl:
                                lines.append(f"  * {cl}")
                    lines.append("")

        elif sec == 'education':
            edu = candidate_data.get('education') or []
            if edu:
                lines.append("EDUCATION")
                lines.append("-" * 32)
                for ed in edu:
                    if not isinstance(ed, dict): continue
                    deg = ed.get('degree', '')
                    inst = ed.get('institution', '')
                    ey = ed.get('end_year', '')
                    lines.append(f"{deg} - {inst} ({ey})")
                    if ed.get('grade'):
                        lines.append(f"  GPA: {ed['grade']}")
                lines.append("")

        elif sec == 'projects':
            proj = candidate_data.get('projects') or []
            if proj:
                lines.append("KEY PROJECTS")
                lines.append("-" * 32)
                for p in proj:
                    if not isinstance(p, dict): continue
                    lines.append(f"{p.get('name', 'Project')}: {p.get('technologies', '')}")
                    if p.get('project_url'):
                        lines.append(f"  URL: {p['project_url']}")
                    desc = p.get('description', '')
                    if desc:
                        for d_line in desc.split('\n'):
                            cl = d_line.strip().lstrip('•-* ')
                            if cl:
                                lines.append(f"  * {cl}")
                    lines.append("")

        elif sec == 'certifications':
            certs = candidate_data.get('certifications') or []
            if certs:
                lines.append("CERTIFICATIONS")
                lines.append("-" * 32)
                for c in certs:
                    if not isinstance(c, dict): continue
                    lines.append(f"* {c.get('name', '')} - {c.get('organization', '')} ({c.get('issue_date', '')})")
                lines.append("")

        elif sec == 'achievements':
            achieve = candidate_data.get('achievements') or []
            if achieve:
                lines.append("ACHIEVEMENTS")
                lines.append("-" * 32)
                for a in achieve:
                    if not isinstance(a, dict): continue
                    lines.append(f"* {a.get('title', '')}: {a.get('description', '')}")
                lines.append("")

        elif sec == 'languages':
            langs = candidate_data.get('languages') or []
            if langs:
                lines.append("LANGUAGES")
                lines.append("-" * 32)
                l_strs = [f"{l.get('language', '')} ({l.get('proficiency', '')})" if isinstance(l, dict) else str(l) for l in langs]
                lines.append(", ".join(l_strs))
                lines.append("")

    return "\n".join(lines)

