import re
import time
import secrets
import hashlib
import jwt
from datetime import datetime, timedelta
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from config import Config

ph = PasswordHasher()

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validates password requirements:
    - Minimum 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 number
    - At least 1 special character (!@#$%^&*(),.?":{}|<>)
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least 1 uppercase letter."
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least 1 lowercase letter."
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least 1 number."
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=~/\\\[\]]', password):
        return False, "Password must contain at least 1 special character."
    return True, "Password meets all security criteria."

def hash_password(password: str) -> str:
    """Hashes password using Argon2id."""
    return ph.hash(password)

def verify_password(stored_hash: str, provided_password: str) -> bool:
    """Verifies plaintext password against Argon2id hash."""
    if not stored_hash or not provided_password:
        return False
    try:
        return ph.verify(stored_hash, provided_password)
    except VerifyMismatchError:
        return False
    except Exception:
        return False

def generate_jwt_token(payload: dict, expires_in_hours: int = None) -> str:
    """Generates a signed JWT token."""
    hours = expires_in_hours or Config.JWT_ACCESS_TOKEN_EXPIRES_HOURS
    exp_time = datetime.utcnow() + timedelta(hours=hours)
    token_data = {
        **payload,
        'exp': exp_time,
        'iat': datetime.utcnow()
    }
    return jwt.encode(token_data, Config.JWT_SECRET_KEY, algorithm='HS256')

def decode_jwt_token(token: str) -> dict | None:
    """Decodes and validates a JWT token."""
    try:
        decoded = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
        return decoded
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

verify_jwt_token = decode_jwt_token

def generate_otp(length: int = 6) -> str:
    """
    Generates a cryptographically secure 6-digit numeric OTP using secrets module.
    Always formatted as 6 digits with leading zeros if necessary.
    Never uses random.randint().
    """
    number = secrets.randbelow(1000000)
    return f"{number:06d}"

def hash_otp(otp: str, email: str) -> str:
    """Hashes OTP with email salt for secure storage."""
    salt = f"{email.lower().strip()}:{Config.SECRET_KEY}"
    return hashlib.sha256(f"{otp}:{salt}".encode('utf-8')).hexdigest()

def verify_otp_hash(otp: str, email: str, stored_hash: str) -> bool:
    """Verifies that provided raw OTP matches stored hash."""
    return hash_otp(otp, email) == stored_hash

def check_resend_cooldown(email: str, purpose: str = 'email_verification') -> tuple[bool, int]:
    """
    Checks if a resend request for this email occurred within the 45-second cooldown window.
    Returns (is_in_cooldown, seconds_remaining).
    """
    from database import execute_query
    record = execute_query(
        """
        SELECT created_at
        FROM otp_verifications
        WHERE email = %s AND purpose = %s
        ORDER BY id DESC LIMIT 1
        """,
        (email.lower().strip(), purpose),
        fetchone=True
    )

    if not record or not record.get('created_at'):
        return False, 0

    created_at_str = str(record['created_at'])
    try:
        if '.' in created_at_str:
            created_at = datetime.strptime(created_at_str.split('.')[0], '%Y-%m-%d %H:%M:%S')
        else:
            created_at = datetime.strptime(created_at_str, '%Y-%m-%d %H:%M:%S')
    except Exception:
        return False, 0

    elapsed = (datetime.utcnow() - created_at).total_seconds()
    cooldown_period = 45 # 45 seconds development cooldown

    if elapsed < cooldown_period:
        remaining = int(cooldown_period - elapsed)
        return True, max(1, remaining)

    return False, 0

