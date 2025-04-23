@echo off
echo Starting Tambakaji Pharmacy Hub...
echo.
echo This will start both backend and frontend servers.
echo.

REM Start backend server in a new window
start "Backend Server" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to initialize
timeout /t 5

REM Start frontend server in a new window
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Servers started! You can access the application at:
echo http://localhost:8080
echo.
echo Press any key to exit this window...
pause > nul 