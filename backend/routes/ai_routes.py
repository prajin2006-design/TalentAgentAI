import json
import logging
from flask import Blueprint, request, jsonify
from config import Config
from database import execute_query
from routes.auth_routes import get_current_user_from_request
from services.ai_service import AIServiceError, analyze_candidate_profile, ask_ai_career_assistant

run_ai_profile_analysis = analyze_candidate_profile

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')
logger = logging.getLogger(__name__)

def require_candidate():
    user = get_current_user_from_request()
    if not user:
        return None, (jsonify({'error': 'Unauthorized. Please log in.'}), 401)
    return user, None

@ai_bp.route('/config', methods=['GET'])
def get_ai_config():
    return get_ai_health()

@ai_bp.route('/analyze-profile', methods=['POST'])
def analyze_profile():
    """Triggers real AI analysis on candidate's profile and resume."""
    user, err = require_candidate()
    if err: return err

    user_id = user['id']
    try:
        analysis_data = run_ai_profile_analysis(user_id)
        return jsonify({
            'success': True,
            'message': 'AI profile analysis completed successfully!',
            'analysis': analysis_data
        }), 200
    except AIServiceError as ai_err:
        return jsonify({'success': False, 'error': ai_err.public_message}), ai_err.status_code
    except Exception as e:
        logger.exception(f"AI profile analysis failed for user_id={user_id}: {e}")
        return jsonify({'error': 'AI analysis failed. Please check OpenAI API setup and try again.'}), 500

@ai_bp.route('/analysis', methods=['GET'])
def get_analysis():
    """Returns stored AI analysis, skill gaps, and job matches for candidate."""
    user, err = require_candidate()
    if err: return err

    user_id = user['id']
    ai_record = execute_query("SELECT * FROM ai_analysis WHERE user_id = %s", (user_id,), fetchone=True)
    if not ai_record:
        return jsonify({'has_analysis': False, 'analysis': None}), 200

    def safe_json(val):
        if isinstance(val, str):
            try: return json.loads(val)
            except Exception: return []
        return val or []

    gaps_rows = execute_query("SELECT * FROM skill_gaps WHERE user_id = %s ORDER BY impact_pct DESC", (user_id,), fetchall=True) or []
    formatted_gaps = []
    for g in gaps_rows:
        formatted_gaps.append({
            'id': g['id'],
            'skill': g['skill_name'],
            'priority': g['priority'],
            'impact': f"+{g['impact_pct']}% Match increase",
            'status': g['status'],
            'currentLevel': g.get('current_level', 'Beginner'),
            'targetLevel': g.get('target_level', 'Intermediate'),
            'description': g.get('description', ''),
            'whyNeeded': g.get('why_needed', ''),
            'learningPath': safe_json(g.get('learning_path')),
            'estimatedHours': g.get('estimated_hours', 10)
        })

    matches_rows = execute_query(
        """
        SELECT jm.*, j.title, j.company, j.location, j.work_mode, j.salary, j.department, j.description
        FROM job_matches jm
        JOIN jobs j ON jm.job_id = j.id
        WHERE jm.user_id = %s
        ORDER BY jm.match_percentage DESC
        """,
        (user_id,),
        fetchall=True
    ) or []

    formatted_matches = []
    for m in matches_rows:
        formatted_matches.append({
            'id': m['job_id'],
            'title': m['title'],
            'company': m['company'],
            'department': m.get('department', 'Engineering'),
            'location': m['location'],
            'workType': m['work_mode'],
            'salary': m.get('salary', 'Competitive'),
            'matchPercentage': m['match_percentage'],
            'matchingSkills': safe_json(m['matching_skills']),
            'missingSkills': safe_json(m['missing_skills']),
            'whyRecommended': m.get('why_recommended', ''),
            'saved': bool(m.get('is_saved', False)),
            'description': m.get('description', '')
        })

    analysis_data = {
        'readiness_score': ai_record['readiness_score'],
        'profile_summary': ai_record.get('profile_summary', ''),
        'recommended_roles': safe_json(ai_record.get('recommended_roles')),
        'strengths': safe_json(ai_record.get('strengths')),
        'weaknesses': safe_json(ai_record.get('weaknesses')),
        'career_roadmap': safe_json(ai_record.get('career_roadmap')),
        'resume_feedback': ai_record.get('resume_feedback', ''),
        'interview_topics': safe_json(ai_record.get('interview_topics')),
        'next_actions': safe_json(ai_record.get('next_actions')),
        'skill_gaps': formatted_gaps,
        'job_matches': formatted_matches,
        'analyzed_at': str(ai_record.get('analyzed_at'))
    }

    return jsonify({'has_analysis': True, 'analysis': analysis_data}), 200

