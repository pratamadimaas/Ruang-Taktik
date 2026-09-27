import { useState } from "react";
import { useData, DATA_URL, teksMusim } from "./lib/data";
import Logo from "./components/Logo";
import Ringkasan from "./pages/Ringkasan";
import Pemain from "./pages/Pemain";
import Klub from "./pages/Klub";
import Metodologi from "./pages/Metodologi";

const MENU = [
  { id: "ringkasan", label: "Ringkasan", short: "Ringkasan" },
  { id: "pemain", label: "Pemain", short: "Pemain" },
  { id: "klub", label: "Klub & susunan", short: "Klub" },
  { id: "metodologi", label: "Metodologi", short: "Metode" },
];

export default function App() {
  const state = useData();
  const [page, setPage] = useState("ringkasan");
  const [pilihId, setPilihId] = useState(null);
  const [namaKlub, setNamaKlub] = useState(null);
  const [filterAwal, setFilterAwal] = useState(null);

  const pindah = (id) => {
    setPage(id);
    window.scrollTo({ top: 0 });
  };
  const bukaPemain = (id) => { setPilihId(id); pindah("pemain"); };
  const bukaKlub = (nama) => { setNamaKlub(nama); pindah("klub"); };
  const bukaArketipe = (nama) => { setFilterAwal({ arketipe: nama, t: Date.now() }); setPilihId(null); pindah("pemain"); };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <Logo />
          <div>
            <strong>Ruang Taktik</strong>
            <span>Arketipe pemain liga top Eropa</span>
          </div>
        </div>
        <nav className="tabs" aria-label="Halaman">
          {MENU.map((m) => (
            <button key={m.id} className={page === m.id ? "on" : ""} aria-current={page === m.id ? "page" : undefined} onClick={() => pindah(m.id)}>
              <span className="tab-long">{m.label}</span>
              <span className="tab-short">{m.short}</span>
            </button>
          ))}
        </nav>
      </header>

      <main>
        {state.status === "loading" && <p className="loading">Memuat data pemain...</p>}

        {state.status === "error" && (
          <div className="setup">
            <h1>Data pemain belum ditemukan</h1>
            <p>{state.error}.</p>
            <ol>
              <li>Jalankan notebook Google Colab sampai cell export JSON, lalu unduh <code>football_dashboard.json</code>.</li>
              <li>Salin file itu ke folder <code>public/</code> di project ini.</li>
              <li>Muat ulang halaman. Dashboard membaca data dari <code>{DATA_URL}</code>.</li>
            </ol>
          </div>
        )}

        {state.status === "ready" && (
          <>
            {page === "ringkasan" && <Ringkasan data={state.data} bukaPemain={bukaPemain} bukaArketipe={bukaArketipe} />}
            {page === "pemain" && <Pemain data={state.data} pilihId={pilihId} setPilihId={setPilihId} filterAwal={filterAwal} bukaKlub={bukaKlub} />}
            {page === "klub" && <Klub data={state.data} namaKlub={namaKlub ?? state.data.klub[0].nama} setNamaKlub={setNamaKlub} bukaPemain={bukaPemain} />}
            {page === "metodologi" && <Metodologi data={state.data} />}
          </>
        )}
      </main>

      <footer className="foot">
        {state.data?.meta.catatan_data ?? `Data: statistik pemain musim ${teksMusim(state.data?.meta)}.`} Diolah dengan K-Means clustering di Google Colab.
      </footer>
    </div>
  );
}
