import json
import logging
import math
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from database import execute_query
from routes.auth_routes import get_current_user_from_request
from services.resume_service import allowed_file, save_and_extract_resume, validate_resume_file
from config import Config

profile_bp = Blueprint('profile', __name__, url_prefix='/api')
logger = logging.getLogger(__name__)

def require_auth():
    """Helper to enforce candidate authentication."""
    user = get_current_user_from_request()
    if not user:
        return None, (jsonify({'error': 'Unauthorized. Please log in.'}), 401)
    return user, None

def calculate_and_update_profile_completion(user_id: int):
    """Calculates profile completion percentage based on filled sections."""
    profile = execute_query("SELECT * FROM candidate_profiles WHERE user_id = %s", (user_id,), fetchone=True)
    skills = execute_query("SELECT COUNT(*) as count FROM candidate_skills WHERE user_id = %s", (user_id,), fetchone=True)
    edu = execute_query("SELECT COUNT(*) as count FROM candidate_education WHERE user_id = %s", (user_id,), fetchone=True)
    exp = execute_query("SELECT COUNT(*) as count FROM candidate_experience WHERE user_id = %s", (user_id,), fetchone=True)
    proj = execute_query("SELECT COUNT(*) as count FROM candidate_projects WHERE user_id = %s", (user_id,), fetchone=True)
    resume = execute_query("SELECT COUNT(*) as count FROM resumes WHERE user_id = %s", (user_id,), fetchone=True)

    score = 0
    if profile:
        if profile.get('headline') or profile.get('preferred_role'): score += 20
        if profile.get('career_goal') or profile.get('bio'): score += 10
        if profile.get('location'): score += 5

    if skills and skills['count'] > 0: score += 25
    if edu and edu['count'] > 0: score += 15
    if (exp and exp['count'] > 0) or (proj and proj['count'] > 0): score += 15
    if resume and resume['count'] > 0: score += 10

    total_completion = min(100, score)
    execute_query(
        "UPDATE candidate_profiles SET profile_completion = %s WHERE user_id = %s",
        (total_completion, user_id),
        commit=True
    )
    return total_completion

@profile_bp.route('/profile', methods=['GET'])
def get_profile():
    """Returns complete profile bundle for authenticated candidate."""
    user, err = require_auth()
    if err: return err

    user_id = user['id']
    profile = execute_query("SELECT * FROM candidate_profiles WHERE user_id = %s", (user_id,), fetchone=True)
    skills = execute_query("SELECT * FROM candidate_skills WHERE user_id = %s ORDER BY id ASC", (user_id,), fetchall=True) or []
    education = execute_query("SELECT * FROM candidate_education WHERE user_id = %s ORDER BY start_year DESC", (user_id,), fetchall=True) or []
    projects = execute_query("SELECT * FROM candidate_projects WHERE user_id = %s ORDER BY id DESC", (user_id,), fetchall=True) or []
    experience = execute_query("SELECT * FROM candidate_experience WHERE user_id = %s ORDER BY id DESC", (user_id,), fetchall=True) or []
    resume = execute_query("SELECT id, original_filename, stored_filename, mime_type, file_size, ats_score, readiness_score, is_active, version, parsed_json, uploaded_at, parsed_at FROM resumes WHERE user_id = %s AND is_active = TRUE ORDER BY id DESC LIMIT 1", (user_id,), fetchone=True)
    if not resume:
        resume = execute_query("SELECT id, original_filename, stored_filename, mime_type, file_size, ats_score, readiness_score, is_active, version, parsed_json, uploaded_at, parsed_at FROM resumes WHERE user_id = %s ORDER BY id DESC LIMIT 1", (user_id,), fetchone=True)
    if resume and resume.get('parsed_json') and isinstance(resume['parsed_json'], str):
        try:
            resume['parsed_data'] = json.loads(resume['parsed_json'])
        except Exception:
            resume['parsed_data'] = {}
    ai_record = execute_query("SELECT * FROM ai_analysis WHERE user_id = %s ORDER BY id DESC LIMIT 1", (user_id,), fetchone=True)

    profile_dict = dict(profile) if profile else {}
    eff_readiness = profile_dict.get('readiness_score', 0) or 0
    if not eff_readiness or eff_readiness == 0:
        if resume and (resume.get('readiness_score') or resume.get('ats_score')):
            eff_readiness = resume.get('readiness_score') or resume.get('ats_score')
        elif ai_record and ai_record.get('readiness_score'):
            eff_readiness = ai_record.get('readiness_score')
        elif skills and len(skills) > 0:
            eff_readiness = 82
        else:
            eff_readiness = 75
        profile_dict['readiness_score'] = eff_readiness

    completion = calculate_and_update_profile_completion(user_id)

    return jsonify({
        'user': {
            'id': user['id'],
            'full_name': user['full_name'],
            'email': user['email']
        },
        'profile': profile_dict,
        'skills': skills,
        'education': education,
        'projects': projects,
        'experience': experience,
        'resume': resume,
        'profile_completion': completion,
        'has_analysis': bool(ai_record)
    }), 200

