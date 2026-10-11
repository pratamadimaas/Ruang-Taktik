# Ruang Taktik

Dashboard arketipe pemain lima liga top Eropa. React, Vite, dan Chart.js.

## Menjalankan

```bash
npm install
npm run dev
```

Buka alamat yang muncul di terminal (biasanya http://localhost:5173).

Data dibaca dari `public/football_dashboard.json`, yang sudah ada di repo. Untuk memperbarui data, jalankan notebook `Football_Player_2_musim.ipynb` di Google Colab sampai cell export, unduh `football_dashboard.json`, lalu timpa file di `public/`. Kalau file tidak ditemukan, dashboard menampilkan langkah ini.

## Deploy ke Vercel

Push ke GitHub, lalu import repo di Vercel. Pengaturan default Vite sudah cukup.

## Struktur

```
public/
  cover.jpg                  gambar hero
  favicon.svg
  football_dashboard.json    data hasil export notebook
src/
  App.jsx                    header, navigasi, pemuatan data
  styles.css                 warna, tipografi, layout
  lib/data.js                pemuatan JSON, label, warna arketipe, persentil
  components/                ChartBox, Pitch (lapangan), Logo, Ui
  pages/                     Ringkasan, Pemain, Klub, Metodologi
```

## Mengubah tampilan

- Warna ada di bagian atas `src/styles.css` (`--kop`, `--sky`, `--grass`, dan lainnya).
- Font Barlow dan Barlow Condensed di-host sendiri lewat `@fontsource`, diimpor di `src/main.jsx`.
- Warna tiap arketipe ada di `WARNA_ARKETIPE` pada `src/lib/data.js`. Kalau nama arketipe di notebook diubah, sesuaikan juga di sini.
