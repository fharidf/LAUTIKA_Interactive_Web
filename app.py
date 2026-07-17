"""
LAUTIKA Interactive Web — Flask Production App
===============================================
Local  : python mulai.py
Deploy : gunicorn app:app  (Render / Railway / PythonAnywhere)
"""
import os, json, time
from flask import (Flask, render_template, jsonify,
                   send_from_directory, request, make_response, redirect)
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── Secret key ────────────────────────────────────────────────
app.secret_key = os.environ.get("SECRET_KEY", "lautika-change-in-production")

# ── Paths ─────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")


# ── HTTPS redirect (production only) ─────────────────────────
@app.before_request
def force_https():
    if os.environ.get("FLASK_ENV") == "production":
        proto = request.headers.get("X-Forwarded-Proto", "http")
        if proto == "http":
            return redirect(request.url.replace("http://", "https://", 1), 301)


# ── Security + Cache headers ──────────────────────────────────
@app.after_request
def add_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"]        = "SAMEORIGIN"
    response.headers["X-XSS-Protection"]       = "1; mode=block"
    response.headers["Referrer-Policy"]        = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"]     = "camera=(), microphone=(), geolocation=()"
    # Long cache for static assets, no-cache for HTML
    if request.path.startswith("/static/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    elif request.path.startswith("/api/"):
        response.headers["Cache-Control"] = "public, max-age=60"
    else:
        response.headers["Cache-Control"] = "no-cache, must-revalidate"
    return response


# ── Data loader ───────────────────────────────────────────────
def load_materi(slug):
    slug = slug.replace("..", "").replace("/", "").replace("\\", "")
    path = os.path.join(DATA_DIR, f"{slug}.json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return None


# ── Materi list ───────────────────────────────────────────────
MATERI_LIST = [
    {
        "slug": "jolen", "nomor": 1, "judul": "Jolen",
        "ikon": "🪣", "warna": "#FFD54F",
        "deskripsi": "Tempat sesaji dalam Tradisi Sedekah Laut",
        "geometri": "Balok + Limas Segi Empat",
    },
    {
        "slug": "tumpeng", "nomor": 2, "judul": "Tumpeng",
        "ikon": "🏔️", "warna": "#00BFA5",
        "deskripsi": "Sesaji berbentuk kerucut dalam prosesi larung",
        "geometri": "Kerucut",
    },
    {
        "slug": "perahu_nelayan", "nomor": 3, "judul": "Perahu Nelayan",
        "ikon": "⛵", "warna": "#29B6F6",
        "deskripsi": "Sarana utama prosesi Sedekah Laut",
        "geometri": "Trapesium, Segitiga, Persegi Panjang, Balok, Tabung",
    },
    {
        "slug": "layar_perahu", "nomor": 4, "judul": "Layar Perahu",
        "ikon": "🔺", "warna": "#FF7043",
        "deskripsi": "Layar berbentuk segitiga pada perahu nelayan",
        "geometri": "Segitiga",
    },
    {
        "slug": "jaring_nelayan", "nomor": 5, "judul": "Jaring Nelayan",
        "ikon": "🕸️", "warna": "#66BB6A",
        "deskripsi": "Alat tangkap ikan dengan pola geometri berulang",
        "geometri": "Pola Geometri, Teselasi, Transformasi",
    },
]


# ── Routes ────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html", materi_list=MATERI_LIST)


@app.route("/materi/<slug>")
def materi(slug):
    found = next((m for m in MATERI_LIST if m["slug"] == slug), None)
    if not found:
        return render_template("404.html", materi_list=MATERI_LIST), 404
    data = load_materi(slug)
    idx  = MATERI_LIST.index(found)
    return render_template(
        "materi.html",
        m=found,
        data=data,
        materi_list=MATERI_LIST,
        prev_materi=MATERI_LIST[idx - 1] if idx > 0 else None,
        next_materi=MATERI_LIST[idx + 1] if idx < len(MATERI_LIST) - 1 else None,
    )


# ── API ───────────────────────────────────────────────────────
@app.route("/api/materi")
def api_all():
    return jsonify(MATERI_LIST)


@app.route("/api/materi/<slug>")
def api_materi(slug):
    data = load_materi(slug)
    if data is None:
        return jsonify({"error": "not found"}), 404
    return jsonify(data)


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "ts": int(time.time())})


# ── PWA: manifest ─────────────────────────────────────────────
@app.route("/static/manifest.json")
def manifest():
    manifest_path = os.path.join(BASE_DIR, "static")
    r = make_response(send_from_directory(manifest_path, "manifest.json"))
    r.headers["Content-Type"] = "application/manifest+json"
    r.headers["Cache-Control"] = "public, max-age=86400"
    return r


# ── PWA: service worker ───────────────────────────────────────
@app.route("/sw.js")
def service_worker():
    sw_path = os.path.join(BASE_DIR, "static", "js")
    r = make_response(send_from_directory(sw_path, "sw.js"))
    r.headers["Service-Worker-Allowed"] = "/"
    r.headers["Content-Type"]           = "application/javascript"
    r.headers["Cache-Control"]          = "no-cache, must-revalidate"
    return r


# ── Error handlers ────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return render_template("404.html", materi_list=MATERI_LIST), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "internal server error"}), 500


# ── Local dev entry point ─────────────────────────────────────
if __name__ == "__main__":
    port  = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV", "development") != "production"
    print(f"\n{'='*50}")
    print(f"  LAUTIKA — http://localhost:{port}")
    print(f"{'='*50}\n")
    app.run(debug=debug, host="0.0.0.0", port=port)
