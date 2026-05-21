# Tygrsec Academy Platform

Tygrsec Academy is an interactive, gamified learning platform designed to teach **Secure Coding Practices** through hands-on labs (SAST, DAST, Remediation) and OWASP-focused self-assessments. 

The platform offers a comprehensive curriculum, combining interactive multiple-choice pathways with live docker-based security sandboxes to help developers build secure software from the ground up.

![Dashboard Preview](frontend/public/favicon.ico) *(Tygrsec Academy)*

---

## Features

- **Interactive Learning Pathways**: Follow structured curricula like "SAST & DAST Mastery" and "OWASP Top 10".
- **Gamification & Leaderboard**: Earn XP, unlock levels, and compete globally on the leaderboard.
- **Defensive Mitigation Panel**: Receive contextual hints and immediate educational feedback during self-assessments.
- **Live Sandbox Challenges**: Spin up isolated Docker containers to perform real-world DAST (Dynamic Application Security Testing) and exploit exercises safely.
- **SAST Code Analysis**: Review vulnerable source code side-by-side with remediation patches.
- **Comprehensive API**: A scalable, clean-architecture Go backend running Gin, backed by PostgreSQL and Redis.
- **Modern Frontend**: A highly responsive, premium-styled Next.js App Router UI with Tailwind CSS.

---

## Architecture Stack

### Backend (Go / Gin)
- **Framework**: Go 1.21+, Gin HTTP Framework
- **Database**: PostgreSQL (GORM) for persistent state (Users, Progress, XP, Badges)
- **Cache**: Redis for session management and fast leaderboard generation
- **Security**: JWT Authentication, strict REST validation, password hashing

### Frontend (Next.js / React)
- **Framework**: Next.js 14+ (App Router), React 18
- **Styling**: Tailwind CSS, class-variance-authority, clsx
- **State**: React Context API & standard hooks (strictly adhering to Immutability patterns)
- **UI Components**: Lucide-React icons, custom gamified widgets (XP Bars, Dashboards)

---

## Quick Start (Development)

### Prerequisites
- Node.js (v18+)
- Go (v1.21+)
- Docker & Docker Compose
- PostgreSQL (or use the provided Docker setup)

### 1. Start Infrastructure (Postgres & Redis)
Ensure you have Docker running, then run the infrastructure services:
```powershell
# From the root directory, you can start the provided containers
docker-compose up -d postgres redis
```

### 2. Backend Setup
```powershell
cd backend
go mod download

# Set up your environment variables
cp .env.example .env

# Run the API server (default: port 8080)
go run ./cmd/api
```

### 3. Frontend Setup
```powershell
cd frontend
npm install

# Set up your environment variables
cp .env.example .env.local

# Start the Next.js dev server (default: port 3000)
npm run dev
```

Visit `http://localhost:3000` to access the Tygrsec Academy dashboard.

---

## Coding Standards & Security Audit

This codebase strictly adheres to the Tygrsec universal coding standards:
- **Immutability**: No direct state mutations; safe updates via functional updaters and spread operators.
- **Type Safety**: Strictly typed interfaces globally. Bypassing types using `any` is prohibited.
- **Graceful Error Handling**: All API boundaries employ deterministic JSON mapping (`{ "error": "...", "status": ... }`) without leaking internal stack traces.
- **Data Binding**: Backend payloads utilize strict Gin `binding:"required"` tags to prevent malicious injection or IDOR.
- **Clean Architecture**: Decoupled handlers, services, and repositories for testability and maintainability.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.