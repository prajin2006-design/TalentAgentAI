import json
import logging
from flask import Blueprint, request, jsonify
from database import execute_query
from routes.auth_routes import get_current_user_from_request

job_bp = Blueprint('jobs', __name__, url_prefix='/api')
logger = logging.getLogger(__name__)

def safe_json(val):
    if isinstance(val, str):
        try: return json.loads(val)
        except Exception: return []
    return val or []

@job_bp.route('/jobs', methods=['GET'])
def get_jobs():
    """Returns active job requisitions."""
    jobs = execute_query(
        "SELECT * FROM jobs WHERE (UPPER(status) = 'ACTIVE' OR status IS NULL) AND is_active = %s ORDER BY id DESC",
        (True,),
        fetchall=True
    ) or []

    result = []
    for j in jobs:
        result.append({
            'id': j['id'],
            'company': j['company'],
            'title': j['title'],
            'department': j.get('department', 'Engineering'),
            'location': j['location'],
            'workType': j['work_mode'],
            'salary': j.get('salary', 'Competitive'),
            'description': j['description'],
            'requiredSkills': safe_json(j['required_skills']),
            'experienceRequired': j.get('experience_required', '0-2 Years'),
            'created_at': str(j.get('created_at'))
        })

    return jsonify({'jobs': result}), 200

@job_bp.route('/jobs/<int:job_id>', methods=['GET'])
def get_job_detail(job_id):
    """Returns single active job details."""
    job = execute_query(
        "SELECT * FROM jobs WHERE id = %s AND (UPPER(status) = 'ACTIVE' OR status IS NULL) AND is_active = %s",
        (job_id, True),
        fetchone=True
    )
    if not job:
        return jsonify({'error': 'Job not found or unavailable.'}), 404

    return jsonify({
        'id': job['id'],
        'company': job['company'],
        'title': job['title'],
        'department': job.get('department', 'Engineering'),
        'location': job['location'],
        'workType': job['work_mode'],
        'salary': job.get('salary', 'Competitive'),
        'description': job['description'],
        'requiredSkills': safe_json(job['required_skills']),
        'experienceRequired': job.get('experience_required', '0-2 Years')
    }), 200

@job_bp.route('/job-matches', methods=['GET'])
def get_user_job_matches():
    """Returns calculated job matches for the authenticated candidate."""
    user = get_current_user_from_request()
    if not user:
        return jsonify({'matches': []}), 200

    # Trigger dynamic recalculation on page load to ensure data is always fresh
    from services.job_matching_service import calculate_job_matches_for_user
    try:
        calculate_job_matches_for_user(user['id'])
    except Exception as e:
        logger.error(f"Error recalculating job matches for user {user['id']}: {e}")

    matches = execute_query(
        """
        SELECT 
            jm.*, 
            j.title, 
            j.company, 
            j.location, 
            j.work_mode, 
            j.salary, 
            j.department, 
            j.description,
            (SELECT COUNT(*) FROM job_bookmarks jb WHERE jb.user_id = jm.user_id AND jb.job_id = jm.job_id) as bookmarked,
            (SELECT status FROM applications a WHERE a.user_id = jm.user_id AND a.job_id = jm.job_id LIMIT 1) as application_status
        FROM job_matches jm
        JOIN jobs j ON jm.job_id = j.id
        WHERE jm.user_id = %s AND (UPPER(j.status) = 'ACTIVE' OR j.status IS NULL) AND j.is_active = %s
        ORDER BY jm.match_percentage DESC
        """,
        (user['id'], True),
        fetchall=True
    ) or []

    result = []
    for m in matches:
        result.append({
            'id': m['job_id'],
            'job_id': m['job_id'],
            'jobId': m['job_id'],
            'title': m['title'],
            'company': m['company'],
            'department': m.get('department', 'Engineering'),
            'location': m['location'],
            'workType': m['work_mode'],
            'work_mode': m['work_mode'],
            'salary': m.get('salary', 'Competitive'),
            'matchPercentage': m['match_percentage'],
            'matchingSkills': safe_json(m['matching_skills']),
            'missingSkills': safe_json(m['missing_skills']),
            'whyRecommended': m.get('why_recommended', ''),
            'saved': bool(m.get('bookmarked', 0) > 0),
            'applied': bool(m.get('application_status') is not None),
            'applicationStatus': m.get('application_status') or 'not_applied',
            'application_status': m.get('application_status') or 'not_applied',
            'description': m.get('description', '')
        })

    return jsonify({'matches': result}), 200

