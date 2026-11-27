/** Ilustrações SVG simples, decorativas (aria-hidden). */

const Sparkle = ({ x, y, size, color, delay }: { x: number; y: number; size: number; color: string; delay: string }) => (
  <path
    d={`M${x} ${y - size}C${x + size * 0.15} ${y - size * 0.15} ${x + size * 0.15} ${y - size * 0.15} ${x + size} ${y}C${x + size * 0.15} ${y + size * 0.15} ${x + size * 0.15} ${y + size * 0.15} ${x} ${y + size}C${x - size * 0.15} ${y + size * 0.15} ${x - size * 0.15} ${y + size * 0.15} ${x - size} ${y}C${x - size * 0.15} ${y - size * 0.15} ${x - size * 0.15} ${y - size * 0.15} ${x} ${y - size}Z`}
    fill={color}
    className="motion-safe:animate-twinkle"
    style={{ transformOrigin: `${x}px ${y}px`, transformBox: "view-box", animationDelay: delay }}
  />
);

export function AllDoneIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden fill="none">
      <ellipse cx="80" cy="108" rx="38" ry="5" className="fill-stone-200" />
      <circle cx="80" cy="58" r="40" className="fill-emerald-100" />
      <circle cx="80" cy="58" r="29" fill="#10b981" />
      <path d="m66 58 9.5 9.5L95 48" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <Sparkle x={30} y={30} size={9} color="#f59e0b" delay="0s" />
      <Sparkle x={132} y={40} size={7} color="#ef4444" delay="0.6s" />
      <Sparkle x={124} y={92} size={5} color="#f59e0b" delay="1.2s" />
      <Sparkle x={36} y={86} size={5} color="#10b981" delay="1.8s" />
      <circle cx="118" cy="18" r="3" fill="#fca5a5" />
      <circle cx="46" cy="12" r="2.5" fill="#6ee7b7" />
    </svg>
  );
}

export function EmptyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden fill="none">
      <ellipse cx="80" cy="110" rx="40" ry="5" className="fill-stone-200" />
      <rect x="48" y="14" width="64" height="86" rx="10" className="fill-white stroke-stone-300" strokeWidth="2" />
      <rect x="66" y="8" width="28" height="12" rx="4" className="fill-stone-200 stroke-stone-300" strokeWidth="2" />
      <circle cx="62" cy="42" r="4.5" className="stroke-stone-300" strokeWidth="2" />
      <rect x="72" y="39.5" width="28" height="5" rx="2.5" className="fill-stone-200" />
      <circle cx="62" cy="60" r="4.5" className="stroke-stone-300" strokeWidth="2" />
      <rect x="72" y="57.5" width="22" height="5" rx="2.5" className="fill-stone-200" />
      <circle cx="62" cy="78" r="4.5" className="stroke-stone-300" strokeWidth="2" />
      <rect x="72" y="75.5" width="25" height="5" rx="2.5" className="fill-stone-200" />
      <circle cx="116" cy="94" r="14" fill="#ef4444" />
      <path d="M116 87.5v13M109.5 94h13" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <Sparkle x={34} y={34} size={6} color="#f59e0b" delay="0.3s" />
    </svg>
  );
}
