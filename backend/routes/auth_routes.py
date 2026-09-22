import os
import secrets
import logging
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, make_response
from config import Config
from database import execute_query
from services.auth_service import (
    hash_password,
    verify_password,
    validate_password_strength,
    generate_otp,
    hash_otp,
    verify_otp_hash,
    check_resend_cooldown,
    generate_jwt_token,
    verify_jwt_token
)
from services.email_service import (
    send_verification_otp,
    send_login_security_alert,
    parse_client_info
)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
logger = logging.getLogger(__name__)

def log_audit_event(actor_id, actor_type, action, target_type, target_id, details, ip_address):
    """Utility helper to record auth audit trails into database."""
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
        logger.error(f"Failed to record audit log: {e}")

def get_current_user_from_request():
    """
    Extracts authenticated user from HTTP-only cookie or Bearer header.
    Returns user dict or None.
    """
    token = request.cookies.get('talent_agent_token')
    if not token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header[7:].strip() or None

    if not token:
        return None

    payload = verify_jwt_token(token)
    if not payload or not payload.get('user_id'):
        return None

    user = execute_query(
        "SELECT id, full_name, email, role, is_active, email_verified, auth_provider, avatar_url FROM users WHERE id = %s",
        (payload['user_id'],),
        fetchone=True
    )
    if not user or not user['is_active'] or user.get('role') != 'candidate':
        return None

    return user

def get_profile_status(user_id):
    """Calculates profile completion and readiness metrics."""
    profile = execute_query("SELECT profile_completion, headline, preferred_role FROM candidate_profiles WHERE user_id = %s", (user_id,), fetchone=True)
    skills = execute_query("SELECT COUNT(*) as count FROM candidate_skills WHERE user_id = %s", (user_id,), fetchone=True)
    education = execute_query("SELECT COUNT(*) as count FROM candidate_education WHERE user_id = %s", (user_id,), fetchone=True)

    completion = profile['profile_completion'] if profile else 0
    skills_count = skills['count'] if skills else 0
    edu_count = education['count'] if education else 0

    profile_complete = Boolean(completion >= 80 or (profile and profile.get('preferred_role') and (skills_count > 0 or edu_count > 0)))
    return {
        'profile_complete': profile_complete,
        'profile_completion': completion
    }

