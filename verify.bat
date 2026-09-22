@echo off
setlocal
cd /d "%~dp0"
set "LOG=%~dp0verify-output.txt"

rem A freshly installed Node.js may not be on this process's inherited PATH,
rem so add the standard install locations before doing anything else.
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
if exist "%APPDATA%\npm" set "PATH=%APPDATA%\npm;%PATH%"

echo CareerFlow verification> "%LOG%"
echo Started %DATE% %TIME%>> "%LOG%"
echo.>> "%LOG%"

echo === versions ===>> "%LOG%"
where node >> "%LOG%" 2>&1
call node -v >> "%LOG%" 2>&1
call npm -v >> "%LOG%" 2>&1
echo.>> "%LOG%"

where node >nul 2>&1
if errorlevel 1 (
  echo NODE_MISSING - install Node.js first, then run this again.>> "%LOG%"
  echo ALL_DONE>> "%LOG%"
  echo Node.js was not found. Install it first.
  timeout /t 10 >nul
  exit /b 1
)

echo === npm install ===>> "%LOG%"
call npm install >> "%LOG%" 2>&1
echo INSTALL_EXIT=%ERRORLEVEL%>> "%LOG%"
echo.>> "%LOG%"

echo === npm run lint ===>> "%LOG%"
call npm run lint >> "%LOG%" 2>&1
echo LINT_EXIT=%ERRORLEVEL%>> "%LOG%"
echo.>> "%LOG%"

echo === npm run typecheck ===>> "%LOG%"
call npm run typecheck >> "%LOG%" 2>&1
echo TYPECHECK_EXIT=%ERRORLEVEL%>> "%LOG%"
echo.>> "%LOG%"

echo === npm test ===>> "%LOG%"
call npm test >> "%LOG%" 2>&1
echo TEST_EXIT=%ERRORLEVEL%>> "%LOG%"
echo.>> "%LOG%"

echo === npm run build ===>> "%LOG%"
call npm run build >> "%LOG%" 2>&1
echo BUILD_EXIT=%ERRORLEVEL%>> "%LOG%"
echo.>> "%LOG%"

echo ALL_DONE>> "%LOG%"
echo.
echo Finished. Results are in verify-output.txt
timeout /t 8 >nul
endlocal
