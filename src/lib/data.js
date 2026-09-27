import { useEffect, useState } from "react";

/* Lokasi file JSON hasil export dari Google Colab (taruh di folder public/) */
export const DATA_URL = "/football_dashboard.json";

/* ---------- Label yang dipakai di UI ---------- */
export const STAT_LABEL = {
  Gls_p90: "Gol",
  Ast_p90: "Assist",
  Sh_p90: "Tembakan",
  SoT_p90: "Tembakan tepat sasaran",
  Crs_p90: "Umpan silang",
  TklW_p90: "Tekel sukses",
  Int_p90: "Intersep",
  Fld_p90: "Dilanggar lawan",
  Fls_p90: "Melakukan pelanggaran",
  CrdY_p90: "Kartu kuning",
  "SoT%": "Akurasi tembakan",
};
/* nama kolom mentah dari dataset (dipakai di fitur penting klasifikasi) */
Object.assign(STAT_LABEL, {
  Gls: "Gol", Ast: "Assist", "G+A": "Gol + assist", "G-PK": "Gol non-penalti", "G+A-PK": "Gol + assist non-penalti",
  PK: "Gol penalti", PKatt: "Percobaan penalti", Sh: "Tembakan", SoT: "Tembakan tepat sasaran",
  "Sh/90": "Tembakan per 90", "SoT/90": "Tepat sasaran per 90", "G/Sh": "Gol per tembakan", "G/SoT": "Gol per tepat sasaran",
  Crs: "Umpan silang", TklW: "Tekel sukses", Int: "Intersep", Fld: "Dilanggar lawan", Fls: "Melakukan pelanggaran",
  CrdY: "Kartu kuning", CrdR: "Kartu merah", OG: "Gol bunuh diri", Age: "Usia", MP: "Jumlah main", Starts: "Jadi starter",
  Min: "Menit main", "90s": "Jumlah 90 menit", GA: "Kebobolan", GA90: "Kebobolan per 90", SoTA: "Tembakan diterima",
  Saves: "Penyelamatan", "Save%": "Persentase penyelamatan", CS: "Clean sheet", "CS%": "Persentase clean sheet",
  W: "Menang", D: "Seri", L: "Kalah", PKA: "Penalti kebobolan", PKsv: "Penalti diselamatkan", PKm: "Penalti meleset",
});

export const STAT_SHORT = {
  Gls_p90: "Gol", Ast_p90: "Assist", Sh_p90: "Tembakan", SoT_p90: "On target", Crs_p90: "Crossing",
  TklW_p90: "Tekel", Int_p90: "Intersep", Fld_p90: "Dilanggar", Fls_p90: "Pelanggaran",
  CrdY_p90: "Kartu", "SoT%": "Akurasi",
};
/* statistik yang makin kecil makin baik */
export const STAT_TERBALIK = new Set(["CrdY_p90", "Fls_p90"]);

export const POSISI_LABEL = { DF: "Bek", MF: "Gelandang", FW: "Penyerang", GK: "Kiper" };

export const DIMENSI_KET = {
  Penyelesaian: "Gol, tembakan, dan tembakan tepat sasaran",
  Kreasi: "Assist dan umpan silang",
  Bertahan: "Tekel sukses dan intersep",
  Duel: "Dilanggar lawan dan melakukan pelanggaran",
  Disiplin: "Semakin jarang kartu kuning, semakin tinggi",
};

/* ---------- Warna arketipe ---------- */
const WARNA_ARKETIPE = {
  "Elite Finisher": "#E8473B",
  "Wide Attacker (Volume Tinggi)": "#F28C28",
  "Playmaker Kreatif": "#F2C14E",
  "Destroyer Agresif": "#C65B9E",
  "Perebut Bola": "#6CABDD",
  "Pemain Posisional": "#8497B0",
  "Bek Disiplin": "#6CABDD",
  "Bek Pasif/Dalam": "#8497B0",
};
const CADANGAN = ["#E8473B", "#F28C28", "#F2C14E", "#C65B9E", "#6CABDD", "#8497B0", "#4FB286", "#B9A4E8"];

