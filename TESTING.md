# End-to-End Testing Checklist

## Pre-Flight Checklist

### 1. Infrastructure Check
```bash
# Check Docker is running
docker ps

# Check ports are available
netstat -ano | findstr :3000  # Frontend
netstat -ano | findstr :8080  # Backend
netstat -ano | findstr :5432  # PostgreSQL
netstat -ano | findstr :6379  # Redis
```

### 2. Environment Variables
Create `.env` file in `docker/` directory:
```env
# Database
POSTGRES_USER=securecoder
POSTGRES_PASSWORD=securecoder_password
POSTGRES_DB=securecoder

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters

# API Keys (optional for testing)
OPENAI_KEY=sk-test-key
GITHUB_CLIENT_ID=test
GITHUB_CLIENT_SECRET=test
```

## Test Suite

### Phase 1: Infrastructure Tests

#### 1.1 Docker Compose Build
```bash
cd securecoder-platform/docker
docker-compose build --no-cache
```
**Expected**: All services build successfully
**Result**: [ ] PASS / [ ] FAIL

#### 1.2 Services Start
```bash
docker-compose up -d
```
**Check**:
```bash
docker-compose ps
```
**Expected**: All 4 services (postgres, redis, backend, frontend) show "Up"
**Result**: [ ] PASS / [ ] FAIL

#### 1.3 Health Checks
```bash
# PostgreSQL
docker-compose exec postgres pg_isready -U securecoder

# Redis
docker-compose exec redis redis-cli ping

# Backend
curl http://localhost:8080/health
```
**Expected**: All return healthy/PONG/200 OK
**Result**: [ ] PASS / [ ] FAIL

### Phase 2: Authentication Tests

#### 2.1 User Registration
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```
**Expected**: 201 Created, returns user object and tokens
**Result**: [ ] PASS / [ ] FAIL

#### 2.2 User Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username_or_email": "testuser",
    "password": "SecurePass123!"
  }'
```
**Expected**: 200 OK, returns access_token and refresh_token
**Result**: [ ] PASS / [ ] FAIL

#### 2.3 Token Refresh
```bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh_token_from_login>"
  }'
```
**Expected**: 200 OK, returns new access_token
**Result**: [ ] PASS / [ ] FAIL

#### 2.4 Protected Route Access
```bash
curl http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer <access_token>"
```
**Expected**: 200 OK, returns user profile
**Result**: [ ] PASS / [ ] FAIL

#### 2.5 Unauthorized Access
```bash
curl http://localhost:8080/api/v1/users/me
```
**Expected**: 401 Unauthorized
**Result**: [ ] PASS / [ ] FAIL

### Phase 3: Challenge Tests

#### 3.1 List Challenges
```bash
curl http://localhost:8080/api/v1/challenges \
  -H "Authorization: Bearer <access_token>"
```
**Expected**: 200 OK, returns array of challenges
**Result**: [ ] PASS / [ ] FAIL

#### 3.2 Filter Challenges
```bash
curl "http://localhost:8080/api/v1/challenges?difficulty=beginner" \
  -H "Authorization: Bearer <access_token>"
```
**Expected**: Only beginner challenges returned
**Result**: [ ] PASS / [ ] FAIL

#### 3.3 Get Challenge Details
```bash
curl http://localhost:8080/api/v1/challenges/<challenge_id> \
  -H "Authorization: Bearer <access_token>"
```
**Expected**: 200 OK, returns challenge with hints
**Result**: [ ] PASS / [ ] FAIL

#### 3.4 Submit Correct Flag
```bash
curl -X POST http://localhost:8080/api/v1/challenges/<id>/submit \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"flag": "flag{correct_flag}"}'
```
**Expected**: 200 OK, correct: true
**Result**: [ ] PASS / [ ] FAIL

#### 3.5 Submit Incorrect Flag
```bash
curl -X POST http://localhost:8080/api/v1/challenges/<id>/submit \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"flag": "flag{wrong}"}'
```
**Expected**: 200 OK, correct: false
**Result**: [ ] PASS / [ ] FAIL

#### 3.6 Get Hints
```bash
curl http://localhost:8080/api/v1/challenges/<id>/hints \
  -H "Authorization: Bearer <access_token>"
```
**Expected**: 200 OK, returns array of hints
**Result**: [ ] PASS / [ ] FAIL

### Phase 4: Lab Environment Tests

#### 4.1 Create Lab
```bash
curl -X POST http://localhost:8080/api/v1/labs \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": "<challenge_id>",
    "image": "securecoder/sqli-basic:latest"
  }'
```
**Expected**: 201 Created, returns lab with status "creating"
**Result**: [ ] PASS / [ ] FAIL

