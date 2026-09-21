import os
import json
import logging
import time
import uuid
import re
from pathlib import Path
from collections import defaultdict, deque
from dotenv import load_dotenv
from groq import Groq
from database import execute_query

logger = logging.getLogger(__name__)

# Explicitly resolve and load backend/.env
BASE_DIR = Path(__file__).resolve().parent.parent
dotenv_path = BASE_DIR / '.env'
if dotenv_path.exists():
    load_dotenv(dotenv_path, override=True)
else:
    load_dotenv(override=True)

GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
GROQ_MODEL = os.getenv('GROQ_MODEL', os.getenv('AI_MODEL', 'openai/gpt-oss-120b'))

# Safe startup validation (Never print or log the actual API key)
if not GROQ_API_KEY:
    print("ERROR: GROQ_API_KEY is not configured")
    logger.warning("ERROR: GROQ_API_KEY is not configured in backend/.env")
else:
    print("Groq API key loaded successfully")
    logger.info("Groq API key loaded successfully")

# System instruction matching Section 7 of specification
TALENT_AGENT_SYSTEM_PROMPT = """You are Talent Agent AI, a professional AI career assistant for students, fresh graduates, and entry-level job seekers.

Help users:
- Understand their skills
- Find suitable career paths
- Analyze job requirements
- Identify skill gaps
- Improve resumes
- Prepare for interviews
- Understand job roles
- Create practical learning plans

Use the candidate's profile information when available.

Give concise, practical and personalized answers.

Never invent candidate information.

When discussing job suitability, clearly separate:
- Matching skills
- Missing skills
- Relevant experience
- Recommended improvements

Do not guarantee employment or job selection.

Be professional, helpful and direct."""

_groq_client_instance = None
_rate_limit_tracker = defaultdict(deque)

class GroqServiceError(Exception):
    def __init__(self, status_code: int, message: str, technical_detail: str = None):
        super().__init__(message)
        self.status_code = status_code
        self.public_message = message
        self.technical_detail = technical_detail

def get_groq_client() -> Groq:
    """Returns singleton Groq client instance configured with GROQ_API_KEY."""
    global _groq_client_instance
    api_key = os.getenv('GROQ_API_KEY', GROQ_API_KEY)
    if not api_key:
        raise GroqServiceError(503, "Groq authentication failed. Check GROQ_API_KEY in backend/.env.")
    
    if _groq_client_instance is None:
        _groq_client_instance = Groq(api_key=api_key)
    return _groq_client_instance

def get_groq_model() -> str:
    """Returns the Groq chat model configured via environment variables."""
    return os.getenv('GROQ_MODEL') or os.getenv('AI_MODEL') or GROQ_MODEL or 'openai/gpt-oss-120b'

def check_user_rate_limit(user_id: int):
    """Enforces request rate limits per user."""
    now = time.time()
    user_requests = _rate_limit_tracker[user_id]
    while user_requests and user_requests[0] < now - 60:
        user_requests.popleft()
    
    max_rpm = int(os.getenv('AI_REQUESTS_PER_MINUTE', '30'))
    if len(user_requests) >= max_rpm:
        raise GroqServiceError(429, "AI service rate limit reached. Please try again later.")
    
    user_requests.append(now)