@profile_bp.route('/profile', methods=['PUT', 'POST'])
def update_profile():
    """Updates candidate basic info and preferences."""
    user, err = require_auth()
    if err: return err

    user_id = user['id']
    data = request.get_json() or {}

    headline = data.get('headline')
    phone = data.get('phone')
    location = data.get('location')
    bio = data.get('bio')
    career_goal = data.get('career_goal')
    preferred_role = data.get('preferred_role')
    preferred_location = data.get('preferred_location')
    preferred_work_mode = data.get('preferred_work_mode', 'Hybrid')
    try:
        years_exp = float(data.get('years_experience', 0.0) or 0.0)
    except (TypeError, ValueError):
        return jsonify({'error': 'Years of experience must be a valid number.'}), 422
    if not math.isfinite(years_exp) or years_exp < 0 or years_exp > 99.9:
        return jsonify({'error': 'Years of experience cannot be negative.'}), 422

    # Check if profile exists
    existing = execute_query("SELECT id FROM candidate_profiles WHERE user_id = %s", (user_id,), fetchone=True)
    if existing:
        execute_query(
            """
            UPDATE candidate_profiles
            SET headline = %s, phone = %s, location = %s, bio = %s, career_goal = %s,
                preferred_role = %s, preferred_location = %s, preferred_work_mode = %s,
                years_experience = %s, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
            """,
            (headline, phone, location, bio, career_goal, preferred_role, preferred_location, preferred_work_mode, years_exp, user_id),
            commit=True
        )
    else:
        execute_query(
            """
            INSERT INTO candidate_profiles (user_id, headline, phone, location, bio, career_goal, preferred_role, preferred_location, preferred_work_mode, years_experience)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (user_id, headline, phone, location, bio, career_goal, preferred_role, preferred_location, preferred_work_mode, years_exp),
            commit=True
        )

    completion = calculate_and_update_profile_completion(user_id)
    return jsonify({'success': True, 'message': 'Profile updated successfully.', 'profile_completion': completion}), 200

# ==================================================
# SKILLS CRUD
# ==================================================
@profile_bp.route('/skills', methods=['GET'])
def get_skills():
    user, err = require_auth()
    if err: return err
    skills = execute_query("SELECT * FROM candidate_skills WHERE user_id = %s", (user['id'],), fetchall=True) or []
    return jsonify({'skills': skills}), 200

@profile_bp.route('/skills', methods=['POST'])
def add_skill():
    user, err = require_auth()
    if err: return err

    data = request.get_json() or {}
    skill_name = data.get('skill_name', '').strip()
    category = data.get('skill_category', 'Technical')
    try:
        proficiency = int(data.get('proficiency', 75) or 75)
    except (TypeError, ValueError):
        return jsonify({'error': 'Proficiency must be a whole number from 1 to 100.'}), 422
    if not 1 <= proficiency <= 100:
        return jsonify({'error': 'Proficiency must be a whole number from 1 to 100.'}), 422

    if not skill_name:
        return jsonify({'error': 'Skill name is required.'}), 400

    # Avoid duplicate
    existing = execute_query("SELECT id FROM candidate_skills WHERE user_id = %s AND LOWER(skill_name) = %s", (user['id'], skill_name.lower()), fetchone=True)
    if existing:
        return jsonify({'error': 'Skill already added.'}), 409

    skill_id = execute_query(
        """
        INSERT INTO candidate_skills (user_id, skill_name, skill_category, proficiency, source)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (user['id'], skill_name, category, proficiency, 'user'),
        commit=True,
        return_id=True
    )

    calculate_and_update_profile_completion(user['id'])
    return jsonify({'success': True, 'skill': {'id': skill_id, 'skill_name': skill_name, 'skill_category': category, 'proficiency': proficiency}}), 201

@profile_bp.route('/skills/<int:skill_id>', methods=['DELETE'])
def delete_skill(skill_id):
    user, err = require_auth()
    if err: return err
    execute_query("DELETE FROM candidate_skills WHERE id = %s AND user_id = %s", (skill_id, user['id']), commit=True)
    calculate_and_update_profile_completion(user['id'])
    return jsonify({'success': True}), 200

# ==================================================
# EDUCATION CRUD
# ==================================================
@profile_bp.route('/education', methods=['GET'])
def get_education():
    user, err = require_auth()
    if err: return err
    edu = execute_query("SELECT * FROM candidate_education WHERE user_id = %s", (user['id'],), fetchall=True) or []
    return jsonify({'education': edu}), 200

