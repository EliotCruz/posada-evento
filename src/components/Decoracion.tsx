/** Decoración navideña en SVG (sin imágenes externas). */

const BOLAS: [number, number, string][] = [
  [92, 98, '#c8102e'], [112, 100, '#d9a441'], [70, 142, '#d9a441'], [104, 140, '#c8102e'], [138, 150, '#2ffad6'],
  [58, 196, '#c8102e'], [92, 190, '#2ffad6'], [128, 200, '#d9a441'], [158, 214, '#c8102e'], [40, 222, '#d9a441'], [110, 226, '#c8102e'],
];
const LUCES: [number, number][] = [
  [84, 70], [118, 78], [60, 118], [128, 122], [46, 168], [150, 176], [76, 168], [32, 234], [168, 234], [76, 232], [142, 236],
];

export function Arbol({ class: cls = '' }: { class?: string }) {
  return (
    <svg viewBox="0 0 200 310" class={cls} role="img" aria-label="Árbol de Navidad">
      <rect x="88" y="262" width="24" height="30" rx="3" fill="#6b4423" />
      <polygon points="100,34 152,112 48,112" fill="#1f6b3a" />
      <polygon points="100,70 166,176 34,176" fill="#1a5c32" />
      <polygon points="100,118 182,246 18,246" fill="#154d29" />
      <path d="M48 112 L100 34 L152 112 M34 176 L100 70 L166 176 M18 246 L100 118 L182 246" fill="none" stroke="#2b8a4f" stroke-width="2" opacity=".7" />
      {LUCES.map(([x, y]) => <circle key={`l${x}${y}`} cx={x} cy={y} r="2.6" fill="#ffe9a6" />)}
      {BOLAS.map(([x, y, c]) => <circle key={`b${x}${y}`} cx={x} cy={y} r="6.5" fill={c} stroke="#fff" stroke-opacity=".5" stroke-width="1" />)}
      <polygon points="100,6 106,24 125,24 110,35 116,53 100,42 84,53 90,35 75,24 94,24" fill="#e8b948" stroke="#b8862a" stroke-width="1.5" />
    </svg>
  );
}

export function Regalos({ class: cls = '' }: { class?: string }) {
  const caja = (x: number, y: number, w: number, h: number, c: string, lazo: string) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill={c} />
      <rect x={x + w / 2 - 4} y={y} width="8" height={h} fill={lazo} />
      <rect x={x} y={y + h / 3} width={w} height="8" fill={lazo} />
      <path d={`M${x + w / 2} ${y} c-14 -16 -22 -2 -6 0 M${x + w / 2} ${y} c14 -16 22 -2 6 0`} fill="none" stroke={lazo} stroke-width="4" stroke-linecap="round" />
    </g>
  );
  return (
    <svg viewBox="0 0 260 90" class={cls} aria-hidden="true">
      {caja(10, 40, 64, 46, '#c8102e', '#e8b948')}
      {caja(84, 54, 52, 32, '#0b1215', '#2ffad6')}
      {caja(146, 30, 56, 56, '#1f6b3a', '#e8b948')}
      {caja(210, 58, 44, 28, '#e8b948', '#c8102e')}
    </svg>
  );
}

/** Guirnalda de pino con moño, para el borde superior. */
export function Guirnalda({ class: cls = '' }: { class?: string }) {
  const bayas = [60, 170, 290, 410, 520, 690, 800, 910, 1030, 1140];
  return (
    <svg viewBox="0 0 1200 150" preserveAspectRatio="xMidYMin slice" class={cls} aria-hidden="true">
      <path d="M-20 38 Q 300 110 600 62 T 1220 38" fill="none" stroke="#154d29" stroke-width="46" stroke-linecap="round" />
      <path d="M-20 38 Q 300 110 600 62 T 1220 38" fill="none" stroke="#1f6b3a" stroke-width="30" stroke-linecap="round" stroke-dasharray="3 7" />
      <path d="M-20 38 Q 300 110 600 62 T 1220 38" fill="none" stroke="#2b8a4f" stroke-width="12" stroke-linecap="round" stroke-dasharray="2 9" />
      {bayas.map((x, i) => <circle key={x} cx={x} cy={i < 5 ? 64 + Math.sin(i) * 6 : 66 + Math.cos(i) * 6} r="7" fill="#c8102e" stroke="#fff" stroke-opacity=".45" />)}
      <g transform="translate(600 66)">
        <path d="M0 0 C-60 -50 -92 -6 -54 26 C-30 40 -10 18 0 0Z" fill="#a50e26" />
        <path d="M0 0 C60 -50 92 -6 54 26 C30 40 10 18 0 0Z" fill="#a50e26" />
        <path d="M0 4 C-26 40 -40 70 -52 96 L-24 84 L-8 100 Z" fill="#c8102e" />
        <path d="M0 4 C26 40 40 70 52 96 L24 84 L8 100 Z" fill="#c8102e" />
        <circle r="15" cy="2" fill="#e8b948" stroke="#b8862a" stroke-width="2" />
      </g>
    </svg>
  );
}
