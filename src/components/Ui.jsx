import { nf } from "../lib/data";

/** Judul bagian. Di luar panel diberi tab merah miring di kiri. */
export function SectionHead({ title, note, children }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {note && <p>{note}</p>}
      </div>
      {children}
    </div>
  );
}

export function ArketipeChip({ arketipe, small = false }) {
  if (!arketipe) return null;
  return (
    <span className={"chip" + (small ? " small" : "")} style={{ "--c": arketipe.warna }}>
      <i />
      {arketipe.nama}
    </span>
  );
}

/** Bar 0-100 per dimensi */
export function DimBars({ dims, keys, compare, color = "var(--sky)" }) {
  return (
    <ul className="dimbars">
      {keys.map((k) => (
        <li key={k}>
          <span className="db-label">{k}</span>
          <span className="db-track">
            <span className="db-fill" style={{ width: `${dims[k]}%`, background: color }} />
            {compare && <span className="db-mark" style={{ left: `${compare[k]}%` }} title="Pembanding" />}
          </span>
          <b className="db-val">{nf(dims[k])}</b>
        </li>
      ))}
    </ul>
  );
}

export function Select({ label, value, onChange, options, all = "Semua" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {all !== null && <option value="">{all}</option>}
        {options.map((o) => {
          const [v, t] = Array.isArray(o) ? o : [o, o];
          return <option key={v} value={v}>{t}</option>;
        })}
      </select>
    </label>
  );
}

export function Badge({ children, tone = "warn" }) {
  return <span className={"badge " + tone}>{children}</span>;
}
