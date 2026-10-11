import { nf, STAT_SHORT, STAT_LABEL, css } from "../lib/data";
import ChartBox, { axis } from "../components/ChartBox";
import { SectionHead } from "../components/Ui";

const SUMBER = [
  {
    judul: "Football Players Stats 2025/2026",
    ket: "Musim penuh, file players_data_light-2025_2026.csv",
    url: "https://www.kaggle.com/datasets/hubertsidorowicz/football-players-stats-2025-2026?select=players_data_light-2025_2026.csv",
  },
  {
    judul: "Football Players Stats 2026/2027",
    ket: "Musim berjalan, file players_data_light-2026_2027.csv",
    url: "https://www.kaggle.com/datasets/hubertsidorowicz/football-players-stats-2026-2027",
  },
];

export default function Metodologi({ data }) {
  const { pca, klasifikasi, meta } = data;
  const loadings = Object.entries(pca.loadings);
  const median = (arr) => { const a = [...arr].sort((x, y) => x - y); return a[Math.floor(a.length / 2)] ?? 0; };
  const adaMusimIni = data.pemain.some((p) => p.menit_musim_ini != null);

  const LANGKAH = [
    ["Gabungkan dua musim", "Statistik musim 2025/26 penuh dijumlahkan dengan musim 2026/27 yang sedang berjalan. Klub dan posisi mengikuti musim terbaru." +
      (adaMusimIni
        ? ` Median menit main per pemain naik dari ${nf(median(data.pemain.map((p) => p.menit_musim_ini ?? 0)))} menjadi ${nf(median(data.pemain.map((p) => p.main_90 * 90)))} menit, jadi angka per 90 menit lebih stabil.`
        : "")],
    ["Hitung per 90 menit", "Gol, assist, tembakan, tekel, dan statistik lain dibagi jumlah 90 menit bermain, supaya pemain inti dan cadangan bisa dibandingkan."],
    ["Standarisasi", "Semua statistik diubah ke skala yang sama dengan StandardScaler agar tidak ada satu statistik yang mendominasi."],
    ["Kelompokkan dengan K-Means", "Jumlah kelompok dipilih lewat metode elbow dan silhouette score. Kelompok terbentuk dari statistik, bukan label posisi, jadi bek sayap yang sering mengirim umpan silang bisa satu kelompok dengan gelandang kreatif. Nama kelompok ditentukan otomatis dari ciri statistiknya, dan random_state tetap membuat hasilnya sama setiap kali dijalankan ulang."],
    ["Hitung kecocokan", `Setiap pemain diberi skor 0 sampai 100 di ${meta.dimensi.length} dimensi. Dua pemain dianggap cocok jika kekuatan mereka saling menutupi, dan setiap rekomendasi duet disertai alasannya.`],
  ];

  const KETERBATASAN = [
    `Batas antar kelompok tidak tegas. Silhouette score untuk ${meta.k_cluster ?? data.arketipe.length} kelompok tergolong rendah, artinya gaya main lebih berupa spektrum dan pemain di perbatasan bisa cocok di dua kelompok.`,
    `Hanya ${meta.fitur.length} statistik yang dipakai. Tidak ada data umpan, dribel, duel udara, atau expected goals, sehingga gelandang jangkar seperti Vitinha di Paris SG bisa masuk kelompok Pemain Posisional.`,
    "Gaya tim memengaruhi angka. Pemain di tim yang jarang menguasai bola cenderung punya tekel dan intersep lebih banyak, meskipun belum tentu lebih baik dalam bertahan.",
    "Kekuatan liga tidak disesuaikan, sehingga satu gol di liga mana pun dihitung sama.",
    "Skor kecocokan mengukur seberapa saling melengkapi statistik dua pemain, dengan bobot yang ditentukan dari logika dan belum divalidasi dengan hasil pertandingan. Chemistry di lapangan juga dipengaruhi taktik dan pola umpan.",
    "Kedua musim diberi bobot sama, dan pemain yang pindah klub membawa statistik dari klub lamanya. Gaya mainnya bisa berubah di klub baru.",
    `Pemain dengan total kurang dari ${meta.min_90_andal} kali 90 menit diberi tanda karena statistiknya masih mudah berubah. Akurasi tembakan tidak dipakai dan kiper tidak ikut dikelompokkan.`,
  ];

  return (
    <div className="page narrow">
      <header className="club-head">
        <h1>Cara analisis ini dibuat</h1>
        <p>Semua angka di dashboard ini berasal dari notebook Google Colab yang sama, tanpa diubah manual.</p>
      </header>

      <section className="panel">
        <ol className="steps">
          {LANGKAH.map(([judul, isi]) => (
            <li key={judul}>
              <h3>{judul}</h3>
              <p>{isi}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="split">
        <section className="panel">
          <SectionHead title="Pembentuk peta gaya main" note="Loading PCA tiap statistik" />
          <ChartBox
            label="Loading PCA"
            height={340}
            deps={[1]}
            make={() => ({
              type: "bar",
              data: {
                labels: loadings.map(([f]) => STAT_SHORT[f] ?? f),
                datasets: [
                  { label: `PC1 (${nf(pca.explained_variance[0] * 100)}%)`, data: loadings.map(([, v]) => v.PC1), backgroundColor: css("--kop") },
                  { label: `PC2 (${nf(pca.explained_variance[1] * 100)}%)`, data: loadings.map(([, v]) => v.PC2), backgroundColor: css("--sky") },
                ],
              },
              options: {
                indexAxis: "y",
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                scales: { x: axis(), y: axis({ grid: false }) },
              },
            })}
          />
        </section>

        {klasifikasi ? (
          <section className="panel">
            <SectionHead title="Menebak posisi dari statistik" note={`Random Forest, akurasi ${nf(klasifikasi.akurasi * 100, 1)}% di data uji`} />
            <div className="cm" style={{ "--n": klasifikasi.label.length }}>
              <span className="cm-corner">Asli \ Prediksi</span>
              {klasifikasi.label.map((l) => <span key={l} className="cm-h">{l}</span>)}
              {klasifikasi.confusion_matrix.map((row, i) => {
                const total = row.reduce((a, b) => a + b, 0) || 1;
                return [
                  <span key={"r" + i} className="cm-h">{klasifikasi.label[i]}</span>,
                  ...row.map((v, j) => (
                    <span key={i + "-" + j} className={"cm-cell" + (i === j ? " diag" : "")} style={{ "--a": v / total }}>
                      {v}
                    </span>
                  )),
                ];
              })}
            </div>
            <p className="fine">Kotak diagonal adalah tebakan yang benar. Semakin pekat warnanya, semakin besar porsinya di baris tersebut.</p>
            <h3 className="sub">Statistik paling membantu menebak posisi</h3>
            <ul className="imp">
              {Object.entries(klasifikasi.fitur_penting).slice(0, 8).map(([f, v], i, arr) => (
                <li key={f}>
                  <span>{STAT_LABEL[f] ?? f}</span>
                  <span className="imp-track"><span style={{ width: `${(v / arr[0][1]) * 100}%` }} /></span>
                  <b>{nf(v * 100, 1)}%</b>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="panel">
            <SectionHead title="Klasifikasi posisi" note="Data klasifikasi tidak ada di file JSON" />
          </section>
        )}
      </div>

      <section className="panel">
        <SectionHead title="Keterbatasan" />
        <ul className="caveats">
          {KETERBATASAN.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </section>

      <section className="panel next">
        <SectionHead title="Rencana pengembangan" />
        <p>
          Menambahkan statistik umpan, dribel, dan expected goals, memberi bobot lebih besar pada musim terbaru,
          menyesuaikan angka dengan kekuatan liga, serta menguji skor kecocokan dengan hasil pertandingan duet pemain.
        </p>
      </section>

      <section className="panel sources">
        <SectionHead title="Sumber data" note="Dataset publik di Kaggle, diunggah oleh Hubert Sidorowicz" />
        <ul>
          {SUMBER.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                <b>{s.judul}</b>
                <small>{s.ket}</small>
              </a>
            </li>
          ))}
        </ul>
        <p className="fine">Mencakup Premier League, La Liga, Serie A, Bundesliga, dan Ligue 1.</p>
      </section>
    </div>
  );
}