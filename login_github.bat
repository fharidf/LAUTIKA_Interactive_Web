@echo off
set PATH=%PATH%;C:\Program Files\GitHub CLI
echo ============================================
echo  LAUTIKA - Login ke GitHub
echo ============================================
echo.
echo Ikuti instruksi di bawah ini:
echo  1. Tekan Enter saat diminta
echo  2. Browser akan terbuka otomatis
echo  3. Login dengan akun GitHub kamu
echo  4. Klik "Authorize GitHub CLI"
echo  5. Kembali ke jendela ini
echo.
gh auth login --web -h github.com
echo.
echo ============================================
echo  Login selesai! Menutup dalam 5 detik...
echo ============================================
timeout /t 5
