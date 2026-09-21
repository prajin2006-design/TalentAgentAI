import os
import uuid
import json
import logging
import io
import re
from flask import Blueprint, request, jsonify, send_file
from database import execute_query
from config import Config
from routes.auth_routes import get_current_user_from_request
from services.pdf_service import extract_text_from_pdf, extract_resume_text
from services.resume_analysis_service import (
    parse_and_structure_resume_text,
    calculate_deterministic_ats_score,
    sync_resume_to_candidate_ecosystem
)
from services.ats_service import (
    analyze_resume_ats,
    analyze_resume_against_job,
    optimize_resume_content,
    compute_builder_ats_score,
    export_resume_pdf,
    export_resume_docx
)
from services.ai_service import (
    generate_ats_summary,
    improve_experience_bullets,
    analyze_job_ats_match
)

resume_bp = Blueprint('resumes', __name__, url_prefix='/api')
logger = logging.getLogger(__name__)

def require_auth():
    user = get_current_user_from_request()
    if not user:
        return None, (jsonify({'error': 'Unauthorized. Please log in.'}), 401)
    return user, None

def _safe_json(v, default=None):
    if default is None: default = []
    if isinstance(v, (list, dict)): return v
    if isinstance(v, str) and v.strip():
        try: return json.loads(v)
        except Exception: return default
    return default

def _format_resume_record(rec):
    if not rec: return None
    d = dict(rec)
    d['personal_info'] = _safe_json(d.get('personal_info'), {})
    d['experience'] = _safe_json(d.get('experience'), [])
    d['education'] = _safe_json(d.get('education'), [])
    d['skills'] = _safe_json(d.get('skills'), [])
    d['projects'] = _safe_json(d.get('projects'), [])
    d['certifications'] = _safe_json(d.get('certifications'), [])
    d['achievements'] = _safe_json(d.get('achievements'), [])
    d['languages'] = _safe_json(d.get('languages'), [])
    d['ats_analysis'] = _safe_json(d.get('ats_analysis'), {})
    return d

def _format_uploaded_resume(rec):
    if not rec: return None
    d = dict(rec)
    parsed_json = _safe_json(d.get('parsed_json'), {})
    d['parsed_data'] = parsed_json
    d['personal_info'] = parsed_json.get('personal_info', {})
    d['summary'] = parsed_json.get('summary', '')
    d['skills'] = parsed_json.get('skills', [])
    d['education'] = parsed_json.get('education', [])
    d['experience'] = parsed_json.get('experience', [])
    d['projects'] = parsed_json.get('projects', [])
    d['certifications'] = parsed_json.get('certifications', [])
    d['achievements'] = parsed_json.get('achievements', [])
    d['languages'] = parsed_json.get('languages', [])
    d['strengths'] = parsed_json.get('strengths', [])
    d['areas_to_improve'] = parsed_json.get('areas_to_improve', [])
    return d

# ==========================================
# REAL PDF RESUME UPLOAD & INTELLIGENCE
# ==========================================

