import os
import sqlite3
import pymysql
import pymysql.cursors
import json
import logging
from pathlib import Path
from config import Config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global flag to track backend database engine
DB_ENGINE = 'mysql' # 'mysql' or 'sqlite'
SQLITE_DB_PATH = Config.BASE_DIR / 'talent_agent_ai.db'

def get_db_connection():
    """
    Returns a database connection based on configured engine.
    Tries MySQL first; falls back to SQLite if MySQL is unavailable.
    """
    global DB_ENGINE
    if DB_ENGINE == 'mysql':
        try:
            conn = pymysql.connect(
                host=Config.DB_HOST,
                port=Config.DB_PORT,
                user=Config.DB_USER,
                password=Config.DB_PASSWORD,
                database=Config.DB_NAME,
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=False,
                charset='utf8mb4'
            )
            return conn
        except Exception as e:
            logger.warning(f"MySQL connection to {Config.DB_NAME} failed ({e}). Switching to resilient SQLite mode.")
            if Config.ENV == 'production':
                raise RuntimeError('MySQL is unavailable in production; refusing SQLite fallback.') from e
            DB_ENGINE = 'sqlite'

    # SQLite fallback connection
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def execute_query(query, params=None, fetchone=False, fetchall=False, commit=False, return_id=False):
    """
    Executes a SQL query safely across MySQL or SQLite.
    Normalizes parameter placeholders (%s for MySQL, ? for SQLite).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    params = params or ()

    try:
        if DB_ENGINE == 'sqlite':
            # Convert %s placeholders to ? for SQLite
            sqlite_query = query.replace('%s', '?')
            cursor.execute(sqlite_query, params)
            if commit:
                conn.commit()
            if return_id:
                last_id = cursor.lastrowid
                conn.close()
                return last_id
            if fetchone:
                row = cursor.fetchone()
                conn.close()
                return dict(row) if row else None
            if fetchall:
                rows = cursor.fetchall()
                conn.close()
                return [dict(r) for r in rows]
            conn.close()
            return True
        else: # MySQL
            cursor.execute(query, params)
            if commit:
                conn.commit()
            if return_id:
                last_id = cursor.lastrowid
                conn.close()
                return last_id
            if fetchone:
                res = cursor.fetchone()
                conn.close()
                return res
            if fetchall:
                res = cursor.fetchall()
                conn.close()
                return res
            conn.close()
            return True
    except Exception as err:
        if commit:
            try:
                conn.rollback()
            except Exception:
                pass
        conn.close()
        logger.error(f"Database Query Error: {err}\nQuery: {query}\nParams: {params}")
        raise err

def init_db():
    """
    Initializes database tables, creates default admin, and seeds initial jobs.
    """
    global DB_ENGINE
    logger.info("Initializing Talent Agent AI Database...")

    # First attempt MySQL database creation if possible
    try:
        server_conn = pymysql.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            autocommit=True
        )
        with server_conn.cursor() as s_cursor:
            s_cursor.execute(f"CREATE DATABASE IF NOT EXISTS {Config.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        server_conn.close()
        DB_ENGINE = 'mysql'
        logger.info(f"MySQL database '{Config.DB_NAME}' verified on {Config.DB_HOST}:{Config.DB_PORT}")
    except Exception as e:
        logger.warning(f"Could not connect to MySQL server ({e}). Initializing SQLite storage.")
        if Config.ENV == 'production':
            raise RuntimeError('MySQL is unavailable in production.') from e
        DB_ENGINE = 'sqlite'

    if DB_ENGINE == 'mysql':
        schema_file = Config.BASE_DIR / 'schema.sql'
        if schema_file.exists():
            with open(schema_file, 'r', encoding='utf-8') as f:
                raw_sql = f.read()

            conn = get_db_connection()
            with conn.cursor() as cursor:
                # Execute statement by statement
                statements = [s.strip() for s in raw_sql.split(';') if s.strip()]
                for stmt in statements:
                    try:
                        cursor.execute(stmt)
                    except Exception as sql_err:
                        logger.error(f"Schema execution error on statement: {stmt[:60]}...: {sql_err}")
                conn.commit()
            conn.close()
            logger.info("MySQL schema applied successfully.")
    else:
        # SQLite Schema
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.execute("PRAGMA foreign_keys = ON")
        cursor = conn.cursor()

        cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NULL,
            email_verified BOOLEAN DEFAULT 0,
            auth_provider TEXT DEFAULT 'local',
            avatar_url TEXT NULL,
            google_sub TEXT NULL UNIQUE,
            role TEXT DEFAULT 'candidate',
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login_at TIMESTAMP NULL
        );

        CREATE TABLE IF NOT EXISTS candidate_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            headline TEXT NULL,
            phone TEXT NULL,
            location TEXT NULL,
            bio TEXT NULL,
            career_goal TEXT NULL,
            preferred_role TEXT NULL,
            preferred_location TEXT NULL,
            preferred_work_mode TEXT DEFAULT 'Hybrid',
            years_experience REAL DEFAULT 0.0,
            profile_completion INTEGER DEFAULT 0,
            readiness_score INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS candidate_skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            skill_name TEXT NOT NULL,
            skill_category TEXT DEFAULT 'Technical',
            proficiency INTEGER DEFAULT 70,
            source TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS candidate_education (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            institution TEXT NOT NULL,
            degree TEXT NOT NULL,
            field TEXT NULL,
            start_year TEXT NULL,
            end_year TEXT NULL,
            grade TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS candidate_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT NULL,
            technologies TEXT NULL,
            project_url TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS candidate_experience (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            company TEXT NOT NULL,
            role TEXT NOT NULL,
            description TEXT NULL,
            start_date TEXT NULL,
            end_date TEXT NULL,
            is_current BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            original_filename TEXT NOT NULL,
            stored_filename TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            extracted_text TEXT NULL,
            parsed_json TEXT NULL,
            status TEXT DEFAULT 'parsed',
            is_active BOOLEAN DEFAULT 1,
            version INTEGER DEFAULT 1,
            ats_score INTEGER DEFAULT 0,
            readiness_score INTEGER DEFAULT 0,
            parsed_at TIMESTAMP NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS resume_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            resume_id INTEGER NOT NULL,
            version_type TEXT DEFAULT 'optimized',
            title TEXT NOT NULL,
            summary TEXT NULL,
            experience_json TEXT NULL,
            skills_json TEXT NULL,
            projects_json TEXT NULL,
            education_json TEXT NULL,
            job_target TEXT NULL,
            ats_score INTEGER DEFAULT 85,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ats_resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL DEFAULT 'My ATS Resume',
            template TEXT NOT NULL DEFAULT 'modern',
            personal_info TEXT NULL,
            summary TEXT NULL,
            experience TEXT NULL,
            education TEXT NULL,
            skills TEXT NULL,
            projects TEXT NULL,
            certifications TEXT NULL,
            achievements TEXT NULL,
            languages TEXT NULL,
            ats_score INTEGER DEFAULT 0,
            ats_analysis TEXT NULL,
            target_role TEXT NULL,
            target_job_description TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT NOT NULL,
            title TEXT NOT NULL,
            department TEXT DEFAULT 'Engineering',
            location TEXT NOT NULL,
            work_mode TEXT DEFAULT 'Hybrid',
            salary TEXT NULL,
            description TEXT NOT NULL,
            required_skills TEXT NOT NULL,
            experience_required TEXT DEFAULT '0-2 Years',
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS job_matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            job_id INTEGER NOT NULL,
            match_percentage INTEGER NOT NULL,
            matching_skills TEXT NOT NULL,
            missing_skills TEXT NOT NULL,
            why_recommended TEXT NULL,
            is_saved BOOLEAN DEFAULT 0,
            calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
            UNIQUE(user_id, job_id)
        );

        CREATE TABLE IF NOT EXISTS skill_gaps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            skill_name TEXT NOT NULL,
            priority TEXT DEFAULT 'HIGH PRIORITY',
            impact_pct INTEGER DEFAULT 5,
            status TEXT DEFAULT 'Not Started',
            current_level TEXT DEFAULT 'None',
            target_level TEXT DEFAULT 'Intermediate',
            description TEXT NULL,
            why_needed TEXT NULL,
            learning_path TEXT NULL,
            estimated_hours INTEGER DEFAULT 12,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ai_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            readiness_score INTEGER NOT NULL DEFAULT 0,
            profile_summary TEXT NULL,
            recommended_roles TEXT NULL,
            strengths TEXT NULL,
            weaknesses TEXT NULL,
            career_roadmap TEXT NULL,
            resume_feedback TEXT NULL,
            interview_topics TEXT NULL,
            next_actions TEXT NULL,
            raw_ai_response TEXT NULL,
            analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ai_conversations (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            title TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ai_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ai_request_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            response_time_ms INTEGER NULL,
            prompt_tokens INTEGER NULL,
            completion_tokens INTEGER NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS otp_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NULL,
            email TEXT NOT NULL,
            otp_hash TEXT NOT NULL,
            purpose TEXT DEFAULT 'email_verification',
            attempts INTEGER DEFAULT 0,
            expires_at TIMESTAMP NOT NULL,
            used BOOLEAN DEFAULT 0,
            is_used BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            job_id INTEGER NOT NULL,
            status TEXT DEFAULT 'Submitted',
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
            UNIQUE(user_id, job_id)
        );

        CREATE TABLE IF NOT EXISTS job_bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            job_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
            UNIQUE(user_id, job_id)
        );

        CREATE TABLE IF NOT EXISTS oauth_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            provider TEXT NOT NULL,
            provider_user_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(provider, provider_user_id)
        );

        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'super_admin',
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login_at TIMESTAMP NULL
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actor_id INTEGER NULL,
            actor_type TEXT DEFAULT 'admin',
            action TEXT NOT NULL,
            target_type TEXT NULL,
            target_id INTEGER NULL,
            details TEXT NULL,
            ip_address TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        conn.commit()
        conn.close()
        logger.info("Database schema verified.")

    def _safe_add_column(tbl, col, ctype):
        try:
            if DB_ENGINE == 'mysql':
                res = execute_query(f"SHOW COLUMNS FROM {tbl} LIKE %s", (col,), fetchall=True)
                if res: return
            execute_query(f"ALTER TABLE {tbl} ADD COLUMN {col} {ctype}", commit=True)
        except Exception:
            pass

    for col, ctype in [
        ("parsed_json", "LONGTEXT NULL" if DB_ENGINE == 'mysql' else "TEXT NULL"),
        ("status", "VARCHAR(50) DEFAULT 'parsed'" if DB_ENGINE == 'mysql' else "TEXT DEFAULT 'parsed'"),
        ("is_active", "TINYINT(1) DEFAULT 1" if DB_ENGINE == 'mysql' else "BOOLEAN DEFAULT 1"),
        ("version", "INT DEFAULT 1" if DB_ENGINE == 'mysql' else "INTEGER DEFAULT 1"),
        ("ats_score", "INT DEFAULT 0" if DB_ENGINE == 'mysql' else "INTEGER DEFAULT 0"),
        ("readiness_score", "INT DEFAULT 0" if DB_ENGINE == 'mysql' else "INTEGER DEFAULT 0"),
        ("parsed_at", "DATETIME NULL" if DB_ENGINE == 'mysql' else "TIMESTAMP NULL")
    ]:
        _safe_add_column("resumes", col, ctype)

    for col, ctype in [
        ("headline", "VARCHAR(255) NULL" if DB_ENGINE == 'mysql' else "TEXT NULL"),
        ("phone", "VARCHAR(50) NULL" if DB_ENGINE == 'mysql' else "TEXT NULL"),
        ("location", "VARCHAR(150) NULL" if DB_ENGINE == 'mysql' else "TEXT NULL"),
        ("bio", "TEXT NULL" if DB_ENGINE == 'mysql' else "TEXT NULL"),
        ("linkedin_url", "VARCHAR(255) NULL" if DB_ENGINE == 'mysql' else "TEXT NULL"),
        ("github_url", "VARCHAR(255) NULL" if DB_ENGINE == 'mysql' else "TEXT NULL"),
        ("portfolio_url", "VARCHAR(255) NULL" if DB_ENGINE == 'mysql' else "TEXT NULL")
    ]:
        _safe_add_column("candidate_profiles", col, ctype)

    for col, ctype in [
        ("location", "VARCHAR(150) NULL" if DB_ENGINE == 'mysql' else "TEXT NULL")
    ]:
        _safe_add_column("candidate_experience", col, ctype)

    for col, ctype in [
        ("resume_id", "INT NULL" if DB_ENGINE == 'mysql' else "INTEGER NULL"),
        ("notes", "TEXT NULL" if DB_ENGINE == 'mysql' else "TEXT NULL"),
        ("cover_letter", "TEXT NULL" if DB_ENGINE == 'mysql' else "TEXT NULL")
    ]:
        _safe_add_column("applications", col, ctype)

    try:
        if DB_ENGINE == 'mysql':
            execute_query("ALTER TABLE applications ADD UNIQUE KEY unique_user_job (user_id, job_id)", commit=True)
        else:
            execute_query("CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_user_job ON applications (user_id, job_id)", commit=True)
    except Exception:
        pass

    for col, ctype in [
        ("status", "VARCHAR(30) DEFAULT 'ACTIVE'" if DB_ENGINE == 'mysql' else "TEXT DEFAULT 'ACTIVE'"),
        ("updated_at", "DATETIME DEFAULT CURRENT_TIMESTAMP" if DB_ENGINE == 'mysql' else "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ("employment_type", "VARCHAR(50) DEFAULT 'Full-time'" if DB_ENGINE == 'mysql' else "TEXT DEFAULT 'Full-time'"),
        ("experience_level", "VARCHAR(50) DEFAULT 'Mid-level'" if DB_ENGINE == 'mysql' else "TEXT DEFAULT 'Mid-level'"),
        ("salary_min", "INT DEFAULT 0" if DB_ENGINE == 'mysql' else "INTEGER DEFAULT 0"),
        ("salary_max", "INT DEFAULT 0" if DB_ENGINE == 'mysql' else "INTEGER DEFAULT 0"),
        ("nice_to_have_skills", "LONGTEXT NULL" if DB_ENGINE == 'mysql' else "TEXT NULL"),
        ("application_deadline", "VARCHAR(50) NULL" if DB_ENGINE == 'mysql' else "TEXT NULL")
    ]:
        _safe_add_column("jobs", col, ctype)

    # Seed Default Administrator & Live Job Positions
    seed_initial_data()

def seed_initial_data():
    """
    Seeds initial administrator user and foundational job requisitions.
    """
    from services.auth_service import hash_password, verify_password

    # 1. Seed Admin Users
    admins_to_seed = [
        ('System Administrator', 'admin@talentagent.ai', 'Talentagent337#', 'super_admin'),
        ('Prajin Admin', 'prajins337@gmail.com', 'Talentagent337#', 'super_admin'),
        ('Prajin Admin', 'prajins3319@gmail.com', 'Talentagent337#', 'super_admin')
    ]
    bootstrap_email = os.getenv('BOOTSTRAP_ADMIN_EMAIL', '').strip().lower()
    bootstrap_password = os.getenv('BOOTSTRAP_ADMIN_PASSWORD', '')
    bootstrap_name = os.getenv('BOOTSTRAP_ADMIN_NAME', 'System Administrator').strip()
    if bootstrap_email and bootstrap_password:
        admins_to_seed.append((bootstrap_name, bootstrap_email, bootstrap_password, 'super_admin'))

    for full_name, email, plain_pwd, role in admins_to_seed:
        existing_admin = execute_query(
            "SELECT id, password_hash, is_active FROM admin_users WHERE email = %s",
            (email,),
            fetchone=True
        )
        if not existing_admin:
            admin_pass_hash = hash_password(plain_pwd)
            execute_query(
                """
                INSERT INTO admin_users (full_name, email, password_hash, role, is_active)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (full_name, email, admin_pass_hash, role, True),
                commit=True
            )
            logger.info(f"Admin User seeded: {email}")
        else:
            # Ensure admin is active and password hash is valid
            if not existing_admin.get('is_active') or not verify_password(existing_admin.get('password_hash', ''), plain_pwd):
                new_hash = hash_password(plain_pwd)
                execute_query(
                    "UPDATE admin_users SET password_hash = %s, is_active = True, role = %s WHERE id = %s",
                    (new_hash, role, existing_admin['id']),
                    commit=True
                )
                logger.info(f"Admin User credentials updated: {email}")


    # 2. Seed Live Job Database
    existing_jobs = execute_query("SELECT COUNT(*) as count FROM jobs", fetchone=True)
    count = existing_jobs['count'] if existing_jobs else 0
    if count == 0:
        seed_jobs = [
            (
                'Starlight SaaS',
                'Frontend Developer',
                'Product Engineering',
                'Bengaluru, KA',
                'Remote',
                '₹14,00,000 - ₹18,00,000 LPA',
                'We are seeking an energetic early-career Frontend Developer to build responsive, accessible web applications in React.',
                json.dumps(['React', 'JavaScript', 'HTML5', 'CSS3', 'Git', 'Figma', 'TypeScript', 'Testing (Jest/RTL)']),
                '0-2 Years'
            ),
            (
                'Aura Interactive',
                'UI/UX Designer & Engineer',
                'Product & UX',
                'Chennai, TN',
                'Hybrid',
                '₹12,00,000 - ₹15,00,000 LPA',
                'Bridge the gap between design tokens and production React components with sleek micro-interactions.',
                json.dumps(['UI/UX Design', 'Figma', 'React', 'CSS3', 'JavaScript', 'User Research', 'Storybook']),
                '1-3 Years'
            ),
            (
                'Nexus Tech',
                'Python & Backend Engineer',
                'Core Backend',
                'Hyderabad, TS',
                'Hybrid',
                '₹13,00,000 - ₹17,00,000 LPA',
                'Work on high-throughput backend APIs and AI service orchestrations using Python and REST architectures.',
                json.dumps(['Python', 'REST APIs', 'Git', 'SQL', 'Django', 'Redis', 'Docker']),
                '0-2 Years'
            ),
            (
                'Hyperion AI',
                'Data Analyst',
                'Data & Analytics',
                'Mumbai, MH',
                'On-site',
                '₹11,00,000 - ₹14,00,000 LPA',
                'Transform complex user analytics into actionable product insights with SQL and data visualization.',
                json.dumps(['SQL', 'Python', 'Data Visualization', 'Git', 'Tableau', 'Pandas']),
                '0-2 Years'
            ),
            (
                'Veloce Labs',
                'Cloud & DevOps Specialist',
                'Infrastructure',
                'Pune, MH',
                'Hybrid',
                '₹15,00,000 - ₹19,00,000 LPA',
                'Automate build pipelines, monitor container clusters, and manage cloud infrastructure deployments.',
                json.dumps(['Git', 'Linux', 'Python', 'AWS', 'Docker', 'Kubernetes', 'CI/CD']),
                '1-3 Years'
            ),
            (
                'Quantex Solutions',
                'Full Stack Engineer',
                'Engineering',
                'Bengaluru, KA',
                'Hybrid',
                '₹16,00,000 - ₹22,00,000 LPA',
                'Build scalable end-to-end features spanning React frontend, Node/Python microservices, and database systems.',
                json.dumps(['React', 'Node.js', 'Python', 'SQL', 'TypeScript', 'REST APIs', 'Docker']),
                '1-3 Years'
            )
        ]

        insert_job_sql = (
            "INSERT INTO jobs (company, title, department, location, work_mode, salary, description, required_skills, experience_required) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
        )
        for j in seed_jobs:
            execute_query(insert_job_sql, j, commit=True)
        logger.info(f"Seeded {len(seed_jobs)} foundational jobs into database.")

