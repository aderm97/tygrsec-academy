#!/bin/bash

# SecureCoder CTF Platform - End-to-End Test Suite
# Usage: ./test-suite.sh [environment]
# Environment: local (default) | docker

set -e

ENVIRONMENT=${1:-local}
BASE_URL="http://localhost:8080"
FRONTEND_URL="http://localhost:3000"
TOKEN=""
USER_ID=""
CHALLENGE_ID=""
LAB_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Logging functions
log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_section() {
    echo ""
    echo "========================================"
    echo "  $1"
    echo "========================================"
}

run_test() {
    ((TESTS_TOTAL++))
    local test_name=$1
    local command=$2
    local expected_status=$3
    
    echo -n "Testing: $test_name... "
    
    if eval "$command" > /tmp/test_output.json 2>&1; then
        local actual_status=$(cat /tmp/test_output.json | grep -o '"status":[^,}]*' | cut -d':' -f2 | tr -d '"' || echo "200")
        
        if [ -z "$expected_status" ] || [ "$actual_status" == "$expected_status" ]; then
            log_pass "$test_name"
            return 0
        else
            log_fail "$test_name (Expected: $expected_status, Got: $actual_status)"
            cat /tmp/test_output.json | head -20
            return 1
        fi
    else
        log_fail "$test_name"
        cat /tmp/test_output.json | head -20
        return 1
    fi
}

# ======================
# Phase 1: Infrastructure
# ======================
log_section "Phase 1: Infrastructure Tests"

if [ "$ENVIRONMENT" == "docker" ]; then
    log_info "Checking Docker services..."
    
    # Check PostgreSQL
    if docker-compose -f docker/docker-compose.yml exec -T postgres pg_isready -U securecoder > /dev/null 2>&1; then
        log_pass "PostgreSQL is ready"
    else
        log_fail "PostgreSQL is not ready"
    fi
    
    # Check Redis
    if docker-compose -f docker/docker-compose.yml exec -T redis redis-cli ping | grep -q "PONG"; then
        log_pass "Redis is ready"
    else
        log_fail "Redis is not ready"
    fi
    
    # Check Backend Health
    if curl -s http://localhost:8080/health | grep -q "healthy"; then
        log_pass "Backend health check"
    else
        log_fail "Backend health check"
    fi
fi

# ======================
# Phase 2: Authentication
# ======================
log_section "Phase 2: Authentication Tests"

# Test 2.1: User Registration
log_info "Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser_'$(date +%s)'",
        "email": "test_'$(date +%s)'@example.com",
        "password": "SecurePass123!"
    }' || echo '{"error": "request failed"}')

echo "$REGISTER_RESPONSE" > /tmp/register_response.json

if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
    log_pass "User Registration"
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"refresh_token":"[^"]*' | cut -d'"' -f4)
else
    log_fail "User Registration"
    echo "$REGISTER_RESPONSE" | head -20
fi

# Test 2.2: User Login
if [ -n "$TOKEN" ]; then
    log_info "Testing user login..."
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "username_or_email": "testuser_'$(date +%s)'",
            "password": "SecurePass123!"
        }' || echo '{"error": "request failed"}')
    
    if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
        log_pass "User Login"
    else
        log_fail "User Login"
    fi
fi