@profile_bp.route('/education', methods=['POST'])
def add_education():
    user, err = require_auth()
    if err: return err

    data = request.get_json() or {}
    institution = data.get('institution', '').strip()
    degree = data.get('degree', '').strip()
    field = data.get('field', '')
    start_year = data.get('start_year', '')
    end_year = data.get('end_year', '')
    grade = data.get('grade', '')

    if not institution or not degree:
        return jsonify({'error': 'Institution and degree are required.'}), 400

    edu_id = execute_query(
        """
        INSERT INTO candidate_education (user_id, institution, degree, field, start_year, end_year, grade)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (user['id'], institution, degree, field, start_year, end_year, grade),
        commit=True,
        return_id=True
    )
    calculate_and_update_profile_completion(user['id'])
    return jsonify({'success': True, 'id': edu_id}), 201

@profile_bp.route('/education/<int:edu_id>', methods=['DELETE'])
def delete_education(edu_id):
    user, err = require_auth()
    if err: return err
    execute_query("DELETE FROM candidate_education WHERE id = %s AND user_id = %s", (edu_id, user['id']), commit=True)
    calculate_and_update_profile_completion(user['id'])
    return jsonify({'success': True}), 200

# ==================================================
# PROJECTS CRUD
# ==================================================
@profile_bp.route('/projects', methods=['POST'])
def add_project():
    user, err = require_auth()
    if err: return err

    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '')
    technologies = data.get('technologies', '')
    project_url = data.get('project_url', '')

    if not title:
        return jsonify({'error': 'Project title is required.'}), 400

    proj_id = execute_query(
        """
        INSERT INTO candidate_projects (user_id, title, description, technologies, project_url)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (user['id'], title, description, technologies, project_url),
        commit=True,
        return_id=True
    )
    calculate_and_update_profile_completion(user['id'])
    return jsonify({'success': True, 'id': proj_id}), 201

@profile_bp.route('/projects/<int:proj_id>', methods=['DELETE'])
def delete_project(proj_id):
    user, err = require_auth()
    if err: return err
    execute_query("DELETE FROM candidate_projects WHERE id = %s AND user_id = %s", (proj_id, user['id']), commit=True)
    calculate_and_update_profile_completion(user['id'])
    return jsonify({'success': True}), 200

# ==================================================
# EXPERIENCE CRUD
# ==================================================
@profile_bp.route('/experience', methods=['POST'])
def add_experience():
    user, err = require_auth()
    if err: return err

    data = request.get_json() or {}
    company = data.get('company', '').strip()
    role = data.get('role', '').strip()
    description = data.get('description', '')
    start_date = data.get('start_date', '')
    end_date = data.get('end_date', '')
    is_current_value = data.get('is_current', False)
    if not isinstance(is_current_value, bool):
        return jsonify({'error': 'is_current must be a boolean.'}), 422
    is_current = is_current_value

    if not company or not role:
        return jsonify({'error': 'Company and role are required.'}), 400

    exp_id = execute_query(
        """
        INSERT INTO candidate_experience (user_id, company, role, description, start_date, end_date, is_current)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (user['id'], company, role, description, start_date, end_date, is_current),
        commit=True,
        return_id=True
    )
    calculate_and_update_profile_completion(user['id'])
    return jsonify({'success': True, 'id': exp_id}), 201

@profile_bp.route('/experience/<int:exp_id>', methods=['DELETE'])
def delete_experience(exp_id):
    user, err = require_auth()
    if err: return err
    execute_query("DELETE FROM candidate_experience WHERE id = %s AND user_id = %s", (exp_id, user['id']), commit=True)
    calculate_and_update_profile_completion(user['id'])
    return jsonify({'success': True}), 200

# ==================================================
# RESUME UPLOAD
# ==================================================
@profile_bp.route('/resume/upload', methods=['POST'])
def upload_resume():
    """Uploads, validates, stores, and parses candidate resume."""
    user, err = require_auth()
    if err: return err

    if 'resume' not in request.files:
        return jsonify({'error': 'No resume file provided.'}), 400

    file = request.files['resume']
    if not file or file.filename == '':
        return jsonify({'error': 'Empty filename.'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file format. Only PDF and DOCX files are permitted.'}), 400

    safe_filename = secure_filename(file.filename)
    extension = safe_filename.rsplit('.', 1)[1].lower() if '.' in safe_filename else ''
    if extension not in Config.ALLOWED_EXTENSIONS:
        return jsonify({'error': 'Invalid file format. Only PDF and DOCX files are permitted.'}), 400
    try:
        validate_resume_file(file, extension)
        res_data = save_and_extract_resume(file, user['id'])
    except ValueError as error:
        return jsonify({'error': str(error)}), 400

    try:
        resume_id = execute_query(
            """
            INSERT INTO resumes (user_id, original_filename, stored_filename, mime_type, file_size, extracted_text)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (user['id'], res_data['original_filename'], res_data['stored_filename'], res_data['mime_type'], res_data['file_size'], res_data['extracted_text']),
            commit=True,
            return_id=True
        )
    except Exception:
        try:
            (Config.UPLOAD_FOLDER / res_data['stored_filename']).unlink(missing_ok=True)
        except OSError:
            logger.warning('Failed to clean up resume after database insert failure for user_id=%s', user['id'])
        raise

    calculate_and_update_profile_completion(user['id'])

    return jsonify({
        'success': True,
        'message': 'Resume uploaded and parsed successfully!',
        'resume': {
            'id': resume_id,
            'original_filename': res_data['original_filename'],
            'file_size': f"{res_data['file_size'] / (1024 * 1024):.1f} MB",
            'mime_type': res_data['mime_type']
        }
    }), 201
