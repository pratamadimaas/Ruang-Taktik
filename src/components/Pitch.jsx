import { useState } from "react";
import { namaPendek } from "../lib/data";

const W = 680;
const H = 1000;
const BARIS_Y = { FW: 200, MF: 440, DF: 690 };

const TARGET = { FW: 3, MF: 3, DF: 4 };
const URUT_BARIS = ["FW", "MF", "DF"];

/**
 * Susun koordinat pemain XI (4-3-3 menghadap ke atas).
 * Kalau satu lini kelebihan pemain (misalnya 5 gelandang dan 1 penyerang),
 * pemain dipindah ke lini tetangga yang kekurangan, dipilih yang gaya mainnya paling cocok.
 */
function susunPosisi(xi, tukar = []) {
  const baris = { FW: [], MF: [], DF: [] };
  for (const p of xi) (baris[p.posisi_utama] || baris.MF).push(p);

  const skorUntuk = (p, tujuan) =>
    tujuan === "FW" ? p.dimensi.Penyelesaian : tujuan === "DF" ? p.dimensi.Bertahan : p.dimensi.Kreasi;

  for (let guard = 0; guard < 10; guard++) {
    const lebih = URUT_BARIS.find((r) => baris[r].length > TARGET[r]);
    if (!lebih) break;
    const i = URUT_BARIS.indexOf(lebih);
    const tetangga = [URUT_BARIS[i - 1], URUT_BARIS[i + 1]].filter(Boolean);
    const tujuan = tetangga.find((r) => baris[r].length < TARGET[r])
      ?? URUT_BARIS.find((r) => baris[r].length < TARGET[r]);
    if (!tujuan) break;
    baris[lebih].sort((a, b) => skorUntuk(b, tujuan) - skorUntuk(a, tujuan));
    baris[tujuan].push(baris[lebih].shift());
  }

  const pos = new Map();
  for (const [row, list] of Object.entries(baris)) {
    const n = list.length;
    const margin = n >= 4 ? 90 : 140;
    urutSayap(list).forEach((p, i) => {
      const x = n === 1 ? W / 2 : margin + (i * (W - 2 * margin)) / (n - 1);
      pos.set(p.id, { x, y: BARIS_Y[row] });
    });
  }

  // tukar posisi yang diatur manual oleh pengguna
  for (const [a, b] of tukar) {
    const pa = pos.get(a);
    const pb = pos.get(b);
    if (pa && pb) { pos.set(a, pb); pos.set(b, pa); }
  }
  return pos;
}

/**
 * Dataset tidak mencatat sisi kiri/kanan. Sebagai tebakan awal, pemain dengan
 * umpan silang terbanyak ditaruh di sisi luar (bek sayap, winger), yang paling sedikit di tengah.
 */
function urutSayap(list) {
  const urut = [...list].sort((a, b) => (b.statistik?.Crs_p90 ?? 0) - (a.statistik?.Crs_p90 ?? 0));
  const hasil = new Array(list.length);
  let kiri = 0;
  let kanan = list.length - 1;
  urut.forEach((p, i) => {
    if (i % 2 === 0) hasil[kiri++] = p;
    else hasil[kanan--] = p;
  });
  return hasil;
}

