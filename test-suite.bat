@echo off
REM SecureCoder CTF Platform - End-to-End Test Suite (Windows)
REM Usage: test-suite.bat [environment]
REM Environment: local (default) | docker

setlocal EnableDelayedExpansion

set ENVIRONMENT=%1
if "%~1"=="" set ENVIRONMENT=local

set BASE_URL=http://localhost:8080
set FRONTEND_URL=http://localhost:3000
set TOKEN=
set USER_ID=
set CHALLENGE_ID=
set LAB_ID=

set TESTS_PASSED=0
set TESTS_FAILED=0
set TESTS_TOTAL=0

echo ========================================
echo  SecureCoder E2E Test Suite
echo  Environment: %ENVIRONMENT%
echo ========================================
echo.

REM Helper functions
call :log_section "Phase 1: Infrastructure Tests"

call :log_info "Checking if backend is accessible..."
curl -s %BASE_URL%/health > nul 2>&1
if !errorlevel! == 0 (
    call :log_pass "Backend is accessible"
) else (
    call :log_fail "Backend is not accessible"
    echo Make sure the server is running on %BASE_URL%
    goto :summary
)

call :log_section "Phase 2: Authentication Tests"

call :log_info "Testing user registration..."
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=!TIMESTAMP: =0!

curl -s -X POST "%BASE_URL%/api/v1/auth/register" ^
    -H "Content-Type: application/json" ^
    -d "{\"username\": \"testuser_!TIMESTAMP!\", \"email\": \"test_!TIMESTAMP!@example.com\", \"password\": \"SecurePass123!\"}" > C:\temp\register_response.json 2>nul

findstr /C:"access_token" C:\temp\register_response.json > nul
if !errorlevel! == 0 (
    call :log_pass "User Registration"
    for /f "tokens=2 delims=:" %%a in ('findstr /C:"access_token" C:\temp\register_response.json') do (
        set TOKEN=%%a
        set TOKEN=!TOKEN:"=!
        set TOKEN=!TOKEN: =!
        set TOKEN=!TOKEN:,=!
        set TOKEN=!TOKEN:}=!
    )
) else (
    call :log_fail "User Registration"
    type C:\temp\register_response.json
)

if defined TOKEN (
    call :log_info "Testing get current user..."
    curl -s "%BASE_URL%/api/v1/users/me" -H "Authorization: Bearer !TOKEN!" > C:\temp\me_response.json 2>nul
    
    findstr /C:"username" C:\temp\me_response.json > nul
    if !errorlevel! == 0 (
        call :log_pass "Get Current User"
    ) else (
        call :log_fail "Get Current User"
    )
)

call :log_info "Testing unauthorized access..."
curl -s -w "%%{http_code}" -o nul "%BASE_URL%/api/v1/users/me" > C:\temp\unauth_code.txt 2>nul
set /p UNAUTH_CODE=<C:\temp\unauth_code.txt
if "!UNAUTH_CODE!"=="401" (
    call :log_pass "Unauthorized Access (401)"
) else (
    call :log_fail "Unauthorized Access (Expected 401, Got !UNAUTH_CODE!)"
)

call :log_section "Phase 3: Challenge Tests"

if defined TOKEN (
    call :log_info "Testing list challenges..."
    curl -s "%BASE_URL%/api/v1/challenges" -H "Authorization: Bearer !TOKEN!" > C:\temp\challenges.json 2>nul
    
    findstr /C:"data" C:\temp\challenges.json > nul
    if !errorlevel! == 0 (
        call :log_pass "List Challenges"
    ) else (
        call :log_fail "List Challenges"
    )
)

call :log_section "Phase 4: Frontend Tests"

call :log_info "Testing frontend homepage..."
curl -s -o nul -w "%%{http_code}" "%FRONTEND_URL%" > C:\temp\frontend_code.txt 2>nul
set /p FRONTEND_CODE=<C:\temp\frontend_code.txt
if "!FRONTEND_CODE!"=="200" (
    call :log_pass "Frontend Homepage"
) else (
    call :log_fail "Frontend Homepage (Status: !FRONTEND_CODE!)"
)

call :log_section "Phase 5: Error Handling"

call :log_info "Testing invalid JSON..."
curl -s -w "%%{http_code}" -o nul -X POST "%BASE_URL%/api/v1/auth/login" ^
    -H "Content-Type: application/json" ^
    -d "invalid json{" > C:\temp\invalid_code.txt 2>nul
set /p INVALID_CODE=<C:\temp\invalid_code.txt
if "!INVALID_CODE!"=="400" (
    call :log_pass "Invalid JSON Handling (400)"
) else (
    call :log_fail "Invalid JSON Handling (Expected 400, Got !INVALID_CODE!)"
)

:summary
call :log_section "Test Summary"

echo Total Tests: !TESTS_TOTAL!
echo Passed: !TESTS_PASSED!
echo Failed: !TESTS_FAILED!
echo.

if !TESTS_TOTAL! gtr 0 (
    set /a PASS_RATE=TESTS_PASSED*100/TESTS_TOTAL
    echo Pass Rate: !PASS_RATE!%%
) else (
    set PASS_RATE=0
    echo Pass Rate: 0%%
)

if !TESTS_FAILED! == 0 (
    echo.
    echo ✅ GO FOR PRODUCTION
    echo All tests passed! The system is ready for deployment.
    exit /b 0
) else if !PASS_RATE! geq 90 (
    echo.
    echo ⚠️  GO WITH CAUTION
    echo Most tests passed. Review failed tests before deployment.
    exit /b 0
) else (
    echo.
    echo ❌ NO-GO
    echo Too many tests failed. Fix issues before deployment.
    exit /b 1
)

REM Functions
:log_info
echo [INFO] %~1
exit /b 0

:log_pass
echo [PASS] %~1
set /a TESTS_PASSED+=1
set /a TESTS_TOTAL+=1
exit /b 0

:log_fail
echo [FAIL] %~1
set /a TESTS_FAILED+=1
set /a TESTS_TOTAL+=1
exit /b 0

:log_section
echo.
echo ========================================
echo   %~1
echo ========================================
exit /b 0