#### 4.2 Get Lab Status
```bash
curl http://localhost:8080/api/v1/labs/<lab_id> \
  -H "Authorization: Bearer <access_token>"
```
**Expected**: 200 OK, lab status progresses to "running"
**Result**: [ ] PASS / [ ] FAIL

#### 4.3 Verify Container Running
```bash
docker ps | grep securecoder-lab
```
**Expected**: Container running on appropriate port
**Result**: [ ] PASS / [ ] FAIL

#### 4.4 Access Lab Application
```bash
curl http://localhost:<lab_port>
```
**Expected**: Returns vulnerable application homepage
**Result**: [ ] PASS / [ ] FAIL

#### 4.5 Destroy Lab
```bash
curl -X DELETE http://localhost:8080/api/v1/labs/<lab_id> \
  -H "Authorization: Bearer <access_token>"
```
**Expected**: 200 OK, container removed
**Result**: [ ] PASS / [ ] FAIL

### Phase 5: Gamification Tests

#### 5.1 Check User Stats
```bash
curl http://localhost:8080/api/v1/users/me/stats \
  -H "Authorization: Bearer <access_token>"
```
**Expected**: 200 OK, shows level, XP, challenges solved
**Result**: [ ] PASS / [ ] FAIL

#### 5.2 Check User Badges
```bash
curl http://localhost:8080/api/v1/users/me/badges \
  -H "Authorization: Bearer <access_token>"
```
**Expected**: 200 OK, returns earned badges
**Result**: [ ] PASS / [ ] FAIL

#### 5.3 XP After Solve
1. Note current XP
2. Solve a challenge
3. Check XP increased
**Result**: [ ] PASS / [ ] FAIL

#### 5.4 Level Up
1. Submit enough flags to reach XP threshold
2. Verify level increases
**Result**: [ ] PASS / [ ] FAIL

### Phase 6: Frontend Tests

#### 6.1 Homepage Load
```bash
curl http://localhost:3000
```
**Expected**: 200 OK, HTML response
**Result**: [ ] PASS / [ ] FAIL

#### 6.2 Login Page
Navigate to: http://localhost:3000/login
**Expected**: Login form visible
**Result**: [ ] PASS / [ ] FAIL

#### 6.3 Challenges Page
Navigate to: http://localhost:3000/challenges
**Expected**: Challenge grid visible with filters
**Result**: [ ] PASS / [ ] FAIL

#### 6.4 Dark Mode Toggle
Click theme toggle button
**Expected**: UI switches to dark/light mode
**Result**: [ ] PASS / [ ] FAIL

### Phase 7: Security Tests

#### 7.1 SQL Injection Test (on vulnerable app)
```bash
# SQL Injection lab should be vulnerable
curl "http://localhost:<lab_port>/search?q=' OR '1'='1"
```
**Expected**: Returns all records (vulnerability working)
**Result**: [ ] PASS / [ ] FAIL

#### 7.2 XSS Test (on vulnerable app)
```bash
curl "http://localhost:<lab_port>/?search=<script>alert('xss')</script>"
```
**Expected**: Script reflected without sanitization
**Result**: [ ] PASS / [ ] FAIL

#### 7.3 JWT Token Security
1. Capture JWT token
2. Decode at jwt.io
3. Verify no sensitive data in payload
**Result**: [ ] PASS / [ ] FAIL

#### 7.4 Rate Limiting Test
```bash
for i in {1..20}; do
  curl http://localhost:8080/api/v1/challenges \
    -H "Authorization: Bearer <token>"
done
```
**Expected**: No rate limiting errors for normal usage
**Result**: [ ] PASS / [ ] FAIL

### Phase 8: Performance Tests

#### 8.1 Response Time
```bash
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8080/api/v1/challenges \
  -H "Authorization: Bearer <token>"
```
curl-format.txt:
```
time_namelookup: %{time_namelookup}\n
time_connect: %{time_connect}\n
time_appconnect: %{time_appconnect}\n
time_pretransfer: %{time_pretransfer}\n
time_redirect: %{time_redirect}\n
time_starttransfer: %{time_starttransfer}\n
time_total: %{time_total}\n
```
**Expected**: API responses < 200ms
**Result**: [ ] PASS / [ ] FAIL

#### 8.2 Database Connection Pool
Check no connection leaks after multiple requests
**Result**: [ ] PASS / [ ] FAIL

