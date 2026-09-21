import json
import logging
from pathlib import Path
from flask import Blueprint, request, jsonify, make_response
from config import Config
from database import execute_query
from services.auth_service import (
    verify_password,
    generate_jwt_token,
    decode_jwt_token,
    log_audit_event
)
from services.email_service import (
    send_login_security_alert,
    parse_client_info
)

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')
logger = logging.getLogger(__name__)

def require_admin():
    """Enforces server-side administrator authorization."""
    token = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:].strip() or None
    elif 'talent_agent_admin_token' in request.cookies:
        token = request.cookies.get('talent_agent_admin_token')

    if not token:
        return None, (jsonify({'error': 'Admin authorization required.'}), 401)

    decoded = decode_jwt_token(token)
    if not decoded or not decoded.get('user_id') or decoded.get('role') not in ('admin', 'super_admin'):
        return None, (jsonify({'error': 'Forbidden. Admin privileges required.'}), 403)

    admin = execute_query(
        "SELECT id, full_name, email, role, is_active FROM admin_users WHERE id = %s AND is_active = %s",
        (decoded['user_id'], True),
        fetchone=True
    )
    if not admin or admin['role'] not in ('admin', 'super_admin') or admin['role'] != decoded.get('role'):
        return None, (jsonify({'error': 'Invalid administrator session.'}), 403)

    return admin, None

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """Admin authentication endpoint."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Admin email and password are required.'}), 400

    admin = execute_query("SELECT * FROM admin_users WHERE email = %s", (email,), fetchone=True)
    if not admin or not admin['is_active']:
        log_audit_event(None, 'admin', 'admin_login_failed', 'admin', None, f"Failed admin login attempt: {email}", request.remote_addr)
        return jsonify({'error': 'Invalid administrator credentials.'}), 401

    if not verify_password(admin['password_hash'], password):
        log_audit_event(admin['id'], 'admin', 'admin_login_failed', 'admin', admin['id'], f"Incorrect admin password: {email}", request.remote_addr)
        return jsonify({'error': 'Invalid administrator credentials.'}), 401

    # Update last login
    execute_query("UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = %s", (admin['id'],), commit=True)

    token = generate_jwt_token({
        'user_id': admin['id'],
        'email': admin['email'],
        'role': admin['role'],
        'full_name': admin['full_name']
    }, expires_in_hours=12)

    log_audit_event(admin['id'], 'admin', 'admin_login_success', 'admin', admin['id'], f"Admin logged in: {email}", request.remote_addr)
    
    # Send login security email alert for Admin authentication (non-blocking)
    try:
        user_agent_str = request.headers.get('User-Agent', '')
        client_ip = request.headers.get('X-Forwarded-For', request.remote_addr or '127.0.0.1')
        if client_ip and ',' in client_ip:
            client_ip = client_ip.split(',')[0].strip()
        client_info = parse_client_info(user_agent_str, client_ip)
        send_login_security_alert(admin['email'], admin.get('full_name', ''), client_info)
    except Exception as e:
        logger.error(f"Error dispatching admin login alert for {admin['email']}: {e}")

    admin_data = {
        'id': admin['id'],
        'full_name': admin['full_name'],
        'email': admin['email'],
        'role': admin['role']
    }

    resp = make_response(jsonify({
        'success': True,
        'message': 'Admin authenticated successfully.',
        'admin': admin_data,
        'token': token
    }))
    resp.set_cookie('talent_agent_admin_token', token, httponly=True, samesite='Lax', secure=Config.COOKIE_SECURE, max_age=12 * 3600)
    return resp, 200

@admin_bp.route('/me', methods=['GET'])
def get_admin_me():
    """Returns currently authenticated administrator profile and session state."""
    admin, err = require_admin()
    if err:
        return jsonify({'authenticated': False, 'admin': None}), 200

    admin_data = {
        'id': admin['id'],
        'full_name': admin['full_name'],
        'email': admin['email'],
        'role': admin['role']
    }

    return jsonify({
        'authenticated': True,
        'admin': admin_data
    }), 200

@admin_bp.route('/logout', methods=['POST'])
def admin_logout():
    """Admin logout endpoint."""
    resp = make_response(jsonify({'success': True, 'message': 'Admin logged out.'}))
    resp.set_cookie('talent_agent_admin_token', '', expires=0, httponly=True)
    return resp, 200

@admin_bp.route('/dashboard', methods=['GET'])
def get_dashboard_metrics():
    """Returns platform metrics for the admin overview."""
    admin, err = require_admin()
    if err: return err

    total_candidates = execute_query("SELECT COUNT(*) as count FROM users WHERE role = 'candidate'", fetchone=True)['count']
    active_candidates = execute_query("SELECT COUNT(*) as count FROM users WHERE role = 'candidate' AND is_active = %s", (True,), fetchone=True)['count']
    verified_candidates = execute_query("SELECT COUNT(*) as count FROM users WHERE role = 'candidate' AND email_verified = %s", (True,), fetchone=True)['count']
    unverified_candidates = total_candidates - verified_candidates

    profiles_completed = execute_query("SELECT COUNT(*) as count FROM candidate_profiles WHERE profile_completion >= 80", fetchone=True)['count']
    resumes_uploaded = execute_query("SELECT COUNT(*) as count FROM resumes", fetchone=True)['count']
    resumes_analyzed = execute_query("SELECT COUNT(*) as count FROM resumes WHERE status = 'parsed'", fetchone=True)['count']
    ai_analyses_run = execute_query("SELECT COUNT(*) as count FROM ai_analysis", fetchone=True)['count']
    
    # Active jobs status check (Active, Paused)
    active_jobs = execute_query("SELECT COUNT(*) as count FROM jobs WHERE is_active = %s AND status = 'Active'", (True,), fetchone=True)['count']
    total_matches = execute_query("SELECT COUNT(*) as count FROM job_matches", fetchone=True)['count']

    avg_readiness_row = execute_query(
        "SELECT AVG(readiness_score) as avg_score FROM candidate_profiles WHERE readiness_score IS NOT NULL AND readiness_score > 0",
        fetchone=True
    )
    average_readiness = int(avg_readiness_row['avg_score']) if (avg_readiness_row and avg_readiness_row['avg_score'] is not None) else 0

    ai_usage = execute_query(
        "SELECT COUNT(*) AS requests, SUM(status = 'success') AS successful, SUM(status IN ('failed', 'rate_limited')) AS failed, AVG(response_time_ms) AS average_response_time_ms, SUM(prompt_tokens + completion_tokens) AS total_tokens FROM ai_request_metrics",
        fetchone=True
    ) or {}

    # Recent Registrations
    recent_users = execute_query(
        """
        SELECT u.id, u.full_name, u.email, u.email_verified, u.created_at, cp.profile_completion, cp.readiness_score, cp.preferred_role
        FROM users u
        LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
        WHERE u.role = 'candidate'
        ORDER BY u.created_at DESC
        LIMIT 8
        """,
        fetchall=True
    ) or []

    return jsonify({
        'metrics': {
            'total_candidates': total_candidates,
            'active_candidates': active_candidates,
            'verified_candidates': verified_candidates,
            'unverified_candidates': unverified_candidates,
            'profiles_completed': profiles_completed,
            'resumes_uploaded': resumes_uploaded,
            'resumes_analyzed': resumes_analyzed,
            'ai_analyses_run': ai_analyses_run,
            'active_jobs': active_jobs,
            'total_matches': total_matches,
            'average_readiness': average_readiness,
            'ai_usage': dict(ai_usage)
        },
        'recent_candidates': [dict(r) for r in recent_users]
    }), 200

@admin_bp.route('/candidates', methods=['GET'])
def get_all_candidates():
    """Returns candidate records with backend pagination, search, sorting and filtering."""
    admin, err = require_admin()
    if err: return err

    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    offset = (page - 1) * limit

    search = request.args.get('search', '').strip().lower()
    status_filter = request.args.get('status', 'all')
    readiness_filter = request.args.get('readiness', 'all')
    resume_filter = request.args.get('resume_status', 'all')
    skill_filter = request.args.get('skills', '').strip().lower()
    
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc').lower()
    if sort_order not in ('asc', 'desc'):
        sort_order = 'desc'

    sort_columns = {
        'name': 'u.full_name',
        'readiness': 'cp.readiness_score',
        'created_at': 'u.created_at',
        'last_active': 'u.last_login_at',
        'preferred_role': 'cp.preferred_role'
    }
    sort_col = sort_columns.get(sort_by, 'u.created_at')

    query_where = ["u.role = 'candidate'"]
    params = []

    if search:
        query_where.append("""
            (LOWER(u.full_name) LIKE %s 
             OR LOWER(u.email) LIKE %s 
             OR LOWER(cp.preferred_role) LIKE %s
             OR LOWER(cp.location) LIKE %s
             OR EXISTS (
                 SELECT 1 FROM candidate_skills cs 
                 WHERE cs.user_id = u.id AND LOWER(cs.skill_name) LIKE %s
             )
             OR EXISTS (
                 SELECT 1 FROM resumes r 
                 WHERE r.user_id = u.id AND LOWER(r.original_filename) LIKE %s
             ))
        """)
        term = f"%{search}%"
        params.extend([term, term, term, term, term, term])

    if status_filter == 'active':
        query_where.append("u.is_active = 1")
    elif status_filter == 'inactive':
        query_where.append("u.is_active = 0")
    elif status_filter == 'verified':
        query_where.append("u.email_verified = 1")
    elif status_filter == 'unverified':
        query_where.append("u.email_verified = 0")

    if readiness_filter == '80-100':
        query_where.append("cp.readiness_score >= 80")
    elif readiness_filter == '60-79':
        query_where.append("cp.readiness_score >= 60 AND cp.readiness_score <= 79")
    elif readiness_filter == '40-59':
        query_where.append("cp.readiness_score >= 40 AND cp.readiness_score <= 59")
    elif readiness_filter == '0-39':
        query_where.append("cp.readiness_score <= 39")

    if resume_filter == 'analyzed':
        query_where.append("EXISTS (SELECT 1 FROM resumes r WHERE r.user_id = u.id AND r.status = 'parsed')")
    elif resume_filter == 'not_analyzed':
        query_where.append("NOT EXISTS (SELECT 1 FROM resumes r WHERE r.user_id = u.id)")

    if skill_filter:
        query_where.append("EXISTS (SELECT 1 FROM candidate_skills cs WHERE cs.user_id = u.id AND LOWER(cs.skill_name) = %s)")
        params.append(skill_filter)

    where_clause = " AND ".join(query_where)

    # 1. Total Count
    count_query = f"""
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
        WHERE {where_clause}
    """
    total_records = execute_query(count_query, params, fetchone=True)['count']

    # 2. Results Query
    select_query = f"""
        SELECT u.id, u.full_name, u.email, u.email_verified, u.is_active, u.created_at, u.last_login_at,
               cp.headline, cp.preferred_role, cp.location, cp.profile_completion, cp.readiness_score,
               (SELECT r.original_filename FROM resumes r WHERE r.user_id = u.id ORDER BY r.id DESC LIMIT 1) as resume_filename,
               (SELECT r.status FROM resumes r WHERE r.user_id = u.id ORDER BY r.id DESC LIMIT 1) as resume_status
        FROM users u
        LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
        WHERE {where_clause}
        ORDER BY {sort_col} {sort_order}
        LIMIT %s OFFSET %s
    """
    pagination_params = params + [limit, offset]
    candidates = execute_query(select_query, pagination_params, fetchall=True) or []

    result = []
    for c in candidates:
        result.append({
            'id': c['id'],
            'full_name': c['full_name'],
            'email': c['email'],
            'email_verified': bool(c['email_verified']),
            'is_active': bool(c['is_active']),
            'created_at': c['created_at'].isoformat() if hasattr(c['created_at'], 'isoformat') else str(c['created_at']),
            'last_login_at': c['last_login_at'].isoformat() if (c.get('last_login_at') and hasattr(c['last_login_at'], 'isoformat')) else (str(c.get('last_login_at')) if c.get('last_login_at') else None),
            'headline': c.get('headline'),
            'preferred_role': c.get('preferred_role'),
            'location': c.get('location'),
            'profile_completion': c.get('profile_completion') or 0,
            'readiness_score': c.get('readiness_score') or 0,
            'resume_filename': c.get('resume_filename'),
            'resume_status': c.get('resume_status') or 'no_resume'
        })

    return jsonify({
        'candidates': result,
        'pagination': {
            'total': total_records,
            'page': page,
            'limit': limit,
            'pages': (total_records + limit - 1) // limit
        }
    }), 200

@admin_bp.route('/candidates/<int:candidate_id>', methods=['GET'])
def get_candidate_detail(candidate_id):
    """Returns full dossier for a specific candidate including resume upload history."""
    admin, err = require_admin()
    if err: return err

    user = execute_query("SELECT id, full_name, email, email_verified, is_active, auth_provider, created_at, last_login_at FROM users WHERE id = %s AND role = 'candidate'", (candidate_id,), fetchone=True)
    if not user:
        return jsonify({'error': 'Candidate not found.'}), 404

    profile = execute_query("SELECT * FROM candidate_profiles WHERE user_id = %s", (candidate_id,), fetchone=True)
    skills = execute_query("SELECT * FROM candidate_skills WHERE user_id = %s", (candidate_id,), fetchall=True) or []
    education = execute_query("SELECT * FROM candidate_education WHERE user_id = %s", (candidate_id,), fetchall=True) or []
    experience = execute_query("SELECT * FROM candidate_experience WHERE user_id = %s", (candidate_id,), fetchall=True) or []
    projects = execute_query("SELECT * FROM candidate_projects WHERE user_id = %s", (candidate_id,), fetchall=True) or []
    
    # Fetch all resumes for versioning history
    resumes = execute_query("SELECT * FROM resumes WHERE user_id = %s ORDER BY id DESC", (candidate_id,), fetchall=True) or []
    latest_resume = resumes[0] if resumes else None

    ai_record = execute_query("SELECT * FROM ai_analysis WHERE user_id = %s", (candidate_id,), fetchone=True)

    matches = execute_query(
        """
        SELECT jm.*, j.title, j.company
        FROM job_matches jm
        JOIN jobs j ON jm.job_id = j.id
        WHERE jm.user_id = %s
        ORDER BY jm.match_percentage DESC
        """,
        (candidate_id,),
        fetchall=True
    ) or []

    gaps = execute_query("SELECT * FROM skill_gaps WHERE user_id = %s", (candidate_id,), fetchall=True) or []

    def safe_json(val):
        if isinstance(val, str):
            try: return json.loads(val)
            except Exception: return val
        return val

    resumes_list = []
    for r in resumes:
        resumes_list.append({
            'id': r['id'],
            'original_filename': r['original_filename'],
            'stored_filename': r['stored_filename'],
            'uploaded_at': r['uploaded_at'].isoformat() if hasattr(r['uploaded_at'], 'isoformat') else str(r['uploaded_at']),
            'status': r.get('status', 'parsed'),
            'ats_score': r.get('ats_score') or 0,
            'readiness_score': r.get('readiness_score') or 0,
            'version': r.get('version') or 1
        })

    return jsonify({
        'user': dict(user),
        'profile': dict(profile) if profile else {},
        'skills': [dict(s) for s in skills],
        'education': [dict(e) for e in education],
        'experience': [dict(exp) for exp in experience],
        'projects': [dict(p) for p in projects],
        'resume': dict(latest_resume) if latest_resume else None,
        'resumes': resumes_list,
        'ai_analysis': {
            'readiness_score': ai_record['readiness_score'] if ai_record else 0,
            'profile_summary': ai_record['profile_summary'] if ai_record else 'None',
            'recommended_roles': safe_json(ai_record['recommended_roles']) if ai_record else [],
            'strengths': safe_json(ai_record['strengths']) if ai_record else [],
            'weaknesses': safe_json(ai_record['weaknesses']) if ai_record else [],
            'resume_feedback': ai_record['resume_feedback'] if ai_record else '',
            'career_roadmap': safe_json(ai_record['career_roadmap']) if ai_record else []
        } if ai_record else None,
        'job_matches': [dict(m) for m in matches],
        'skill_gaps': [dict(g) for g in gaps]
    }), 200

@admin_bp.route('/candidates/<int:candidate_id>/status', methods=['PATCH'])
def toggle_candidate_status(candidate_id):
    """Activates or deactivates candidate account."""
    admin, err = require_admin()
    if err: return err

    data = request.get_json() or {}
    if not isinstance(data.get('is_active'), bool):
        return jsonify({'error': 'is_active must be a boolean.'}), 422
    is_active = data['is_active']

    candidate = execute_query("SELECT id FROM users WHERE id = %s AND role = 'candidate'", (candidate_id,), fetchone=True)
    if not candidate:
        return jsonify({'error': 'Candidate not found.'}), 404
    execute_query("UPDATE users SET is_active = %s WHERE id = %s AND role = 'candidate'", (is_active, candidate_id), commit=True)
    action = 'candidate_activated' if is_active else 'candidate_deactivated'
    log_audit_event(admin['id'], 'admin', action, 'user', candidate_id, f"Candidate status changed to active={is_active}", request.remote_addr)

    return jsonify({'success': True, 'is_active': is_active}), 200

@admin_bp.route('/candidates/<int:candidate_id>', methods=['DELETE'])
def delete_candidate(candidate_id):
    """Deletes candidate account."""
    admin, err = require_admin()
    if err: return err

    candidate = execute_query("SELECT id FROM users WHERE id = %s AND role = 'candidate'", (candidate_id,), fetchone=True)
    if not candidate:
        return jsonify({'error': 'Candidate not found.'}), 404
    resume_files = execute_query("SELECT stored_filename FROM resumes WHERE user_id = %s", (candidate_id,), fetchall=True) or []
    execute_query("DELETE FROM users WHERE id = %s AND role = 'candidate'", (candidate_id,), commit=True)
    for resume in resume_files:
        try:
            (Config.UPLOAD_FOLDER / Path(resume['stored_filename']).name).unlink(missing_ok=True)
        except OSError:
            logger.warning('Failed to remove stored resume for deleted candidate_id=%s', candidate_id)
    log_audit_event(admin['id'], 'admin', 'candidate_deleted', 'user', candidate_id, f"Candidate {candidate_id} permanently deleted", request.remote_addr)
    return jsonify({'success': True, 'message': 'Candidate record deleted.'}), 200

# ==================================================
# ADMIN JOB MANAGEMENT
# ==================================================


@admin_bp.route('/jobs', methods=['GET'])
def admin_get_jobs():
    admin, err = require_admin()
    if err: return err

    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    offset = (page - 1) * limit

    search = request.args.get('search', '').strip().lower()
    status_filter = request.args.get('status', 'all')
    work_mode_filter = request.args.get('work_mode', 'all')
    employment_type_filter = request.args.get('employment_type', 'all')
    experience_level_filter = request.args.get('experience_level', 'all')

    query_where = []
    params = []

    if search:
        query_where.append("(LOWER(title) LIKE %s OR LOWER(company) LIKE %s OR LOWER(location) LIKE %s OR LOWER(required_skills) LIKE %s)")
        term = f"%{search}%"
        params.extend([term, term, term, term])

    if status_filter != 'all':
        query_where.append("status = %s")
        params.append(status_filter)

    if work_mode_filter != 'all':
        query_where.append("work_mode = %s")
        params.append(work_mode_filter)

    if employment_type_filter != 'all':
        query_where.append("employment_type = %s")
        params.append(employment_type_filter)

    if experience_level_filter != 'all':
        query_where.append("experience_level = %s")
        params.append(experience_level_filter)

    where_clause = " AND ".join(query_where) if query_where else "1=1"

    # Get total count
    count_query = f"SELECT COUNT(*) as count FROM jobs WHERE {where_clause}"
    total_records = execute_query(count_query, params, fetchone=True)['count']

    # Get paginated results with applications and matches counts
    select_query = f"""
        SELECT *,
               (SELECT COUNT(*) FROM applications a WHERE a.job_id = jobs.id) as applications_count,
               (SELECT COUNT(*) FROM job_matches jm WHERE jm.job_id = jobs.id AND jm.match_percentage >= 60) as matched_candidates_count
        FROM jobs
        WHERE {where_clause}
        ORDER BY id DESC
        LIMIT %s OFFSET %s
    """
    pagination_params = params + [limit, offset]
    jobs = execute_query(select_query, pagination_params, fetchall=True) or []

    def safe_json(v):
        if isinstance(v, str):
            try: return json.loads(v)
            except Exception: return []
        return v or []

    result = []
    for j in jobs:
        d = dict(j)
        d['required_skills'] = safe_json(d['required_skills'])
        d['nice_to_have_skills'] = safe_json(d['nice_to_have_skills'])
        result.append(d)

    return jsonify({
        'jobs': result,
        'pagination': {
            'total': total_records,
            'page': page,
            'limit': limit,
            'pages': (total_records + limit - 1) // limit
        }
    }), 200

@admin_bp.route('/jobs', methods=['POST'])
def admin_create_job():
    admin, err = require_admin()
    if err: return err

    data = request.get_json() or {}
    company = data.get('company', '').strip()
    title = data.get('title', '').strip()
    department = data.get('department', 'Engineering')
    location = data.get('location', '').strip()
    work_mode = data.get('work_mode', 'Hybrid')
    employment_type = data.get('employment_type', 'Full-time')
    experience_level = data.get('experience_level', 'Mid-level')
    description = data.get('description', '').strip()
    required_skills = data.get('required_skills', [])
    nice_to_have_skills = data.get('nice_to_have_skills', [])
    application_deadline = data.get('application_deadline', '')
    status = data.get('status', 'Active')

    try:
        salary_min = int(data.get('salary_min', 0))
    except Exception:
        salary_min = 0

    try:
        salary_max = int(data.get('salary_max', 0))
    except Exception:
        salary_max = 0

    if not company or not title or not description:
        return jsonify({'error': 'Company, title, and description are required.'}), 400

    # Auto experience description mapper
    exp_map = {
        'Entry level': '0-1 Years',
        'Junior': '1-2 Years',
        'Mid-level': '3-5 Years',
        'Senior': '5-8 Years',
        'Lead': '8+ Years'
    }
    experience_required = exp_map.get(experience_level, '3-5 Years')

    # Format salary string for backward compatibility
    salary = f"₹{salary_min:,} - ₹{salary_max:,} LPA" if (salary_min and salary_max) else "Competitive"

    skills_json = json.dumps(required_skills if isinstance(required_skills, list) else [s.strip() for s in str(required_skills).split(',')])
    nice_skills_json = json.dumps(nice_to_have_skills if isinstance(nice_to_have_skills, list) else [s.strip() for s in str(nice_to_have_skills).split(',')])
    is_active = status == 'Active'

    job_id = execute_query(
        """
        INSERT INTO jobs (company, title, department, location, work_mode, salary, description, required_skills, status, is_active, 
                          employment_type, experience_level, salary_min, salary_max, nice_to_have_skills, application_deadline, experience_required)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (company, title, department, location, work_mode, salary, description, skills_json, status, is_active,
         employment_type, experience_level, salary_min, salary_max, nice_skills_json, application_deadline, experience_required),
        commit=True,
        return_id=True
    )

    log_audit_event(admin['id'], 'admin', 'job_created', 'job', job_id, f"Created job posting: {title} at {company}", request.remote_addr)
    
    # Reload created record to return to UI
    job_record = execute_query("SELECT * FROM jobs WHERE id = %s", (job_id,), fetchone=True)
    d = dict(job_record)
    d['required_skills'] = required_skills
    d['nice_to_have_skills'] = nice_to_have_skills

    return jsonify({'success': True, 'job': d}), 201

