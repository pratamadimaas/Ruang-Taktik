# Ruang Taktik

Dashboard arketipe pemain liga top Eropa (React + Vite + Chart.js).

## Cara menjalankan

1. Jalankan notebook `Football_Player_2_musim.ipynb` di Google Colab sampai cell export, lalu unduh `football_dashboard.json`. File JSON versi terbaru sudah disertakan di folder `public/`.
2. Salin file itu ke folder `public/` (sejajar dengan `cover.jpg`).
3. Jalankan:

```bash
npm install
npm run dev
```

Buka alamat yang muncul di terminal (biasanya http://localhost:5173).

Kalau file JSON belum ada, dashboard akan menampilkan petunjuk langkah di atas.

## Deploy ke Vercel

Push ke GitHub (pastikan `public/football_dashboard.json` ikut ter-commit), lalu import repo di Vercel. Pengaturan default Vite sudah cukup.

## Struktur

```
public/
  cover.jpg                  gambar hero
  football_dashboard.json    data dari Colab (tambahkan sendiri)
src/
  App.jsx                    header, navigasi, dan pemuatan data
  styles.css                 warna, tipografi, layout
  lib/data.js                pemuatan JSON, label, warna arketipe, persentil
  components/                ChartBox, Pitch (lapangan), Logo, Ui
  pages/                     Ringkasan, Pemain, Klub, Metodologi
```

## Mengubah tampilan

- Warna utama ada di bagian atas `src/styles.css` (`--kop`, `--sky`, `--grass`, dan lainnya).
- Warna tiap arketipe ada di `WARNA_ARKETIPE` pada `src/lib/data.js`. Kalau nama arketipe di notebook diubah, sesuaikan juga di sini.
