import unittest
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from database import execute_query
from services.auth_service import hash_password, generate_jwt_token

class TestFullAuthMatrix(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_google_config_endpoint(self):
        resp = self.client.get('/api/auth/google/config')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertTrue(data['enabled'])
        self.assertEqual(data['client_id'], '231069201439-nn48c3s4vn08vrl3ih4l8t8tjgqf8hl4.apps.googleusercontent.com')
        self.assertNotIn('client_secret', data)
        self.assertNotIn('GOOGLE_CLIENT_SECRET', data)

    def test_auth_me_unauthenticated(self):
        resp = self.client.get('/api/auth/me')
        data = json.loads(resp.data)
        self.assertFalse(data['authenticated'])
        self.assertIsNone(data['user'])

    def test_email_login_registered_user(self):
        email = "test_matrix_candidate@talentagent.ai"
        pwd = "CandidatePassword@2026"
        existing = execute_query("SELECT id FROM users WHERE email = %s", (email,), fetchone=True)
        if not existing:
            pwd_hash = hash_password(pwd)
            user_id = execute_query(
                "INSERT INTO users (full_name, email, password_hash, email_verified, auth_provider, role, is_active) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                ("Matrix Candidate", email, pwd_hash, True, "local", "candidate", True),
                commit=True, return_id=True
            )
            execute_query("INSERT INTO candidate_profiles (user_id, profile_completion) VALUES (%s, 100)", (user_id,), commit=True)

        resp = self.client.post('/api/auth/login', json={'email': email, 'password': pwd})
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertTrue(data['success'])
        self.assertIn('token', data)

    def test_account_linking_existing_local_user(self):
        email = "test_linking_user@gmail.com"
        pwd = "CandidatePassword@2026"
        existing = execute_query("SELECT id FROM users WHERE email = %s", (email,), fetchone=True)
        if not existing:
            pwd_hash = hash_password(pwd)
            user_id = execute_query(
                "INSERT INTO users (full_name, email, password_hash, email_verified, auth_provider, role, is_active) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                ("Existing Local Candidate", email, pwd_hash, True, "local", "candidate", True),
                commit=True, return_id=True
            )
            execute_query("INSERT INTO candidate_profiles (user_id, profile_completion) VALUES (%s, 100)", (user_id,), commit=True)
        else:
            user_id = existing['id']

        execute_query(
            "UPDATE users SET google_sub = %s, auth_provider = %s WHERE id = %s",
            ("google_sub_link_999", "local+google", user_id),
            commit=True
        )
        linked_user = execute_query("SELECT * FROM users WHERE id = %s", (user_id,), fetchone=True)
        self.assertEqual(linked_user['google_sub'], "google_sub_link_999")
        self.assertEqual(linked_user['auth_provider'], "local+google")

if __name__ == '__main__':
    unittest.main()
