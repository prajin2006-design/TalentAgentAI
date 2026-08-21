import unittest
import json
import sys
import io
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import create_app
from database import execute_query
from services.auth_service import generate_jwt_token

class TestATSResumeBuilder(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

        # Create a test candidate
        self.email = "ats_builder_tester@gmail.com"
        existing = execute_query("SELECT id FROM users WHERE email = %s", (self.email,), fetchone=True)
        if existing:
            self.user_id = existing['id']
        else:
            self.user_id = execute_query(
                "INSERT INTO users (full_name, email, password_hash, email_verified, auth_provider, role, is_active) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                ("ATS Test Candidate", self.email, "some_hash", True, "local", "candidate", True),
                commit=True, return_id=True
            )
            execute_query("INSERT INTO candidate_profiles (user_id, profile_completion, headline, preferred_role) VALUES (%s, 100, %s, %s)", (self.user_id, "Senior Software Engineer", "Full Stack Developer"), commit=True)
            execute_query("INSERT INTO candidate_skills (user_id, skill_name, proficiency) VALUES (%s, %s, %s)", (self.user_id, "React", "advanced"), commit=True)
            execute_query("INSERT INTO candidate_skills (user_id, skill_name, proficiency) VALUES (%s, %s, %s)", (self.user_id, "Python", "advanced"), commit=True)

        self.token = generate_jwt_token({'user_id': self.user_id, 'email': self.email, 'role': 'candidate', 'full_name': 'ATS Test Candidate'})
        self.headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}

    def test_create_and_get_builder_resume(self):
        # 1. Create resume
        payload = {
            'name': 'Software Engineer ATS Resume',
            'template': 'modern',
            'personal_info': {
                'full_name': 'ATS Test Candidate',
                'professional_title': 'Lead Software Engineer',
                'email': self.email,
                'phone': '+1 (555) 019-2834',
                'location': 'San Francisco, CA',
                'linkedin_url': 'https://linkedin.com/in/testcandidate',
                'github_url': 'https://github.com/testcandidate'
            },
            'summary': 'Results-oriented Lead Software Engineer with 5+ years of experience architecting distributed cloud applications and high-throughput microservices.',
            'skills': ['React', 'TypeScript', 'Python', 'Flask', 'MySQL', 'Docker', 'AWS', 'REST APIs'],
            'experience': [
                {
                    'job_title': 'Senior Frontend Engineer',
                    'company': 'Tech Corp',
                    'location': 'San Francisco, CA',
                    'start_date': '2022',
                    'end_date': 'Present',
                    'is_current': True,
                    'description': 'Engineered high-performance real-time UI components in React and TypeScript.\nReduced bundle size by 35% through code-splitting.'
                }
            ],
            'education': [
                {
                    'degree': 'B.S. in Computer Science',
                    'institution': 'University of California',
                    'location': 'Berkeley, CA',
                    'start_year': '2018',
                    'end_year': '2022',
                    'grade': '3.9 GPA',
                    'description': ''
                }
            ],
            'projects': [
                {
                    'name': 'Cloud Orchestrator',
                    'role': 'Creator',
                    'technologies': 'Python, Docker, Redis',
                    'description': 'Designed microservices deployment automation toolkit.',
                    'project_url': 'https://cloud-orch.example.com',
                    'github_url': 'https://github.com/testcandidate/cloud-orch'
                }
            ]
        }

        create_resp = self.client.post('/api/resumes', headers=self.headers, json=payload)
        self.assertEqual(create_resp.status_code, 201)
        created_data = json.loads(create_resp.data)
        self.assertTrue(created_data['success'])
        resume_id = created_data['resume']['id']
        self.assertGreater(created_data['resume']['ats_score'], 70)

        # 2. Get single resume
        get_resp = self.client.get(f'/api/resumes/{resume_id}', headers=self.headers)
        self.assertEqual(get_resp.status_code, 200)
        get_data = json.loads(get_resp.data)
        self.assertEqual(get_data['resume']['name'], 'Software Engineer ATS Resume')
        self.assertEqual(get_data['resume']['personal_info']['email'], self.email)

        # 3. Update resume
        update_payload = dict(payload)
        update_payload['name'] = 'Updated ATS Resume'
        update_payload['template'] = 'classic'
        put_resp = self.client.put(f'/api/resumes/{resume_id}', headers=self.headers, json=update_payload)
        self.assertEqual(put_resp.status_code, 200)
        put_data = json.loads(put_resp.data)
        self.assertEqual(put_data['resume']['name'], 'Updated ATS Resume')
        self.assertEqual(put_data['resume']['template'], 'classic')

        # 4. ATS Scoring analysis
        ats_resp = self.client.post(f'/api/resumes/{resume_id}/ats-analysis', headers=self.headers, json={})
        self.assertEqual(ats_resp.status_code, 200)
        ats_data = json.loads(ats_resp.data)
        self.assertIn('ats_analysis', ats_data)
        self.assertIn('breakdown', ats_data['ats_analysis'])

        # 5. Job Match analysis
        jd_resp = self.client.post(
            f'/api/resumes/{resume_id}/job-match',
            headers=self.headers,
            json={'job_description': 'Seeking a Senior Frontend Engineer proficient in React, TypeScript, and REST APIs to build scalable web applications.'}
        )
        self.assertEqual(jd_resp.status_code, 200)
        jd_data = json.loads(jd_resp.data)
        self.assertIn('match_score', jd_data)

        # 6. PDF Download
        pdf_resp = self.client.get(f'/api/resumes/{resume_id}/download/pdf', headers=self.headers)
        self.assertEqual(pdf_resp.status_code, 200)
        self.assertEqual(pdf_resp.content_type, 'application/pdf')
        self.assertGreater(len(pdf_resp.data), 1000)

        # 7. DOCX Download
        docx_resp = self.client.get(f'/api/resumes/{resume_id}/download/docx', headers=self.headers)
        self.assertEqual(docx_resp.status_code, 200)
        self.assertIn('officedocument.wordprocessingml', docx_resp.content_type)
        self.assertGreater(len(docx_resp.data), 1000)

        # 8. Delete resume
        del_resp = self.client.delete(f'/api/resumes/{resume_id}', headers=self.headers)
        self.assertEqual(del_resp.status_code, 200)

if __name__ == '__main__':
    unittest.main()
