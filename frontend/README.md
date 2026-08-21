# Talent Agent AI — Production AI Career Intelligence Platform

**Talent Agent AI** is a production-ready, full-stack AI-powered career intelligence platform designed specifically for students, fresh graduates, and early-career professionals.

The platform analyzes candidate resumes, calibrates skill matrices, computes real-time job compatibility scores, identifies prioritized skill gaps, charts personalized 5-stage career roadmaps, and provides a context-aware AI career co-pilot.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, React Router v6, Lucide Icons, Custom CSS Design System, HTML5 Canvas Particle Flow Field, Inverted Custom Cursor (`mix-blend-mode: difference`).
- **Backend**: Python 3.11+, Flask, Flask-CORS, PyJWT, Argon2id Password Hashing, `secrets` module 6-digit OTP generation, ReportLab (PDF export), python-docx (DOCX export).
- **Database**: MySQL 8.0 with resilient SQLite fallback (`talent_agent_ai.db`).
- **AI Integration**: OpenAI API (`gpt-4o-mini`) server-side with structured JSON output and deterministic expert engine fallback.
- **Email Service**: Gmail SMTP with `STARTTLS` (Port 587) for transactional email OTP verification.
- **Security**: Argon2id password hashing, SHA-256 OTP hashing with email salt, HTTP-only authentication cookies, 45-second resend cooldowns, 10-minute OTP expiration, 5-attempt brute-force protection, strict admin authorization gate.

---

## 📁 Repository Structure

```
d:/project/
├── backend/
│   ├── app.py                      # Flask Application Entry Point & Blueprint Registration
│   ├── config.py                   # Central Configuration & Environment Loader
│   ├── database.py                 # MySQL / SQLite Dual Database Engine & Query Helper
│   ├── requirements.txt            # Python Dependencies
│   ├── schema.sql                  # MySQL Relational Schema
│   ├── routes/
│   │   ├── admin_routes.py         # Admin Authentication, Candidate Management & Telemetry
│   │   ├── ai_routes.py            # AI Profile Analysis & Career Assistant Chat
│   │   ├── auth_routes.py          # Signup, Login, Email OTP Verification, Google OAuth
│   │   ├── job_routes.py           # Job Requisitions & Candidate Compatibility Matches
│   │   ├── profile_routes.py       # Candidate Profiles, Skills, Education, Experience, Projects
│   │   └── resume_routes.py        # ATS Analysis, Job-Specific ATS Match, Optimization, Versions & Export
│   ├── services/
│   │   ├── ai_service.py           # OpenAI Profile & Chat Integration with Expert Fallback
│   │   ├── ats_service.py          # ATS Parsing, Keyword Density, Layout Check & PDF/DOCX Generators
│   │   ├── auth_service.py         # Argon2id Hashing, JWT, secrets OTP Generation & SHA-256 Storage
│   │   ├── email_service.py        # Gmail SMTP (STARTTLS) Email Delivery
│   │   ├── job_matching_service.py # Real Compatibility Calculation & Skill Gap Prioritization
│   │   └── resume_service.py       # PDF/DOCX Resume Extraction & Secure Storage
│   └── tests/
│       └── test_auth.py            # Backend Unit Tests for Auth, OTP, Passwords & API Health
├── src/
│   ├── components/                 # HeroParticleCanvas, CustomCursor, Navbar, Sidebar, SkillBar, etc.
│   ├── context/                    # AuthContext, CareerContext
│   ├── hooks/                      # useScrollReveal, useCountUp
│   ├── layouts/                    # DashboardLayout
│   ├── pages/                      # Home, Login, Signup, VerifyEmail, Onboarding, Dashboard, Profile,
│   │                               # ResumeAnalysis, JobMatching, SkillGapAnalysis, CareerPath, Assistant,
│   │                               # Settings, AdminLogin, AdminDashboard
│   ├── services/
│   │   └── api.js                  # Centralized Frontend API Client (Auth, Profile, Resume, AI, Jobs, Admin)
│   ├── App.jsx                     # Route Definitions & Router Gateways
│   └── index.css                   # Global Design System Tokens
├── .env.example                    # Environment Variable Template
├── .gitignore                      # Git Ignore Configuration
├── Dockerfile                      # Production Multi-Stage Dockerfile
├── docker-compose.yml              # Production Docker Compose Setup
└── README.md                       # Comprehensive Technical Documentation
```

---

## 🔑 Environment Variables Configuration

Create a `.env` file inside `backend/.env` based on `backend/.env.example`:

```env
# Database Credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=talent_agent_ai

# Security Secrets
JWT_SECRET_KEY=talent_agent_ai_super_secret_jwt_key_2026
SESSION_SECRET=talent_agent_session_secret_2026
ENVIRONMENT=development

# Gmail SMTP Email Configuration (Development & Production)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-character-gmail-app-password
MAIL_DEFAULT_SENDER=Talent Agent AI <your-email@gmail.com>

# OpenAI API Key (Backend Server-Side Only)
OPENAI_API_KEY=your_openai_api_key_here

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

---

## 🚀 Running Locally

### 1. Backend (Flask) Setup

1. Open terminal and navigate to backend directory:
   ```cmd
   cd d:\project\backend
   ```
2. Create and activate a Python virtual environment:
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```
3. Install dependencies:
   ```cmd
   pip install -r requirements.txt
   pip install python-docx reportlab
   ```
4. Start the Flask Backend:
   ```cmd
   python app.py
   ```
   *The Flask API server will start on `http://127.0.0.1:5000`.*

### 2. Frontend (React / Vite) Setup

1. Open a second terminal window and navigate to the project root:
   ```cmd
   cd d:\project
   ```
2. Install frontend packages:
   ```cmd
   npm install
   ```
3. Start the Vite Development Server:
   ```cmd
   npm run dev
   ```
   *The React frontend will start on `http://localhost:5173`.*

---

## 🧪 Running Backend Unit Tests

Run the Python test suite:

```cmd
python -m unittest backend/tests/test_auth.py
```

---

## 🐳 Docker Deployment

To build and run the full application with MySQL using Docker Compose:

```cmd
docker-compose up --build -d
```

---

## 🔒 Security Measures

- **No Plaintext Passwords**: Hashed with Argon2id algorithm.
- **No Plaintext OTPs**: Generated with `secrets.randbelow(1000000)` and stored as SHA-256 hashes with salt in `otp_verifications`.
- **Server-Side API Key Protection**: OpenAI API keys and SMTP credentials never leave the backend environment.
- **Role Isolation**: Admin endpoints enforce `role == 'admin'` server-side; candidate endpoints scope all data by authenticated `user_id`.

---

## 📜 License

Copyright © 2026 Talent Agent AI. All rights reserved.