@resume_bp.route('/resumes/upload-pdf', methods=['POST'])
@resume_bp.route('/resumes/upload', methods=['POST'])
def upload_pdf_resume():
    """
    Accepts PDF resume upload (max 10MB), extracts text via pypdf,
    parses structured data via Gemini AI/heuristics, calculates ATS score,
    persists resume version to DB, and synchronizes candidate ecosystem.
    """
    user, err = require_auth()
    if err: return err

    if 'resume' not in request.files and 'file' not in request.files:
        return jsonify({'error': 'No resume file uploaded. Please select a PDF or DOCX file.'}), 400

    file_obj = request.files.get('resume') or request.files.get('file')
    original_filename = file_obj.filename or 'resume.pdf'
    fn_lower = original_filename.lower()

    if not (fn_lower.endswith('.pdf') or fn_lower.endswith('.docx')):
        return jsonify({'error': 'Only PDF and DOCX resume files are supported. Please upload a .pdf or .docx document.'}), 400

    mime_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' if fn_lower.endswith('.docx') else 'application/pdf'

    file_bytes = file_obj.read()
    file_size = len(file_bytes)
    if file_size > 10 * 1024 * 1024:
        return jsonify({'error': f'File size ({round(file_size / (1024*1024), 1)} MB) exceeds the 10 MB limit.'}), 400

    if file_size < 100:
        return jsonify({'error': 'Uploaded file is empty or corrupted.'}), 400

    user_upload_dir = Config.UPLOAD_FOLDER / 'resumes' / f"user_{user['id']}"
    user_upload_dir.mkdir(parents=True, exist_ok=True)

    safe_name = re.sub(r'[^\w\.-]', '_', original_filename)
    stored_filename = f"{uuid.uuid4().hex[:12]}_{safe_name}"
    storage_path = user_upload_dir / stored_filename

    with open(storage_path, 'wb') as f:
        f.write(file_bytes)

    extraction = extract_resume_text(file_bytes, original_filename)
    if not extraction['success']:
        return jsonify({'error': extraction['error']}), 400

    extracted_text = extraction['extracted_text']
    structured_data = parse_and_structure_resume_text(extracted_text, user)
    ats_score = structured_data.get('ats_score', 80)
    readiness_score = structured_data.get('readiness_score', 80)

    max_ver_rec = execute_query(
        "SELECT MAX(version) as max_v FROM resumes WHERE user_id = %s",
        (user['id'],),
        fetchone=True
    )
    current_max_version = (max_ver_rec['max_v'] or 0) if max_ver_rec else 0
    new_version = current_max_version + 1

    execute_query("UPDATE resumes SET is_active = FALSE WHERE user_id = %s", (user['id'],), commit=True)

    resume_id = execute_query(
        """
        INSERT INTO resumes (user_id, original_filename, stored_filename, mime_type, file_size, extracted_text, parsed_json, status, is_active, version, ats_score, readiness_score, parsed_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        """,
        (
            user['id'],
            original_filename,
            stored_filename,
            'application/pdf',
            file_size,
            extracted_text,
            json.dumps(structured_data),
            'parsed',
            True,
            new_version,
            ats_score,
            readiness_score
        ),
        commit=True,
        return_id=True
    )

    sync_resume_to_candidate_ecosystem(user['id'], structured_data, ats_score)

    new_resume = execute_query("SELECT * FROM resumes WHERE id = %s", (resume_id,), fetchone=True)

    return jsonify({
        'success': True,
        'message': 'Resume uploaded, parsed, and analyzed successfully.',
        'resume': _format_uploaded_resume(new_resume)
    }), 201

@resume_bp.route('/resumes/active', methods=['GET'])
def get_active_resume():
    """Returns candidate's currently active analyzed resume and full version history."""
    user, err = require_auth()
    if err: return err

    active_rec = execute_query(
        "SELECT * FROM resumes WHERE user_id = %s AND is_active = TRUE ORDER BY id DESC LIMIT 1",
        (user['id'],),
        fetchone=True
    )
    if not active_rec:
        active_rec = execute_query(
            "SELECT * FROM resumes WHERE user_id = %s ORDER BY id DESC LIMIT 1",
            (user['id'],),
            fetchone=True
        )

    history = execute_query(
        "SELECT id, original_filename, stored_filename, mime_type, file_size, status, is_active, version, ats_score, readiness_score, uploaded_at, parsed_at FROM resumes WHERE user_id = %s ORDER BY id DESC",
        (user['id'],),
        fetchall=True
    ) or []

    return jsonify({
        'success': True,
        'resume': _format_uploaded_resume(active_rec) if active_rec else None,
        'history': [dict(h) for h in history]
    }), 200

