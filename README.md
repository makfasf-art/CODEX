# NEON CODE X (CODEX CX prjct)

Generator kode dinamis: AI (OpenAI API) menulis kode dari instruksimu, bukan dari template.
Bisa membuat project baru (HTML/CSS/JS, Python, Java, C++, dll.), memperbaiki, menjelaskan, mencari bug, dan mengembangkan project yang ada.

## Struktur
```
server.js            backend Express: /api/status, /api/generate (streaming SSE)
public/              frontend (dipakai web & APK)
  index.html style.css app.js highlight.js config.js logo.png
assets/logo.png      sumber ikon APK
capacitor.config.json  scripts/build-apk.sh  .github/workflows/android-debug.yml
.env.example  package.json
```

## Jalankan
1. `npm install`
2. `cp .env.example .env`, isi `OPENAI_API_KEY` dan `OPENAI_MODEL` (model yang ada di akun OpenAI-mu).
3. `npm start`, buka http://localhost:3000

API key hanya dibaca backend dari environment variable. Tanpa key, aplikasi menampilkan langkah konfigurasi, bukan kode palsu.

## Fitur
- Streaming output, tombol Stop, status loading, pesan error API, hitungan mundur batas penggunaan, tombol Coba lagi
- Mode: Buat, Kembangkan, Perbaiki, Cari bug, Jelaskan
- Editor dengan syntax highlighting, Salin, Unduh (file tunggal atau ZIP), Preview HTML/SVG (CSS/JS antar file digabung otomatis)
- Riwayat project (chat + file) tersimpan di localStorage

## Debug APK
APK hanyalah cangkang (Capacitor) untuk UI. Backend + API key tetap di server.
1. Deploy/jalankan backend yang bisa dijangkau HP. Isi `ALLOWED_ORIGINS` (mis. `http://localhost`).
2. **GitHub Actions (tanpa install apa pun):** push repo, tab Actions, Build Debug APK, Run workflow, unduh artifact `app-debug.apk`. Opsional: variabel repo `API_BASE_URL` = alamat backend.
3. **Lokal:** `npm run apk` (butuh JDK 17 + Android SDK). Hasil: `android/app/build/outputs/apk/debug/app-debug.apk`.
4. Di aplikasi: Atur > isi alamat server > Tes koneksi.