@job_bp.route('/job-matches/<int:job_id>/save', methods=['POST'])
def toggle_save_job(job_id):
    """Toggles saved/bookmarked state for candidate job match."""
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    existing = execute_query(
        "SELECT id FROM job_bookmarks WHERE user_id = %s AND job_id = %s",
        (user['id'], job_id),
        fetchone=True
    )

    if existing:
        execute_query("DELETE FROM job_bookmarks WHERE id = %s", (existing['id'],), commit=True)
        saved = False
    else:
        execute_query("INSERT INTO job_bookmarks (user_id, job_id) VALUES (%s, %s)", (user['id'], job_id), commit=True)
        saved = True

    execute_query(
        "UPDATE job_matches SET is_saved = %s WHERE user_id = %s AND job_id = %s",
        (saved, user['id'], job_id),
        commit=True
    )

    return jsonify({'success': True, 'saved': saved}), 200

@job_bp.route('/jobs/<int:job_id>/apply', methods=['POST'])
def apply_for_job(job_id):
    """Submits candidate job application."""
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized. Please log in.'}), 401

    job = execute_query("SELECT * FROM jobs WHERE id = %s", (job_id,), fetchone=True)
    if not job:
        return jsonify({'error': 'Job post not found.'}), 404

    existing = execute_query("SELECT id, status, applied_at FROM applications WHERE user_id = %s AND job_id = %s", (user['id'], job_id), fetchone=True)
    if existing:
        return jsonify({
            'success': True,
            'message': f"You have already applied for {job['title']} at {job['company']}.",
            'already_applied': True,
            'application': {
                'id': existing['id'],
                'job_id': job_id,
                'jobId': job_id,
                'candidate_id': user['id'],
                'candidateId': user['id'],
                'status': existing['status'],
                'applied_at': str(existing['applied_at'])
            }
        }), 200

    active_resume = execute_query("SELECT id FROM resumes WHERE user_id = %s AND is_active = TRUE ORDER BY id DESC LIMIT 1", (user['id'],), fetchone=True)
    resume_id = active_resume['id'] if active_resume else None

    app_id = execute_query(
        "INSERT INTO applications (user_id, job_id, status, resume_id) VALUES (%s, %s, %s, %s)",
        (user['id'], job_id, 'Submitted', resume_id),
        commit=True,
        return_id=True
    )

    new_app = execute_query("SELECT id, status, applied_at FROM applications WHERE id = %s", (app_id,), fetchone=True)

    return jsonify({
        'success': True,
        'message': f"Application submitted for {job['title']} at {job['company']}!",
        'already_applied': False,
        'application': {
            'id': app_id,
            'job_id': job_id,
            'jobId': job_id,
            'candidate_id': user['id'],
            'candidateId': user['id'],
            'status': new_app['status'] if new_app else 'Submitted',
            'applied_at': str(new_app['applied_at']) if new_app else ''
        }
    }), 201

@job_bp.route('/applications', methods=['GET'])
def get_user_applications():
    """Returns candidate's submitted job applications."""
    user = get_current_user_from_request()
    if not user:
        return jsonify({'applications': []}), 200

    rows = execute_query(
        """
        SELECT a.id AS application_id, a.status AS application_status, a.applied_at, j.*
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE a.user_id = %s
        ORDER BY a.applied_at DESC
        """,
        (user['id'],),
        fetchall=True
    ) or []

    apps = []
    for r in rows:
        apps.append({
            'id': r['application_id'],
            'application_id': r['application_id'],
            'job_id': r['id'],
            'jobId': r['id'],
            'candidate_id': user['id'],
            'candidateId': user['id'],
            'company': r['company'],
            'title': r['title'],
            'location': r['location'],
            'work_mode': r['work_mode'],
            'workType': r['work_mode'],
            'salary': r.get('salary', 'Competitive'),
            'status': r['application_status'],
            'application_status': r['application_status'],
            'applied_at': str(r['applied_at'])
        })

    return jsonify({'success': True, 'applications': apps}), 200