def Boolean(val):
    return bool(val)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Candidate Signup Endpoint."""
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')

    if not full_name or not email or not password:
        return jsonify({'error': 'Full name, email, and password are required.'}), 400

    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match.'}), 400

    valid, msg = validate_password_strength(password)
    if not valid:
        return jsonify({'error': msg}), 400

    existing_user = execute_query("SELECT id FROM users WHERE email = %s", (email,), fetchone=True)
    if existing_user:
        return jsonify({'error': 'An account with this email already exists.'}), 400

    pwd_hash = hash_password(password)

    user_id = execute_query(
        """
        INSERT INTO users (full_name, email, password_hash, email_verified, auth_provider, role, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (full_name, email, pwd_hash, False, 'local', 'candidate', True),
        commit=True,
        return_id=True
    )

    execute_query(
        "INSERT INTO candidate_profiles (user_id, profile_completion, readiness_score) VALUES (%s, 0, 0)",
        (user_id,),
        commit=True
    )

    otp = generate_otp(6)
    otp_h = hash_otp(otp, email)
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    execute_query(
        """
        INSERT INTO otp_verifications (user_id, email, otp_hash, purpose, expires_at)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (user_id, email, otp_h, 'email_verification', expires_at),
        commit=True
    )

    send_verification_otp(email, otp)
    log_audit_event(user_id, 'user', 'signup_registered', 'user', user_id, f"Candidate account created: {email}", request.remote_addr)

    return jsonify({
        'success': True,
        'message': 'Account created successfully! Please verify your email with the OTP sent.',
        'email': email,
        'requires_verification': True
    }), 201

@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify Candidate 6-Digit Email OTP."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    otp = data.get('otp', '').strip()

    if not email or not otp:
        return jsonify({'error': 'Email and OTP code are required.'}), 400

    user = execute_query("SELECT * FROM users WHERE email = %s", (email,), fetchone=True)
    if not user:
        return jsonify({'error': 'Account not found.'}), 404

    if user['email_verified']:
        return jsonify({'error': 'Email is already verified. Please log in with your password.'}), 409

    otp_record = execute_query(
        """
        SELECT * FROM otp_verifications
        WHERE email = %s AND purpose = 'email_verification' AND (used = False OR used IS NULL) AND (is_used = False OR is_used IS NULL)
        ORDER BY created_at DESC LIMIT 1
        """,
        (email,),
        fetchone=True
    )

    if not otp_record:
        return jsonify({'error': 'No active OTP verification request found. Please click resend OTP.'}), 400

    if not user.get('is_active') or user.get('role') != 'candidate':
        return jsonify({'success': False, 'error': 'This account is not eligible for candidate access.'}), 403

    expires_at = otp_record['expires_at']
    if isinstance(expires_at, str):
        try:
            expires_at = datetime.fromisoformat(expires_at)
        except (TypeError, ValueError):
            return jsonify({'error': 'OTP has expired. Please request a new verification code.'}), 400

    if not isinstance(expires_at, datetime) or datetime.utcnow() > expires_at:
        return jsonify({'error': 'OTP has expired. Please request a new verification code.'}), 400

    if not verify_otp_hash(otp, email, otp_record['otp_hash']):
        current_attempts = (otp_record.get('attempts') or 0) + 1
        execute_query("UPDATE otp_verifications SET attempts = %s, used = %s, is_used = %s WHERE id = %s", (current_attempts, current_attempts >= 5, current_attempts >= 5, otp_record['id']), commit=True)
        if current_attempts >= 5:
            return jsonify({'error': 'Maximum verification attempts exceeded. Please request a new OTP.'}), 429
        return jsonify({'error': 'Invalid 6-digit OTP code.'}), 400

    execute_query("UPDATE otp_verifications SET used = True, is_used = True WHERE id = %s", (otp_record['id'],), commit=True)
    execute_query("UPDATE users SET email_verified = True WHERE id = %s", (user['id'],), commit=True)

    token = generate_jwt_token({
        'user_id': user['id'],
        'email': user['email'],
        'role': user['role'],
        'full_name': user['full_name']
    })

    log_audit_event(user['id'], 'user', 'email_verified', 'user', user['id'], f"Email verified: {email}", request.remote_addr)

    user_data = {
        'id': user['id'],
        'full_name': user['full_name'],
        'email': user['email'],
        'role': user['role'],
        'email_verified': True
    }
    profile_status = get_profile_status(user['id'])
    user_data['profile_complete'] = profile_status['profile_complete']
    user_data['profile_completion'] = profile_status['profile_completion']

    resp = make_response(jsonify({
        'success': True,
        'message': 'Email verified successfully!',
        'user': user_data,
        **profile_status,
        'redirect': '/dashboard' if profile_status['profile_complete'] else '/profile/setup'
    }))

    resp.set_cookie('talent_agent_token', token, httponly=True, samesite='Lax', secure=Config.COOKIE_SECURE, max_age=7*24*3600)
    return resp, 200

@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    """Resend Email OTP Code with 45s Cooldown Guard."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    purpose = data.get('purpose', 'email_verification')

    if not email:
        return jsonify({'error': 'Email is required.'}), 400

    user = execute_query("SELECT id, email_verified FROM users WHERE email = %s", (email,), fetchone=True)
    if not user:
        return jsonify({'error': 'Account not found.'}), 404

    if purpose == 'email_verification' and user['email_verified']:
        return jsonify({'message': 'Email is already verified.'}), 200

    allowed, cooldown_remaining = check_resend_cooldown(email, purpose)
    if not allowed:
        return jsonify({
            'error': f'Please wait {cooldown_remaining} seconds before requesting another code.',
            'cooldown_seconds': cooldown_remaining
        }), 429

    otp = generate_otp(6)
    otp_h = hash_otp(otp, email)
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    execute_query(
        "UPDATE otp_verifications SET used = True, is_used = True WHERE email = %s AND purpose = %s",
        (email, purpose),
        commit=True
    )

    execute_query(
        """
        INSERT INTO otp_verifications (user_id, email, otp_hash, purpose, expires_at)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (user['id'], email, otp_h, purpose, expires_at),
        commit=True
    )

    send_verification_otp(email, otp)
    log_audit_event(user['id'], 'user', 'otp_resent', 'user', user['id'], f"OTP resent to: {email}", request.remote_addr)

    return jsonify({
        'success': True,
        'message': 'A new 6-digit OTP has been sent to your email.',
        'cooldown_seconds': 45
    }), 200

@auth_bp.route('/login', methods=['POST'])
def login():
    """Candidate Email/Password Login Endpoint."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    user = execute_query("SELECT * FROM users WHERE email = %s", (email,), fetchone=True)
    if not user or not user.get('is_active') or user.get('role') != 'candidate':
        return jsonify({'error': 'Invalid email or password.'}), 401

    if not user.get('password_hash'):
        return jsonify({'error': 'This account uses Google Sign-In. Please click "Continue with Google".'}), 400

    if not verify_password(user['password_hash'], password):
        return jsonify({'error': 'Invalid email or password.'}), 401

    if not user.get('email_verified'):
        in_cooldown, remaining = check_resend_cooldown(email, 'email_verification')
        if in_cooldown:
            return jsonify({'error': f'Please wait {remaining} seconds before requesting another verification code.', 'requires_verification': True, 'email': email}), 429
        otp = generate_otp(6)
        otp_h = hash_otp(otp, email)
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        execute_query("UPDATE otp_verifications SET used = True, is_used = True WHERE email = %s AND purpose = 'email_verification'", (email,), commit=True)
        execute_query(
            "INSERT INTO otp_verifications (user_id, email, otp_hash, purpose, expires_at) VALUES (%s, %s, %s, %s, %s)",
            (user['id'], email, otp_h, 'email_verification', expires_at), commit=True
        )
        send_verification_otp(email, otp)
        return jsonify({
            'error': 'Please verify your email before logging in.',
            'requires_verification': True,
            'email': email
        }), 403

    execute_query("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = %s", (user['id'],), commit=True)

    token = generate_jwt_token({
        'user_id': user['id'],
        'email': user['email'],
        'role': user['role'],
        'full_name': user['full_name']
    })

    log_audit_event(user['id'], 'user', 'login_success', 'user', user['id'], f"User logged in: {email}", request.remote_addr)
    
    # Send login security email alert (non-blocking)
    try:
        user_agent_str = request.headers.get('User-Agent', '')
        client_ip = request.headers.get('X-Forwarded-For', request.remote_addr or '127.0.0.1')
        if client_ip and ',' in client_ip:
            client_ip = client_ip.split(',')[0].strip()
        client_info = parse_client_info(user_agent_str, client_ip)
        send_login_security_alert(user['email'], user.get('full_name', ''), client_info)
    except Exception as e:
        logger.error(f"Error dispatching login alert for {email}: {e}")

    user_data = {
        'id': user['id'],
        'full_name': user['full_name'],
        'email': user['email'],
        'role': user['role'],
        'email_verified': True,
        'avatar_url': user.get('avatar_url')
    }
    profile_status = get_profile_status(user['id'])
    user_data['profile_complete'] = profile_status['profile_complete']
    user_data['profile_completion'] = profile_status['profile_completion']

    resp = make_response(jsonify({
        'success': True,
        'message': 'Login successful!',
        'user': user_data,
        'token': token,
        **profile_status,
        'redirect': '/dashboard' if profile_status['profile_complete'] else '/profile/setup'
    }))

    resp.set_cookie('talent_agent_token', token, httponly=True, samesite='Lax', secure=Config.COOKIE_SECURE, max_age=7 * 24 * 3600)
    return resp, 200

@auth_bp.route('/google/config', methods=['GET'])
def get_google_config():
    """Returns public Google Client ID configuration for GIS frontend button initialization."""
    client_id = os.getenv('GOOGLE_CLIENT_ID') or getattr(Config, 'GOOGLE_CLIENT_ID', '')
    return jsonify({
        'enabled': bool(client_id),
        'client_id': client_id
    }), 200

@auth_bp.route('/admin/login', methods=['POST'])
@auth_bp.route('/admin-login', methods=['POST'])
def admin_login():
    """Administrator Login Endpoint."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    user = execute_query("SELECT * FROM users WHERE email = %s", (email,), fetchone=True)
    if not user or not user.get('is_active') or user.get('role') != 'admin':
        return jsonify({'error': 'Invalid administrator credentials.'}), 401

    if not verify_password(password, user['password_hash']):
        return jsonify({'error': 'Invalid administrator credentials.'}), 401

    # Record login
    execute_query("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = %s", (user['id'],), commit=True)

    token = generate_jwt_token({
        'user_id': user['id'],
        'email': user['email'],
        'role': 'admin',
        'full_name': user['full_name']
    })

    log_audit_event(user['id'], 'admin', 'admin_login_success', 'user', user['id'], f"Admin logged in: {email}", request.remote_addr)

    user_data = {
        'id': user['id'],
        'full_name': user['full_name'],
        'email': user['email'],
        'role': 'admin',
        'email_verified': True
    }

    resp = make_response(jsonify({
        'success': True,
        'message': 'Admin login successful!',
        'user': user_data,
        'token': token,
        'redirect': '/admin'
    }))

    resp.set_cookie(
        'jwt_token',
        token,
        httponly=True,
        secure=Config.COOKIE_SECURE,
        samesite='Lax',
        max_age=60 * 60 * 24 * 7
    )
    return resp, 200

@auth_bp.route('/google', methods=['POST'])
def google_auth():
    """
    Verifies Google Identity Services ID Token (JWT) credential and logs in / registers candidate.
    Validates token signature, issuer, audience (GOOGLE_CLIENT_ID), expiration, and email_verified.
    """
    data = request.get_json() or {}
    credential = data.get('credential') or data.get('id_token')

    configured_client_id = Config.GOOGLE_CLIENT_ID or os.getenv('GOOGLE_CLIENT_ID', '')
    is_client_id_configured = bool(configured_client_id)
    is_cred_received = bool(credential)
    cred_len = len(credential) if credential else 0

    logger.info(f"Google Auth: GOOGLE_CLIENT_ID configured: {is_client_id_configured}")
    logger.info(f"Google Auth: credential received: {is_cred_received}")
    logger.info(f"Google Auth: credential length: {cred_len}")

    if not credential:
        return jsonify({'success': False, 'error': 'Google credential token is required.'}), 400

    if not configured_client_id:
        logger.error("Google Auth: GOOGLE_CLIENT_ID is not configured on the backend.")
        return jsonify({'success': False, 'error': 'Google authentication is not configured.'}), 503

    logger.info("Google Auth: token verification started")
    id_info = None
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        # Verify Google ID Token against configured GOOGLE_CLIENT_ID (with 300s clock skew tolerance)
        id_info = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            configured_client_id,
            clock_skew_in_seconds=300
        )

        token_aud = id_info.get('aud')
        token_iss = id_info.get('iss')
        token_exp = id_info.get('exp')

        logger.info("Google Auth: token verification succeeded")
        logger.info(f"Google Auth: token audience: {token_aud}")
        logger.info(f"Google Auth: expected audience: {configured_client_id}")
        logger.info(f"Google Auth: token issuer: {token_iss}")
        logger.info(f"Google Auth: token expiration: {token_exp}")

        # Audience strict verification check
        if token_aud != configured_client_id:
            logger.error(f"Google Auth Error: Audience mismatch. Token aud: '{token_aud}', Configured aud: '{configured_client_id}'")
            return jsonify({'success': False, 'error': 'Google authentication failed: Token audience mismatch.'}), 400

        # Validate issuer
        if token_iss not in ['accounts.google.com', 'https://accounts.google.com']:
            logger.error(f"Google Auth Error: Invalid issuer '{token_iss}'")
            return jsonify({'success': False, 'error': 'Google authentication failed: Invalid issuer.'}), 400

        # Validate email_verified
        if id_info.get('email_verified') is not True:
            logger.error("Google Auth Error: email_verified is not True")
            return jsonify({'success': False, 'error': 'Your Google email could not be verified.'}), 400

    except ValueError as val_err:
        logger.error(f"Google Auth: token verification failed. Exception type: {type(val_err).__name__}, message: {val_err}. Expected audience: {configured_client_id}")
        return jsonify({'success': False, 'error': 'Google authentication failed. Invalid token signature or expiration.'}), 400
    except Exception as e:
        logger.exception(f"Google Auth: unexpected verification error: {type(e).__name__}: {e}")
        return jsonify({'success': False, 'error': 'Google authentication is currently unavailable. Please try again.'}), 500

    google_sub = id_info.get('sub')
    email = id_info.get('email', '').strip().lower()
    full_name = (id_info.get('name') or f"{id_info.get('given_name', '')} {id_info.get('family_name', '')}").strip()
    avatar_url = id_info.get('picture')

    if not google_sub or not email:
        return jsonify({'success': False, 'error': 'Google identity missing required email or subject ID.'}), 400

    any_google_user = execute_query("SELECT id, is_active, role FROM users WHERE google_sub = %s", (google_sub,), fetchone=True)
    if any_google_user and not any_google_user.get('is_active'):
        return jsonify({'success': False, 'error': 'This Google account is inactive. Please contact support.'}), 403
    user = execute_query("SELECT * FROM users WHERE google_sub = %s AND is_active = %s", (google_sub, True), fetchone=True)
    if not user:
        oauth_rec = execute_query(
            "SELECT user_id FROM oauth_accounts WHERE provider = 'google' AND provider_user_id = %s",
            (google_sub,),
            fetchone=True
        )
        if oauth_rec:
            user = execute_query("SELECT * FROM users WHERE id = %s AND is_active = %s", (oauth_rec['user_id'], True), fetchone=True)

    if not user:
        existing_user = execute_query("SELECT * FROM users WHERE email = %s", (email,), fetchone=True)
        if existing_user and not existing_user.get('is_active'):
            return jsonify({'success': False, 'error': 'This account is inactive. Please contact support.'}), 403
        if existing_user and existing_user.get('role') != 'candidate':
            return jsonify({'success': False, 'error': 'This account is not eligible for candidate access.'}), 403
        if existing_user:
            # SAFELY LINK EXISTING ACCOUNT TO GOOGLE IDENTITY
            user_id = existing_user['id']
            provider_str = 'local+google' if existing_user.get('auth_provider') == 'local' else 'google'
            clean_name = full_name if full_name and (not existing_user.get('full_name') or existing_user.get('full_name').lower() in ('google candidate', 'user', 'google user', 'candidate')) else existing_user.get('full_name', full_name)
            execute_query(
                """
                UPDATE users
                SET google_sub = %s, auth_provider = %s, avatar_url = COALESCE(avatar_url, %s),
                    full_name = COALESCE(%s, full_name),
                    email_verified = True, last_login_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """,
                (google_sub, provider_str, avatar_url, clean_name, user_id),
                commit=True
            )
            existing_oauth = execute_query("SELECT id FROM oauth_accounts WHERE user_id = %s AND provider = 'google'", (user_id,), fetchone=True)
            if not existing_oauth:
                execute_query(
                    "INSERT INTO oauth_accounts (user_id, provider, provider_user_id) VALUES (%s, 'google', %s)",
                    (user_id, google_sub),
                    commit=True
                )
            user = execute_query("SELECT * FROM users WHERE id = %s", (user_id,), fetchone=True)
            log_audit_event(user_id, 'user', 'google_account_linked', 'user', user_id, f"Linked Google identity to email={email}", request.remote_addr)
        else:
            # CREATE NEW USER ACCOUNT FOR GOOGLE AUTHENTICATION
            candidate_name = full_name or email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
            user_id = execute_query(
                """
                INSERT INTO users (full_name, email, password_hash, email_verified, auth_provider, avatar_url, google_sub, role, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (candidate_name, email, None, True, 'google', avatar_url, google_sub, 'candidate', True),
                commit=True,
                return_id=True
            )
            execute_query("INSERT INTO candidate_profiles (user_id, profile_completion, readiness_score) VALUES (%s, 0, 0)", (user_id,), commit=True)
            execute_query("INSERT INTO oauth_accounts (user_id, provider, provider_user_id) VALUES (%s, 'google', %s)", (user_id, google_sub), commit=True)
            user = execute_query("SELECT * FROM users WHERE id = %s", (user_id,), fetchone=True)
            log_audit_event(user_id, 'user', 'google_signup_success', 'user', user_id, f"Registered new Google candidate: {email}", request.remote_addr)
    else:
        if user.get('role') != 'candidate':
            return jsonify({'success': False, 'error': 'This account is not eligible for candidate access.'}), 403
        if full_name and (not user.get('full_name') or user.get('full_name').lower() in ('google candidate', 'user', 'google user', 'candidate')):
            execute_query("UPDATE users SET full_name = %s WHERE id = %s", (full_name, user['id']), commit=True)
            user['full_name'] = full_name
        execute_query("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = %s", (user['id'],), commit=True)
        log_audit_event(user['id'], 'user', 'google_login_success', 'user', user['id'], f"Google login for: {email}", request.remote_addr)

    # Determine sanitized display name
    resolved_name = user.get('full_name', '')
    if not resolved_name or resolved_name.lower() in ('google candidate', 'user', 'google user', 'candidate'):
        resolved_name = full_name or (email.split('@')[0].replace('.', ' ').replace('_', ' ').title())

    token = generate_jwt_token({
        'user_id': user['id'],
        'email': user['email'],
        'role': user['role'],
        'full_name': resolved_name
    })

    # Send login security email alert for Google authentication (non-blocking)
    try:
        user_agent_str = request.headers.get('User-Agent', '')
        client_ip = request.headers.get('X-Forwarded-For', request.remote_addr or '127.0.0.1')
        if client_ip and ',' in client_ip:
            client_ip = client_ip.split(',')[0].strip()
        client_info = parse_client_info(user_agent_str, client_ip)
        send_login_security_alert(user['email'], user.get('full_name', ''), client_info)
    except Exception as e:
        logger.error(f"Error dispatching Google login alert for {user['email']}: {e}")

    user_data = {
        'id': user['id'],
        'full_name': resolved_name,
        'profile_full_name': resolved_name,
        'email': user['email'],
        'role': user['role'],
        'auth_provider': user.get('auth_provider', 'google'),
        'avatar_url': user.get('avatar_url'),
        'email_verified': True
    }

    profile_status = get_profile_status(user['id'])
    user_data['profile_complete'] = profile_status['profile_complete']
    user_data['profile_completion'] = profile_status['profile_completion']

    redirect_url = '/dashboard' if profile_status['profile_complete'] else '/profile/setup'

    resp = make_response(jsonify({
        'success': True,
        'message': 'Google authentication successful.',
        'user': user_data,
        **profile_status,
        'redirect': redirect_url
    }))

    resp.set_cookie('talent_agent_token', token, httponly=True, samesite='Lax', secure=Config.COOKIE_SECURE, max_age=7 * 24 * 3600)
    return resp, 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Generates and sends password reset OTP securely."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    if not email or '@' not in email:
        return jsonify({'error': 'Please enter a valid email address.'}), 400

    # Anti-enumeration response message
    generic_success_msg = 'If an account exists for this email, a recovery code has been sent.'

    user = execute_query("SELECT id, full_name, is_active, password_hash FROM users WHERE email = %s", (email,), fetchone=True)
    if not user or not user.get('is_active'):
        # Return generic success to prevent email enumeration
        return jsonify({'success': True, 'message': generic_success_msg, 'email': email}), 200

    # Check if account is OAuth-only without a password
    if not user.get('password_hash'):
        oauth_acct = execute_query("SELECT id FROM oauth_accounts WHERE user_id = %s", (user['id'],), fetchone=True)
        if oauth_acct:
            # User registers/logins via Google OAuth
            logger.info(f"Password reset requested for Google-only account: {email}")
            return jsonify({'success': True, 'message': generic_success_msg, 'email': email}), 200

    in_cooldown, cooldown_remaining = check_resend_cooldown(email, 'password_reset')
    if in_cooldown and cooldown_remaining > 0:
        return jsonify({'error': f'Please wait {cooldown_remaining} seconds before requesting another code.', 'cooldown_remaining': cooldown_remaining}), 429

    logger.info(f"[AUTH] Password recovery requested for {email}")
    otp = generate_otp(6)
    logger.info(f"[AUTH] Recovery code generated for {email}")
    otp_h = hash_otp(otp, email)
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Invalidate previous reset OTPs for this account
    execute_query("UPDATE otp_verifications SET used = True, is_used = True WHERE email = %s AND purpose = 'password_reset'", (email,), commit=True)
    execute_query(
        "INSERT INTO otp_verifications (user_id, email, otp_hash, purpose, expires_at) VALUES (%s, %s, %s, %s, %s)",
        (user['id'], email, otp_h, 'password_reset', expires_at), commit=True
    )

    sent_status = send_verification_otp(email, otp, purpose='password_reset')
    log_audit_event(user['id'], 'user', 'forgot_password_requested', 'user', user['id'], f"Reset requested: {email}", request.remote_addr)

    if not sent_status:
        logger.error(f"[AUTH] Recovery email failed for {email}")
        return jsonify({
            'error': "Unable to send recovery code. We couldn't send a verification code right now. Please try again in a moment."
        }), 500

    return jsonify({'success': True, 'message': generic_success_msg, 'email': email}), 200

@auth_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    """Verifies a 6-digit password reset OTP and issues a short-lived reset token."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    otp = data.get('otp', '').strip()

    if not email or not otp or len(otp) != 6:
        return jsonify({'error': 'Valid email and 6-digit code are required.'}), 400

    otp_record = execute_query(
        """
        SELECT * FROM otp_verifications
        WHERE email = %s AND purpose = 'password_reset' AND (used = False OR used IS NULL) AND (is_used = False OR is_used IS NULL)
        ORDER BY created_at DESC LIMIT 1
        """,
        (email,), fetchone=True
    )

    if not otp_record:
        return jsonify({'error': 'Invalid or expired recovery code. Please request a new one.'}), 400

    current_attempts = otp_record.get('attempts') or 0
    if current_attempts >= 5:
        execute_query("UPDATE otp_verifications SET used = True, is_used = True WHERE id = %s", (otp_record['id'],), commit=True)
        return jsonify({'error': 'Too many failed attempts. Please request a new recovery code.'}), 429

    try:
        expires_at = otp_record['expires_at']
        if isinstance(expires_at, str):
            expires_at = datetime.strptime(expires_at.split('.')[0], '%Y-%m-%d %H:%M:%S')
        if datetime.utcnow() > expires_at:
            execute_query("UPDATE otp_verifications SET used = True, is_used = True WHERE id = %s", (otp_record['id'],), commit=True)
            return jsonify({'error': 'Recovery code has expired. Please request a new one.'}), 400
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid recovery code timestamp.'}), 400

    if not verify_otp_hash(otp, email, otp_record['otp_hash']):
        attempts = current_attempts + 1
        execute_query("UPDATE otp_verifications SET attempts = %s, used = %s, is_used = %s WHERE id = %s", (attempts, attempts >= 5, attempts >= 5, otp_record['id']), commit=True)
        if attempts >= 5:
            return jsonify({'error': 'Too many failed attempts. Please request a new recovery code.'}), 429
        return jsonify({'error': 'Incorrect verification code. Please check and try again.'}), 400

    # Mark OTP as verified/used
    execute_query("UPDATE otp_verifications SET used = True, is_used = True WHERE id = %s", (otp_record['id'],), commit=True)

    # Issue a secure 15-minute reset token
    reset_token = generate_jwt_token({
        'user_id': otp_record['user_id'],
        'email': email,
        'purpose': 'password_reset_token'
    }, expires_in_hours=0.25)

    return jsonify({
        'success': True,
        'message': 'Code verified successfully.',
        'reset_token': reset_token
    }), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Resets candidate password using a valid reset token (or raw OTP fallback)."""
    data = request.get_json() or {}
    reset_token = data.get('reset_token', '').strip()
    email = data.get('email', '').strip().lower()
    otp = data.get('otp', '').strip()
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if not new_password or not confirm_password:
        return jsonify({'error': 'New password and confirm password are required.'}), 400

    if new_password != confirm_password:
        return jsonify({'error': 'Passwords do not match.'}), 400

    valid, msg = validate_password_strength(new_password)
    if not valid:
        return jsonify({'error': msg}), 400

    user_id = None
    target_email = email

    # 1. Preferred Flow: Validate short-lived signed reset_token
    if reset_token:
        decoded = verify_jwt_token(reset_token)
        if not decoded or decoded.get('purpose') != 'password_reset_token':
            return jsonify({'error': 'Your password reset session has expired. Please request a new code.'}), 400
        user_id = decoded.get('user_id')
        target_email = decoded.get('email', email)
    # 2. Legacy Direct OTP Fallback
    elif email and otp:
        user = execute_query("SELECT id, is_active, role FROM users WHERE email = %s", (email,), fetchone=True)
        if not user or not user.get('is_active'):
            return jsonify({'error': 'Account not found.'}), 404
        user_id = user['id']
        otp_record = execute_query(
            "SELECT * FROM otp_verifications WHERE email = %s AND purpose = 'password_reset' AND (used = False OR used IS NULL) ORDER BY created_at DESC LIMIT 1",
            (email,), fetchone=True
        )
        if not otp_record or not verify_otp_hash(otp, email, otp_record['otp_hash']):
            return jsonify({'error': 'Invalid or expired OTP verification code.'}), 400
        execute_query("UPDATE otp_verifications SET used = True, is_used = True WHERE id = %s", (otp_record['id'],), commit=True)
    else:
        return jsonify({'error': 'Invalid reset authorization token.'}), 400

    if not user_id:
        return jsonify({'error': 'User identification failed.'}), 400

    pwd_hash = hash_password(new_password)
    execute_query("UPDATE users SET password_hash = %s, email_verified = True WHERE id = %s", (pwd_hash, user_id), commit=True)
    execute_query("UPDATE otp_verifications SET used = True, is_used = True WHERE user_id = %s AND purpose = 'password_reset'", (user_id,), commit=True)

    log_audit_event(user_id, 'user', 'password_reset_success', 'user', user_id, f"Password reset for: {target_email}", request.remote_addr)
    return jsonify({'success': True, 'message': 'Password updated successfully. Please log in with your new password.'}), 200

@auth_bp.route('/me', methods=['GET'])
def get_me():
    """Returns currently authenticated candidate profile and session state."""
    user = get_current_user_from_request()
    if not user:
        return jsonify({'authenticated': False, 'user': None}), 200

    profile_status = get_profile_status(user['id'])

    candidate_profile = execute_query(
        "SELECT headline, preferred_role FROM candidate_profiles WHERE user_id = %s",
        (user['id'],),
        fetchone=True
    ) or {}

    raw_name = user.get('full_name') or ''
    if not raw_name or raw_name.lower() in ('google candidate', 'user', 'google user', 'candidate'):
        if user.get('email'):
            raw_name = user['email'].split('@')[0].replace('.', ' ').replace('_', ' ').title()
        else:
            raw_name = 'Candidate'

    user_data = {
        'id': user['id'],
        'full_name': raw_name,
        'profile_full_name': raw_name,
        'email': user['email'],
        'role': user['role'],
        'email_verified': bool(user.get('email_verified')),
        'auth_provider': user.get('auth_provider', 'local'),
        'avatar_url': user.get('avatar_url'),
        'profile_complete': profile_status['profile_complete'],
        'profile_completion': profile_status['profile_completion']
    }

    return jsonify({
        'authenticated': True,
        'user': user_data,
        **profile_status
    }), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Clears candidate authentication session and HTTP-only cookie."""
    user = get_current_user_from_request()
    if user:
        log_audit_event(user['id'], 'user', 'logout', 'user', user['id'], f"User logged out: {user['email']}", request.remote_addr)

    resp = make_response(jsonify({'success': True, 'message': 'Logged out successfully.'}))
    resp.delete_cookie('talent_agent_token')
    return resp, 200
