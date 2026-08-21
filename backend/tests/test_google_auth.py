import unittest
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from database import execute_query
from services.auth_service import generate_jwt_token

class TestGoogleAuthFlow(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_google_config_endpoint(self):
        resp = self.client.get('/api/auth/google/config')
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertIn('enabled', data)
        self.assertIn('client_id', data)

    def test_google_auth_requires_credential(self):
        resp = self.client.post('/api/auth/google', json={})
        self.assertEqual(resp.status_code, 400)

    def test_invalid_google_credential_rejected(self):
        resp = self.client.post('/api/auth/google', json={'credential': 'invalid_fake_google_jwt_token'})
        self.assertEqual(resp.status_code, 400)
        data = json.loads(resp.data)
        self.assertFalse(data['success'])
        self.assertIn('error', data)

    def test_google_authenticated_user_access(self):
        # Create a Google user directly in database
        email = "google_candidate_test@gmail.com"
        google_sub = "google_sub_123456789"
        existing = execute_query("SELECT id FROM users WHERE email = %s", (email,), fetchone=True)
        if existing:
            user_id = existing['id']
        else:
            user_id = execute_query(
                """
                INSERT INTO users (full_name, email, password_hash, email_verified, auth_provider, google_sub, role, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                ("Google Candidate", email, None, True, "google", google_sub, "candidate", True),
                commit=True, return_id=True
            )
            execute_query("INSERT INTO candidate_profiles (user_id, profile_completion) VALUES (%s, 0)", (user_id,), commit=True)

        token = generate_jwt_token({'user_id': user_id, 'email': email, 'role': 'candidate', 'full_name': 'Google Candidate'})

        # Test /api/auth/me using token header
        me_resp = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(me_resp.status_code, 200)
        me_data = json.loads(me_resp.data)
        self.assertTrue(me_data['authenticated'])
        self.assertEqual(me_data['user']['email'], email)
        self.assertEqual(me_data['user']['auth_provider'], 'google')

        # Test /api/ai/chat authorization
        chat_resp = self.client.post('/api/ai/chat', headers={'Authorization': f'Bearer {token}'}, json={'message': 'Hi'})
        # Should not be 401 Unauthorized
        self.assertNotEqual(chat_resp.status_code, 401)

    def test_google_auth_mocked_new_user(self):
        import uuid
        from unittest.mock import patch
        uid = uuid.uuid4().hex[:8]
        email = f"mock_candidate_{uid}@gmail.com"
        google_sub = f"mock_sub_{uid}"
        mock_idinfo = {
            'iss': 'https://accounts.google.com',
            'sub': google_sub,
            'email': email,
            'email_verified': True,
            'name': 'Mock Google Candidate',
            'picture': 'https://example.com/avatar.jpg',
            'aud': '231069201439-nn48c3s4vn08vrl3ih4l8t8tjgqf8hl4.apps.googleusercontent.com',
            'exp': 1800000000
        }
        with patch('google.oauth2.id_token.verify_oauth2_token', return_value=mock_idinfo), \
             patch('routes.auth_routes.send_login_security_alert', return_value=True):
            resp = self.client.post('/api/auth/google', json={'credential': 'valid_mock_jwt'})
            self.assertEqual(resp.status_code, 200)
            data = json.loads(resp.data)
            self.assertTrue(data['success'])
            self.assertEqual(data['user']['email'], email)
            self.assertEqual(data['user']['auth_provider'], 'google')

            # Verify cookie set
            cookies = [c for c in resp.headers.getlist('Set-Cookie') if 'talent_agent_token' in c]
            self.assertTrue(len(cookies) > 0)

            # Verify /api/auth/me works with cookie
            me_resp = self.client.get('/api/auth/me', headers={'Cookie': cookies[0]})
            self.assertEqual(me_resp.status_code, 200)
            me_data = json.loads(me_resp.data)
            self.assertTrue(me_data['authenticated'])
            self.assertEqual(me_data['user']['email'], email)

    def test_google_auth_mocked_account_linking(self):
        import uuid
        from unittest.mock import patch
        uid = uuid.uuid4().hex[:8]
        email = f"mock_link_{uid}@gmail.com"
        google_sub = f"mock_sub_link_{uid}"
        user_id = execute_query(
            "INSERT INTO users (full_name, email, password_hash, email_verified, auth_provider, role, is_active) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            ("Link Candidate", email, "some_hash", True, "local", "candidate", True),
            commit=True, return_id=True
        )

        mock_idinfo = {
            'iss': 'accounts.google.com',
            'sub': google_sub,
            'email': email,
            'email_verified': True,
            'name': 'Link Candidate Google',
            'picture': 'https://example.com/avatar_link.jpg',
            'aud': '231069201439-nn48c3s4vn08vrl3ih4l8t8tjgqf8hl4.apps.googleusercontent.com',
            'exp': 1800000000
        }
        with patch('google.oauth2.id_token.verify_oauth2_token', return_value=mock_idinfo), \
             patch('routes.auth_routes.send_login_security_alert', return_value=True):
            resp = self.client.post('/api/auth/google', json={'credential': 'valid_mock_jwt'})
            self.assertEqual(resp.status_code, 200)
            data = json.loads(resp.data)
            self.assertTrue(data['success'])
            self.assertEqual(data['user']['auth_provider'], 'local+google')

            # Verify database updated
            updated_user = execute_query("SELECT google_sub, auth_provider FROM users WHERE id = %s", (user_id,), fetchone=True)
            self.assertEqual(updated_user['google_sub'], google_sub)
            self.assertEqual(updated_user['auth_provider'], 'local+google')

    def test_google_auth_mocked_unverified_email_rejected(self):
        from unittest.mock import patch
        mock_idinfo = {
            'iss': 'accounts.google.com',
            'sub': 'mock_sub_unverified',
            'email': 'unverified@gmail.com',
            'email_verified': False,
            'aud': '231069201439-nn48c3s4vn08vrl3ih4l8t8tjgqf8hl4.apps.googleusercontent.com',
            'exp': 1800000000
        }
        with patch('google.oauth2.id_token.verify_oauth2_token', return_value=mock_idinfo):
            resp = self.client.post('/api/auth/google', json={'credential': 'valid_mock_jwt'})
            self.assertEqual(resp.status_code, 400)
            data = json.loads(resp.data)
            self.assertFalse(data['success'])
            self.assertIn('could not be verified', data['error'])

    def test_google_auth_mocked_invalid_issuer_rejected(self):
        from unittest.mock import patch
        mock_idinfo = {
            'iss': 'https://evil-issuer.com',
            'sub': 'mock_sub_evil',
            'email': 'evil@gmail.com',
            'email_verified': True,
            'aud': '231069201439-nn48c3s4vn08vrl3ih4l8t8tjgqf8hl4.apps.googleusercontent.com',
            'exp': 1800000000
        }
        with patch('google.oauth2.id_token.verify_oauth2_token', return_value=mock_idinfo):
            resp = self.client.post('/api/auth/google', json={'credential': 'valid_mock_jwt'})
            self.assertEqual(resp.status_code, 400)
            data = json.loads(resp.data)
            self.assertFalse(data['success'])
            self.assertIn('Invalid issuer', data['error'])

if __name__ == '__main__':
    unittest.main()