def create_and_store_otp(email: str, purpose: str = 'email_verification', user_id: int = None) -> str:
    """
    Generates a 6-digit OTP using secrets, stores its hash in otp_verifications with 10 min expiration,
    and returns the raw OTP for transmission via Gmail SMTP.
    """
    from database import execute_query
    raw_otp = generate_otp(6)
    email_clean = email.lower().strip()
    hashed = hash_otp(raw_otp, email_clean)
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Invalidate previous unused OTPs for this email & purpose
    execute_query(
        "UPDATE otp_verifications SET used = %s, is_used = %s WHERE email = %s AND purpose = %s",
        (True, True, email_clean, purpose),
        commit=True
    )

    # Insert new OTP record
    execute_query(
        """
        INSERT INTO otp_verifications (user_id, email, otp_hash, purpose, attempts, expires_at, used, is_used)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (user_id, email_clean, hashed, purpose, 0, expires_at.strftime('%Y-%m-%d %H:%M:%S'), False, False),
        commit=True
    )

    return raw_otp

def verify_otp(email: str, raw_otp: str, purpose: str = 'email_verification') -> tuple[bool, str]:
    """
    Verifies submitted OTP against stored hash.
    Checks expiration, attempt limits (max 5 attempts), and single-use status.
    """
    from database import execute_query
    email_clean = email.lower().strip()
    raw_otp_clean = raw_otp.strip()

    record = execute_query(
        """
        SELECT id, user_id, otp_hash, attempts, expires_at, used, is_used
        FROM otp_verifications
        WHERE email = %s AND purpose = %s AND (used = %s OR is_used = %s)
        ORDER BY id DESC LIMIT 1
        """,
        (email_clean, purpose, False, False),
        fetchone=True
    )

    if not record:
        return False, "No active verification code found. Please request a new code."

    # Check attempt limit (max 5 attempts)
    attempts = record.get('attempts', 0)
    if attempts >= 5:
        execute_query("UPDATE otp_verifications SET used = %s, is_used = %s WHERE id = %s", (True, True, record['id']), commit=True)
        return False, "Too many attempts. Please request a new code."

    # Check expiration (10 minutes)
    expires_at_str = str(record['expires_at'])
    try:
        if '.' in expires_at_str:
            expires_at = datetime.strptime(expires_at_str.split('.')[0], '%Y-%m-%d %H:%M:%S')
        else:
            expires_at = datetime.strptime(expires_at_str, '%Y-%m-%d %H:%M:%S')
    except Exception:
        expires_at = datetime.utcnow() + timedelta(minutes=1)

    if datetime.utcnow() > expires_at:
        execute_query("UPDATE otp_verifications SET used = %s, is_used = %s WHERE id = %s", (True, True, record['id']), commit=True)
        return False, "Your verification code has expired. Please request a new code."

    # Compare hash
    expected_hash = hash_otp(raw_otp_clean, email_clean)
    if record['otp_hash'] != expected_hash:
        new_attempts = attempts + 1
        if new_attempts >= 5:
            execute_query(
                "UPDATE otp_verifications SET attempts = %s, used = %s, is_used = %s WHERE id = %s",
                (new_attempts, True, True, record['id']),
                commit=True
            )
            return False, "Too many attempts. Please request a new code."
        else:
            execute_query(
                "UPDATE otp_verifications SET attempts = %s WHERE id = %s",
                (new_attempts, record['id']),
                commit=True
            )
            return False, "Invalid verification code."

    # Successful verification -> Mark used = True, is_used = True
    execute_query("UPDATE otp_verifications SET used = %s, is_used = %s WHERE id = %s", (True, True, record['id']), commit=True)
    return True, "Email verified successfully."

def log_audit_event(actor_id: int | None, actor_type: str, action: str, target_type: str = None, target_id: int = None, details: str = None, ip_address: str = None):
    """Records security and administrative actions in audit_logs."""
    from database import execute_query
    try:
        execute_query(
            """
            INSERT INTO audit_logs (actor_id, actor_type, action, target_type, target_id, details, ip_address)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (actor_id, actor_type, action, target_type, target_id, details, ip_address),
            commit=True
        )
    except Exception as e:
        print(f"Audit log insertion failed: {e}")
