export default function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="7" fill="var(--grass)" />
      <rect x="6" y="6" width="28" height="28" rx="1.5" fill="none" stroke="#F1EFE8" strokeOpacity=".75" strokeWidth="1.6" />
      <line x1="6" y1="20" x2="34" y2="20" stroke="#F1EFE8" strokeOpacity=".75" strokeWidth="1.6" />
      <circle cx="20" cy="20" r="5" fill="none" stroke="#F1EFE8" strokeOpacity=".75" strokeWidth="1.6" />
      <path d="M12 29 L20 13 L28 26" fill="none" stroke="var(--kop)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="29" r="2.6" fill="var(--sky)" />
      <circle cx="20" cy="13" r="2.6" fill="var(--sky)" />
      <circle cx="28" cy="26" r="2.6" fill="var(--sky)" />
    </svg>
  );
}
