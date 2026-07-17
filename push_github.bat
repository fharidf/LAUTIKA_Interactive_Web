@echo off
set PATH=%PATH%;C:\Program Files\GitHub CLI
set GIT="C:\Program Files\Git\cmd\git.exe"
cd /d d:\kiro\LAUTIKA_Interactive_Web

echo ============================================
echo  LAUTIKA - Upload ke GitHub dan Deploy
echo ============================================
echo.

echo [1/4] Membuat repository GitHub...
gh repo create lautika-web --public --description "LAUTIKA Interactive Web - Media Pembelajaran Etnomatematika" --source=. --remote=origin --push

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [BERHASIL] Repository dibuat dan di-upload!
    echo.
    echo ============================================
    echo  Repository: https://github.com/NAMAMU/lautika-web
    echo ============================================
    echo.
    echo [2/4] Membuka Render.com untuk deploy...
    echo  - Klik: New Plus - Web Service
    echo  - Connect GitHub - pilih: lautika-web
    echo  - Klik: Create Web Service
    echo  - Tunggu 3-5 menit
    echo  - URL: https://lautika-web.onrender.com
    echo.
    start https://dashboard.render.com/select-repo?type=web
) else (
    echo.
    echo [!] Gagal. Pastikan sudah login: jalankan login_github.bat dulu
)

echo.
pause
