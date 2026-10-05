@echo off
title AEGIS Windows Packet Sensor
cd /d "%~dp0"
echo.
echo Starting AEGIS Windows Packet Sensor...
echo IMPORTANT: Run this file as Administrator.
echo.
python sensor_agent.py
pause
