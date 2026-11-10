// Compone el cartel del QR (fondo + logo + texto + QR) en un <canvas>, para descargarlo como imagen.
// Todo se dibuja en el navegador: el PNG resultante funciona sin internet (tótem, pantallas, etc.).
import QRCode from 'qrcode';

export type VersionId = 'totem' | 'horizontal' | 'vertical';
export interface Version { id: VersionId; nombre: string; detalle: string; w: number; h: number; archivo: string }

export const VERSIONES: Version[] = [
  { id: 'totem', nombre: 'Tótem vertical 1:4', detalle: '1080 × 4320 px · proporción 1:4 (168 × 672)', w: 1080, h: 4320, archivo: 'qr-posada-totem-1x4.png' },
  { id: 'horizontal', nombre: 'Pantalla horizontal 16:9', detalle: '1920 × 1080 px · TV, proyector, monitor', w: 1920, h: 1080, archivo: 'qr-posada-pantalla-16x9.png' },
  { id: 'vertical', nombre: 'Pantalla vertical 9:16', detalle: '1080 × 1920 px · TV vertical, celular', w: 1080, h: 1920, archivo: 'qr-posada-vertical-9x16.png' },
];

const BG_W = 557, BG_H = 2000; // tamaño de la plantilla
const TINTA = '#0b1215';
const FUENTE = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const cargar = (src: string) => new Promise<HTMLImageElement>((ok, mal) => {
  const i = new Image(); i.onload = () => ok(i); i.onerror = () => mal(new Error(`No se pudo cargar ${src}`)); i.src = src;
});

function colorCrema(bg: HTMLImageElement, px = 20, py = 1000): [number, number, number] {
  const c = document.createElement('canvas'); c.width = c.height = 1;
  const x = c.getContext('2d')!; x.drawImage(bg, px, py, 1, 1, 0, 0, 1, 1);
  const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]];
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

/** Dibuja una región de la imagen con los bordes indicados difuminados (fracción del tamaño). */
function recorte(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement,
  sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number,
  bordes: Partial<Record<'arr' | 'aba' | 'izq' | 'der', number>>,
) {
  const t = document.createElement('canvas'); t.width = Math.ceil(dw); t.height = Math.ceil(dh);
  const c = t.getContext('2d')!; c.imageSmoothingQuality = 'high';
  c.drawImage(img, sx, sy, sw, sh, 0, 0, t.width, t.height);
  c.globalCompositeOperation = 'destination-in';
  const f = (x0: number, y0: number, x1: number, y1: number, parada: number) => {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(parada, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = g; c.fillRect(0, 0, t.width, t.height);
  };
  if (bordes.arr) f(0, 0, 0, t.height, bordes.arr);
  if (bordes.aba) f(0, t.height, 0, 0, bordes.aba);
  if (bordes.izq) f(0, 0, t.width, 0, bordes.izq);
  if (bordes.der) f(t.width, 0, 0, 0, bordes.der);
  ctx.drawImage(t, dx, dy);
}

export async function componer(v: Version, url: string, base: string): Promise<HTMLCanvasElement> {
  const b = base.replace(/\/$/, '');
  const [tall, wide, logo] = await Promise.all([
    cargar(`${b}/fondos/plantilla.jpg`), cargar(`${b}/fondos/fondo-horizontal.jpg`), cargar(`${b}/logos/borgwarner-negro.png`),
  ]);
  const crema = v.id === 'totem' ? colorCrema(tall) : colorCrema(wide, 1000, 1000);

  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, url, { width: 900, margin: 0, errorCorrectionLevel: 'M', color: { dark: TINTA, light: '#ffffff' } });
  qr.style.width = qr.style.height = '';

  const c = document.createElement('canvas'); c.width = v.w; c.height = v.h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = `rgb(${crema})`; ctx.fillRect(0, 0, v.w, v.h);

  const lw = (bw: number) => bw * (logo.naturalHeight / logo.naturalWidth);

  if (v.id === 'horizontal') {
    // Imagen horizontal a pantalla completa (cubre el lienzo); contenido en la zona libre central.
    const s = Math.max(v.w / 2000, v.h / 1116);
    ctx.drawImage(wide, (v.w - 2000 * s) / 2, (v.h - 1116 * s) / 2, 2000 * s, 1116 * s);
    const cx = v.w * 0.46;
    ctx.drawImage(logo, cx - 290, 215, 580, lw(580));
    LINEAS.forEach((l, i) => texto(ctx, cx, 345 + i * 58, l, 44));
    marcoQr(ctx, qr, cx - 250, 470, 500);
    return c;
  }

  if (v.id === 'vertical') {
    // Imagen horizontal recortada: guirnalda arriba a la izquierda y árbol abajo a la derecha.
    const sg = v.w * 0.92 / 1000;                       // guirnalda: región 1000×730 de la imagen
    recorte(ctx, wide, 0, 0, 1000, 730, 0, 0, 1000 * sg, 730 * sg, { aba: 0.3, der: 0.3 });
    const st = 0.7;                                     // árbol: región 920×886, abajo a la derecha
    recorte(ctx, wide, 1080, 230, 920, 886, v.w - 920 * st, v.h - 886 * st, 920 * st, 886 * st, { arr: 0.12, izq: 0.18 });
    const cx = v.w * 0.5;
    ctx.drawImage(logo, cx - 230, 535, 460, lw(460));
    LINEAS.forEach((l, i) => texto(ctx, cx, 645 + i * 58, l, 44));
    marcoQr(ctx, qr, cx - 260, 790, 520);
    return c;
  }

  // Tótem 1:4. La plantilla (557×2000) es más ancha que 1:4, así que se ajusta al ancho: la guirnalda va pegada
  // arriba, el árbol pegado abajo, y el tramo crema que sobra queda en medio, donde van logo, texto y QR.
  const s = v.w / BG_W;
  const CORTE = 900;                                   // fila de la plantilla donde se separa (zona crema)
  recorte(ctx, tall, 0, 0, BG_W, CORTE, 0, 0, v.w, CORTE * s, { aba: 0.2 });
  recorte(ctx, tall, 0, CORTE, BG_W, BG_H - CORTE, 0, v.h - (BG_H - CORTE) * s, v.w, (BG_H - CORTE) * s, { arr: 0.2 });
  const libreArriba = 700 * s, libreAbajo = v.h - (BG_H - 1345) * s;   // entre la guirnalda y la estrella del árbol
  const logoW = v.w * 0.62, lado = v.w * 0.8, px = v.w * 0.058, interlinea = px * 1.32;
  const alto = lw(logoW) + 70 + interlinea * 3 + 60 + lado;
  let y = (libreArriba + libreAbajo) / 2 - alto / 2;
  const cx = v.w / 2;
  ctx.drawImage(logo, cx - logoW / 2, y, logoW, lw(logoW)); y += lw(logoW) + 70 + px;
  LINEAS.forEach((l, i) => texto(ctx, cx, y + i * interlinea, l, px));
  y += interlinea * 2 + 60 + px * 0.3;
  marcoQr(ctx, qr, cx - lado / 2, y, lado);
  return c;
}
