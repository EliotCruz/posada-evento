const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I/L

/** Código de verificación tipo "K7M-4PQ". Usa crypto cuando está disponible. */
export function generarCodigo(rng?: () => number): string {
  const r = rng ?? (() => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32);
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += ALFABETO[Math.floor(r() * ALFABETO.length)];
    if (i === 2) s += '-';
  }
  return s;
}
