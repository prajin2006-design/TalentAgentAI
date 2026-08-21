import unittest
import json
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from services.auth_service import (
    validate_password_strength,
    generate_otp,
    hash_otp,
    check_resend_cooldown
)

class TestAuthAndSecurity(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_password_strength_validation(self):
        # Invalid passwords
        valid, msg = validate_password_strength('short')
        self.assertFalse(valid)

        valid, msg = validate_password_strength('no_uppercase_123!')
        self.assertFalse(valid)

        valid, msg = validate_password_strength('NO_LOWERCASE_123!')
        self.assertFalse(valid)

        valid, msg = validate_password_strength('NoSpecialChar123')
        self.assertFalse(valid)

        # Valid password
        valid, msg = validate_password_strength('Talent@Agent2026')
        self.assertTrue(valid)

    def test_otp_generation_format(self):
        otp = generate_otp(6)
        self.assertEqual(len(otp), 6)
        self.assertTrue(otp.isdigit())

    def test_otp_hash_consistency(self):
        otp = "123456"
        email = "testcandidate@talentagent.ai"
        hash1 = hash_otp(otp, email)
        hash2 = hash_otp(otp, email)
        self.assertEqual(hash1, hash2)

    def test_health_check_endpoint(self):
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')

if __name__ == '__main__':
    unittest.main()
