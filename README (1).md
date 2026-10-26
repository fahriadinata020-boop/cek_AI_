# Asisten Laporan Akademik

Situs statis (`index.html`) untuk GitHub Pages, plus `worker.js` opsional untuk mengaktifkan Claude.

## 1. Deploy situs ke GitHub Pages
1. Buat repo baru, unggah `index.html` dan `.nojekyll` ke root.
2. Settings > Pages > Deploy from a branch > `main` / `(root)` > Save.
3. Situs ada di `https://USERNAME.github.io/NAMA-REPO/`.

## 2. Aktifkan Claude (penilaian AI, parafrase, OCR)
Buka menu **Pengaturan** di aplikasi. Biaya dibayar per pemakaian lewat kunci dari console.anthropic.com (terpisah dari langganan Claude).

**A. Kunci pribadi (untuk dipakai sendiri).** Pilih "Kunci API pribadi", tempel kunci, Simpan, Tes koneksi. Kunci hanya tersimpan di browser itu. Pasang batas pengeluaran bulanan di console.

**B. Proxy Cloudflare Worker (untuk dibagikan).**
1. Daftar di cloudflare.com, lalu Workers & Pages > Create > Hello World > Deploy.
2. Edit code, ganti isinya dengan `worker.js`, Deploy.
3. Settings > Variables and Secrets: tambah Secret `ANTHROPIC_API_KEY` dan Text `ALLOWED_ORIGIN` = `https://USERNAME.github.io` (tanpa path).
4. Di aplikasi: Pengaturan > Proxy, isi alamat `https://....workers.dev`, Simpan, Tes koneksi.

Catatan keamanan proxy: pemeriksaan Origin hanya menghentikan situs lain di browser. Orang yang memanggil Worker lewat skrip bisa memalsukan header itu. Pembatas 30 permintaan per menit per IP bersifat perkiraan. Karena itu tetap pasang batas pengeluaran di console Anthropic dan jangan sebarkan alamat Worker secara luas.

## 3. Detektor eksternal (Sapling, GPTZero)
Butuh `server.js` lokal (`node server.js`, salin `index.html` menjadi `app.html`). Kunci di `.env`, tidak untuk GitHub.
