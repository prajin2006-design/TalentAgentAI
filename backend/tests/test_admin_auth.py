import unittest
import json
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from database import execute_query, init_db
from services.auth_service import hash_password, generate_jwt_token

class TestAdminAuth(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

        pwd_hash = hash_password('Admin123!')
        existing_admin = execute_query("SELECT id FROM admin_users WHERE email = %s", ('admin@talentagent.ai',), fetchone=True)
        if not existing_admin:
            execute_query(
                "INSERT INTO admin_users (full_name, email, password_hash, role, is_active) VALUES (%s, %s, %s, %s, %s)",
                ('System Administrator', 'admin@talentagent.ai', pwd_hash, 'super_admin', True),
                commit=True
            )
        else:
            execute_query(
                "UPDATE admin_users SET password_hash = %s, is_active = True WHERE email = %s",
                (pwd_hash, 'admin@talentagent.ai'),
                commit=True
            )

    def test_admin_me_unauthenticated(self):
        """Unauthenticated call to /api/admin/me should return authenticated: False"""
        response = self.client.get('/api/admin/me')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertFalse(data.get('authenticated'))

    def test_admin_login_and_me_success(self):
        """Valid admin login should succeed and /api/admin/me should return admin data"""
        login_res = self.client.post('/api/admin/login', json={
            'email': 'admin@talentagent.ai',
            'password': 'Admin123!'
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = json.loads(login_res.data)
        self.assertTrue(login_data.get('success'))
        self.assertEqual(login_data.get('admin', {}).get('email'), 'admin@talentagent.ai')

        # Test /api/admin/me with session cookie
        me_res = self.client.get('/api/admin/me')
        self.assertEqual(me_res.status_code, 200)
        me_data = json.loads(me_res.data)
        self.assertTrue(me_data.get('authenticated'))
        self.assertEqual(me_data.get('admin', {}).get('role'), 'super_admin')

    def test_admin_routes_forbidden_for_candidate(self):
        """Candidate token accessing admin routes should receive 403 Forbidden"""
        candidate_token = generate_jwt_token({
            'user_id': 9999,
            'email': 'candidate@test.com',
            'role': 'candidate',
            'full_name': 'Test Candidate'
        })

        response = self.client.get('/api/admin/dashboard', headers={
            'Authorization': f'Bearer {candidate_token}'
        })
        self.assertEqual(response.status_code, 403)

if __name__ == '__main__':
    unittest.main()
