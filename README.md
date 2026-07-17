# LAUTIKA Interactive Web

**Learning Box Etnomatematika** — Media Pembelajaran Matematika berbasis Tradisi Sedekah Laut Kabupaten Cilacap.

> Website produksi dengan URL HTTPS permanen, dapat diakses dari seluruh perangkat dan jaringan internet tanpa perlu menjalankan server lokal.

---

## 🌐 Cara Deploy ke Render.com (URL Permanen, GRATIS)

Ikuti langkah ini **satu kali**. Setelah selesai, website aktif selamanya tanpa perlu komputer menyala.

---

### LANGKAH 1 — Install Git

1. Buka: **https://git-scm.com/download/win**
2. Download installer → jalankan → klik Next terus → Finish
3. Buka **Command Prompt** baru, ketik: `git --version`
   Jika muncul versi → Git berhasil terinstal ✓

---

### LANGKAH 2 — Buat Akun GitHub (jika belum punya)

1. Buka: **https://github.com**
2. Klik **Sign up** → isi email, password, username → verifikasi email

---

### LANGKAH 3 — Upload Project ke GitHub

Buka **Command Prompt** → masuk ke folder project:

```
cd d:\kiro\LAUTIKA_Interactive_Web
```

Jalankan perintah berikut **satu per satu**:

```
git init
git add .
git commit -m "LAUTIKA Web - Production"
```

Buat repository di GitHub:
1. Buka: **https://github.com/new**
2. Repository name: `lautika-web`
3. Pilih: **Public**
4. Klik: **Create repository**

Di halaman yang muncul, salin dan jalankan dua perintah yang tertera (bentuknya seperti ini):

```
git remote add origin https://github.com/NAMAMU/lautika-web.git
git branch -M main
git push -u origin main
```

> Ganti `NAMAMU` dengan username GitHub kamu.

---

### LANGKAH 4 — Deploy ke Render.com

1. Buka: **https://render.com**
2. Klik **Get Started for Free** → daftar pakai akun Google atau email
3. Setelah masuk, klik **New +** → pilih **Web Service**
4. Klik **Connect GitHub** → authorize Render
5. Pilih repository **lautika-web**
6. Render otomatis mendeteksi konfigurasi dari `render.yaml`
7. Klik **Create Web Service**
8. Tunggu **3–5 menit** proses build

**URL kamu akan menjadi:**
```
https://lautika-web.onrender.com
```

---

### Setelah Deploy Selesai

- ✅ Website aktif 24 jam, 7 hari seminggu
- ✅ HTTPS otomatis (tidak ada peringatan "not secure")
- ✅ URL tidak berubah
- ✅ Bisa dibuka dari HP, tablet, laptop, dari jaringan mana saja
- ✅ Tidak perlu komputer kamu menyala
- ✅ Update otomatis saat kamu push ke GitHub

---

### Jika Ingin Update Konten

Edit file di folder ini, lalu:

```
git add .
git commit -m "Update materi"
git push
```

Render otomatis rebuild dan deploy dalam 2–3 menit.

---

## 🚀 Menjalankan Secara Lokal (Development)

```bash
pip install -r requirements.txt
python mulai.py
```

Buka: http://localhost:5000

---

## 📁 Struktur Project

```
LAUTIKA_Interactive_Web/
├── app.py               ← Flask backend (production-ready)
├── mulai.py             ← Local dev launcher
├── requirements.txt     ← Dependensi Python (pinned)
├── Procfile             ← Gunicorn command untuk Render/Railway
├── render.yaml          ← Konfigurasi Render.com
├── runtime.txt          ← Versi Python
├── .gitignore
├── README.md
├── data/
│   ├── jolen.json
│   ├── tumpeng.json
│   ├── perahu_nelayan.json
│   ├── layar_perahu.json
│   └── jaring_nelayan.json
├── templates/
│   ├── base.html        ← Layout induk
│   ├── index.html       ← Beranda
│   ├── materi.html      ← Halaman materi
│   └── 404.html
└── static/
    ├── css/style.css
    ├── js/
    │   ├── main.js
    │   ├── viewer3d.js
    │   └── sw.js        ← Service Worker (PWA)
    ├── manifest.json    ← PWA manifest
    └── img/             ← Icons PWA
```

---

## 🛠️ Teknologi

| Komponen        | Teknologi              |
|-----------------|------------------------|
| Backend         | Python Flask 3.x       |
| Production WSGI | Gunicorn               |
| 3D Viewer       | Three.js 0.160         |
| Rumus           | KaTeX 0.16.9           |
| PWA             | Web Manifest + SW      |
| Hosting         | Render.com (free)      |
| CDN             | jsDelivr               |

---

## 🌍 Kompatibilitas

| Perangkat     | Status |
|---------------|--------|
| Android       | ✅     |
| iPhone/iPad   | ✅     |
| Laptop Win    | ✅     |
| Laptop Mac    | ✅     |
| Desktop       | ✅     |
| Tablet        | ✅     |

| Browser        | Status |
|----------------|--------|
| Chrome         | ✅     |
| Firefox        | ✅     |
| Safari         | ✅     |
| Edge           | ✅     |
| Samsung Internet| ✅    |
| Opera          | ✅     |

---

## 📱 Materi Tersedia

1. **Jolen** — Balok + Limas Segi Empat
2. **Tumpeng** — Kerucut
3. **Perahu Nelayan** — Trapesium, Segitiga, Persegi Panjang, Balok, Tabung
4. **Layar Perahu** — Segitiga
5. **Jaring Nelayan** — Teselasi, Transformasi Geometri

Setiap materi memiliki: Visualisasi 3D interaktif · Simulasi slider · Rumus KaTeX · Latihan · Quiz

---

*LAUTIKA — Learning Box Etnomatematika · Tradisi Sedekah Laut Kabupaten Cilacap*