@ai_bp.route('/chat', methods=['POST'])
def chat_with_assistant():
    """Run a persisted, profile-aware Gemini/OpenAI conversation for the candidate."""
    user, err = require_candidate()
    if err: return err

    data = request.get_json() or {}
    message = data.get('message', data.get('query', '')).strip()
    conversation_id = data.get('conversation_id')
    request_id = data.get('request_id')

    if not message:
        return jsonify({'success': False, 'error': 'Message text is required.'}), 400

    try:
        result = ask_ai_career_assistant(user['id'], message, conversation_id, request_id)
        return jsonify({
            'success': True,
            'message': result['reply'],
            'conversation_id': result['conversation_id'],
            'request_id': result.get('request_id')
        }), 200
    except AIServiceError as error:
        logger.error(f"AIServiceError caught in route: {error.status_code} - {error.public_message} - detail: {error.technical_detail}")
        return jsonify({'success': False, 'error': error.public_message, 'detail': error.technical_detail}), error.status_code
    except Exception as e:
        logger.exception(f"Unexpected AI chat failure for user_id={user['id']}: {e}")
        return jsonify({'success': False, 'error': 'Talent Agent AI is temporarily unavailable. Please try again.'}), 500

@ai_bp.route('/conversations', methods=['GET'])
def list_conversations():
    """Returns candidate's recent conversation threads from database."""
    user, err = require_candidate()
    if err: return err

    rows = execute_query(
        "SELECT id, title, created_at, updated_at FROM ai_conversations WHERE user_id = %s ORDER BY updated_at DESC LIMIT 30",
        (user['id'],),
        fetchall=True
    ) or []
    return jsonify({'conversations': [dict(row) for row in rows]}), 200

@ai_bp.route('/health', methods=['GET'])
def get_ai_health():
    """Returns AI service health status without exposing sensitive credentials."""
    configured = bool(Config.GROQ_API_KEY and len(Config.GROQ_API_KEY) > 5)
    model = Config.AI_MODEL or 'openai/gpt-oss-120b'
    provider = 'groq'

    return jsonify({
        'configured': configured,
        'provider': provider,
        'model': model,
        'status': 'ready' if configured else 'missing_configuration'
    }), 200

@ai_bp.route('/conversations', methods=['DELETE'])
def clear_all_conversations():
    """Clears all conversations for the authenticated candidate."""
    user, err = require_candidate()
    if err: return err

    execute_query("DELETE FROM ai_conversations WHERE user_id = %s", (user['id'],), commit=True)
    return jsonify({'success': True, 'message': 'All conversations cleared.'}), 200

@ai_bp.route('/conversations/<conversation_id>/regenerate', methods=['POST'])
def regenerate_assistant_response(conversation_id):
    """Regenerates the latest AI response for a conversation thread."""
    user, err = require_candidate()
    if err: return err

    conversation = execute_query(
        "SELECT id FROM ai_conversations WHERE id = %s AND user_id = %s",
        (conversation_id, user['id']),
        fetchone=True
    )
    if not conversation:
        return jsonify({'error': 'Conversation not found.'}), 404

    # Fetch last user message in this conversation
    last_user_msg = execute_query(
        "SELECT message FROM ai_messages WHERE conversation_id = %s AND user_id = %s AND role = 'user' ORDER BY id DESC LIMIT 1",
        (conversation_id, user['id']),
        fetchone=True
    )
    if not last_user_msg:
        return jsonify({'error': 'No prior user message to regenerate.'}), 400

    try:
        # Delete last assistant response if it exists
        last_ast_msg = execute_query(
            "SELECT id FROM ai_messages WHERE conversation_id = %s AND user_id = %s AND role = 'assistant' ORDER BY id DESC LIMIT 1",
            (conversation_id, user['id']),
            fetchone=True
        )
        if last_ast_msg:
            execute_query("DELETE FROM ai_messages WHERE id = %s", (last_ast_msg['id'],), commit=True)

        result = ask_ai_career_assistant(user['id'], last_user_msg['message'], conversation_id)
        return jsonify({
            'success': True,
            'message': result['reply'],
            'conversation_id': result['conversation_id']
        }), 200
    except AIServiceError as error:
        return jsonify({'success': False, 'error': error.public_message}), error.status_code
    except Exception as e:
        logger.exception(f"AI regenerate failed for user_id={user['id']}: {e}")
        return jsonify({'success': False, 'error': 'Failed to regenerate response. Please try again.'}), 500

@ai_bp.route('/conversations/<conversation_id>', methods=['GET', 'DELETE'])
def conversation_detail(conversation_id):
    """Retrieves or deletes a candidate conversation thread and its message stream."""
    user, err = require_candidate()
    if err: return err

    conversation = execute_query(
        "SELECT id, title, created_at, updated_at FROM ai_conversations WHERE id = %s AND user_id = %s",
        (conversation_id, user['id']),
        fetchone=True
    )
    if not conversation:
        return jsonify({'error': 'Conversation not found.'}), 404

    if request.method == 'DELETE':
        execute_query("DELETE FROM ai_conversations WHERE id = %s AND user_id = %s", (conversation_id, user['id']), commit=True)
        return jsonify({'success': True, 'message': 'Conversation deleted.'}), 200

    messages = execute_query(
        "SELECT id, role, message as content, created_at FROM ai_messages WHERE conversation_id = %s AND user_id = %s ORDER BY id ASC",
        (conversation_id, user['id']),
        fetchall=True
    ) or []

    return jsonify({
        'conversation': dict(conversation),
        'messages': [dict(row) for row in messages]
    }), 200
