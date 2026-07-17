"""
LAUTIKA — Git Push ke GitHub
Jalankan: python d:\kiro\LAUTIKA_Interactive_Web\git_push.py
"""
import os, subprocess, sys, shutil, json, urllib.request

GIT = r"C:\Program Files\Git\cmd\git.exe"
GH  = r"C:\Program Files\GitHub CLI\gh.exe"
DIR = r"d:\kiro\LAUTIKA_Interactive_Web"

os.chdir(DIR)
print(f"Working dir: {os.getcwd()}\n")

def g(*args, capture=False):
    """Jalankan git command dari DIR."""
    cmd = [GIT] + list(args)
    print(f"> git {' '.join(args)}")
    if capture:
        r = subprocess.run(cmd, cwd=DIR, capture_output=True, text=True)
        return r.stdout.strip()
    else:
        subprocess.run(cmd, cwd=DIR)

def gh_api(method, endpoint, data=None):
    """Panggil GitHub API pakai token dari gh CLI."""
    # Ambil token
    tr = subprocess.run([GH, "auth", "token"], capture_output=True, text=True)
    token = tr.stdout.strip()
    if not token:
        print("ERROR: tidak dapat token GitHub")
        sys.exit(1)

    url = f"https://api.github.com{endpoint}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    }
    body = json.dumps(data).encode() if data else None
    req  = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read()), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return json.loads(body) if body else {}, e.code


# ── STEP 1: Hapus .git lama & init baru ──────────────────────
git_dir = os.path.join(DIR, ".git")
if os.path.exists(git_dir):
    # Paksa hapus read-only files
    def force_remove(func, path, exc):
        os.chmod(path, 0o777)
        func(path)
    shutil.rmtree(git_dir, onerror=force_remove)
    print("✓ .git lama dihapus")

g("init")
g("config", "user.email", "lautika.web@gmail.com")
g("config", "user.name",  "LAUTIKA Web")

# ── STEP 2: Stage semua file KECUALI subfolder .git ──────────
# Tambahkan semua file secara individual agar tidak ada submodule issue
file_list = []
for root, dirs, files in os.walk(DIR):
    dirs[:] = [d for d in dirs if d != ".git"]
    for f in files:
        rel = os.path.relpath(os.path.join(root, f), DIR)
        file_list.append(rel)

print(f"\n✓ {len(file_list)} file akan di-add")

# Add file per-file dengan path relatif
batch = 50
for i in range(0, len(file_list), batch):
    chunk = file_list[i:i+batch]
    subprocess.run([GIT, "add", "--"] + chunk, cwd=DIR)

staged = g("status", "--short", capture=True)
print(f"✓ {len(staged.splitlines())} file staged")

# ── STEP 3: Commit ────────────────────────────────────────────
g("commit", "-m", "LAUTIKA Interactive Web - Production Ready")
g("branch", "-M", "main")
commit = g("log", "--oneline", "-1", capture=True)
print(f"\n✓ Commit: {commit}")

# ── STEP 4: Buat repo GitHub via API ─────────────────────────
print("\n" + "="*55)
print("Membuat repository GitHub via API...")

# Cek username
ur = subprocess.run([GH, "api", "user", "--jq", ".login"],
                    capture_output=True, text=True)
username = ur.stdout.strip()
print(f"Username: {username}")

# Hapus repo lama jika ada
subprocess.run([GH, "api", "-X", "DELETE",
                f"/repos/{username}/lautika-web"],
               capture_output=True)

# Buat repo baru
resp, status = gh_api("POST", "/user/repos", {
    "name":        "lautika-web",
    "description": "LAUTIKA Interactive Web - Media Pembelajaran Etnomatematika Sedekah Laut Cilacap",
    "private":     False,
    "auto_init":   False,
})

if status in (200, 201):
    repo_url = resp.get("clone_url", f"https://github.com/{username}/lautika-web.git")
    print(f"✓ Repository dibuat: {repo_url}")
elif status == 422 and "already exists" in str(resp):
    repo_url = f"https://github.com/{username}/lautika-web.git"
    print(f"✓ Repository sudah ada, pakai: {repo_url}")
else:
    print(f"ERROR {status}: {resp}")
    sys.exit(1)

# ── STEP 5: Push ke GitHub ────────────────────────────────────
# Pakai URL dengan token untuk auth otomatis
tr = subprocess.run([GH, "auth", "token"], capture_output=True, text=True)
token = tr.stdout.strip()
auth_url = repo_url.replace("https://", f"https://{username}:{token}@")

g("remote", "remove", "origin")
g("remote", "add", "origin", auth_url)

print("\nPushing ke GitHub...")
r = subprocess.run([GIT, "push", "-u", "origin", "main"], cwd=DIR)

if r.returncode == 0:
    clean_url = f"https://github.com/{username}/lautika-web"
    print("\n" + "="*60)
    print("✓ BERHASIL! Project sudah di GitHub!")
    print(f"  {clean_url}")
    print("="*60)
    print("\nLangkah terakhir — Deploy ke Render (1x klik):")
    print("  1. Browser akan terbuka ke Render.com")
    print("  2. Sign up/login dengan Google")
    print("  3. New + → Web Service → Connect GitHub")
    print(f"  4. Pilih repo: lautika-web")
    print("  5. Klik: Create Web Service")
    print("  6. Tunggu 3-5 menit")
    print(f"  7. URL: https://lautika-web.onrender.com")
    print()

    import webbrowser
    webbrowser.open("https://render.com")
else:
    print("\nERROR: Push gagal.")
    print("Coba jalankan manual di CMD:")
    print(f"  cd {DIR}")
    print(f"  git remote set-url origin {repo_url}")
    print(f"  git push -u origin main")
