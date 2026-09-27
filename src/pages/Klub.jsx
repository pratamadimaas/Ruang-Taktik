import { useEffect, useMemo, useState } from "react";
import { nf, POSISI_LABEL, statusTransfer } from "../lib/data";
import Pitch from "../components/Pitch";
import { SectionHead, DimBars, Select } from "../components/Ui";

export default function Klub({ data, namaKlub, setNamaKlub, bukaPemain }) {
  const k = data.klubMap.get(namaKlub) ?? data.klub[0];
  const liga = k.liga;
  const [aktifDuet, setAktifDuet] = useState(null);

  // ---- atur posisi manual (tersimpan di browser per klub) ----
  const kunciSimpan = `susunan:${k.nama}`;
  const [modeAtur, setModeAtur] = useState(false);
  const [terpilih, setTerpilih] = useState(null);
  const [tukar, setTukar] = useState([]);

  useEffect(() => {
    try { setTukar(JSON.parse(localStorage.getItem(kunciSimpan)) ?? []); } catch { setTukar([]); }
    setTerpilih(null);
    setModeAtur(false);
  }, [kunciSimpan]);

  const simpanTukar = (baru) => {
    setTukar(baru);
    try { localStorage.setItem(kunciSimpan, JSON.stringify(baru)); } catch { /* storage penuh atau diblokir */ }
  };

  const klikPemain = (id) => {
    if (!modeAtur) return bukaPemain(id);
    if (terpilih == null) return setTerpilih(id);
    if (terpilih === id) return setTerpilih(null);
    simpanTukar([...tukar, [terpilih, id]]);
    setTerpilih(null);
  };

  const klubLiga = data.klub.filter((x) => x.liga === liga);
  const xi = k.xi.map((id) => data.byId.get(id)).filter(Boolean);
  const warna = (nama) => data.arketipeMap.get(nama)?.warna ?? "#8497B0";

  const cadangan = useMemo(
    () => data.pemain.filter((p) => p.klub === k.nama && !k.xi.includes(p.id))
      .sort((a, b) => (b.menit_musim_ini ?? b.main_90) - (a.menit_musim_ini ?? a.main_90)),
    [data.pemain, k]
  );

  const gantiLiga = (l) => {
    const pertama = data.klub.find((x) => x.liga === l);
    if (pertama) setNamaKlub(pertama.nama);
  };

  const rekrutan = (k.rekrutan ?? []).map((id) => data.byId.get(id)).filter(Boolean);
  const rekrutanSet = new Set(k.rekrutan ?? []);

  const dimTerkuat = Object.entries(k.keseimbangan)
    .filter(([d]) => data.meta.dimensi_inti.includes(d))
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="page">
      <div className="club-bar">
        <Select label="Liga" value={liga} onChange={gantiLiga} options={data.meta.liga} all={null} />
        <Select label="Klub" value={k.nama} onChange={(v) => { setNamaKlub(v); setAktifDuet(null); }} options={klubLiga.map((x) => x.nama)} all={null} />
      </div>

      <header className="club-head">
        <h1>{k.nama}</h1>
        <p>
          {k.liga}, formasi {data.meta.formasi}. Tim ini paling menonjol di <b>{dimTerkuat[0][0].toLowerCase()}</b> dan
          paling lemah di <b>{dimTerkuat[dimTerkuat.length - 1][0].toLowerCase()}</b>.
        </p>
      </header>

      <div className="club-grid">
        <section className="pitch-wrap">
          <div className="pitch-tools">
            <button className={"btn" + (modeAtur ? " on" : "")} onClick={() => { setModeAtur((m) => !m); setTerpilih(null); }}>
              {modeAtur ? "Selesai mengatur" : "Atur posisi"}
            </button>
            {tukar.length > 0 && <button className="btn ghost" onClick={() => simpanTukar([])}>Kembalikan susunan awal</button>}
          </div>
          {modeAtur && (
            <p className="tool-hint" role="status">
              {terpilih == null ? "Ketuk pemain pertama yang ingin dipindah." : `Sekarang ketuk pemain yang ingin ditukar dengan ${data.byId.get(terpilih)?.nama}.`}
            </p>
          )}
          <Pitch xi={xi} kiper={k.kiper} duet={k.duet_terbaik} aktifDuet={aktifDuet} setAktifDuet={setAktifDuet} warna={warna}
            onPilih={klikPemain} baru={rekrutanSet} tukar={tukar} terpilih={terpilih} modeAtur={modeAtur} />
          <ul className="legend">
            {[...new Set(xi.map((p) => p.arketipe))].map((n) => (
              <li key={n}><i style={{ background: warna(n) }} />{n}</li>
            ))}
          </ul>
          <p className="fine">
            XI disusun dari pemain dengan menit main terbanyak musim ini di tiap posisi. Data tidak mencatat sisi kiri
            atau kanan, jadi pemain dengan umpan silang terbanyak ditaruh di sisi luar. Gunakan Atur posisi untuk merapikannya.
            {rekrutanSet.size > 0 && " Lingkaran biru menandai rekrutan baru."}
          </p>
        </section>

        <div className="club-side">
          <section className="panel">
            <SectionHead title="Duet paling saling melengkapi" note="Garis merah di lapangan, nomor sesuai urutan" />
            <ol className="duets">
              {k.duet_terbaik.map((d, i) => {
                const a = data.byId.get(d.a);
                const b = data.byId.get(d.b);
                if (!a || !b) return null;
                return (
                  <li key={i} className={aktifDuet === i ? "on" : ""} onMouseEnter={() => setAktifDuet(i)} onMouseLeave={() => setAktifDuet(null)}>
                    <span className="duet-rank">{i + 1}</span>
                    <div className="duet-body">
                      <p className="duet-names">
                        <button className="linkish" onClick={() => bukaPemain(a.id)}>{a.nama}</button>
                        <span className="plus">+</span>
                        <button className="linkish" onClick={() => bukaPemain(b.id)}>{b.nama}</button>
                      </p>
                      <small>{d.alasan}</small>
                    </div>
                    <b className="duet-score">{nf(d.skor)}</b>
                  </li>
                );
              })}
            </ol>
          </section>

          {rekrutan.length > 0 && (
            <section className="panel">
              <SectionHead title="Rekrutan musim ini" note={`${rekrutan.length} pemain baru di skuad`} />
              <ul className="bench">
                {rekrutan.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => bukaPemain(p.id)}>
                      <i style={{ background: warna(p.arketipe) }} />
                      <span>{p.nama}</span>
                      <small>{statusTransfer(p)}, {nf(p.menit_musim_ini)}&prime;</small>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="panel">
            <SectionHead title="Keseimbangan XI" note={`Garis putih: rata-rata XI di ${k.liga}`} />
            <DimBars dims={k.keseimbangan} keys={data.meta.dimensi} compare={data.rataLiga[k.liga]} color="var(--kop)" />
          </section>

          <section className="panel">
            <SectionHead title="Pemain lain di skuad" note={`${cadangan.length} pemain di luar XI`} />
            <ul className="bench">
              {cadangan.slice(0, 12).map((p) => (
                <li key={p.id}>
                  <button onClick={() => bukaPemain(p.id)}>
                    <i style={{ background: warna(p.arketipe) }} />
                    <span>{p.nama}</span>
                    <small>{POSISI_LABEL[p.posisi_utama] ?? p.posisi_utama}, {p.menit_musim_ini != null ? `${nf(p.menit_musim_ini)}′ musim ini` : `${nf(p.main_90, 1)}x90′`}</small>
                  </button>
                </li>
              ))}
              {cadangan.length === 0 && <li className="fine">Semua pemain tercatat sudah masuk XI.</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}