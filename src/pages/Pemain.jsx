import { useEffect, useMemo, useState } from "react";
import { nf, POSISI_LABEL, STAT_LABEL, DIMENSI_KET, css, statusTransfer, teksMusim } from "../lib/data";
import ChartBox from "../components/ChartBox";
import { SectionHead, ArketipeChip, Select, Badge } from "../components/Ui";

const URUTAN = [
  ["main_90", "Menit main total", (p) => p.main_90, 1],
  ["menit_musim_ini", "Menit main musim ini", (p) => p.menit_musim_ini ?? 0, 0],
  ["Gls_p90", "Gol per 90", (p) => p.statistik.Gls_p90, 2],
  ["Ast_p90", "Assist per 90", (p) => p.statistik.Ast_p90, 2],
  ["Sh_p90", "Tembakan per 90", (p) => p.statistik.Sh_p90, 2],
  ["Crs_p90", "Crossing per 90", (p) => p.statistik.Crs_p90, 2],
  ["TklW_p90", "Tekel per 90", (p) => p.statistik.TklW_p90, 2],
  ["Int_p90", "Intersep per 90", (p) => p.statistik.Int_p90, 2],
  ["usia_muda", "Usia termuda", (p) => -(p.usia ?? 99), 0],
];
const PER_HALAMAN = 40;