@resume_bp.route('/resumes/history', methods=['GET'])
def get_resume_history():
    """Returns candidate's full resume version history."""
    user, err = require_auth()
    if err: return err

    history = execute_query(
        "SELECT * FROM resumes WHERE user_id = %s ORDER BY id DESC",
        (user['id'],),
        fetchall=True
    ) or []

    return jsonify({
        'success': True,
        'history': [_format_uploaded_resume(r) for r in history]
    }), 200

@resume_bp.route('/resumes/<int:resume_id>/set-active', methods=['POST'])
def set_active_resume(resume_id):
    """Sets specified resume version as active and re-syncs candidate profile."""
    user, err = require_auth()
    if err: return err

    rec = execute_query("SELECT * FROM resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), fetchone=True)
    if not rec:
        return jsonify({'error': 'Resume record not found or access denied.'}), 404

    execute_query("UPDATE resumes SET is_active = FALSE WHERE user_id = %s", (user['id'],), commit=True)
    execute_query("UPDATE resumes SET is_active = TRUE WHERE id = %s AND user_id = %s", (resume_id, user['id']), commit=True)

    parsed_data = _safe_json(rec.get('parsed_json'), {})
    ats_score = rec.get('ats_score', 80)
    if parsed_data:
        sync_resume_to_candidate_ecosystem(user['id'], parsed_data, ats_score)

    updated = execute_query("SELECT * FROM resumes WHERE id = %s", (resume_id,), fetchone=True)
    return jsonify({
        'success': True,
        'message': 'Resume set as active.',
        'resume': _format_uploaded_resume(updated)
    }), 200

@resume_bp.route('/resumes/<int:resume_id>/reanalyze', methods=['POST'])
def reanalyze_stored_resume(resume_id):
    """Re-analyzes an existing uploaded PDF resume stored on disk."""
    user, err = require_auth()
    if err: return err

    rec = execute_query("SELECT * FROM resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), fetchone=True)
    if not rec:
        return jsonify({'error': 'Resume record not found.'}), 404

    user_upload_dir = Config.UPLOAD_FOLDER / 'resumes' / f"user_{user['id']}"
    file_path = user_upload_dir / rec['stored_filename']

    if not file_path.exists():
        return jsonify({'error': 'Stored PDF resume file was not found on server.'}), 404

    with open(file_path, 'rb') as f:
        file_bytes = f.read()

    extraction = extract_text_from_pdf(file_bytes)
    if not extraction['success']:
        return jsonify({'error': extraction['error']}), 400

    extracted_text = extraction['extracted_text']
    structured_data = parse_and_structure_resume_text(extracted_text, user)
    ats_score = structured_data.get('ats_score', 80)
    readiness_score = structured_data.get('readiness_score', 80)

    execute_query(
        """
        UPDATE resumes
        SET extracted_text = %s, parsed_json = %s, status = 'parsed',
            ats_score = %s, readiness_score = %s, parsed_at = CURRENT_TIMESTAMP
        WHERE id = %s AND user_id = %s
        """,
        (extracted_text, json.dumps(structured_data), ats_score, readiness_score, resume_id, user['id']),
        commit=True
    )

    sync_resume_to_candidate_ecosystem(user['id'], structured_data, ats_score)

    updated = execute_query("SELECT * FROM resumes WHERE id = %s", (resume_id,), fetchone=True)
    return jsonify({
        'success': True,
        'message': 'Resume re-analyzed successfully.',
        'resume': _format_uploaded_resume(updated)
    }), 200

@resume_bp.route('/resumes/uploaded/<int:resume_id>', methods=['DELETE'])
@resume_bp.route('/resumes/pdf/<int:resume_id>', methods=['DELETE'])
def delete_uploaded_pdf_resume(resume_id):
    """Deletes uploaded PDF resume record and removes file from disk."""
    user, err = require_auth()
    if err: return err

    rec = execute_query("SELECT * FROM resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), fetchone=True)
    if not rec:
        return jsonify({'error': 'Resume record not found.'}), 404

    was_active = bool(rec.get('is_active'))

    try:
        file_path = Config.UPLOAD_FOLDER / 'resumes' / f"user_{user['id']}" / rec['stored_filename']
        if file_path.exists():
            os.remove(file_path)
    except Exception as e:
        logger.warning(f"Error removing resume file from disk: {e}")

    execute_query("DELETE FROM resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), commit=True)

    if was_active:
        next_rec = execute_query("SELECT id FROM resumes WHERE user_id = %s ORDER BY id DESC LIMIT 1", (user['id'],), fetchone=True)
        if next_rec:
            execute_query("UPDATE resumes SET is_active = TRUE WHERE id = %s", (next_rec['id'],), commit=True)

    return jsonify({'success': True, 'message': 'Resume deleted successfully.'}), 200

# ==========================================
# ATS RESUME MAKER — BUILDER CRUD
# ==========================================

@resume_bp.route('/resumes', methods=['GET'])
def get_user_resumes():
    """Returns all ATS builder resumes owned by authenticated candidate."""
    user, err = require_auth()
    if err: return err

    ats_resumes = execute_query(
        "SELECT * FROM ats_resumes WHERE user_id = %s ORDER BY updated_at DESC",
        (user['id'],),
        fetchall=True
    ) or []

    resumes_list = [_format_resume_record(r) for r in ats_resumes]

    # Also include legacy uploaded resumes for unified backwards compatibility
    uploaded = execute_query(
        "SELECT id, original_filename, stored_filename, mime_type, file_size, uploaded_at FROM resumes WHERE user_id = %s ORDER BY id DESC",
        (user['id'],),
        fetchall=True
    ) or []

    return jsonify({
        'success': True,
        'resumes': resumes_list,
        'uploaded_resumes': [dict(u) for u in uploaded]
    }), 200

@resume_bp.route('/resumes', methods=['POST'])
def create_user_resume():
    """Creates a new ATS builder resume. Optionally pre-fills from profile."""
    user, err = require_auth()
    if err: return err

    data = request.get_json() or {}
    name = data.get('name', '').strip() or 'My ATS Resume'
    template = data.get('template', 'modern')

    # If payload contains data, use it; otherwise pre-populate from candidate profile
    profile = execute_query("SELECT * FROM candidate_profiles WHERE user_id = %s", (user['id'],), fetchone=True) or {}
    skills_db = execute_query("SELECT skill_name FROM candidate_skills WHERE user_id = %s", (user['id'],), fetchall=True) or []
    edu_db = execute_query("SELECT * FROM candidate_education WHERE user_id = %s", (user['id'],), fetchall=True) or []
    exp_db = execute_query("SELECT * FROM candidate_experience WHERE user_id = %s", (user['id'],), fetchall=True) or []
    proj_db = execute_query("SELECT * FROM candidate_projects WHERE user_id = %s", (user['id'],), fetchall=True) or []

    personal_info = data.get('personal_info') or {
        'full_name': user['full_name'],
        'professional_title': profile.get('headline') or profile.get('preferred_role', 'Software Engineer'),
        'email': user['email'],
        'phone': profile.get('phone', ''),
        'location': profile.get('location', ''),
        'linkedin_url': profile.get('linkedin_url', ''),
        'github_url': profile.get('github_url', ''),
        'portfolio_url': profile.get('portfolio_url', '')
    }

    summary = data.get('summary') or profile.get('bio') or f"Results-driven {personal_info.get('professional_title', 'Engineer')} with expertise in scalable systems and modern software development."

    skills = data.get('skills') or [s['skill_name'] for s in skills_db] or ['JavaScript', 'React', 'Python', 'SQL', 'Git']

    experience = data.get('experience') or [
        {
            'job_title': e.get('role', 'Developer'),
            'company': e.get('company', 'Tech Co'),
            'location': profile.get('location', ''),
            'start_date': e.get('start_date', '2023'),
            'end_date': e.get('end_date', 'Present'),
            'is_current': bool(e.get('is_current')),
            'description': e.get('description', 'Developed and maintained core web application components.')
        } for e in exp_db
    ]

    education = data.get('education') or [
        {
            'degree': ed.get('degree', 'B.S. in Computer Science'),
            'institution': ed.get('institution', 'University'),
            'location': profile.get('location', ''),
            'start_year': ed.get('start_year', '2020'),
            'end_year': ed.get('end_year', '2024'),
            'grade': ed.get('grade', ''),
            'description': ''
        } for ed in edu_db
    ]

    projects = data.get('projects') or [
        {
            'name': p.get('title', 'Portfolio Web App'),
            'role': 'Lead Developer',
            'technologies': p.get('technologies', 'React, Python, Tailwind'),
            'description': p.get('description', 'Designed and built full-stack responsive web platform.'),
            'project_url': p.get('project_url', ''),
            'github_url': ''
        } for p in proj_db
    ]

    certifications = data.get('certifications') or []
    achievements = data.get('achievements') or []
    languages = data.get('languages') or [{'language': 'English', 'proficiency': 'Fluent'}]

    # Compute initial ATS score
    sample_data = {
        'personal_info': personal_info,
        'summary': summary,
        'skills': skills,
        'experience': experience,
        'education': education,
        'projects': projects,
        'certifications': certifications,
        'achievements': achievements,
        'languages': languages
    }
    ats_score_res = compute_builder_ats_score(sample_data)
    ats_score = ats_score_res.get('score', 85)

    resume_id = execute_query(
        """
        INSERT INTO ats_resumes (user_id, name, template, personal_info, summary, experience, education, skills, projects, certifications, achievements, languages, ats_score, ats_analysis, target_role, target_job_description)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            user['id'],
            name,
            template,
            json.dumps(personal_info),
            summary,
            json.dumps(experience),
            json.dumps(education),
            json.dumps(skills),
            json.dumps(projects),
            json.dumps(certifications),
            json.dumps(achievements),
            json.dumps(languages),
            ats_score,
            json.dumps(ats_score_res),
            personal_info.get('professional_title', ''),
            ''
        ),
        commit=True,
        return_id=True
    )

    new_resume = execute_query("SELECT * FROM ats_resumes WHERE id = %s", (resume_id,), fetchone=True)
    return jsonify({
        'success': True,
        'message': 'ATS Resume created successfully.',
        'resume': _format_resume_record(new_resume)
    }), 201

@resume_bp.route('/resumes/<int:resume_id>', methods=['GET'])
def get_single_resume(resume_id):
    """Fetches single ATS builder resume by ID."""
    user, err = require_auth()
    if err: return err

    resume = execute_query("SELECT * FROM ats_resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), fetchone=True)
    if not resume:
        # Fallback to check legacy resumes table
        legacy = execute_query("SELECT * FROM resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), fetchone=True)
        if legacy:
            return jsonify({'success': True, 'resume': dict(legacy)}), 200
        return jsonify({'error': 'Resume not found or access denied.'}), 404

    return jsonify({'success': True, 'resume': _format_resume_record(resume)}), 200

@resume_bp.route('/resumes/<int:resume_id>', methods=['PUT'])
def update_user_resume(resume_id):
    """Updates/saves ATS builder resume."""
    user, err = require_auth()
    if err: return err

    existing = execute_query("SELECT id FROM ats_resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), fetchone=True)
    if not existing:
        return jsonify({'error': 'Resume not found or access denied.'}), 404

    data = request.get_json() or {}
    name = data.get('name', 'My ATS Resume')
    template = data.get('template', 'modern')
    personal_info = data.get('personal_info') or {}
    summary = data.get('summary', '')
    experience = data.get('experience') or []
    education = data.get('education') or []
    skills = data.get('skills') or []
    projects = data.get('projects') or []
    certifications = data.get('certifications') or []
    achievements = data.get('achievements') or []
    languages = data.get('languages') or []
    target_role = data.get('target_role', '')
    target_job_description = data.get('target_job_description', '')

    # Recompute ATS score
    sample_data = {
        'personal_info': personal_info,
        'summary': summary,
        'skills': skills,
        'experience': experience,
        'education': education,
        'projects': projects,
        'certifications': certifications,
        'achievements': achievements,
        'languages': languages
    }
    ats_score_res = compute_builder_ats_score(sample_data)
    ats_score = ats_score_res.get('score', 85)

    execute_query(
        """
        UPDATE ats_resumes
        SET name = %s, template = %s, personal_info = %s, summary = %s, experience = %s,
            education = %s, skills = %s, projects = %s, certifications = %s, achievements = %s,
            languages = %s, ats_score = %s, ats_analysis = %s, target_role = %s, target_job_description = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s AND user_id = %s
        """,
        (
            name,
            template,
            json.dumps(personal_info),
            summary,
            json.dumps(experience),
            json.dumps(education),
            json.dumps(skills),
            json.dumps(projects),
            json.dumps(certifications),
            json.dumps(achievements),
            json.dumps(languages),
            ats_score,
            json.dumps(ats_score_res),
            target_role,
            target_job_description,
            resume_id,
            user['id']
        ),
        commit=True
    )

    updated = execute_query("SELECT * FROM ats_resumes WHERE id = %s", (resume_id,), fetchone=True)
    return jsonify({
        'success': True,
        'message': 'Resume saved successfully.',
        'resume': _format_resume_record(updated)
    }), 200

@resume_bp.route('/resumes/<int:resume_id>', methods=['DELETE'])
def delete_user_resume(resume_id):
    """Deletes ATS builder resume."""
    user, err = require_auth()
    if err: return err

    existing = execute_query("SELECT id FROM ats_resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), fetchone=True)
    if not existing:
        return jsonify({'error': 'Resume not found or access denied.'}), 404

    execute_query("DELETE FROM ats_resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), commit=True)
    return jsonify({'success': True, 'message': 'Resume deleted successfully.'}), 200

# ==========================================
# AI OPTIMIZATION & SCORING ENDPOINTS
# ==========================================

@resume_bp.route('/resumes/generate-summary', methods=['POST'])
@resume_bp.route('/resumes/<int:resume_id>/generate-summary', methods=['POST'])
def generate_summary_endpoint(resume_id=None):
    """Gemini AI generates concise ATS-optimized professional summary."""
    user, err = require_auth()
    if err: return err

    data = request.get_json() or {}
    target_role = data.get('target_role', '')

    resume_data = data
    if resume_id and not data.get('personal_info'):
        rec = execute_query("SELECT * FROM ats_resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), fetchone=True)
        if rec: resume_data = _format_resume_record(rec)

    res = generate_ats_summary(resume_data, target_role)
    return jsonify(res), 200

@resume_bp.route('/resumes/improve-bullets', methods=['POST'])
@resume_bp.route('/resumes/<int:resume_id>/improve-bullets', methods=['POST'])
def improve_bullets_endpoint(resume_id=None):
    """Gemini AI converts rough text into impact-driven ATS action-verb bullets."""
    user, err = require_auth()
    if err: return err

    data = request.get_json() or {}
    draft_text = data.get('draft_text', data.get('description', '')).strip()
    role = data.get('role', data.get('job_title', 'Position'))
    company = data.get('company', 'Company')

    res = improve_experience_bullets(draft_text, role, company)
    return jsonify(res), 200 if res.get('success') else 400

@resume_bp.route('/resumes/ats-analysis', methods=['POST'])
@resume_bp.route('/resumes/<int:resume_id>/ats-analysis', methods=['POST'])
@resume_bp.route('/resumes/<int:resume_id>/analyze-ats', methods=['POST'])
@resume_bp.route('/resume/analyze-ats', methods=['POST'])
def analyze_ats_endpoint(resume_id=None):
    """Calculates comprehensive ATS Score, section breakdown, and recommendations."""
    user, err = require_auth()
    if err: return err

    data = request.get_json() or {}

    # If builder resume
    if resume_id:
        rec = execute_query("SELECT * FROM ats_resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), fetchone=True)
        if rec:
            resume_dict = _format_resume_record(rec)
            if data:
                resume_dict.update({k: v for k, v in data.items() if v is not None})
            analysis = compute_builder_ats_score(resume_dict)
            execute_query(
                "UPDATE ats_resumes SET ats_score = %s, ats_analysis = %s WHERE id = %s",
                (analysis['score'], json.dumps(analysis), resume_id),
                commit=True
            )
            return jsonify({'success': True, 'ats_analysis': analysis, 'score': analysis['score']}), 200

    if data.get('personal_info') or data.get('skills') or data.get('experience'):
        analysis = compute_builder_ats_score(data)
        return jsonify({'success': True, 'ats_analysis': analysis, 'score': analysis['score']}), 200

    # Legacy text-based ATS analysis
    resume = execute_query("SELECT extracted_text FROM resumes WHERE user_id = %s ORDER BY id DESC LIMIT 1", (user['id'],), fetchone=True)
    extracted_text = resume['extracted_text'] if resume else ""
    analysis = analyze_resume_ats(extracted_text, user['id'])
    return jsonify({'success': True, 'ats_analysis': analysis}), 200

@resume_bp.route('/resumes/job-match', methods=['POST'])
@resume_bp.route('/resumes/<int:resume_id>/job-match', methods=['POST'])
@resume_bp.route('/resumes/<int:resume_id>/analyze-job', methods=['POST'])
@resume_bp.route('/resume/analyze-job-ats', methods=['POST'])
def analyze_job_match_endpoint(resume_id=None):
    """Compares candidate's resume with target Job Description."""
    user, err = require_auth()
    if err: return err

    data = request.get_json() or {}
    job_description = data.get('job_description', '').strip()
    job_id = data.get('job_id')

    if job_id:
        job = execute_query("SELECT description FROM jobs WHERE id = %s", (job_id,), fetchone=True)
        if job: job_description = job['description']

    if not job_description:
        return jsonify({'error': 'Please provide a job description to analyze match.'}), 400

    resume_data = data
    if resume_id and not data.get('skills'):
        rec = execute_query("SELECT * FROM ats_resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), fetchone=True)
        if rec: resume_data = _format_resume_record(rec)

    res = analyze_job_ats_match(resume_data, job_description)
    return jsonify(res), 200 if res.get('success') else 400

# ==========================================
# PDF & DOCX DOWNLOADS
# ==========================================

@resume_bp.route('/resumes/<int:resume_id>/download/pdf', methods=['GET'])
def download_resume_pdf(resume_id):
    """Downloads ATS resume as PDF with selectable text."""
    user, err = require_auth()
    if err: return err

    template = request.args.get('template')
    rec = execute_query("SELECT * FROM ats_resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), fetchone=True)
    if not rec:
        return jsonify({'error': 'Resume not found.'}), 404

    resume_data = _format_resume_record(rec)
    tpl = template or resume_data.get('template', 'modern')

    pdf_bytes = export_resume_pdf(resume_data, template=tpl)
    raw_name = resume_data.get('personal_info', {}).get('full_name') or user['full_name']
    clean_name = re.sub(r'[^\w\-]', '_', raw_name.strip())
    doc_name = re.sub(r'[^\w\-]', '_', resume_data.get('name', 'ATS_Resume').strip())

    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{clean_name}_{doc_name}.pdf"
    )

@resume_bp.route('/resumes/<int:resume_id>/download/docx', methods=['GET'])
def download_resume_docx(resume_id):
    """Downloads ATS resume as editable DOCX document."""
    user, err = require_auth()
    if err: return err

    template = request.args.get('template')
    rec = execute_query("SELECT * FROM ats_resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), fetchone=True)
    if not rec:
        return jsonify({'error': 'Resume not found.'}), 404

    resume_data = _format_resume_record(rec)
    tpl = template or resume_data.get('template', 'modern')

    docx_bytes = export_resume_docx(resume_data, template=tpl)
    raw_name = resume_data.get('personal_info', {}).get('full_name') or user['full_name']
    clean_name = re.sub(r'[^\w\-]', '_', raw_name.strip())
    doc_name = re.sub(r'[^\w\-]', '_', resume_data.get('name', 'ATS_Resume').strip())

    return send_file(
        io.BytesIO(docx_bytes),
        mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        as_attachment=True,
        download_name=f"{clean_name}_{doc_name}.docx"
    )

@resume_bp.route('/resumes/export', methods=['POST', 'GET'])
@resume_bp.route('/resume/export', methods=['POST', 'GET'])
def export_resume():
    """Legacy resume export endpoint."""
    user, err = require_auth()
    if err: return err

    file_format = request.args.get('format', 'pdf').lower()
    resume_id = request.args.get('resume_id')
    template = request.args.get('template', 'modern')

    if resume_id:
        rec = execute_query("SELECT * FROM ats_resumes WHERE id = %s AND user_id = %s", (resume_id, user['id']), fetchone=True)
        if rec:
            resume_data = _format_resume_record(rec)
            clean_name = re.sub(r'[^\w\-]', '_', user['full_name'].strip())
            if file_format == 'docx':
                file_bytes = export_resume_docx(resume_data, template=template)
                return send_file(io.BytesIO(file_bytes), mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document', as_attachment=True, download_name=f"{clean_name}_ATS_Resume.docx")
            else:
                file_bytes = export_resume_pdf(resume_data, template=template)
                return send_file(io.BytesIO(file_bytes), mimetype='application/pdf', as_attachment=True, download_name=f"{clean_name}_ATS_Resume.pdf")

    # Fallback to candidate bundle
    profile = execute_query("SELECT * FROM candidate_profiles WHERE user_id = %s", (user['id'],), fetchone=True) or {}
    skills = execute_query("SELECT skill_name FROM candidate_skills WHERE user_id = %s", (user['id'],), fetchall=True) or []
    education = execute_query("SELECT * FROM candidate_education WHERE user_id = %s", (user['id'],), fetchall=True) or []
    experience = execute_query("SELECT * FROM candidate_experience WHERE user_id = %s", (user['id'],), fetchall=True) or []
    projects = execute_query("SELECT * FROM candidate_projects WHERE user_id = %s", (user['id'],), fetchall=True) or []

    candidate_bundle = {
        'full_name': user['full_name'],
        'email': user['email'],
        'phone': profile.get('phone', ''),
        'location': profile.get('location', ''),
        'summary': profile.get('bio') or profile.get('headline') or f"Candidate seeking {profile.get('preferred_role', 'Software Engineer')} positions.",
        'skills': [s['skill_name'] for s in skills],
        'education': [dict(e) for e in education],
        'experience': [dict(exp) for exp in experience],
        'projects': [dict(p) for p in projects]
    }

    clean_name = re.sub(r'[^\w\-]', '_', user['full_name'].strip())
    if file_format == 'docx':
        file_bytes = export_resume_docx(candidate_bundle, template=template)
        return send_file(io.BytesIO(file_bytes), mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document', as_attachment=True, download_name=f"{clean_name}_ATS_Resume.docx")
    else:
        file_bytes = export_resume_pdf(candidate_bundle, template=template)
        return send_file(io.BytesIO(file_bytes), mimetype='application/pdf', as_attachment=True, download_name=f"{clean_name}_ATS_Resume.pdf")

