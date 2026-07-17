"""
LAUTIKA — DEPLOY KE INTERNET SEKARANG
======================================
Jalankan: python DEPLOY_SEKARANG.py

Script ini akan:
1. Cek Git sudah terinstal
2. Init repository dan commit semua file
3. Buka GitHub untuk buat repository baru
4. Panduan push ke GitHub
5. Buka Render.com untuk deploy (URL permanen HTTPS)

Hasil akhir: https://lautika-web.onrender.com
(atau nama serupa — aktif 24/7 tanpa komputer menyala)
"""

import os, sys, subprocess, webbrowser, time

BASE = os.path.dirname(os.path.abspath(__file__))


def clear():
    os.system("cls" if os.name == "nt" else "clear")


def run(cmd, **kwargs):
    return subprocess.run(cmd, cwd=BASE, capture_output=True, text=True, **kwargs)


def header(title):
    print()
    print("─" * 60)
    print(f"  {title}")
    print("─" * 60)


def check_git():
    r = run(["git", "--version"])
    return r.returncode == 0


def git_setup():
    header("Git: Persiapan Repository")

    # Init jika belum ada
    if not os.path.exists(os.path.join(BASE, ".git")):
        run(["git", "init"])
        print("  ✓ Repository dibuat")
    else:
        print("  ✓ Repository sudah ada")

    # Config default jika belum ada
    r = run(["git", "config", "user.email"])
    if not r.stdout.strip():
        run(["git", "config", "user.email", "lautika@example.com"])
        run(["git", "config", "user.name", "LAUTIKA"])

    # Add semua file
    run(["git", "add", "."])
    r = run(["git", "status", "--short"])
    files = [l for l in r.stdout.strip().splitlines() if l.strip()]
    print(f"  ✓ {len(files)} file siap di-commit")

    # Commit
    r = run(["git", "commit", "-m", "LAUTIKA Web - Production Deploy"])
    if r.returncode == 0:
        print("  ✓ Commit berhasil")
    else:
        if "nothing to commit" in (r.stdout + r.stderr):
            print("  ✓ Tidak ada perubahan (sudah up-to-date)")
        else:
            print("  ! Commit info:", r.stderr.strip()[:80])

    # Rename branch ke main
    run(["git", "branch", "-M", "main"])


def github_step():
    header("GitHub: Buat Repository")
    print()
    print("  Langkah:")
    print("  1. Halaman GitHub New Repository akan terbuka")
    print("  2. Isi: Repository name = lautika-web")
    print("  3. Pilih: Public")
    print("  4. JANGAN centang 'Initialize this repository'")
    print("  5. Klik: Create repository")
    print("  6. Salin URL yang muncul (bentuk: https://github.com/NAMA/lautika-web.git)")
    print()
    input("  Tekan Enter untuk membuka GitHub...")
    webbrowser.open("https://github.com/new")
    print()
    print("  Setelah repository dibuat, masukkan URL di bawah:")
    print("  (Contoh: https://github.com/johndoe/lautika-web.git)")
    print()

    while True:
        url = input("  URL repository GitHub: ").strip()
        if not url:
            print("  URL kosong. Coba lagi atau ketik 'skip' untuk lewati.")
            if input("  ").strip().lower() == "skip":
                return None
            continue
        if not url.endswith(".git"):
            url = url.rstrip("/") + ".git"
        return url


def push_to_github(repo_url):
    header("GitHub: Upload Project")
    print()

    # Remove existing remote if any
    run(["git", "remote", "remove", "origin"])

    # Add new remote
    r = run(["git", "remote", "add", "origin", repo_url])
    if r.returncode != 0:
        print(f"  ! Error: {r.stderr.strip()}")
        return False

    print("  Mengupload ke GitHub...")
    print("  (Mungkin muncul jendela login — masuk dengan akun GitHub)")
    print()

    r = subprocess.run(
        ["git", "push", "-u", "origin", "main"],
        cwd=BASE
    )
    if r.returncode == 0:
        print()
        print("  ✓ Upload berhasil!")
        return True
    else:
        print()
        print("  ! Upload gagal. Jalankan manual di terminal:")
        print(f"    cd {BASE}")
        print(f"    git push -u origin main")
        return False