#### 8.3 Lab Startup Time
Time from lab creation to running state
**Expected**: < 30 seconds
**Result**: [ ] PASS / [ ] FAIL

### Phase 9: Data Persistence Tests

#### 9.1 Database Migrations
```bash
docker-compose exec backend go run cmd/api/main.go migrate
```
**Expected**: All migrations run successfully
**Result**: [ ] PASS / [ ] FAIL

#### 9.2 Data Survives Restart
1. Create user and solve challenges
2. Restart backend: `docker-compose restart backend`
3. Verify data persists
**Result**: [ ] PASS / [ ] FAIL

#### 9.3 Redis Cache
1. Login (creates session)
2. Check Redis: `docker-compose exec redis redis-cli keys "*"`
3. Verify session data exists
**Result**: [ ] PASS / [ ] FAIL

### Phase 10: Error Handling Tests

#### 10.1 Invalid JSON
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d 'invalid json{'
```
**Expected**: 400 Bad Request with error message
**Result**: [ ] PASS / [ ] FAIL

#### 10.2 Missing Required Fields
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test"}'
```
**Expected**: 400 Bad Request, validation errors
**Result**: [ ] PASS / [ ] FAIL

#### 10.3 Non-existent Resource
```bash
curl http://localhost:8080/api/v1/challenges/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer <token>"
```
**Expected**: 404 Not Found
**Result**: [ ] PASS / [ ] FAIL

#### 10.4 Expired Token
Wait for token to expire, then:
```bash
curl http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer <expired_token>"
```
**Expected**: 401 Unauthorized
**Result**: [ ] PASS / [ ] FAIL

## Test Execution Log

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Docker Compose Build | [ ] | |
| 1.2 | Services Start | [ ] | |
| 1.3 | Health Checks | [ ] | |
| 2.1 | User Registration | [ ] | |
| 2.2 | User Login | [ ] | |
| 2.3 | Token Refresh | [ ] | |
| 2.4 | Protected Route | [ ] | |
| 2.5 | Unauthorized Access | [ ] | |
| 3.1 | List Challenges | [ ] | |
| 3.2 | Filter Challenges | [ ] | |
| 3.3 | Get Challenge | [ ] | |
| 3.4 | Submit Correct Flag | [ ] | |
| 3.5 | Submit Incorrect Flag | [ ] | |
| 3.6 | Get Hints | [ ] | |
| 4.1 | Create Lab | [ ] | |
| 4.2 | Get Lab Status | [ ] | |
| 4.3 | Verify Container | [ ] | |
| 4.4 | Access Lab App | [ ] | |
| 4.5 | Destroy Lab | [ ] | |
| 5.1 | User Stats | [ ] | |
| 5.2 | User Badges | [ ] | |
| 5.3 | XP After Solve | [ ] | |
| 5.4 | Level Up | [ ] | |
| 6.1 | Homepage Load | [ ] | |
| 6.2 | Login Page | [ ] | |
| 6.3 | Challenges Page | [ ] | |
| 6.4 | Dark Mode | [ ] | |
| 7.1 | SQL Injection | [ ] | |
| 7.2 | XSS Test | [ ] | |
| 7.3 | JWT Security | [ ] | |
| 7.4 | Rate Limiting | [ ] | |
| 8.1 | Response Time | [ ] | |
| 8.2 | Connection Pool | [ ] | |
| 8.3 | Lab Startup | [ ] | |
| 9.1 | Migrations | [ ] | |
| 9.2 | Data Persistence | [ ] | |
| 9.3 | Redis Cache | [ ] | |
| 10.1 | Invalid JSON | [ ] | |
| 10.2 | Missing Fields | [ ] | |
| 10.3 | Non-existent | [ ] | |
| 10.4 | Expired Token | [ ] | |

## Go/No-Go Criteria

### GO Criteria (All must pass):
- [ ] All Phase 1 tests pass (Infrastructure)
- [ ] All Phase 2 tests pass (Authentication)
- [ ] All Phase 3 tests pass (Challenges)
- [ ] All Phase 4 tests pass (Labs)
- [ ] All Phase 5 tests pass (Gamification)
- [ ] All Phase 7 tests pass (Security)
- [ ] 90% of tests overall pass

### NO-GO Criteria (Any is a blocker):
- [ ] Authentication system fails
- [ ] Database connections fail
- [ ] Docker containers won't start
- [ ] Critical security vulnerability found
- [ ] Data loss on restart

## Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| Security Lead | | | |
| DevOps Lead | | | |
| Product Owner | | | |