@echo off
chcp 65001 >nul
echo ========================================================
echo    تجميع وكيل الطباعة الذكي Maktabati Print Agent (.EXE)
echo ========================================================
echo.

echo 1. التحقق من تثبيت متطلبات بايثون...
pip install -r requirements.txt

echo.
echo 2. بناء الملف التنفيذي الخفيف المستقل...
pyinstaller --noconfirm --onedir --windowed --name "MaktabatiPrintAgent" --add-data "config.json;." print_agent.py

echo.
echo ========================================================
echo  تم التجميع بنجاح!
echo  الملف التنفيذي جاهز في المجلد:
echo  print_agent\dist\MaktabatiPrintAgent\MaktabatiPrintAgent.exe
echo ========================================================
echo.
echo للتشغيل التلقائي مع إقلاع ويندوز:
echo اضغط Win+R ثم اكتب shell:startup وانسخ اختصاراً للبرنامج هناك.
echo ========================================================
pause
