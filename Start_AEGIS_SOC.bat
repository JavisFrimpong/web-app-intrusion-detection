@echo off
setlocal
title AEGIS Security Operations Center (SOC) Launcher
color 0A

set "ROOT=%~dp0"
set "BACKEND=%ROOT%app\backend"
set "FRONTEND=%ROOT%app\frontend"
set "MODEL=%ROOT%models\random_forest.pkl"
set "SCALER=%ROOT%models\standard_scaler.pkl"
set "LABELS=%ROOT%data\processed\label_mapping.csv"

echo =========================================================================
echo               AEGIS ENTERPRISE SOC PLATFORM LAUNCHER
echo =========================================================================
echo.

echo [1/6] Checking Python...
where python >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python was not found in PATH.
  echo Install Python 3.11+ and try again.
  pause
  exit /b 1
)

echo [2/6] Checking backend dependencies...
python -c "import flask, flask_cors, joblib, pandas, requests" >nul 2>&1
if errorlevel 1 (
  echo Missing Python packages. Installing backend requirements...
  python -m pip install -r "%BACKEND%\requirements.txt"
  if errorlevel 1 (
    echo [ERROR] Backend dependency installation failed.
    pause
    exit /b 1
  )
)

echo [3/6] Checking Node.js and frontend dependencies...
where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found in PATH.
  echo Install Node.js LTS and try again.
  pause
  exit /b 1
)

if not exist "%FRONTEND%\node_modules" (
  echo Frontend packages are not installed. Running npm install...
  pushd "%FRONTEND%"
  call npm install
  if errorlevel 1 (
    popd
    echo [ERROR] Frontend dependency installation failed.
    pause
    exit /b 1
  )
  popd
)

echo [4/6] Checking machine-learning assets...
set "ML_READY=1"
if not exist "%MODEL%" (
  echo [WARNING] Missing: models\random_forest.pkl
  set "ML_READY=0"
)
if not exist "%SCALER%" (
  echo [WARNING] Missing: models\standard_scaler.pkl
  set "ML_READY=0"
)
if not exist "%LABELS%" (
  echo [WARNING] Missing: data\processed\label_mapping.csv
  set "ML_READY=0"
)

if "%ML_READY%"=="0" (
  echo.
  echo [WARNING] AEGIS will start in DEGRADED MODE.
  echo The web console and backend will run, but ML prediction features
  echo remain unavailable until the trained model assets are restored.
  echo.
)

echo [5/6] Starting Flask Backend API on port 5000...
start "AEGIS Backend API" /min cmd /c "cd /d ""%BACKEND%"" && python app.py"

echo [6/6] Starting React Web Console on port 5173...
start "AEGIS Frontend Console" /min cmd /c "cd /d ""%FRONTEND%"" && npm run dev"

echo.
echo =========================================================================
echo  AEGIS SOC Platform startup initiated.
echo  Backend:  http://127.0.0.1:5000
echo  Console:  http://localhost:5173
echo =========================================================================
echo.
echo SMTP credentials are no longer stored in this launcher.
echo Set SMTP_USER and SMTP_PASS as local environment variables if email
echo verification delivery is required.
echo.

timeout /t 4 /nobreak >nul
start "" http://localhost:5173

endlocal
exit /b 0
