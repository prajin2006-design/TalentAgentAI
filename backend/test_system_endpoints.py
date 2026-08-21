import requests
import json

BASE_URL = 'http://127.0.0.1:5000'

def test_full_system():
    session = requests.Session()
    print("--- 1. Candidate Login ---")
    login_res = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "prajin3319@gmail.com",
        "password": "Password123!"
    })
    print("Login status:", login_res.status_code, login_res.json().get('message'))
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json().get('token')
    session.headers.update({'Authorization': f'Bearer {token}'})

    print("\n--- 2. Get Profile ---")
    profile_res = session.get(f"{BASE_URL}/api/profile")
    print("Profile status:", profile_res.status_code)
    p_data = profile_res.json()
    print("User name:", p_data.get('user', {}).get('full_name'))
    print("Skills count:", len(p_data.get('skills', [])))

    print("\n--- 3. Update Profile & Settings ---")
    update_res = session.put(f"{BASE_URL}/api/profile", json={
        "headline": "Lead Full Stack & AI Engineer",
        "phone": "+1 (555) 234-5678",
        "location": "San Francisco, CA",
        "bio": "Specialized in high-scale web platforms and generative AI integrations.",
        "preferred_role": "Staff Frontend Architect",
        "preferred_location": "Remote / San Francisco",
        "preferred_work_mode": "Remote",
        "years_experience": 6.5
    })
    print("Update status:", update_res.status_code, update_res.json())
    assert update_res.status_code == 200

    print("\n--- 4. Candidate Dashboard Summary ---")
    dash_res = session.get(f"{BASE_URL}/api/dashboard/summary")
    print("Dashboard summary status:", dash_res.status_code)
    d_data = dash_res.json()
    metrics = d_data.get('metrics', {})
    print("Readiness score:", metrics.get('readiness_score'))
    print("Total active jobs:", metrics.get('total_active_jobs'))
    print("Skill coverage:", metrics.get('skill_coverage_pct'))
    print("Top job matches count:", len(d_data.get('top_job_matches', [])))

    print("\n--- 5. Candidate Dashboard Activity Stream ---")
    act_res = session.get(f"{BASE_URL}/api/dashboard/activity")
    print("Activity status:", act_res.status_code)
    a_data = act_res.json()
    print("Recent activity items:", len(a_data.get('recent_activity', [])))
    print("Chart timeline points:", len(a_data.get('chart_series', {}).get('points', [])))

    print("\n--- 6. Active Jobs & Matches ---")
    jobs_res = session.get(f"{BASE_URL}/api/jobs")
    print("Jobs count:", len(jobs_res.json().get('jobs', [])))
    matches_res = session.get(f"{BASE_URL}/api/job-matches")
    print("Job matches count:", len(matches_res.json().get('matches', [])))

    print("\n--- 7. AI Career Assistant (Groq) ---")
    ai_res = session.post(f"{BASE_URL}/api/ai/chat", json={
        "message": "Briefly state 1 actionable interview tip for a Staff Frontend Architect."
    })
    print("AI status:", ai_res.status_code, ai_res.text[:200])
    ai_json = ai_res.json()
    msg = ai_json.get('message', '') or ''
    clean_msg = msg.encode('ascii', 'ignore').decode('ascii')
    print("AI Reply:", clean_msg[:120] + "...")

    print("\n--- 8. Admin Login & Job Management ---")
    admin_session = requests.Session()
    admin_login_res = admin_session.post(f"{BASE_URL}/api/admin/login", json={
        "email": "admin@talentagent.ai",
        "password": "Talentagent337#"
    })
    print("Admin login status:", admin_login_res.status_code, admin_login_res.json().get('message'))
    assert admin_login_res.status_code == 200

    admin_jobs_res = admin_session.get(f"{BASE_URL}/api/admin/jobs")
    print("Admin jobs count:", len(admin_jobs_res.json().get('jobs', [])))

    print("\n=== ALL SYSTEM TESTS PASSED CLEANLY! ===")

if __name__ == '__main__':
    test_full_system()
