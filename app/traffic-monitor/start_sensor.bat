@echo off
setlocal
title AEGIS Windows Packet Sensor
cd /d "%~dp0"

echo.
echo ============================================================
echo AEGIS WINDOWS PACKET SENSOR
echo ============================================================
echo Run this file as Administrator so Npcap can capture packets.
echo.

if "%AEGIS_API_URL%"=="" set "AEGIS_API_URL=https://aegis-ids-api.onrender.com"

if "%AEGIS_SENSOR_TOKEN%"=="" (
  echo Paste the Sensor Credential shown in AEGIS Dashboard ^> Settings.
  set /p AEGIS_SENSOR_TOKEN=Sensor Credential: 
)

if "%AEGIS_SENSOR_TOKEN%"=="" (
  echo.
  echo ERROR: A sensor credential is required.
  pause
  exit /b 1
)

echo.
echo API: %AEGIS_API_URL%
echo Connecting this Windows sensor to your AEGIS account...
echo.

python sensor_agent.py
echo.
echo Sensor process stopped.
pause
