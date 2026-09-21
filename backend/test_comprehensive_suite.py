import sys
import json
from pathlib import Path

# Add backend directory
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import app
from database import execute_query

def run_comprehensive_test():
    client = app.test_client()
    results = {}

    print("\n==========================================")
    print("TALENT AGENT AI — END-TO-END AUDIT SUITE")
    print("==========================================\n")

    # 1. Health
    print("1. Health Check Endpoint...")
    res = client.get('/api/health')
    assert res.status_code == 200, f"Health check failed: {res.data}"
    print("   [PASS] Health check PASS:", res.get_json())
    results['health'] = 'PASS'

    # 2. Google Config
    print("\n2. Google Config Endpoint...")
    res = client.get('/api/auth/google/config')
    assert res.status_code == 200
    print("   [PASS] Google Config PASS:", res.get_json())
    results['google_config'] = 'PASS'

    # 3. Candidate Authentication (Alex Mercer)
    print("\n3. Candidate Login...")
    res = client.post('/api/auth/login', json={
        'email': 'candidate@talentagent.ai',
        'password': 'Password123!'
    })
    assert res.status_code == 200, f"Login failed: {res.data}"
    login_data = res.get_json()
    token = login_data.get('token')
    headers = {'Authorization': f'Bearer {token}'}
    print("   [PASS] Candidate Login PASS:", login_data.get('message'))
    results['candidate_login'] = 'PASS'

    # 4. Profile Operations
    print("\n4. Profile CRUD Operations...")
    p_res = client.get('/api/profile', headers=headers)
    assert p_res.status_code == 200
    p_data = p_res.get_json()
    print("   [PASS] Get Profile PASS:", p_data.get('user', {}).get('full_name'), f"(Completion: {p_data.get('profile_completion')}%)")

    # Add Skill
    sk_res = client.post('/api/skills', headers=headers, json={
        'skill_name': 'TypeScript & Next.js',
        'skill_category': 'Technical',
        'proficiency': 90
    })
    if sk_res.status_code in (201, 409):
        print("   [PASS] Add Skill PASS:", sk_res.status_code)
    else:
        assert False, f"Add Skill failed: {sk_res.data}"

    # 5. Active Jobs & Matching
    print("\n5. Active Jobs & Matching...")
    jobs_res = client.get('/api/jobs', headers=headers)
    assert jobs_res.status_code == 200
    jobs_list = jobs_res.get_json().get('jobs', [])
    print(f"   [PASS] Get Active Jobs PASS: {len(jobs_list)} jobs retrieved")
    assert len(jobs_list) > 0

    first_job_id = jobs_list[0]['id']
    job_detail_res = client.get(f'/api/jobs/{first_job_id}', headers=headers)
    assert job_detail_res.status_code == 200
    print("   [PASS] Get Job Detail PASS:", job_detail_res.get_json().get('title'))

    match_res = client.get('/api/job-matches', headers=headers)
    assert match_res.status_code == 200
    matches = match_res.get_json().get('matches', [])
    print(f"   [PASS] Calculated Job Matches PASS: {len(matches)} matches")

    save_res = client.post(f'/api/job-matches/{first_job_id}/save', headers=headers)
    assert save_res.status_code == 200
    print("   [PASS] Toggle Save Job PASS:", save_res.get_json())

    apply_res = client.post(f'/api/jobs/{first_job_id}/apply', headers=headers)
    assert apply_res.status_code in (200, 201)
    print("   [PASS] Apply to Job PASS:", apply_res.get_json().get('message'))

    apps_res = client.get('/api/applications', headers=headers)
    assert apps_res.status_code == 200
    apps_list = apps_res.get_json().get('applications', [])
    print(f"   [PASS] Get Applications PASS: {len(apps_list)} applications tracked")

    # 6. ATS Resume Maker CRUD & Export
    print("\n6. ATS Resume Maker & Export...")
    res_list_res = client.get('/api/resumes', headers=headers)
    assert res_list_res.status_code == 200
    print(f"   [PASS] Get Resumes PASS: {len(res_list_res.get_json().get('resumes', []))} resumes")

    create_res = client.post('/api/resumes', headers=headers, json={
        'name': 'Production ATS Resume 2026',
        'template': 'modern'
    })
    assert create_res.status_code == 201
    new_resume = create_res.get_json().get('resume')
    resume_id = new_resume['id']
    print("   [PASS] Create ATS Resume PASS:", new_resume.get('name'), f"(ATS Score: {new_resume.get('ats_score')}%)")

    # ATS Analysis
    ats_res = client.post(f'/api/resumes/{resume_id}/ats-analysis', headers=headers, json={})
    assert ats_res.status_code == 200
    print("   [PASS] ATS Score Calculation PASS:", ats_res.get_json().get('score'))

    # Job Description Matching
    job_match_res = client.post(f'/api/resumes/{resume_id}/job-match', headers=headers, json={
        'job_description': 'Looking for a Senior React Engineer with experience in TypeScript, scalable state management, and modern CSS.'
    })
    assert job_match_res.status_code == 200
    print("   [PASS] Resume VS Job Match PASS:", job_match_res.get_json().get('match_score'))

    # PDF Export
    pdf_res = client.get(f'/api/resumes/{resume_id}/download/pdf', headers=headers)
    assert pdf_res.status_code == 200
    assert len(pdf_res.data) > 500, "PDF export data too short"
    print(f"   [PASS] PDF Generation & Download PASS ({len(pdf_res.data)} bytes)")

    # DOCX Export
    docx_res = client.get(f'/api/resumes/{resume_id}/download/docx', headers=headers)
    assert docx_res.status_code == 200
    assert len(docx_res.data) > 500, "DOCX export data too short"
    print(f"   [PASS] DOCX Generation & Download PASS ({len(docx_res.data)} bytes)")

    # 7. AI Co-Pilot & Mock Interview
    print("\n7. AI Features & Mock Interview...")
    ai_health = client.get('/api/ai/health')
    assert ai_health.status_code == 200
    print("   [PASS] AI Health PASS:", ai_health.get_json())

    # Chat
    chat_res = client.post('/api/ai/chat', headers=headers, json={
        'message': 'Provide 1 concise tip for high-traffic web performance.'
    })
    assert chat_res.status_code == 200
    chat_data = chat_res.get_json()
    print("   [PASS] AI Chat PASS:", chat_data.get('message')[:100].encode('ascii', 'ignore').decode('ascii') + "...")

    # Interview Question Generation
    q_res = client.post('/api/ai/interview/generate', headers=headers, json={
        'target_role': 'Staff Frontend Engineer'
    })
    assert q_res.status_code == 200
    q_data = q_res.get_json()
    generated_questions = q_data.get('questions', [])
    print(f"   [PASS] AI Interview Questions Generation PASS: {len(generated_questions)} questions generated")
    assert len(generated_questions) > 0

    # Interview Answer Evaluation
    eval_res = client.post('/api/ai/interview/evaluate', headers=headers, json={
        'question': generated_questions[0]['question'],
        'answer': 'To optimize rendering and state management, I implement component memoization with React.memo and useMemo, virtualize long lists with windowing libraries, and structure global state with fine-grained selectors in Zustand to minimize re-renders. In production, this reduced our LCP by 40%.',
        'target_role': 'Staff Frontend Engineer'
    })
    assert eval_res.status_code == 200
    eval_data = eval_res.get_json()
    print(f"   [PASS] AI Interview Answer Evaluation PASS: Score {eval_data.get('score')}/100, Rating: {eval_data.get('rating')}")

    # 8. Admin Portal Operations
    print("\n8. Admin Portal Operations...")
    admin_login_res = client.post('/api/admin/login', json={
        'email': 'admin@talentagent.ai',
        'password': 'Talentagent337#'
    })
    assert admin_login_res.status_code == 200
    admin_token = admin_login_res.get_json().get('token')
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    print("   [PASS] Admin Login PASS:", admin_login_res.get_json().get('admin', {}).get('full_name'))

    admin_dash_res = client.get('/api/admin/dashboard', headers=admin_headers)
    assert admin_dash_res.status_code == 200
    metrics = admin_dash_res.get_json().get('metrics', {})
    print(f"   [PASS] Admin Dashboard PASS: {metrics.get('total_candidates')} candidates, {metrics.get('active_jobs')} active jobs")

    admin_cand_res = client.get('/api/admin/candidates', headers=admin_headers)
    assert admin_cand_res.status_code == 200
    cands = admin_cand_res.get_json().get('candidates', [])
    print(f"   [PASS] Admin Candidate List PASS: {len(cands)} candidates listed")

    # Admin Job Create
    new_job_res = client.post('/api/admin/jobs', headers=admin_headers, json={
        'company': 'CloudScale Tech',
        'title': 'AI Integration Engineer',
        'department': 'Applied AI',
        'location': 'Bengaluru, KA',
        'work_mode': 'Hybrid',
        'salary_min': 1800000,
        'salary_max': 2400000,
        'description': 'Design, integrate, and scale generative AI pipelines and vector search services.',
        'required_skills': ['Python', 'FastAPI', 'Groq', 'Vector Databases', 'Docker', 'REST APIs'],
        'status': 'Active'
    })
    assert new_job_res.status_code == 201
    created_job = new_job_res.get_json().get('job')
    admin_job_id = created_job['id']
    print(f"   [PASS] Admin Job Creation PASS: Job #{admin_job_id} '{created_job['title']}' created")

    # Verify Candidate Side Sees the Newly Created Admin Job
    cand_verify_res = client.get(f'/api/jobs/{admin_job_id}', headers=headers)
    assert cand_verify_res.status_code == 200
    print(f"   [PASS] Candidate Retrieval of Admin Job PASS: '{cand_verify_res.get_json().get('title')}'")

    # Admin Job Pause
    pause_res = client.post(f'/api/admin/jobs/{admin_job_id}/pause', headers=admin_headers)
    assert pause_res.status_code == 200
    print("   [PASS] Admin Job Pause PASS")

    # Admin Job Delete
    del_res = client.delete(f'/api/admin/jobs/{admin_job_id}', headers=admin_headers)
    assert del_res.status_code == 200
    print("   [PASS] Admin Job Delete PASS")

    print("\n==========================================")
    print("ALL 8 MAJOR SUBSYSTEMS PASSED WITH 100% SUCCESS!")
    print("==========================================\n")

if __name__ == '__main__':
    run_comprehensive_test()
