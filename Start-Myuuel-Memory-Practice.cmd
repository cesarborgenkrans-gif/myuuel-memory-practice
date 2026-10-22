@echo off
title Start - Myuuel Memory Practice
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-Myuuel-Memory-Practice.ps1"
if errorlevel 1 (
  echo.
  echo Startup needs attention. Review the message above.
  pause
)
