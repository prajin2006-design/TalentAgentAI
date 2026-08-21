import smtplib
import logging
import re
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import Config

logger = logging.getLogger(__name__)

def parse_client_info(user_agent_str: str = '', ip_address: str = '') -> dict:
    """
    Parses device, operating system, and browser from user-agent string and client IP.
    Does not make external network requests for geolocation to protect privacy and latency.
    """
    ua = (user_agent_str or '').strip()
    
    # 1. Detect Operating System & Device Type
    device = "Desktop / Laptop"
    os_name = "Unknown OS"

    if re.search(r'iPhone', ua, re.IGNORECASE):
        device = "iPhone"
        os_match = re.search(r'OS (\d+[_\.]\d+)', ua)
        os_name = f"iOS {os_match.group(1).replace('_', '.')}" if os_match else "iOS"
    elif re.search(r'iPad', ua, re.IGNORECASE):
        device = "iPad"
        os_match = re.search(r'OS (\d+[_\.]\d+)', ua)
        os_name = f"iPadOS {os_match.group(1).replace('_', '.')}" if os_match else "iPadOS"
    elif re.search(r'Android', ua, re.IGNORECASE):
        if re.search(r'Mobile', ua, re.IGNORECASE):
            device = "Android phone"
        else:
            device = "Android tablet"
        os_match = re.search(r'Android (\d+(\.\d+)?)', ua)
        os_name = f"Android {os_match.group(1)}" if os_match else "Android"
    elif re.search(r'Windows NT 10\.0|Windows NT 11\.0', ua, re.IGNORECASE):
        device = "Windows PC"
        os_name = "Windows 10 / 11"
    elif re.search(r'Windows NT 6\.3', ua, re.IGNORECASE):
        device = "Windows PC"
        os_name = "Windows 8.1"
    elif re.search(r'Windows NT 6\.1', ua, re.IGNORECASE):
        device = "Windows PC"
        os_name = "Windows 7"
    elif re.search(r'Windows', ua, re.IGNORECASE):
        device = "Windows PC"
        os_name = "Windows"
    elif re.search(r'Macintosh|Mac OS X', ua, re.IGNORECASE):
        device = "Mac"
        os_match = re.search(r'Mac OS X (\d+[_\.]\d+([_\.]\d+)?)', ua)
        os_name = f"macOS {os_match.group(1).replace('_', '.')}" if os_match else "macOS"
    elif re.search(r'CrOS', ua, re.IGNORECASE):
        device = "Chromebook"
        os_name = "Chrome OS"
    elif re.search(r'Linux', ua, re.IGNORECASE):
        device = "Linux PC"
        os_name = "Linux"

    # 2. Detect Browser
    browser = "Web Browser"
    if re.search(r'Edg/|Edge/', ua, re.IGNORECASE):
        browser = "Microsoft Edge"
    elif re.search(r'Brave', ua, re.IGNORECASE):
        browser = "Brave"
    elif re.search(r'OPR/|Opera/', ua, re.IGNORECASE):
        browser = "Opera"
    elif re.search(r'Vivaldi/', ua, re.IGNORECASE):
        browser = "Vivaldi"
    elif re.search(r'SamsungBrowser/', ua, re.IGNORECASE):
        browser = "Samsung Internet"
    elif re.search(r'Chrome/', ua, re.IGNORECASE):
        browser = "Google Chrome"
    elif re.search(r'Firefox/|FxiOS/', ua, re.IGNORECASE):
        browser = "Mozilla Firefox"
    elif re.search(r'Safari/', ua, re.IGNORECASE):
        browser = "Apple Safari"

    # 3. Format Date & Time
    now_utc = datetime.now(timezone.utc)
    formatted_time = now_utc.strftime("%d %B %Y, %I:%M %p UTC")

    # 4. Clean IP
    clean_ip = ip_address.strip() if ip_address else "127.0.0.1"

    return {
        "device": device,
        "browser": browser,
        "os": os_name,
        "ip": clean_ip,
        "location": "Location unavailable",
        "timestamp": formatted_time
    }