export default function Pitch({ xi, kiper, duet, aktifDuet, setAktifDuet, warna, onPilih, baru = new Set(), tukar = [], terpilih = null, modeAtur = false }) {
  const [hoverId, setHoverId] = useState(null);
  const pos = susunPosisi(xi, tukar);

  // cari titik di sepanjang garis yang tidak menabrak pemain atau nomor duet lain
  const badges = [];
  duet.forEach((d, i) => {
    const a = pos.get(d.a);
    const b = pos.get(d.b);
    if (!a || !b) return;
    const titik = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82].map((t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }));
    const bebas = (c) =>
      // hindari lingkaran pemain beserta label namanya di bawahnya
      [...pos.values()].every((n) => Math.abs(n.x - c.x) > 75 || c.y < n.y - 55 || c.y > n.y + 100) &&
      badges.every((o) => Math.hypot(o.x - c.x, o.y - c.y) > 40);
    const pilih = titik.find(bebas) ?? titik[0];
    badges.push({ i, ...pilih });
  });

  const garisTerkait = (d) => hoverId != null && (d.a === hoverId || d.b === hoverId);

  return (
    <svg className="pitch" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Susunan pemain di lapangan dengan garis duet terbaik">
      <defs>
        <pattern id="stripe" width={W} height="100" patternUnits="userSpaceOnUse">
          <rect width={W} height="50" fill="var(--grass)" />
          <rect y="50" width={W} height="50" fill="var(--grass-2)" />
        </pattern>
      </defs>
      <rect width={W} height={H} rx="14" fill="url(#stripe)" />

      {/* garis lapangan */}
      <g fill="none" stroke="#F1EFE8" strokeOpacity=".55" strokeWidth="3">
        <rect x="30" y="30" width={W - 60} height={H - 60} />
        <line x1="30" y1={H / 2} x2={W - 30} y2={H / 2} />
        <circle cx={W / 2} cy={H / 2} r="80" />
        <rect x={W / 2 - 170} y="30" width="340" height="150" />
        <rect x={W / 2 - 75} y="30" width="150" height="55" />
        <rect x={W / 2 - 170} y={H - 180} width="340" height="150" />
        <rect x={W / 2 - 75} y={H - 85} width="150" height="55" />
        <path d={`M ${W / 2 - 70} 180 A 90 90 0 0 0 ${W / 2 + 70} 180`} />
        <path d={`M ${W / 2 - 70} ${H - 180} A 90 90 0 0 1 ${W / 2 + 70} ${H - 180}`} />
      </g>
      <circle cx={W / 2} cy={H / 2} r="5" fill="#F1EFE8" fillOpacity=".6" />

      {/* garis duet */}
      {duet.map((d, i) => {
        const a = pos.get(d.a);
        const b = pos.get(d.b);
        if (!a || !b) return null;
        const on = aktifDuet === i || garisTerkait(d);
        const redup = (aktifDuet != null || hoverId != null) && !on;
        return (
          <line key={i} className="duet-line" x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--kop)"
            strokeWidth={on ? 9 : 7 - i} strokeLinecap="round" opacity={redup ? 0.18 : on ? 1 : 0.85}
            onMouseEnter={() => setAktifDuet(i)} onMouseLeave={() => setAktifDuet(null)} />
        );
      })}

      {/* pemain */}
      {xi.map((p) => {
        const c = pos.get(p.id);
        if (!c) return null;
        const label = namaPendek(p.nama);
        const panjang = label.length > 9;
        const lebar = Math.max(84, label.length * (panjang ? 11 : 13) + 24);
        return (
          <g key={p.id} className={"node" + (modeAtur ? " atur" : "")} transform={`translate(${c.x} ${c.y})`} tabIndex={0} role="button"
            aria-label={modeAtur ? `${p.nama}. Pilih untuk ditukar posisinya` : `${p.nama}, ${p.arketipe}. Buka profil`}
            onMouseEnter={() => setHoverId(p.id)} onMouseLeave={() => setHoverId(null)}
            onFocus={() => setHoverId(p.id)} onBlur={() => setHoverId(null)}
            onClick={() => onPilih(p.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPilih(p.id); } }}>
            {terpilih === p.id && <circle r="48" fill="var(--gold)" fillOpacity=".25" stroke="var(--gold)" strokeWidth="5" />}
            {baru.has(p.id) && <circle r="43" fill="none" stroke="var(--sky)" strokeWidth="4" strokeDasharray="7 5" />}
            <circle r="34" fill={warna(p.arketipe)} stroke="#F1EFE8" strokeWidth="4" />
            <text textAnchor="middle" dy="9" className="node-pos">{p.posisi_utama}</text>
            <rect x={-lebar / 2} y="44" width={lebar} height="34" rx="4" fill="#0E1A2C" fillOpacity=".88" />
            <text textAnchor="middle" y="68" className={"node-name" + (panjang ? " long" : "")}>{label}</text>
          </g>
        );
      })}

      {/* nomor duet, digambar paling atas dan digeser supaya tidak saling menumpuk */}
      {badges.map(({ i, x, y }) => {
        const d = duet[i];
        const on = aktifDuet === i || garisTerkait(d);
        const redup = (aktifDuet != null || hoverId != null) && !on;
        return (
          <g key={"b" + i} transform={`translate(${x} ${y})`} opacity={redup ? 0.3 : 1} className="duet-line"
            onMouseEnter={() => setAktifDuet(i)} onMouseLeave={() => setAktifDuet(null)}>
            <circle r="17" fill="var(--kop)" stroke="#F1EFE8" strokeWidth="2.5" />
            <text textAnchor="middle" dy="6" className="duet-num">{i + 1}</text>
          </g>
        );
      })}

      {/* kiper (tidak ada statistik outfield) */}
      <g transform={`translate(${W / 2} ${H - 110})`}>
        <circle r="30" fill="#DDE3EA" stroke="#F1EFE8" strokeWidth="4" />
        <text textAnchor="middle" dy="8" className="node-pos dark">GK</text>
        {kiper && (
          <>
            <rect x={-Math.max(84, namaPendek(kiper).length * 13 + 26) / 2} y="40" width={Math.max(84, namaPendek(kiper).length * 13 + 26)} height="34" rx="4" fill="#0E1A2C" fillOpacity=".88" />
            <text textAnchor="middle" y="64" className="node-name">{namaPendek(kiper)}</text>
          </>
        )}
      </g>
    </svg>
  );
}