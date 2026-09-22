@echo off
setlocal
cd /d "%~dp0"
set "LOG=%~dp0verify-output.txt"

echo CareerFlow verification> "%LOG%"
echo Started %DATE% %TIME%>> "%LOG%"
echo.>> "%LOG%"

echo === versions ===>> "%LOG%"
call node -v >> "%LOG%" 2>&1
call npm -v >> "%LOG%" 2>&1
echo.>> "%LOG%"

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
echo Finished. Results written to verify-output.txt
timeout /t 5 >nul
endlocal