export default function Pemain({ data, pilihId, setPilihId, filterAwal, bukaKlub }) {
  const [f, setF] = useState({ q: "", liga: "", klub: "", arketipe: "", posisi: "", andal: false, transfer: false, urut: "main_90" });
  const [batas, setBatas] = useState(PER_HALAMAN);

  // filter arketipe dari halaman ringkasan
  useEffect(() => {
    if (filterAwal?.arketipe) setF((p) => ({ ...p, arketipe: filterAwal.arketipe }));
  }, [filterAwal]);

  const set = (k) => (v) => {
    setBatas(PER_HALAMAN);
    setF((p) => ({ ...p, [k]: v, ...(k === "liga" ? { klub: "" } : {}) }));
  };

  const klubOpsi = useMemo(
    () => data.klub.filter((k) => !f.liga || k.liga === f.liga).map((k) => k.nama),
    [data.klub, f.liga]
  );

  const [, labelUrut, nilaiUrut, desUrut] = URUTAN.find((u) => u[0] === f.urut);

  const hasil = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return data.pemain
      .filter((p) =>
        (!q || p.nama.toLowerCase().includes(q)) &&
        (!f.liga || p.liga === f.liga) &&
        (!f.klub || p.klub === f.klub) &&
        (!f.arketipe || p.arketipe === f.arketipe) &&
        (!f.posisi || p.posisi_utama === f.posisi) &&
        (!f.andal || !p.sampel_kecil) &&
        (!f.transfer || p.pindah_klub || p.pemain_baru))
      .sort((a, b) => (nilaiUrut(b) ?? -1) - (nilaiUrut(a) ?? -1));
  }, [data.pemain, f, nilaiUrut]);

  const pilih = pilihId != null ? data.byId.get(pilihId) : null;
  const tampil = pilih ?? hasil[0];

  return (
    <div className="page">
      <SectionHead title="Cari pemain" note={`${nf(hasil.length)} dari ${nf(data.pemain.length)} pemain`} />

      <div className="filters">
        <label className="field search">
          <span>Nama pemain</span>
          <input type="search" value={f.q} placeholder="Contoh: Mbappé" onChange={(e) => set("q")(e.target.value)} />
        </label>
        <Select label="Liga" value={f.liga} onChange={set("liga")} options={data.meta.liga} />
        <Select label="Klub" value={f.klub} onChange={set("klub")} options={klubOpsi} />
        <Select label="Arketipe" value={f.arketipe} onChange={set("arketipe")} options={data.arketipe.map((a) => a.nama)} />
        <Select label="Posisi" value={f.posisi} onChange={set("posisi")} options={[["DF", "Bek"], ["MF", "Gelandang"], ["FW", "Penyerang"]]} />
        <Select label="Urutkan" value={f.urut} onChange={set("urut")} options={URUTAN.map((u) => [u[0], u[1]])} all={null} />
        <label className="toggle">
          <input type="checkbox" checked={f.andal} onChange={(e) => set("andal")(e.target.checked)} />
          <span>Sembunyikan pemain dengan menit main sedikit</span>
        </label>
        {data.pemain.some((q) => q.pindah_klub != null) && (
          <label className="toggle">
            <input type="checkbox" checked={f.transfer} onChange={(e) => set("transfer")(e.target.checked)} />
            <span>Hanya pemain yang pindah klub atau baru</span>
          </label>
        )}
      </div>

      <div className="scout">
        <section className="list-panel" aria-label="Daftar pemain">
          {hasil.length === 0 && (
            <div className="empty">
              <b>Tidak ada pemain yang cocok.</b>
              <p>Longgarkan salah satu filter, misalnya pilih semua liga atau semua posisi.</p>
            </div>
          )}
          <ul className="plist">
            {hasil.slice(0, batas).map((p) => {
              const a = data.arketipeMap.get(p.arketipe);
              const aktif = tampil?.id === p.id;
              return (
                <li key={p.id}>
                  <button className={"prow" + (aktif ? " on" : "")} style={{ "--c": a?.warna }} onClick={() => setPilihId(p.id)}>
                    <span className="prow-main">
                      <b>{p.nama}</b>
                      <small>{p.klub}, {POSISI_LABEL[p.posisi_utama] ?? p.posisi_utama}</small>
                    </span>
                    <span className="prow-val">
                      <b>{nf(nilaiUrut(p) < 0 ? -nilaiUrut(p) : nilaiUrut(p), desUrut)}</b>
                      <small>{f.urut === "usia_muda" ? "tahun" : f.urut === "main_90" ? "x 90 menit" : f.urut === "menit_musim_ini" ? "menit" : labelUrut.replace(" per 90", "/90").toLowerCase()}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {hasil.length > batas && (
            <button className="btn more" onClick={() => setBatas((b) => b + PER_HALAMAN)}>
              Tampilkan {Math.min(PER_HALAMAN, hasil.length - batas)} pemain lagi
            </button>
          )}
        </section>

        {tampil && <ProfilPemain data={data} p={tampil} setPilihId={setPilihId} bukaKlub={bukaKlub} />}
      </div>
    </div>
  );
}

function ProfilPemain({ data, p, setPilihId, bukaKlub }) {
  const a = data.arketipeMap.get(p.arketipe);
  const dims = data.meta.dimensi;

  return (
    <article className="profile" style={{ "--c": a?.warna }} aria-live="polite">
      <header className="profile-head">
        <div className="profile-num">{p.posisi_utama}</div>
        <div className="profile-id">
          <h2>{p.nama}</h2>
          <p>
            <button className="linkish" onClick={() => bukaKlub(p.klub)}>{p.klub}</button>, {p.liga}
          </p>
          <div className="profile-tags">
            <ArketipeChip arketipe={a} />
            {statusTransfer(p) && <Badge tone="info">{statusTransfer(p)}</Badge>}
            {p.sampel_kecil && <Badge>Menit main masih sedikit</Badge>}
          </div>
        </div>
      </header>

      <dl className="profile-facts">
        <div><dt>Posisi</dt><dd>{p.posisi}</dd></div>
        <div><dt>Usia</dt><dd>{p.usia ?? "-"}</dd></div>
        <div><dt>Negara</dt><dd>{p.negara || "-"}</dd></div>
        <div><dt>Main (total)</dt><dd>{nf(p.main_90, 1)} x 90&prime;</dd></div>
      </dl>
      {p.menit_musim_lalu != null && (
        <div className="seasons">
          <div>
            <span>Musim 2025/26</span>
            <b>{p.menit_musim_lalu ? `${nf(p.menit_musim_lalu)} menit` : "Belum di lima liga"}</b>
            {p.klub_musim_lalu && <small>{p.klub_musim_lalu}, {p.liga_musim_lalu}</small>}
          </div>
          <div>
            <span>Musim {data.meta.musim_terkini ?? teksMusim(data.meta)}</span>
            <b>{nf(p.menit_musim_ini)} menit</b>
            <small>{p.klub}, {p.liga}</small>
          </div>
        </div>
      )}

      <div className="profile-grid">
        <section>
          <h3 className="sub">Profil gaya main</h3>
          <ChartBox
            label={`Radar dimensi ${p.nama} dibanding rata-rata arketipe`}
            height={260}
            deps={[p.id]}
            make={() => ({
              type: "radar",
              data: {
                labels: dims,
                datasets: [
                  { label: p.nama, data: dims.map((d) => p.dimensi[d]), borderColor: a?.warna, backgroundColor: (a?.warna ?? "#6CABDD") + "40", borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: a?.warna },
                  { label: `Rata-rata ${a?.nama}`, data: dims.map((d) => a?.dimensi[d]), borderColor: css("--mist"), borderDash: [4, 4], borderWidth: 1.5, backgroundColor: "transparent", pointRadius: 0 },
                ],
              },
              options: {
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                scales: {
                  r: {
                    min: 0, max: 100,
                    ticks: { display: false, stepSize: 25 },
                    grid: { color: css("--line") },
                    angleLines: { color: css("--line") },
                    pointLabels: { color: css("--chalk"), font: { family: "'Barlow Condensed', sans-serif", size: 14, weight: "600" } },
                  },
                },
              },
            })}
          />
          <ul className="dim-notes">
            {dims.map((d) => (
              <li key={d}><b>{d} {nf(p.dimensi[d])}</b> <span>{DIMENSI_KET[d]}</span></li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="sub">Statistik per 90 menit</h3>
          <ul className="statbars">
            {data.meta.fitur.map((f) => {
              const v = p.statistik[f];
              const pct = data.persentil(f, v);
              return (
                <li key={f}>
                  <span className="sb-label">{STAT_LABEL[f] ?? f}</span>
                  <b className="sb-val">{f === "SoT%" ? (v == null ? "-" : nf(v, 0) + "%") : nf(v, 2)}</b>
                  <span className="sb-track" title={`Lebih baik dari ${nf(pct)}% pemain`}>
                    <span style={{ width: `${pct}%` }} />
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="fine">Panjang bar menunjukkan persentil dibanding seluruh pemain. Untuk pelanggaran dan kartu, bar panjang berarti lebih jarang.</p>
        </section>
      </div>

      <div className="profile-grid">
        <section>
          <h3 className="sub">Paling cocok dimainkan bersama</h3>
          <p className="fine">Rekan setim yang kekuatannya paling menutupi kekurangan {p.nama.split(" ").slice(-1)[0]}.</p>
          <ul className="mates">
            {p.partner.map((m) => {
              const q = data.byId.get(m.id);
              if (!q) return null;
              const qa = data.arketipeMap.get(q.arketipe);
              return (
                <li key={m.id}>
                  <button onClick={() => setPilihId(q.id)} style={{ "--c": qa?.warna }}>
                    <span className="score">{nf(m.skor)}</span>
                    <span className="mate-body">
                      <b>{q.nama}</b>
                      <small>{m.alasan}</small>
                    </span>
                  </button>
                </li>
              );
            })}
            {p.partner.length === 0 && <li className="fine">Belum ada rekan setim dengan data yang cukup.</li>}
          </ul>
        </section>

        <section>
          <h3 className="sub">Gaya main paling mirip</h3>
          <p className="fine">Dari seluruh liga, cocok untuk mencari pengganti atau alternatif.</p>
          <ul className="mates">
            {p.mirip.map((m) => {
              const q = data.byId.get(m.id);
              if (!q) return null;
              const qa = data.arketipeMap.get(q.arketipe);
              return (
                <li key={m.id}>
                  <button onClick={() => setPilihId(q.id)} style={{ "--c": qa?.warna }}>
                    <span className="score">{nf(m.skor)}%</span>
                    <span className="mate-body">
                      <b>{q.nama}</b>
                      <small>{q.klub}, {q.liga}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </article>
  );
}
