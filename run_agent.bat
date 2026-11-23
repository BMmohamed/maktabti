@echo off
chcp 65001 >nul
title مكتبتي - وكيل الطباعة الذكي (MaktabatiPrint)

cd /d "%~dp0\print_agent"

echo ========================================================
echo   تشغيل وكيل الطباعة الذكي (MaktabatiPrint)
echo ========================================================
echo.

python main.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [تنبيه] توقف البرنامج.
    pause
    
)
