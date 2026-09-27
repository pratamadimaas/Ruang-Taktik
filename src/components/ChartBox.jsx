import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { css } from "../lib/data";

function applyDefaults() {
  const small = window.innerWidth < 600;
  Chart.defaults.font.family = "'Barlow', system-ui, sans-serif";
  Chart.defaults.font.size = small ? 11 : 12;
  Chart.defaults.color = css("--mist");
  Chart.defaults.borderColor = css("--line");
  Chart.defaults.plugins.legend.labels.boxWidth = 10;
  Chart.defaults.plugins.legend.labels.boxHeight = 10;
  Chart.defaults.plugins.tooltip.backgroundColor = "#F1EFE8";
  Chart.defaults.plugins.tooltip.titleColor = "#0E1A2C";
  Chart.defaults.plugins.tooltip.bodyColor = "#0E1A2C";
  Chart.defaults.plugins.tooltip.titleFont = { family: "'Barlow Condensed', sans-serif", size: 14, weight: "700" };
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 4;
  Chart.defaults.plugins.tooltip.displayColors = false;
  Chart.defaults.animation.duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350;
}

/** Wrapper Chart.js: `make` mengembalikan config, chart dibuat ulang saat `deps` berubah. */
export default function ChartBox({ make, deps, height = 260, label }) {
  const ref = useRef(null);
  useEffect(() => {
    applyDefaults();
    const chart = new Chart(ref.current, make());
    return () => chart.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return (
    <div className="chart" style={{ height }}>
      <canvas ref={ref} role="img" aria-label={label} />
    </div>
  );
}

/** Pengaturan sumbu yang dipakai berulang */
export function axis({ title, grid = true, ticks = {}, ...rest } = {}) {
  return {
    border: { display: false },
    grid: { display: grid, color: css("--line"), drawTicks: false },
    ticks: { padding: 6, maxRotation: 0, autoSkipPadding: 8, ...ticks },
    title: title ? { display: true, text: title, color: css("--mist") } : { display: false },
    ...rest,
  };
}
