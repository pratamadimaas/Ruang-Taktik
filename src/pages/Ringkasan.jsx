import { useMemo } from "react";
import { nf, css, STAT_SHORT, teksMusim } from "../lib/data";
import ChartBox, { axis } from "../components/ChartBox";
import { SectionHead, DimBars } from "../components/Ui";

/* papan teratas: hanya pemain dengan menit main cukup */
const PAPAN = [
  { judul: "Gol per 90", nilai: (p) => p.statistik.Gls_p90, d: 2 },
  { judul: "Assist per 90", nilai: (p) => p.statistik.Ast_p90, d: 2 },
  { judul: "Tekel + intersep per 90", nilai: (p) => (p.statistik.TklW_p90 ?? 0) + (p.statistik.Int_p90 ?? 0), d: 2 },
];

export default function Ringkasan({ data, bukaPemain, bukaArketipe }) {
  const { meta, arketipe, pemain } = data;
  const andal = useMemo(() => pemain.filter((p) => !p.sampel_kecil), [pemain]);

  const rekrutan = useMemo(
    () => pemain.filter((p) => p.pindah_klub || p.pemain_baru).sort((a, b) => (b.menit_musim_ini ?? 0) - (a.menit_musim_ini ?? 0)),
    [pemain]
  );

  const perLiga = useMemo(() => {
    return meta.liga.map((liga) => {
      const ps = pemain.filter((p) => p.liga === liga);
      return { liga, total: ps.length, per: Object.fromEntries(arketipe.map((a) => [a.nama, ps.filter((p) => p.arketipe === a.nama).length])) };
    });
  }, [meta, pemain, arketipe]);

  const ev = data.pca.explained_variance;
  // label sumbu PCA dari dua fitur dengan loading terbesar
  const labelPC = (k) =>
    Object.entries(data.pca.loadings)
      .sort((a, b) => Math.abs(b[1][k]) - Math.abs(a[1][k]))
      .slice(0, 2)
      .map(([f]) => (STAT_SHORT[f] || f).toLowerCase())
      .join(", ");

  return (
    <div className="page">
      <section className="hero">
        <img src="/cover.jpg" alt="" className="hero-img" />
        <div className="hero-shade" />
        <div className="hero-body">
          <p className="hero-kicker">Liga top Eropa, musim {teksMusim(meta)}</p>
          <h1>
            {nf(meta.jumlah_pemain)} pemain.
            <br />
            {arketipe.length} cara bermain.
          </h1>
          <p className="hero-text">
            Pemain outfield dari lima liga top Eropa dikelompokkan berdasarkan statistik per 90 menit. Lihat gaya main
            mereka, siapa yang paling saling melengkapi di lapangan, dan bagaimana rekrutan baru mengubah skuad.
          </p>
        </div>
        <div className="scorebug" aria-label="Ringkasan data">
          <div><b>{meta.liga.length}</b><span>Liga</span></div>
          <div><b>{meta.jumlah_klub}</b><span>Klub</span></div>
          <div><b>{nf(meta.jumlah_pemain)}</b><span>Pemain</span></div>
          <div className="accent"><b>{arketipe.length}</b><span>Arketipe</span></div>
        </div>
      </section>

      <SectionHead title="Enam arketipe" note="Klik salah satu untuk melihat daftar pemainnya" />
      <div className="arch-grid">
        {arketipe.map((a) => (
          <button key={a.nama} className="arch-card" style={{ "--c": a.warna }} onClick={() => bukaArketipe(a.nama)}>
            <div className="arch-top">
              <h3>{a.nama}</h3>
              <span className="arch-count"><b>{nf(a.jumlah)}</b> pemain</span>
            </div>
            <p>{a.deskripsi}</p>
            <DimBars dims={a.dimensi} keys={meta.dimensi_inti} color={a.warna} />
            <p className="arch-names">
              {a.contoh_pemain.slice(0, 3).map((id) => data.byId.get(id)?.nama).filter(Boolean).join(", ")}
            </p>
          </button>
        ))}
      </div>

      <div className="split">
        <section className="panel">
          <SectionHead title="Peta gaya main" note={`Proyeksi PCA, dua komponen menjelaskan ${nf((ev[0] + ev[1]) * 100)}% variasi`} />
          <ChartBox
            label="Scatter PCA pemain berdasarkan arketipe"
            height={380}
            deps={[pemain.length]}
            make={() => ({
              type: "scatter",
              data: {
                datasets: arketipe.map((a) => ({
                  label: a.nama,
                  data: pemain.filter((p) => p.arketipe === a.nama).map((p) => ({ x: p.pca[0], y: p.pca[1], p })),
                  backgroundColor: a.warna + "B0",
                  pointRadius: 2.6,
                  pointHoverRadius: 6,
                })),
              },
              options: {
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "bottom", labels: { padding: 14 } },
                  tooltip: { callbacks: { title: (c) => c[0].raw.p.nama, label: (c) => `${c.raw.p.klub}, ${c.raw.p.arketipe}` } },
                },
                scales: {
                  x: axis({ title: `PC1 (${nf(ev[0] * 100)}%), didominasi ${labelPC("PC1")}` }),
                  y: axis({ title: `PC2 (${nf(ev[1] * 100)}%), didominasi ${labelPC("PC2")}` }),
                },
                onClick: (e, el, chart) => {
                  if (!el.length) return;
                  const pt = chart.data.datasets[el[0].datasetIndex].data[el[0].index];
                  bukaPemain(pt.p.id);
                },
                onHover: (e, el) => { e.native.target.style.cursor = el.length ? "pointer" : "default"; },
              },
            })}
          />
        </section>

        <section className="panel">
          <SectionHead title="Komposisi per liga" note="Jumlah pemain tiap arketipe" />
          <ChartBox
            label="Jumlah pemain per arketipe di tiap liga"
            height={380}
            deps={[pemain.length]}
            make={() => ({
              type: "bar",
              data: {
                labels: perLiga.map((l) => l.liga),
                datasets: arketipe.map((a) => ({
                  label: a.nama,
                  data: perLiga.map((l) => l.per[a.nama]),
                  backgroundColor: a.warna,
                  borderColor: css("--stand"),
                  borderWidth: 1,
                  barPercentage: 0.7,
                })),
              },
              options: {
                indexAxis: "y",
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${nf(c.raw)} pemain` } },
                },
                scales: { x: axis({ stacked: true }), y: axis({ stacked: true, grid: false, ticks: { font: { size: 13, weight: "600" } } }) },
              },
            })}
          />
        </section>
      </div>

      <SectionHead title="Papan teratas" note={`Pemain dengan minimal ${meta.min_90_andal} kali 90 menit bermain`}>
        {rekrutan.length > 0 && <span className="head-stat"><b>{nf(rekrutan.length)}</b> pemain pindah klub atau baru di lima liga musim ini</span>}
      </SectionHead>
      <div className="leader-grid">
        {PAPAN.map((b) => {
          const top = [...andal].sort((x, y) => b.nilai(y) - b.nilai(x)).slice(0, 5);
          return (
            <section className="leader" key={b.judul}>
              <h3>{b.judul}</h3>
              <ol>
                {top.map((p, i) => (
                  <li key={p.id}>
                    <button onClick={() => bukaPemain(p.id)}>
                      <span className="rank">{i + 1}</span>
                      <span className="lb-name">
                        {p.nama}
                        <small>{p.klub}</small>
                      </span>
                      <b>{nf(b.nilai(p), b.d)}</b>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
        {rekrutan.length > 0 && (
          <section className="leader transfer">
            <h3>Rekrutan paling banyak dimainkan</h3>
            <ol>
              {rekrutan.slice(0, 5).map((p, i) => (
                <li key={p.id}>
                  <button onClick={() => bukaPemain(p.id)}>
                    <span className="rank">{i + 1}</span>
                    <span className="lb-name">
                      {p.nama}
                      <small>{p.klub_musim_lalu ? `${p.klub_musim_lalu} ke ${p.klub}` : `Baru di ${p.klub}`}</small>
                    </span>
                    <b>{nf(p.menit_musim_ini)}&prime;</b>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}