@admin_bp.route('/jobs/<int:job_id>', methods=['PUT', 'PATCH'])
def admin_update_job(job_id):
    admin, err = require_admin()
    if err: return err

    data = request.get_json() or {}
    company = data.get('company', '').strip()
    title = data.get('title', '').strip()
    department = data.get('department', 'Engineering')
    location = data.get('location', '').strip()
    work_mode = data.get('work_mode', 'Hybrid')
    employment_type = data.get('employment_type', 'Full-time')
    experience_level = data.get('experience_level', 'Mid-level')
    description = data.get('description', '').strip()
    required_skills = data.get('required_skills', [])
    nice_to_have_skills = data.get('nice_to_have_skills', [])
    application_deadline = data.get('application_deadline', '')
    status = data.get('status', 'Active')

    current_job = execute_query("SELECT id FROM jobs WHERE id = %s", (job_id,), fetchone=True)
    if not current_job:
        return jsonify({'error': 'Job not found.'}), 404

    try:
        salary_min = int(data.get('salary_min', 0))
    except Exception:
        salary_min = 0

    try:
        salary_max = int(data.get('salary_max', 0))
    except Exception:
        salary_max = 0

    exp_map = {
        'Entry level': '0-1 Years',
        'Junior': '1-2 Years',
        'Mid-level': '3-5 Years',
        'Senior': '5-8 Years',
        'Lead': '8+ Years'
    }
    experience_required = exp_map.get(experience_level, '3-5 Years')
    salary = f"₹{salary_min:,} - ₹{salary_max:,} LPA" if (salary_min and salary_max) else "Competitive"

    is_active = status == 'Active'
    skills_json = json.dumps(required_skills if isinstance(required_skills, list) else [s.strip() for s in str(required_skills).split(',')])
    nice_skills_json = json.dumps(nice_to_have_skills if isinstance(nice_to_have_skills, list) else [s.strip() for s in str(nice_to_have_skills).split(',')])

    execute_query(
        """
        UPDATE jobs
        SET company = %s, title = %s, department = %s, location = %s, work_mode = %s,
            salary = %s, description = %s, required_skills = %s, status = %s, is_active = %s,
            employment_type = %s, experience_level = %s, salary_min = %s, salary_max = %s,
            nice_to_have_skills = %s, application_deadline = %s, experience_required = %s
        WHERE id = %s
        """,
        (company, title, department, location, work_mode, salary, description, skills_json, status, is_active,
         employment_type, experience_level, salary_min, salary_max, nice_skills_json, application_deadline, experience_required, job_id),
        commit=True
    )

    log_audit_event(admin['id'], 'admin', 'job_updated', 'job', job_id, f"Updated job posting {job_id} to status {status}", request.remote_addr)
    
    # Reload and return updated job
    job_record = execute_query("SELECT * FROM jobs WHERE id = %s", (job_id,), fetchone=True)
    d = dict(job_record)
    d['required_skills'] = required_skills
    d['nice_to_have_skills'] = nice_to_have_skills

    return jsonify({'success': True, 'job': d}), 200

