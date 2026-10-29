import unittest
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from database import execute_query
from services.auth_service import (
    generate_otp,
    hash_otp,
    check_resend_cooldown,
    hash_password
)

class TestOTPVerificationFlow(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        self.test_email = "otp_unit_test_candidate@talentagent.ai"

        # Clean up any existing records for test email
        execute_query("DELETE FROM otp_verifications WHERE email = %s", (self.test_email,), commit=True)
        execute_query("DELETE FROM candidate_profiles WHERE user_id IN (SELECT id FROM users WHERE email = %s)", (self.test_email,), commit=True)
        execute_query("DELETE FROM users WHERE email = %s", (self.test_email,), commit=True)

        # Create candidate user
        pwd_hash = hash_password("CandidatePassword@2026")
        self.user_id = execute_query(
            "INSERT INTO users (full_name, email, password_hash, email_verified, auth_provider, role, is_active) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            ("OTP Test Candidate", self.test_email, pwd_hash, False, "local", "candidate", True),
            commit=True, return_id=True
        )
        execute_query("INSERT INTO candidate_profiles (user_id, profile_completion, readiness_score) VALUES (%s, 0, 0)", (self.user_id,), commit=True)

    def tearDown(self):
        execute_query("DELETE FROM otp_verifications WHERE email = %s", (self.test_email,), commit=True)
        execute_query("DELETE FROM candidate_profiles WHERE user_id IN (SELECT id FROM users WHERE email = %s)", (self.test_email,), commit=True)
        execute_query("DELETE FROM users WHERE email = %s", (self.test_email,), commit=True)

    def test_cooldown_behavior(self):
        # 1. No prior OTP -> not in cooldown
        in_cd, rem = check_resend_cooldown(self.test_email, 'email_verification')
        self.assertFalse(in_cd)
        self.assertEqual(rem, 0)

        # 2. Insert fresh OTP record just now
        raw_otp = generate_otp(6)
        otp_h = hash_otp(raw_otp, self.test_email)
        exp = datetime.utcnow() + timedelta(minutes=10)
        execute_query(
            "INSERT INTO otp_verifications (user_id, email, otp_hash, purpose, expires_at) VALUES (%s, %s, %s, %s, %s)",
            (self.user_id, self.test_email, otp_h, 'email_verification', exp),
            commit=True
        )

        # Should now be in cooldown with ~45 seconds remaining
        in_cd, rem = check_resend_cooldown(self.test_email, 'email_verification')
        self.assertTrue(in_cd)
        self.assertGreater(rem, 0)
        self.assertLessEqual(rem, 45)

    def test_verify_email_success(self):
        raw_otp = "789123"
        otp_h = hash_otp(raw_otp, self.test_email)
        exp = datetime.utcnow() + timedelta(minutes=10)
        execute_query(
            "INSERT INTO otp_verifications (user_id, email, otp_hash, purpose, expires_at) VALUES (%s, %s, %s, %s, %s)",
            (self.user_id, self.test_email, otp_h, 'email_verification', exp),
            commit=True
        )

        # Verify using correct OTP
        resp = self.client.post('/api/auth/verify-email', json={
            'email': self.test_email,
            'otp': raw_otp
        })
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertTrue(data['success'])
        self.assertEqual(data['user']['email_verified'], True)

        # Confirm user is marked email_verified in DB
        u = execute_query("SELECT email_verified FROM users WHERE id = %s", (self.user_id,), fetchone=True)
        self.assertTrue(u['email_verified'])

        # Confirm OTP is marked used
        otps = execute_query("SELECT used, is_used FROM otp_verifications WHERE email = %s", (self.test_email,), fetchall=True)
        for r in otps:
            self.assertTrue(r['used'])
            self.assertTrue(r['is_used'])

    def test_verify_email_invalid_otp(self):
        raw_otp = "123456"
        otp_h = hash_otp(raw_otp, self.test_email)
        exp = datetime.utcnow() + timedelta(minutes=10)
        execute_query(
            "INSERT INTO otp_verifications (user_id, email, otp_hash, purpose, expires_at) VALUES (%s, %s, %s, %s, %s)",
            (self.user_id, self.test_email, otp_h, 'email_verification', exp),
            commit=True
        )

        resp = self.client.post('/api/auth/verify-email', json={
            'email': self.test_email,
            'otp': '999999'
        })
        self.assertEqual(resp.status_code, 400)
        data = json.loads(resp.data)
        self.assertIn('Invalid', data['error'])

    def test_verify_email_matches_any_valid_active_otp(self):
        # Insert OTP 1
        raw_otp1 = "111111"
        h1 = hash_otp(raw_otp1, self.test_email)
        exp1 = datetime.utcnow() + timedelta(minutes=10)
        execute_query(
            "INSERT INTO otp_verifications (user_id, email, otp_hash, purpose, expires_at) VALUES (%s, %s, %s, %s, %s)",
            (self.user_id, self.test_email, h1, 'email_verification', exp1),
            commit=True
        )

        # Insert OTP 2
        raw_otp2 = "222222"
        h2 = hash_otp(raw_otp2, self.test_email)
        exp2 = datetime.utcnow() + timedelta(minutes=10)
        execute_query(
            "INSERT INTO otp_verifications (user_id, email, otp_hash, purpose, expires_at) VALUES (%s, %s, %s, %s, %s)",
            (self.user_id, self.test_email, h2, 'email_verification', exp2),
            commit=True
        )

        # Verifying with either valid OTP should succeed
        resp = self.client.post('/api/auth/verify-email', json={
            'email': self.test_email,
            'otp': raw_otp2
        })
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertTrue(data['success'])

if __name__ == '__main__':
    unittest.main()
