// Compone el cartel del QR (fondo + logo + texto + QR) en un <canvas>, para descargarlo como imagen.
// Todo se dibuja en el navegador: el PNG resultante funciona sin internet (tótem, pantallas, etc.).
import QRCode from 'qrcode';

export type VersionId = 'totem' | 'horizontal' | 'vertical';
export interface Version { id: VersionId; nombre: string; detalle: string; w: number; h: number; archivo: string }

export const VERSIONES: Version[] = [
  { id: 'totem', nombre: 'Tótem vertical', detalle: '1114 × 4000 px · proporción de la plantilla', w: 1114, h: 4000, archivo: 'qr-posada-totem.png' },
  { id: 'horizontal', nombre: 'Pantalla horizontal 16:9', detalle: '1920 × 1080 px · TV, proyector, monitor', w: 1920, h: 1080, archivo: 'qr-posada-pantalla-16x9.png' },
  { id: 'vertical', nombre: 'Pantalla vertical 9:16', detalle: '1080 × 1920 px · TV vertical, celular', w: 1080, h: 1920, archivo: 'qr-posada-vertical-9x16.png' },
];

const BG_W = 557, BG_H = 2000; // tamaño de la plantilla
const TINTA = '#0b1215';
const FUENTE = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const cargar = (src: string) => new Promise<HTMLImageElement>((ok, mal) => {
  const i = new Image(); i.onload = () => ok(i); i.onerror = () => mal(new Error(`No se pudo cargar ${src}`)); i.src = src;
});

function colorCrema(bg: HTMLImageElement): [number, number, number] {
  const c = document.createElement('canvas'); c.width = c.height = 1;
  const x = c.getContext('2d')!; x.drawImage(bg, 20, 1000, 1, 1, 0, 0, 1, 1);
  const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]];
}

/** Degradado de la crema a transparente: difumina el borde de una copia de la plantilla. */
function difuminar(ctx: CanvasRenderingContext2D, crema: number[], x0: number, x1: number, y: number, h: number) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, `rgba(${crema},1)`); g.addColorStop(1, `rgba(${crema},0)`);
  ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x1), y, Math.abs(x1 - x0), h);
}

type Parte = { t: string; negrita?: boolean };
function texto(ctx: CanvasRenderingContext2D, cx: number, y: number, partes: Parte[], px: number) {
  const f = (p: Parte) => `${p.negrita ? '700' : '400'} ${px}px ${FUENTE}`;
  let total = 0;
  for (const p of partes) { ctx.font = f(p); total += ctx.measureText(p.t).width; }
  let x = cx - total / 2;
  ctx.textBaseline = 'alphabetic'; ctx.fillStyle = TINTA; ctx.textAlign = 'left';
  for (const p of partes) { ctx.font = f(p); ctx.fillText(p.t, x, y); x += ctx.measureText(p.t).width; }
}

const LINEAS: Parte[][] = [
  [{ t: '¡Escanea el QR con tu celular' }],
  [{ t: 'para completar ' }, { t: 'tu registro', negrita: true }],
  [{ t: 'para la gran rifa!' }],
];

/** QR con marco dorado. (x, y) = esquina superior izquierda; lado = tamaño total del marco. */
function marcoQr(ctx: CanvasRenderingContext2D, qr: HTMLCanvasElement, x: number, y: number, lado: number) {
  const borde = lado * 0.022;
  const g = ctx.createLinearGradient(x, y, x + lado, y + lado);
  g.addColorStop(0, '#f3d98b'); g.addColorStop(0.5, '#c9962f'); g.addColorStop(1, '#f3d98b');
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = lado * 0.04; ctx.shadowOffsetY = lado * 0.01;
  ctx.fillStyle = g; ctx.fillRect(x, y, lado, lado);
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.fillRect(x + borde, y + borde, lado - 2 * borde, lado - 2 * borde);
  const pad = lado * 0.04;
  ctx.imageSmoothingEnabled = false; // módulos del QR nítidos
  ctx.drawImage(qr, x + borde + pad, y + borde + pad, lado - 2 * (borde + pad), lado - 2 * (borde + pad));
  ctx.imageSmoothingEnabled = true;
}

export async function componer(v: Version, url: string, base: string): Promise<HTMLCanvasElement> {
  const b = base.replace(/\/$/, '');
  const [bg, logo] = await Promise.all([cargar(`${b}/fondos/plantilla.jpg`), cargar(`${b}/logos/borgwarner-negro.png`)]);
  const crema = colorCrema(bg);

  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, url, { width: 900, margin: 0, errorCorrectionLevel: 'M', color: { dark: TINTA, light: '#ffffff' } });
  qr.style.width = qr.style.height = '';

  const c = document.createElement('canvas'); c.width = v.w; c.height = v.h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = `rgb(${crema})`; ctx.fillRect(0, 0, v.w, v.h);

  const lw = (bw: number) => bw * (logo.naturalHeight / logo.naturalWidth);

  if (v.id === 'horizontal') {
    // Plantilla a los dos lados; el contenido va al centro, grande.
    const s = v.h / BG_H, w = BG_W * s;
    ctx.drawImage(bg, 0, 0, w, v.h);
    ctx.drawImage(bg, v.w - w, 0, w, v.h);
    difuminar(ctx, crema, w - 70, w, 0, v.h);
    difuminar(ctx, crema, v.w - w + 70, v.w - w, 0, v.h);
    const cx = v.w / 2;
    ctx.drawImage(logo, cx - 320, 70, 640, lw(640));
    LINEAS.forEach((l, i) => texto(ctx, cx, 218 + i * 62, l, 48));
    marcoQr(ctx, qr, cx - 300, 400, 600);
    return c;
  }

  // Tótem y vertical: la plantilla ocupa todo el alto y el contenido se ubica sobre su zona libre.
  const s = v.h / BG_H, ox = (v.w - BG_W * s) / 2;
  ctx.drawImage(bg, ox, 0, BG_W * s, v.h);
  if (ox > 1) { difuminar(ctx, crema, ox, ox + 60, 0, v.h); difuminar(ctx, crema, v.w - ox, v.w - ox - 60, 0, v.h); ctx.fillStyle = `rgb(${crema})`; ctx.fillRect(0, 0, ox, v.h); ctx.fillRect(v.w - ox, 0, ox, v.h); }
  const X = (u: number) => ox + u * s, Y = (u: number) => u * s;
  const cx = X(BG_W / 2);
  ctx.drawImage(logo, cx - 190 * s, Y(618), 380 * s, lw(380 * s));
  LINEAS.forEach((l, i) => texto(ctx, cx, Y(728 + i * 50), l, 35 * s));
  marcoQr(ctx, qr, cx - 230 * s, Y(862), 460 * s);
  return c;
}