@admin_bp.route('/jobs/<int:job_id>/pause', methods=['POST'])
def admin_pause_job(job_id):
    admin, err = require_admin()
    if err: return err

    job = execute_query("SELECT id FROM jobs WHERE id = %s", (job_id,), fetchone=True)
    if not job:
        return jsonify({'error': 'Job not found.'}), 404

    execute_query("UPDATE jobs SET status = 'PAUSED', is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (job_id,), commit=True)
    execute_query("DELETE FROM job_matches WHERE job_id = %s", (job_id,), commit=True)
    log_audit_event(admin['id'], 'admin', 'job_paused', 'job', job_id, f"Paused job requisition {job_id}", request.remote_addr)
    return jsonify({'success': True, 'message': 'Job requisition paused.'}), 200

@admin_bp.route('/jobs/<int:job_id>/resume', methods=['POST'])
def admin_resume_job(job_id):
    admin, err = require_admin()
    if err: return err

    job = execute_query("SELECT id FROM jobs WHERE id = %s", (job_id,), fetchone=True)
    if not job:
        return jsonify({'error': 'Job not found.'}), 404

    execute_query("UPDATE jobs SET status = 'ACTIVE', is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (job_id,), commit=True)
    log_audit_event(admin['id'], 'admin', 'job_resumed', 'job', job_id, f"Resumed job requisition {job_id}", request.remote_addr)
    return jsonify({'success': True, 'message': 'Job requisition resumed.'}), 200

@admin_bp.route('/jobs/<int:job_id>/archive', methods=['POST'])
def admin_archive_job(job_id):
    admin, err = require_admin()
    if err: return err

    job = execute_query("SELECT id FROM jobs WHERE id = %s", (job_id,), fetchone=True)
    if not job:
        return jsonify({'error': 'Job not found.'}), 404

    execute_query("UPDATE jobs SET status = 'ARCHIVED', is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (job_id,), commit=True)
    execute_query("DELETE FROM job_matches WHERE job_id = %s", (job_id,), commit=True)
    log_audit_event(admin['id'], 'admin', 'job_archived', 'job', job_id, f"Archived job requisition {job_id}", request.remote_addr)
    return jsonify({'success': True, 'message': 'Job requisition archived.'}), 200

@admin_bp.route('/jobs/<int:job_id>', methods=['DELETE'])
def admin_delete_job(job_id):
    admin, err = require_admin()
    if err: return err

    job = execute_query("SELECT id FROM jobs WHERE id = %s", (job_id,), fetchone=True)
    if not job:
        return jsonify({'error': 'Job not found.'}), 404

    execute_query("DELETE FROM job_matches WHERE job_id = %s", (job_id,), commit=True)
    execute_query("DELETE FROM jobs WHERE id = %s", (job_id,), commit=True)
    log_audit_event(admin['id'], 'admin', 'job_deleted', 'job', job_id, f"Permanently deleted job requisition {job_id}", request.remote_addr)
    return jsonify({'success': True, 'message': 'Job requisition deleted successfully.'}), 200

@admin_bp.route('/resumes/<int:resume_id>/download', methods=['GET'])
def admin_download_resume(resume_id):
    """Allows authorized admin to download candidate raw PDF resume files."""
    admin, err = require_admin()
    if err: return err

    resume = execute_query("SELECT user_id, original_filename, stored_filename FROM resumes WHERE id = %s", (resume_id,), fetchone=True)
    if not resume:
        return jsonify({'error': 'Resume not found.'}), 404

    # File path: Config.UPLOAD_FOLDER / 'resumes' / f"user_{user_id}" / stored_filename
    file_path = Config.UPLOAD_FOLDER / 'resumes' / f"user_{resume['user_id']}" / resume['stored_filename']
    if not file_path.exists():
        return jsonify({'error': 'Resume file not found on disk.'}), 404

    from flask import send_file
    log_audit_event(admin['id'], 'admin', 'resume_downloaded', 'resume', resume_id, f"Downloaded resume: {resume['original_filename']}", request.remote_addr)

    return send_file(
        str(file_path),
        download_name=resume['original_filename'],
        as_attachment=True
    )

@admin_bp.route('/resumes/<int:resume_id>/reanalyze', methods=['POST'])
def admin_reanalyze_resume(resume_id):
    """Triggers backend re-parsing and ATS analysis of a candidate's uploaded resume."""
    admin, err = require_admin()
    if err: return err

    rec = execute_query("SELECT * FROM resumes WHERE id = %s", (resume_id,), fetchone=True)
    if not rec:
        return jsonify({'error': 'Resume record not found.'}), 404

    candidate_id = rec['user_id']
    user = execute_query("SELECT id, full_name, email FROM users WHERE id = %s", (candidate_id,), fetchone=True)
    if not user:
        return jsonify({'error': 'Candidate user not found.'}), 404

    user_upload_dir = Config.UPLOAD_FOLDER / 'resumes' / f"user_{candidate_id}"
    file_path = user_upload_dir / rec['stored_filename']
    if not file_path.exists():
        return jsonify({'error': 'PDF file missing on server.'}), 404

    with open(file_path, 'rb') as f:
        file_bytes = f.read()

    from services.pdf_service import extract_text_from_pdf
    extraction = extract_text_from_pdf(file_bytes)
    if not extraction['success']:
        return jsonify({'error': extraction['error']}), 400

    extracted_text = extraction['extracted_text']
    from services.resume_analysis_service import parse_and_structure_resume_text, calculate_deterministic_ats_score, sync_resume_to_candidate_ecosystem
    structured_data = parse_and_structure_resume_text(extracted_text, user)
    ats_score_res = calculate_deterministic_ats_score(structured_data)
    ats_score = ats_score_res['score']
    readiness_score = ats_score_res['readiness_score']

    execute_query(
        """
        UPDATE resumes
        SET extracted_text = %s, parsed_json = %s, status = 'parsed',
            ats_score = %s, readiness_score = %s, parsed_at = CURRENT_TIMESTAMP
        WHERE id = %s
        """,
        (extracted_text, json.dumps(structured_data), ats_score, readiness_score, resume_id),
        commit=True
    )

    sync_resume_to_candidate_ecosystem(candidate_id, structured_data, ats_score)

    # Recalculate job matches
    from services.job_matching_service import calculate_job_matches_for_user
    try:
        calculate_job_matches_for_user(candidate_id)
    except Exception as e:
        logger.error(f"Error recalculating matches: {e}")

    log_audit_event(admin['id'], 'admin', 'resume_analyzed', 'resume', resume_id, f"Admin re-analyzed resume v{rec.get('version', 1)} for user {candidate_id}", request.remote_addr)
    return jsonify({'success': True, 'message': 'Resume re-analyzed successfully and profile sync completed.'}), 200

@admin_bp.route('/audit-logs', methods=['GET'])
def get_audit_logs():
    """Returns platform audit history with backend pagination."""
    admin, err = require_admin()
    if err: return err

    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 30))
    offset = (page - 1) * limit

    total_logs = execute_query("SELECT COUNT(*) as count FROM audit_logs", fetchone=True)['count']
    logs = execute_query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT %s OFFSET %s", (limit, offset), fetchall=True) or []

    result = []
    for l in logs:
        result.append({
            'id': l['id'],
            'actor_id': l.get('actor_id'),
            'actor_type': l.get('actor_type'),
            'action': l['action'],
            'target_type': l.get('target_type'),
            'target_id': l.get('target_id'),
            'details': l.get('details'),
            'ip_address': l.get('ip_address') or '127.0.0.1',
            'created_at': l['created_at'].isoformat() if hasattr(l['created_at'], 'isoformat') else str(l['created_at'])
        })

    return jsonify({
        'logs': result,
        'pagination': {
            'total': total_logs,
            'page': page,
            'limit': limit,
            'pages': (total_logs + limit - 1) // limit
        }
    }), 200