export function warnaArketipe(nama, daftar = []) {
  if (WARNA_ARKETIPE[nama]) return WARNA_ARKETIPE[nama];
  const i = Math.max(0, daftar.indexOf(nama));
  return CADANGAN[i % CADANGAN.length];
}

/* ---------- Format angka ---------- */
export const nf = (v, d = 0) =>
  v == null || Number.isNaN(v)
    ? "-"
    : Number(v).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d });

export function namaPendek(nama) {
  if (!nama) return "";
  const p = nama.trim().split(/\s+/);
  if (p.length === 1) return p[0];
  const akhir = p[p.length - 1];
  // "Vinicius Júnior", "Cristian Cásseres Jr." lebih dikenal dengan nama depan/tengah
  if (/^(j[uú]nior|jr\.?|filho|neto|ii|iii)$/i.test(akhir)) return p[p.length - 2];
  return akhir;
}

/** Teks musim, cocok untuk JSON lama ("2026-2027") maupun baru ("2025/26 dan 2026/27") */
export const teksMusim = (meta) => (meta?.musim ?? "").replace(/^(\d{4})-(\d{4})$/, "$1/$2");

/** Label asal-usul pemain untuk musim ini */
export function statusTransfer(p) {
  if (p.pindah_klub && p.klub_musim_lalu) return `Pindah dari ${p.klub_musim_lalu}`;
  if (p.pemain_baru) return "Baru di lima liga";
  return null;
}

export const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/* ---------- Muat dan olah data ---------- */
function olah(raw) {
  const pemain = raw.pemain;
  const byId = new Map(pemain.map((p) => [p.id, p]));
  const namaArketipe = raw.arketipe.map((a) => a.nama);
  const arketipe = raw.arketipe.map((a) => ({ ...a, warna: warnaArketipe(a.nama, namaArketipe) }));
  const arketipeMap = new Map(arketipe.map((a) => [a.nama, a]));

  // persentil per statistik, dihitung di browser dari seluruh pemain
  const fitur = raw.meta.fitur;
  const urut = {};
  for (const f of fitur) {
    urut[f] = pemain.map((p) => p.statistik[f] ?? 0).sort((a, b) => a - b);
  }
  const persentil = (f, v) => {
    const arr = urut[f];
    let lo = 0, hi = arr.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] <= (v ?? 0)) lo = m + 1; else hi = m; }
    const p = (lo / arr.length) * 100;
    return STAT_TERBALIK.has(f) ? 100 - p : p;
  };

  const klub = Object.entries(raw.klub)
    .map(([nama, k]) => ({ nama, ...k }))
    .sort((a, b) => a.liga.localeCompare(b.liga) || a.nama.localeCompare(b.nama));
  const klubMap = new Map(klub.map((k) => [k.nama, k]));

  // rata-rata keseimbangan XI per liga, untuk pembanding di halaman klub
  const rataLiga = {};
  for (const liga of raw.meta.liga) {
    const ks = klub.filter((k) => k.liga === liga);
    rataLiga[liga] = Object.fromEntries(
      raw.meta.dimensi.map((d) => [d, ks.reduce((s, k) => s + k.keseimbangan[d], 0) / (ks.length || 1)])
    );
  }

  return { ...raw, pemain, byId, arketipe, arketipeMap, klub, klubMap, persentil, rataLiga };
}

export function useData() {
  const [state, setState] = useState({ status: "loading" });
  useEffect(() => {
    let batal = false;
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`File ${DATA_URL} tidak ditemukan (status ${r.status})`);
        return r.json();
      })
      .then((raw) => { if (!batal) setState({ status: "ready", data: olah(raw) }); })
      .catch((e) => { if (!batal) setState({ status: "error", error: e.message }); });
    return () => { batal = true; };
  }, []);
  return state;
}
