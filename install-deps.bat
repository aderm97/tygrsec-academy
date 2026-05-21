@echo off
REM Frontend dependencies installation script for Windows
echo Installing frontend dependencies...

cd frontend

REM Install all dependencies from package.json
npm install

REM If npm install fails, try with legacy peer deps
if %errorlevel% neq 0 (
    echo Retrying with legacy peer deps...
    npm install --legacy-peer-deps
)

echo Frontend dependencies installed successfully!
echo.
echo To start the development server:
echo   cd frontend ^&^& npm run dev
pause