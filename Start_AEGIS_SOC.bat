@echo off
title AEGIS Security Operations Center (SOC) Launcher
color 0A

echo =========================================================================
echo               AEGIS ENTERPRISE SOC PLATFORM LAUNCHER
echo =========================================================================
echo.
echo [1/3] Configuring Real SMTP Email Credentials...
set SMTP_USER=spencer.mail.services@gmail.com
set SMTP_PASS=sbee ejrh cdos vfgx

echo [2/3] Starting Flask Backend Machine Learning Engine (Port 5000)...
start "AEGIS Backend API" /min cmd /c "cd /d "%~dp0app\backend" && python app.py"

echo [3/3] Starting React Web Console (Port 5173)...
start "AEGIS Frontend Console" /min cmd /c "cd /d "%~dp0app\frontend" && npm run dev"

echo.
echo =========================================================================
echo  AEGIS SOC Platform is now ACTIVE!
echo  Opening http://localhost:5173 in your default browser...
echo =========================================================================
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173

exit