def fetch_candidate_profile_context(user_id: int) -> tuple[dict, bool]:
    """
    Retrieves candidate's profile details from MySQL:
    - Name, Email
    - Education
    - Skills & proficiencies
    - Experience
    - Projects
    - Preferred role, location, work mode
    - Resume snippet / analysis & skill gaps
    """
    user = execute_query("SELECT full_name, email FROM users WHERE id = %s", (user_id,), fetchone=True) or {}
    profile = execute_query(
        """
        SELECT headline, location, career_goal, preferred_role, preferred_location,
               preferred_work_mode, years_experience, profile_completion, readiness_score, bio
        FROM candidate_profiles WHERE user_id = %s
        """,
        (user_id,), fetchone=True
    ) or {}

    skills = execute_query(
        "SELECT skill_name, skill_category, proficiency FROM candidate_skills WHERE user_id = %s ORDER BY proficiency DESC LIMIT 30",
        (user_id,), fetchall=True
    ) or []

    education = execute_query(
        "SELECT institution, degree, field, start_year, end_year, grade FROM candidate_education WHERE user_id = %s ORDER BY start_year DESC LIMIT 10",
        (user_id,), fetchall=True
    ) or []

    experience = execute_query(
        "SELECT company, role, description, start_date, end_date, is_current FROM candidate_experience WHERE user_id = %s ORDER BY id DESC LIMIT 10",
        (user_id,), fetchall=True
    ) or []

    projects = execute_query(
        "SELECT title, description, technologies, project_url FROM candidate_projects WHERE user_id = %s ORDER BY id DESC LIMIT 10",
        (user_id,), fetchall=True
    ) or []

    ai_analysis = execute_query(
        "SELECT readiness_score, profile_summary, strengths, weaknesses, recommended_roles FROM ai_analysis WHERE user_id = %s",
        (user_id,), fetchone=True
    ) or {}

    skill_gaps = execute_query(
        "SELECT skill_name, priority, impact_pct, status FROM skill_gaps WHERE user_id = %s ORDER BY impact_pct DESC LIMIT 10",
        (user_id,), fetchall=True
    ) or []

    resume = execute_query(
        "SELECT original_filename, extracted_text FROM resumes WHERE user_id = %s ORDER BY id DESC LIMIT 1",
        (user_id,), fetchone=True
    )

    has_data = any([profile, skills, education, experience, projects, resume, ai_analysis])

    context = {
        'candidate_name': user.get('full_name'),
        'candidate_email': user.get('email'),
        'profile': profile,
        'skills': [s['skill_name'] for s in skills],
        'education': [dict(e) for e in education],
        'experience': [dict(exp) for exp in experience],
        'projects': [dict(p) for p in projects],
        'ai_readiness_score': ai_analysis.get('readiness_score'),
        'identified_skill_gaps': [g['skill_name'] for g in skill_gaps],
        'resume_text_snippet': (resume.get('extracted_text') or '')[:2500] if resume else None
    }

    return context, has_data

def generate_groq_chat_completion(messages: list, temperature: float = 0.5, max_tokens: int = 1500) -> str:
    """
    Executes a chat completion with Groq API and handles fallbacks gracefully.
    """
    client = get_groq_client()
    primary_model = get_groq_model()
    fallback_models = [
        primary_model,
        'openai/gpt-oss-120b',
        'qwen/qwen3.8-27b',
        'openai/gpt-oss-20b',
        'groq/compound',
        'groq/compound-mini',
        'allam-2-7b',
        'llama-3.3-70b-versatile'
    ]
    # Deduplicate while preserving order
    candidate_models = []
    for m in fallback_models:
        if m and m not in candidate_models:
            candidate_models.append(m)

    last_error = None
    for model_name in candidate_models:
        try:
            logger.info(f"Calling Groq API with model '{model_name}'")
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            raw_text = (response.choices[0].message.content or '').strip()
            # Remove any thinking tags if returned
            clean_text = re.sub(r'<think>.*?</think>', '', raw_text, flags=re.DOTALL).strip()
            if not clean_text:
                raise GroqServiceError(500, "Unable to contact the AI service. Please try again.")
            return clean_text
        except GroqServiceError:
            raise
        except Exception as e:
            last_error = e
            err_msg = str(e).lower()
            status_code = getattr(e, 'status_code', None) or getattr(e, 'code', None)

            if status_code in (401, 403) or 'invalid api key' in err_msg or 'unauthorized' in err_msg or 'invalid_api_key' in err_msg:
                logger.error(f"Groq authentication failure: {e}")
                raise GroqServiceError(401, "Groq authentication failed. Check GROQ_API_KEY in backend/.env.", str(e))

            if status_code == 429 or 'rate limit' in err_msg or 'quota' in err_msg or 'rate_limit_exceeded' in err_msg:
                logger.warning(f"Groq model '{model_name}' rate limited: {e}")
                # Try smaller fallback model if possible
                continue

            if status_code == 404 or 'model_not_found' in err_msg or 'not found' in err_msg:
                logger.warning(f"Groq model '{model_name}' not found. Trying next fallback...")
                continue

            logger.warning(f"Groq model '{model_name}' invocation error: {e}. Trying fallback...")

    # If all candidate models fail due to rate limit or general error
    if last_error and ('rate limit' in str(last_error).lower() or getattr(last_error, 'status_code', None) == 429):
        raise GroqServiceError(429, "AI service rate limit reached. Please try again later.", str(last_error))

    raise GroqServiceError(503, "Unable to contact the AI service. Please try again.", str(last_error))

