import os
from pathlib import Path
from dotenv import load_dotenv

# Base Directory of backend
BASE_DIR = Path(__file__).resolve().parent

# Load .env file from backend directory with override=True
dotenv_path = BASE_DIR / '.env'
if dotenv_path.exists():
    load_dotenv(dotenv_path, override=True)
else:
    load_dotenv(override=True)

class Config:
    BASE_DIR = BASE_DIR
    # Environment
    ENV = os.getenv('ENVIRONMENT', 'development')
    DEBUG = ENV == 'development'

    # Secret Keys
    SECRET_KEY = os.getenv('SESSION_SECRET', 'talent_agent_session_secret_2026_super_secure')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'talent_agent_ai_jwt_secret_key_2026')
    COOKIE_SECURE = ENV == 'production'
    JWT_ACCESS_TOKEN_EXPIRES_HOURS = 24 * 7 # 7 days

    # MySQL Configuration
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = int(os.getenv('DB_PORT', 3306))
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')
    DB_NAME = os.getenv('DB_NAME', 'talent_agent_ai')

    # Uploads Storage
    UPLOAD_FOLDER = BASE_DIR / 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max file upload
    ALLOWED_EXTENSIONS = {'pdf', 'docx'}

    # Groq AI API Configuration
    GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
    AI_PROVIDER = os.getenv('AI_PROVIDER', 'groq').lower()
    AI_MODEL = os.getenv('AI_MODEL', 'openai/gpt-oss-120b')
    GROQ_FALLBACK_MODELS = ['openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'groq/compound-mini']
    AI_TIMEOUT_SECONDS = float(os.getenv('AI_TIMEOUT_SECONDS', '45'))
    AI_MAX_MESSAGE_LENGTH = int(os.getenv('AI_MAX_MESSAGE_LENGTH', '6000'))
    AI_MAX_HISTORY_MESSAGES = int(os.getenv('AI_MAX_HISTORY_MESSAGES', '12'))
    AI_REQUESTS_PER_MINUTE = int(os.getenv('AI_REQUESTS_PER_MINUTE', '30'))

    # Google OAuth
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '')
    CORS_ORIGINS = [origin.strip() for origin in os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000').split(',') if origin.strip()]

    # SMTP / Email Configuration
    MAIL_SERVER = os.getenv('SMTP_HOST', os.getenv('MAIL_SERVER', os.getenv('EMAIL_HOST', 'smtp.gmail.com')))
    MAIL_PORT = int(os.getenv('SMTP_PORT', os.getenv('MAIL_PORT', os.getenv('EMAIL_PORT', 587))))
    MAIL_USE_TLS = os.getenv('SMTP_USE_TLS', os.getenv('MAIL_USE_TLS', 'true')).lower() in ('true', '1', 't')
    MAIL_USERNAME = os.getenv('SMTP_USER', os.getenv('MAIL_USERNAME', os.getenv('EMAIL_USER', '')))
    _raw_mail_pass = os.getenv('SMTP_PASSWORD', os.getenv('MAIL_PASSWORD', os.getenv('EMAIL_PASSWORD', '')))
    MAIL_PASSWORD = _raw_mail_pass.replace(" ", "").strip() if _raw_mail_pass else ""
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_FROM', os.getenv('MAIL_DEFAULT_SENDER', os.getenv('EMAIL_FROM', 'Talent Agent AI <noreply@talentagent.ai>')))

    # Ensure Uploads Directory exists
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

    if ENV == 'production' and (
        not SECRET_KEY
        or not JWT_SECRET_KEY
        or SECRET_KEY == 'talent_agent_session_secret_2026_super_secure'
        or JWT_SECRET_KEY == 'talent_agent_ai_jwt_secret_key_2026'
    ):
        raise RuntimeError('SESSION_SECRET and JWT_SECRET_KEY must be configured in production.')
