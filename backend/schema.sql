-- ==========================================================
-- TALENT AGENT AI — DATABASE SCHEMA (MySQL)
-- Database: talent_agent_ai
-- ==========================================================

CREATE DATABASE IF NOT EXISTS talent_agent_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE talent_agent_ai;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    auth_provider VARCHAR(50) DEFAULT 'local', -- 'local', 'google'
    avatar_url VARCHAR(500) NULL,
    google_sub VARCHAR(255) NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'candidate', -- 'candidate', 'admin'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    INDEX idx_user_email (email),
    INDEX idx_user_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CANDIDATE PROFILES
CREATE TABLE IF NOT EXISTS candidate_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    headline VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    location VARCHAR(150) NULL,
    bio TEXT NULL,
    career_goal TEXT NULL,
    preferred_role VARCHAR(150) NULL,
    preferred_location VARCHAR(150) NULL,
    preferred_work_mode VARCHAR(50) DEFAULT 'Hybrid', -- 'Remote', 'Hybrid', 'On-site'
    years_experience DECIMAL(3,1) DEFAULT 0.0,
    profile_completion INT DEFAULT 0, -- 0 to 100%
    readiness_score INT DEFAULT 0, -- AI computed 0 to 100%
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_profile_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CANDIDATE SKILLS
CREATE TABLE IF NOT EXISTS candidate_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    skill_category VARCHAR(100) DEFAULT 'Technical', -- 'Technical', 'Framework', 'Tool', 'Soft Skill'
    proficiency INT DEFAULT 70, -- 1 to 100
    source VARCHAR(50) DEFAULT 'user', -- 'user', 'resume_extracted', 'ai_inferred'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_skills_user (user_id),
    INDEX idx_skills_name (skill_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. CANDIDATE EDUCATION
CREATE TABLE IF NOT EXISTS candidate_education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    institution VARCHAR(200) NOT NULL,
    degree VARCHAR(150) NOT NULL,
    field VARCHAR(150) NULL,
    start_year VARCHAR(10) NULL,
    end_year VARCHAR(10) NULL,
    grade VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_edu_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. CANDIDATE PROJECTS
CREATE TABLE IF NOT EXISTS candidate_projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    technologies VARCHAR(500) NULL,
    project_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_proj_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. CANDIDATE EXPERIENCE
CREATE TABLE IF NOT EXISTS candidate_experience (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company VARCHAR(200) NOT NULL,
    role VARCHAR(150) NOT NULL,
    description TEXT NULL,
    start_date VARCHAR(50) NULL,
    end_date VARCHAR(50) NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_exp_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. RESUMES
CREATE TABLE IF NOT EXISTS resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL,
    extracted_text LONGTEXT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_resume_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7B. RESUME VERSIONS
CREATE TABLE IF NOT EXISTS resume_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    resume_id INT NOT NULL,
    version_type VARCHAR(50) DEFAULT 'optimized', -- 'original', 'optimized', 'job_specific'
    title VARCHAR(255) NOT NULL,
    summary TEXT NULL,
    experience_json JSON NULL,
    skills_json JSON NULL,
    projects_json JSON NULL,
    education_json JSON NULL,
    job_target VARCHAR(255) NULL,
    ats_score INT DEFAULT 85,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
    INDEX idx_ver_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7B2. ATS BUILDER RESUMES (Production-grade ATS Resume Maker)
CREATE TABLE IF NOT EXISTS ats_resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'My ATS Resume',
    template VARCHAR(50) NOT NULL DEFAULT 'modern', -- 'classic', 'modern', 'minimal'
    personal_info JSON NULL,
    summary TEXT NULL,
    experience JSON NULL,
    education JSON NULL,
    skills JSON NULL,
    projects JSON NULL,
    certifications JSON NULL,
    achievements JSON NULL,
    languages JSON NULL,
    ats_score INT DEFAULT 0,
    ats_analysis JSON NULL,
    target_role VARCHAR(255) NULL,
    target_job_description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ats_res_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7C. RESUME ANALYSIS
CREATE TABLE IF NOT EXISTS resume_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    resume_id INT NULL,
    readiness_score INT NOT NULL DEFAULT 0,
    profile_summary TEXT NULL,
    recommended_roles JSON NULL,
    strengths JSON NULL,
    weaknesses JSON NULL,
    career_roadmap JSON NULL,
    resume_feedback TEXT NULL,
    interview_topics JSON NULL,
    next_actions JSON NULL,
    raw_ai_response JSON NULL,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_res_ana_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7D. ATS RESULTS
CREATE TABLE IF NOT EXISTS ats_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    resume_id INT NULL,
    job_id INT NULL,
    overall_score INT NOT NULL DEFAULT 75,
    keyword_match_score INT NOT NULL DEFAULT 18,
    formatting_score INT NOT NULL DEFAULT 20,
    skills_score INT NOT NULL DEFAULT 17,
    experience_score INT NOT NULL DEFAULT 15,
    structure_score INT NOT NULL DEFAULT 12,
    matching_keywords JSON NULL,
    missing_keywords JSON NULL,
    formatting_issues JSON NULL,
    actionable_recommendations JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ats_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. JOBS TABLE (Live Platform Requisitions)
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(150) NOT NULL,
    title VARCHAR(150) NOT NULL,
    department VARCHAR(100) DEFAULT 'Engineering',
    location VARCHAR(150) NOT NULL,
    work_mode VARCHAR(50) DEFAULT 'Hybrid', -- 'Remote', 'Hybrid', 'On-site'
    salary VARCHAR(100) NULL,
    description TEXT NOT NULL,
    required_skills JSON NOT NULL, -- JSON array of strings e.g. ["React", "TypeScript"]
    experience_required VARCHAR(50) DEFAULT '0-2 Years',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_job_title (title),
    INDEX idx_job_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. JOB MATCHES (Calculated per candidate)
CREATE TABLE IF NOT EXISTS job_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    match_percentage INT NOT NULL, -- 0 to 100
    matching_skills JSON NOT NULL,
    missing_skills JSON NOT NULL,
    why_recommended TEXT NULL,
    is_saved BOOLEAN DEFAULT FALSE,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    INDEX idx_match_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9b. CANDIDATE JOB APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Submitted',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_application (user_id, job_id),
    INDEX idx_app_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9c. CANDIDATE JOB BOOKMARKS
CREATE TABLE IF NOT EXISTS job_bookmarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_bookmark (user_id, job_id),
    INDEX idx_bookmark_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. SKILL GAPS (Prioritized per candidate)
CREATE TABLE IF NOT EXISTS skill_gaps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    priority VARCHAR(50) DEFAULT 'HIGH PRIORITY', -- 'HIGH PRIORITY', 'MEDIUM', 'LOW'
    impact_pct INT DEFAULT 5, -- e.g. +8% match potential
    status VARCHAR(50) DEFAULT 'Not Started', -- 'Not Started', 'In Progress', 'Completed'
    current_level VARCHAR(50) DEFAULT 'None',
    target_level VARCHAR(50) DEFAULT 'Intermediate',
    description TEXT NULL,
    why_needed TEXT NULL,
    learning_path JSON NULL, -- JSON array of strings/milestones
    estimated_hours INT DEFAULT 12,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_gaps_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. AI ANALYSIS (Full structured intelligence output)
CREATE TABLE IF NOT EXISTS ai_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    readiness_score INT NOT NULL DEFAULT 0,
    profile_summary TEXT NULL,
    recommended_roles JSON NULL,
    strengths JSON NULL,
    weaknesses JSON NULL,
    career_roadmap JSON NULL,
    resume_feedback TEXT NULL,
    interview_topics JSON NULL,
    next_actions JSON NULL,
    raw_ai_response JSON NULL,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ai_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11B. AI CONVERSATIONS
CREATE TABLE IF NOT EXISTS ai_conversations (
    id CHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ai_conversation_user_updated (user_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11C. AI CONVERSATION MESSAGES
CREATE TABLE IF NOT EXISTS ai_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversation_id CHAR(36) NOT NULL,
    user_id INT NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ai_message_conversation_created (conversation_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11D. AI REQUEST TELEMETRY (no message content)
CREATE TABLE IF NOT EXISTS ai_request_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    response_time_ms INT NULL,
    prompt_tokens INT NULL,
    completion_tokens INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ai_metrics_created (created_at),
    INDEX idx_ai_metrics_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. OTP VERIFICATIONS
CREATE TABLE IF NOT EXISTS otp_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    email VARCHAR(191) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'email_verification', -- 'email_verification', 'password_reset'
    attempts INT DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_otp_user (user_id),
    INDEX idx_otp_email (email),
    INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. OAUTH ACCOUNTS
CREATE TABLE IF NOT EXISTS oauth_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'google'
    provider_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_provider_user (provider, provider_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. ADMIN USERS
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'super_admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    INDEX idx_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actor_id INT NULL,
    actor_type VARCHAR(50) DEFAULT 'admin', -- 'admin', 'user', 'system'
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NULL,
    target_id INT NULL,
    details TEXT NULL,
    ip_address VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15B. ADMIN AUDIT LOGS (Alias table)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NULL,
    actor_type VARCHAR(50) DEFAULT 'admin',
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NULL,
    target_id INT NULL,
    details TEXT NULL,
    ip_address VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
