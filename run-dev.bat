@echo off
cd /d "%~dp0"
echo ============================================
echo  CareerFlow - development server
echo ============================================
echo.
echo The app will open in your browser shortly.
echo Leave this window open; close it to stop the server.
echo.
start "" /min cmd /c "timeout /t 12 >nul && start http://localhost:5173/"
call npm run dev -- --port 5173 --strictPort
echo.
echo Server stopped.
timeout /t 10 >nul
