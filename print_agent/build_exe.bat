@echo off
chcp 65001 >nul
echo ========================================================
echo    بناء وتجميع برنامج الطباعة المباشرة MaktabatiPrint.exe
echo ========================================================
echo.

cd /d "%~dp0"

echo 1. التحقق من وجود مشغل SumatraPDF...
if not exist "bin\SumatraPDF.exe" (
    echo مشغل SumatraPDF.exe غير موجود في bin! يرجى تحميله أولاً.
    pause
    exit /b 1
)

echo.
echo 2. بناء الملف التنفيذي المستقل (Single Executable)...
pyinstaller --noconfirm --clean --onefile --noconsole --name "MaktabatiPrint" --add-binary "bin/SumatraPDF.exe;." main.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [خطأ] فشل بناء الملف التنفيذي!
    pause
    exit /b 1
)

echo.
echo 3. نسخ البرنامج إلى مجلد تنزيلات الويب (web/public/downloads)...
if not exist "..\web\public\downloads" mkdir "..\web\public\downloads"
copy /y "dist\MaktabatiPrint.exe" "..\web\public\downloads\MaktabatiPrint.exe"

echo.
echo ========================================================
echo  ✓ تم بناء وتجميع MaktabatiPrint.exe بنجاح تام!
echo  المسار: print_agent\dist\MaktabatiPrint.exe
echo  ورابط التنزيل المباشر: web\public\downloads\MaktabatiPrint.exe
echo ========================================================
echo.
pause