def process_career_assistant_chat(
    user_id: int,
    user_message: str,
    conversation_id: str = None,
    client_conversation: list = None
) -> dict:
    """
    Main entrypoint for AI Career Assistant:
    1. Checks rate limits and validates inputs.
    2. Builds/retrieves database conversation session.
    3. Gathers candidate profile context from MySQL.
    4. Builds system prompt + history + current query.
    5. Calls Groq AI via Groq Python client.
    6. Saves messages into MySQL `ai_messages`.
    7. Returns clean response dictionary.
    """
    check_user_rate_limit(user_id)

    clean_msg = (user_message or '').strip()
    if not clean_msg:
        raise GroqServiceError(400, "Message cannot be empty.")

    # 1. Manage Conversation in Database
    if conversation_id:
        existing = execute_query(
            "SELECT id FROM ai_conversations WHERE id = %s AND user_id = %s",
            (conversation_id, user_id),
            fetchone=True
        )
        if not existing:
            conversation_id = None

    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        initial_title = clean_msg[:45] + ('...' if len(clean_msg) > 45 else '')
        execute_query(
            "INSERT INTO ai_conversations (id, user_id, title) VALUES (%s, %s, %s)",
            (conversation_id, user_id, initial_title),
            commit=True
        )

    # 2. Retrieve Candidate Profile Context
    context_data, has_profile = fetch_candidate_profile_context(user_id)
    context_str = json.dumps(context_data, default=str)

    # 3. Retrieve Historical Messages
    past_messages = execute_query(
        """
        SELECT role, message
        FROM ai_messages
        WHERE conversation_id = %s AND user_id = %s
        ORDER BY id DESC
        LIMIT 10
        """,
        (conversation_id, user_id),
        fetchall=True
    ) or []
    past_messages.reverse()

    # 4. Construct Prompt Messages
    messages = [
        {"role": "system", "content": TALENT_AGENT_SYSTEM_PROMPT}
    ]

    if has_profile:
        messages.append({
            "role": "system",
            "content": f"Candidate Profile Information (use this to personalize answers):\n{context_str}"
        })

    # Add historical messages or client conversation fallback
    if past_messages:
        for m in past_messages:
            role = 'assistant' if m['role'] == 'assistant' else 'user'
            messages.append({"role": role, "content": m['message']})
    elif client_conversation and isinstance(client_conversation, list):
        for m in client_conversation[-6:]:
            role = m.get('role') or ('assistant' if m.get('sender') == 'ai' else 'user')
            content = m.get('content') or m.get('text') or m.get('message', '')
            if content:
                messages.append({"role": role, "content": content})

    # Add current query
    messages.append({"role": "user", "content": clean_msg})

    # 5. Generate AI Response via Groq
    reply_text = generate_groq_chat_completion(messages)

    # 6. Save to Database
    execute_query(
        "INSERT INTO ai_messages (conversation_id, user_id, role, message) VALUES (%s, %s, %s, %s)",
        (conversation_id, user_id, 'user', clean_msg),
        commit=True
    )
    execute_query(
        "INSERT INTO ai_messages (conversation_id, user_id, role, message) VALUES (%s, %s, %s, %s)",
        (conversation_id, user_id, 'assistant', reply_text),
        commit=True
    )
    execute_query(
        "UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s",
        (conversation_id, user_id),
        commit=True
    )

    return {
        'response': reply_text,
        'message': reply_text,
        'conversation_id': conversation_id,
        'success': True
    }