def send_login_security_alert(recipient_email: str, recipient_name: str = '', client_info: dict = None) -> bool:
    """
    Sends an automated security email notification when a real user successfully authenticates.
    Includes device type, browser, OS, login timestamp, and IP address.
    Never raises exceptions to callers — handles SMTP failures gracefully without blocking login.
    """
    if not recipient_email or not isinstance(recipient_email, str) or '@' not in recipient_email:
        logger.warning(f"Login alert skipped: invalid recipient email '{recipient_email}'")
        return False

    clean_email = recipient_email.strip().lower()

    # Safeguard: Do NOT send real SMTP emails to test/mock/example addresses
    mock_patterns = ['mock_', 'mockcandidate', 'example.com', 'example.org', 'test.com', 'test_candidate', 'fake_']
    if any(p in clean_email for p in mock_patterns):
        logger.info(f"Login security alert skipped for mock/test recipient email: '{clean_email}'")
        return True

    info = client_info or {
        "device": "Unknown Device",
        "browser": "Web Browser",
        "os": "Unknown OS",
        "ip": "127.0.0.1",
        "location": "Location unavailable",
        "timestamp": datetime.now(timezone.utc).strftime("%d %B %Y, %I:%M %p UTC")
    }

    raw_name = recipient_name.strip() if recipient_name else ''
    # Filter out mock/generic candidate fallback names
    invalid_name_keywords = ['mock', 'google candidate', 'demo candidate', 'test user', 'placeholder']
    if raw_name and not any(kw in raw_name.lower() for kw in invalid_name_keywords):
        greeting = f"Hello {raw_name},"
    else:
        greeting = "Hello,"

    subject = "New login to your Talent Agent AI account"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8F9FB;
      margin: 0;
      padding: 32px 16px;
      color: #111827;
    }}
    .email-container {{
      max-width: 540px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }}
    .brand-header {{
      font-size: 17px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 24px;
      letter-spacing: -0.02em;
    }}
    .brand-header span {{
      background: #243BFF;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 4px;
    }}
    .security-badge {{
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      color: #243BFF;
      background-color: #EEF2FF;
      border: 1px solid rgba(36, 59, 255, 0.15);
      border-radius: 999px;
      padding: 3px 10px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .email-title {{
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 8px 0;
      letter-spacing: -0.025em;
    }}
    .email-body-text {{
      font-size: 14px;
      color: #4B5563;
      line-height: 1.55;
      margin: 0 0 24px 0;
    }}
    .details-card {{
      background-color: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }}
    .detail-row {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #F3F4F6;
      font-size: 13px;
    }}
    .detail-row:last-child {{
      border-bottom: none;
      padding-bottom: 0;
    }}
    .detail-row:first-child {{
      padding-top: 0;
    }}
    .detail-label {{
      color: #6B7280;
      font-weight: 500;
    }}
    .detail-value {{
      color: #111827;
      font-weight: 600;
      text-align: right;
    }}
    .action-guidance {{
      font-size: 13px;
      color: #4B5563;
      line-height: 1.5;
      margin-bottom: 20px;
      padding: 14px;
      background-color: #F9FAFB;
      border-left: 3px solid #243BFF;
      border-radius: 4px;
    }}
    .action-guidance strong {{
      color: #111827;
    }}
    .footer-note {{
      font-size: 12px;
      color: #9CA3AF;
      line-height: 1.5;
      border-top: 1px solid #E5E7EB;
      padding-top: 20px;
      margin-top: 24px;
    }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="brand-header">TALENT AGENT <span>AI</span></div>
    <div class="security-badge">Security Alert</div>
    <h1 class="email-title">New login detected</h1>
    <p class="email-body-text">
      {greeting}<br>
      Your Talent Agent AI account was just signed in.
    </p>

    <div class="details-card">
      <div class="detail-row">
        <span class="detail-label">Account Email</span>
        <span class="detail-value">{recipient_email}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Device</span>
        <span class="detail-value">{info.get('device', 'Desktop')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Browser</span>
        <span class="detail-value">{info.get('browser', 'Web Browser')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Operating System</span>
        <span class="detail-value">{info.get('os', 'Unknown OS')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time</span>
        <span class="detail-value">{info.get('timestamp', '')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">IP Address</span>
        <span class="detail-value">{info.get('ip', '127.0.0.1')}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Location</span>
        <span class="detail-value">{info.get('location', 'Location unavailable')}</span>
      </div>
    </div>

    <div class="action-guidance">
      <strong>If this was you:</strong> You can safely ignore this email.<br><br>
      <strong>If you don't recognize this activity:</strong> Please secure your account immediately by resetting your password on the Talent Agent AI portal.
    </div>

    <div class="footer-note">
      This is an automated security notification sent to {recipient_email}.<br>
      Talent Agent AI Platform Security.
    </div>
  </div>
</body>
</html>
"""

    plain_text = f"""Talent Agent AI — Security Alert

New login detected

{greeting}
Your Talent Agent AI account was just signed in.

Account Email:    {recipient_email}
Device:           {info.get('device', 'Desktop')}
Browser:          {info.get('browser', 'Web Browser')}
Operating System: {info.get('os', 'Unknown OS')}
Date & Time:      {info.get('timestamp', '')}
IP Address:       {info.get('ip', '127.0.0.1')}
Location:         {info.get('location', 'Location unavailable')}

If this was you:
You can safely ignore this email.

If you don't recognize this activity:
Please secure your account immediately by resetting your password on the Talent Agent AI portal.

---
This is an automated security notification sent to {recipient_email}.
Talent Agent AI Platform Security.
"""

    smtp_server = Config.MAIL_SERVER
    smtp_port = Config.MAIL_PORT
    username = Config.MAIL_USERNAME
    password = Config.MAIL_PASSWORD
    sender = Config.MAIL_DEFAULT_SENDER or username

    if not username or not password:
        logger.info("SMTP credentials not configured in backend/.env — login security email logged but not transmitted.")
        return False

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = sender
        msg['To'] = recipient_email

        msg.attach(MIMEText(plain_text, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_content, 'html', 'utf-8'))

        with smtplib.SMTP(smtp_server, smtp_port, timeout=12) as server:
            if Config.MAIL_USE_TLS:
                server.starttls()
            server.login(username, password)
            server.sendmail(sender, [recipient_email], msg.as_string())

        logger.info(f"Login security alert email successfully delivered to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to deliver login security alert to {recipient_email}: {e}")
        return False

def send_verification_otp(email: str, otp: str, purpose: str = 'email_verification') -> bool:
    """
    Sends a 6-digit verification OTP email to candidate using Gmail/custom SMTP (STARTTLS).
    Returns True if sent successfully via SMTP, or False if SMTP sending failed.
    Never logs plaintext OTP or credentials.
    """
    is_password_reset = (purpose == 'password_reset')
    subject = "Reset your Talent Agent AI password" if is_password_reset else "Verify your Talent Agent AI account"
    heading = "Reset your password" if is_password_reset else "Verify your email"
    action_notice = (
        "You requested a password reset for your Talent Agent AI account."
        if is_password_reset
        else "Thank you for creating a Talent Agent AI account."
    )

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #FFFAFA;
          margin: 0;
          padding: 40px 20px;
          color: #080808;
        }}
        .email-container {{
          max-width: 520px;
          margin: 0 auto;
          background: #FFFFFF;
          border-radius: 20px;
          padding: 40px 36px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.03);
        }}
        .brand-header {{
          font-size: 18px;
          font-weight: 800;
          color: #080808;
          margin-bottom: 28px;
          letter-spacing: -0.02em;
        }}
        .brand-header span {{
          color: #0000FF;
        }}
        .email-title {{
          font-size: 24px;
          font-weight: 800;
          color: #080808;
          margin: 0 0 12px 0;
          letter-spacing: -0.03em;
        }}
        .email-body-text {{
          font-size: 15px;
          color: #666666;
          line-height: 1.6;
          margin: 0 0 28px 0;
        }}
        .otp-box {{
          background-color: #EEF0FF;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          margin-bottom: 28px;
        }}
        .otp-label {{
          font-size: 12px;
          font-weight: 700;
          color: #0000FF;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }}
        .otp-code {{
          font-size: 38px;
          font-weight: 800;
          letter-spacing: 10px;
          color: #0000FF;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }}
        .footer-note {{
          font-size: 13px;
          color: #888888;
          line-height: 1.6;
          border-top: 1px solid #F3F3F3;
          padding-top: 24px;
        }}
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="brand-header">TALENT AGENT <span>AI</span></div>
        <h1 class="email-title">{heading}</h1>
        <p class="email-body-text">
          {action_notice}<br>
          Your verification code is:
        </p>
        <div class="otp-box">
          <div class="otp-label">Verification Code</div>
          <div class="otp-code">{otp}</div>
        </div>
        <div class="footer-note">
          This code expires in 10 minutes.<br>
          If you did not create a Talent Agent AI account, you can ignore this email.<br><br>
          Do not reply to this email.
        </div>
      </div>
    </body>
    </html>
    """

    plain_text = f"""Talent Agent AI

{heading}

Your verification code is:

{otp}

This code expires in 10 minutes.

If you did not create a Talent Agent AI account, you can ignore this email.

Do not reply to this email.
"""

    smtp_server = Config.MAIL_SERVER
    smtp_port = Config.MAIL_PORT
    username = Config.MAIL_USERNAME
    password = (Config.MAIL_PASSWORD or '').replace(" ", "").strip()
    sender = Config.MAIL_DEFAULT_SENDER or username

    if not username or not password:
        logger.error("[AUTH] SMTP Configuration Error: MAIL_USERNAME or MAIL_PASSWORD is not set in backend/.env.")
        return False

    try:
        logger.info(f"[AUTH] Sending recovery email to {email}")
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = sender
        msg['To'] = email

        msg.attach(MIMEText(plain_text, 'plain', 'utf-8'))
        msg.attach(MIMEText(html_content, 'html', 'utf-8'))

        with smtplib.SMTP(smtp_server, smtp_port, timeout=12) as server:
            if Config.MAIL_USE_TLS:
                server.starttls()
            server.login(username, password)
            server.sendmail(sender, [email], msg.as_string())

        logger.info(f"[AUTH] Recovery email accepted by provider for {email}")
        return True
    except Exception as e:
        logger.error(f"[AUTH] Recovery email failed for {email}: {e}")
        return False

# Backward compatibility alias
def send_email_otp(recipient_email: str, recipient_name: str, otp_code: str, purpose: str = 'email_verification') -> bool:
    return send_verification_otp(recipient_email, otp_code, purpose)
