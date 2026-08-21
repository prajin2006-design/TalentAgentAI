import unittest
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from database import execute_query
from services.auth_service import hash_password, generate_jwt_token
from services.ai_service import get_candidate_context_for_ai, AIServiceError

class TestAIAssistantEndpoint(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

        # Create a test candidate user in database
        self.test_email = "test_ai_candidate@talentagent.ai"
        existing = execute_query("SELECT id FROM users WHERE email = %s", (self.test_email,), fetchone=True)
        if existing:
            self.user_id = existing['id']
        else:
            pwd_hash = hash_password("TestCandidate@2026")
            self.user_id = execute_query(
                "INSERT INTO users (full_name, email, password_hash, email_verified, role, is_active) VALUES (%s, %s, %s, %s, %s, %s)",
                ("Prajin Candidate", self.test_email, pwd_hash, True, "candidate", True),
                commit=True, return_id=True
            )
            execute_query(
                "INSERT INTO candidate_profiles (user_id, headline, preferred_role, location) VALUES (%s, %s, %s, %s)",
                (self.user_id, "Frontend Developer Candidate", "Frontend Developer", "Bengaluru, KA"),
                commit=True
            )
            execute_query(
                "INSERT INTO candidate_skills (user_id, skill_name, skill_category, proficiency) VALUES (%s, %s, %s, %s)",
                (self.user_id, "React", "Technical", 90),
                commit=True
            )

        self.token = generate_jwt_token({
            'user_id': self.user_id,
            'email': self.test_email,
            'role': 'candidate',
            'full_name': 'Prajin Candidate'
        })
        self.headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}

    def test_health_check(self):
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')

    def test_ai_config_endpoint(self):
        response = self.client.get('/api/ai/config')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('configured', data)
        self.assertIn('model', data)

    def test_unauthenticated_chat_rejected(self):
        response = self.client.post('/api/ai/chat', json={'message': 'Hi'})
        self.assertEqual(response.status_code, 401)

    def test_candidate_context_retrieval(self):
        context, has_data = get_candidate_context_for_ai(self.user_id)
        self.assertTrue(has_data)
        self.assertEqual(context['candidate_name'], 'Prajin Candidate')
        self.assertIn('React', context['skills'])

    def test_conversations_api(self):
        # List conversations
        resp = self.client.get('/api/ai/conversations', headers=self.headers)
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.data)
        self.assertIn('conversations', data)

if __name__ == '__main__':
    unittest.main()