def render_step(repo_url):
    header("Render.com: Deploy Website")
    print()
    print("  Langkah di Render.com:")
    print()
    print("  1. Halaman Render.com akan terbuka")
    print("  2. Klik: Get Started for Free")
    print("  3. Sign up dengan Google atau email")
    print("  4. Klik: New + → Web Service")
    print("  5. Klik: Connect GitHub")
    print("  6. Authorize Render → pilih repo: lautika-web")
    print("  7. Render otomatis deteksi config dari render.yaml")
    print("  8. Klik: Create Web Service")
    print("  9. Tunggu 3-5 menit")
    print()
    print("  URL kamu (permanen, tidak berubah):")
    print("  ╔══════════════════════════════════════════╗")
    print("  ║  https://lautika-web.onrender.com        ║")
    print("  ╚══════════════════════════════════════════╝")
    print()
    input("  Tekan Enter untuk membuka Render.com...")
    webbrowser.open("https://render.com")


def print_final_summary(repo_url):
    header("SELESAI! ✓")
    print()
    print("  Project sudah di-upload ke GitHub.")
    print("  Sekarang deploy di Render.com (sudah terbuka di browser).")
    print()
    print("  Setelah Render selesai build (3-5 menit):")
    print()
    print("  ┌─────────────────────────────────────────────────────┐")
    print("  │  🌐 URL PERMANEN:                                   │")
    print("  │  https://lautika-web.onrender.com                   │")
    print("  │                                                     │")
    print("  │  ✓ Aktif 24 jam, 7 hari seminggu                   │")
    print("  │  ✓ HTTPS (aman)                                     │")
    print("  │  ✓ Bisa dibuka dari HP, tablet, laptop             │")
    print("  │  ✓ Dari jaringan mana saja (4G, WiFi, dll)         │")
    print("  │  ✓ Tidak perlu komputer kamu menyala               │")
    print("  │  ✓ Bisa di-share via QR Code                       │")
    print("  └─────────────────────────────────────────────────────┘")
    print()
    print("  Untuk update konten di masa depan:")
    print(f"    cd {BASE}")
    print("    git add .")
    print('    git commit -m "Update"')
    print("    git push")
    print("  (Render otomatis rebuild)")
    print()


def main():
    clear()
    print()
    print("╔══════════════════════════════════════════════════════╗")
    print("║   LAUTIKA — Deploy ke Internet (URL Permanen HTTPS)  ║")
    print("╚══════════════════════════════════════════════════════╝")
    print()
    print("  Script ini akan deploy website kamu ke Render.com.")
    print("  Setelah selesai, website aktif selamanya di internet.")
    print()
    print("  Yang dibutuhkan:")
    print("  - Git (cek dengan: git --version)")
    print("  - Akun GitHub gratis (github.com)")
    print("  - Akun Render gratis (render.com)")
    print()
    input("  Tekan Enter untuk mulai...")

    # Step 1: Check Git
    header("Cek: Git")
    if not check_git():
        print()
        print("  ✗ Git belum terinstal!")
        print()
        print("  Install Git:")
        print("  1. Buka: https://git-scm.com/download/win")
        print("  2. Download dan install")
        print("  3. Restart terminal")
        print("  4. Jalankan script ini lagi")
        print()
        input("  Tekan Enter untuk buka halaman download Git...")
        webbrowser.open("https://git-scm.com/download/win")
        sys.exit(1)

    r = subprocess.run(["git", "--version"], capture_output=True, text=True)
    print(f"  ✓ {r.stdout.strip()}")

    # Step 2: Git setup
    git_setup()

    # Step 3: GitHub
    repo_url = github_step()
    if not repo_url:
        print()
        print("  GitHub dilewati.")
        print("  Jalankan manual:")
        print(f"    cd {BASE}")
        print("    git remote add origin https://github.com/NAMAMU/lautika-web.git")
        print("    git push -u origin main")
        print()
        render_step(None)
        print_final_summary(None)
        return

    # Step 4: Push
    push_to_github(repo_url)

    # Step 5: Render
    render_step(repo_url)

    # Summary
    print_final_summary(repo_url)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n  Dibatalkan.")