# Test 2.3: Get Current User
if [ -n "$TOKEN" ]; then
    log_info "Testing get current user..."
    ME_RESPONSE=$(curl -s "$BASE_URL/api/v1/users/me" \
        -H "Authorization: Bearer $TOKEN" || echo '{"error": "request failed"}')
    
    if echo "$ME_RESPONSE" | grep -q "username"; then
        log_pass "Get Current User"
        USER_ID=$(echo "$ME_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    else
        log_fail "Get Current User"
    fi
fi

# Test 2.4: Unauthorized Access
log_info "Testing unauthorized access..."
UNAUTH_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/v1/users/me")
if [ "$UNAUTH_RESPONSE" == "401" ]; then
    log_pass "Unauthorized Access (401)"
else
    log_fail "Unauthorized Access (Expected 401, Got $UNAUTH_RESPONSE)"
fi

# ======================
# Phase 3: Challenges
# ======================
log_section "Phase 3: Challenge Tests"

if [ -n "$TOKEN" ]; then
    # Test 3.1: List Challenges
    log_info "Testing list challenges..."
    CHALLENGES_RESPONSE=$(curl -s "$BASE_URL/api/v1/challenges" \
        -H "Authorization: Bearer $TOKEN" || echo '{"error": "request failed"}')
    
    if echo "$CHALLENGES_RESPONSE" | grep -q "data"; then
        log_pass "List Challenges"
        # Extract first challenge ID
        CHALLENGE_ID=$(echo "$CHALLENGES_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    else
        log_fail "List Challenges"
    fi
    
    # Test 3.2: Get Challenge Details
    if [ -n "$CHALLENGE_ID" ]; then
        log_info "Testing get challenge details..."
        CHALLENGE_RESPONSE=$(curl -s "$BASE_URL/api/v1/challenges/$CHALLENGE_ID" \
            -H "Authorization: Bearer $TOKEN" || echo '{"error": "request failed"}')
        
        if echo "$CHALLENGE_RESPONSE" | grep -q "title"; then
            log_pass "Get Challenge Details"
        else
            log_fail "Get Challenge Details"
        fi
    fi
    
    # Test 3.3: Submit Flag (incorrect)
    if [ -n "$CHALLENGE_ID" ]; then
        log_info "Testing submit flag (incorrect)..."
        FLAG_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/challenges/$CHALLENGE_ID/submit" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"flag": "flag{wrong}"}' || echo '{"error": "request failed"}')
        
        if echo "$FLAG_RESPONSE" | grep -q '"correct":false'; then
            log_pass "Submit Incorrect Flag"
        else
            log_fail "Submit Incorrect Flag"
        fi
    fi
fi

# ======================
# Phase 4: Labs
# ======================
log_section "Phase 4: Lab Tests"

if [ -n "$TOKEN" ] && [ -n "$CHALLENGE_ID" ]; then
    # Test 4.1: Create Lab
    log_info "Testing create lab..."
    LAB_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/labs" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"challenge_id\": \"$CHALLENGE_ID\", \"image\": \"securecoder/sqli-basic:latest\"}" || echo '{"error": "request failed"}')
    
    if echo "$LAB_RESPONSE" | grep -q "id"; then
        log_pass "Create Lab"
        LAB_ID=$(echo "$LAB_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    else
        log_fail "Create Lab"
        echo "$LAB_RESPONSE" | head -20
    fi
    
    # Test 4.2: Get Lab (if created)
    if [ -n "$LAB_ID" ]; then
        log_info "Testing get lab..."
        sleep 2  # Wait for lab to start
        
        GET_LAB_RESPONSE=$(curl -s "$BASE_URL/api/v1/labs/$LAB_ID" \
            -H "Authorization: Bearer $TOKEN" || echo '{"error": "request failed"}')
        
        if echo "$GET_LAB_RESPONSE" | grep -q "status"; then
            log_pass "Get Lab Status"
        else
            log_fail "Get Lab Status"
        fi
    fi
fi

# ======================
# Phase 5: Gamification
# ======================
log_section "Phase 5: Gamification Tests"

if [ -n "$TOKEN" ] && [ -n "$USER_ID" ]; then
    # Test 5.1: Get User Stats
    log_info "Testing get user stats..."
    STATS_RESPONSE=$(curl -s "$BASE_URL/api/v1/users/me/stats" \
        -H "Authorization: Bearer $TOKEN" || echo '{"error": "request failed"}')
    
    if echo "$STATS_RESPONSE" | grep -q "level"; then
        log_pass "Get User Stats"
    else
        log_fail "Get User Stats"
    fi
    
    # Test 5.2: Get User Badges
    log_info "Testing get user badges..."
    BADGES_RESPONSE=$(curl -s "$BASE_URL/api/v1/users/me/badges" \
        -H "Authorization: Bearer $TOKEN" || echo '{"error": "request failed"}')
    
    if echo "$BADGES_RESPONSE" | grep -q "badges"; then
        log_pass "Get User Badges"
    else
        log_fail "Get User Badges"
    fi
fi

# ======================
# Phase 6: Frontend
# ======================
log_section "Phase 6: Frontend Tests"

# Test 6.1: Homepage
log_info "Testing frontend homepage..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" || echo "000")
if [ "$FRONTEND_STATUS" == "200" ]; then
    log_pass "Frontend Homepage"
else
    log_fail "Frontend Homepage (Status: $FRONTEND_STATUS)"
fi

# ======================
# Phase 7: Error Handling
# ======================
log_section "Phase 7: Error Handling Tests"

# Test 7.1: Invalid JSON
log_info "Testing invalid JSON handling..."
INVALID_JSON=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d 'invalid json{' || echo "000")

if [ "$INVALID_JSON" == "400" ]; then
    log_pass "Invalid JSON Handling (400)"
else
    log_fail "Invalid JSON Handling (Expected 400, Got $INVALID_JSON)"
fi

# Test 7.2: Non-existent Resource
if [ -n "$TOKEN" ]; then
    log_info "Testing non-existent resource..."
    NOT_FOUND=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/v1/challenges/00000000-0000-0000-0000-000000000000" \
        -H "Authorization: Bearer $TOKEN" || echo "000")
    
    if [ "$NOT_FOUND" == "404" ]; then
        log_pass "Non-existent Resource (404)"
    else
        log_fail "Non-existent Resource (Expected 404, Got $NOT_FOUND)"
    fi
fi

# ======================
# Summary
# ======================
log_section "Test Summary"

echo "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

PASS_RATE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
echo "Pass Rate: $PASS_RATE%"

# Go/No-Go Decision
if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ GO FOR PRODUCTION${NC}"
    echo "All tests passed! The system is ready for deployment."
    exit 0
elif [ $PASS_RATE -ge 90 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  GO WITH CAUTION${NC}"
    echo "Most tests passed. Review failed tests before deployment."
    exit 0
else
    echo ""
    echo -e "${RED}❌ NO-GO${NC}"
    echo "Too many tests failed. Fix issues before deployment."
    exit 1
fi