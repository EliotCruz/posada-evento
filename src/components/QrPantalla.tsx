import { useEffect, useRef, useState } from 'preact/hooks';
import { componer, VERSIONES, type Version } from '../lib/cartel';

export default function QrPantalla({ base, url }: { base: string; url: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const [v, setV] = useState<Version>(VERSIONES[0]);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    setCanvas(null); setError('');
    componer(v, url, base)
      .then((c) => {
        if (!vivo) return;
        c.style.cssText = 'max-width:100%;max-height:calc(100vh - 13rem);width:auto;height:auto;border-radius:6px;box-shadow:0 8px 30px rgba(0,0,0,.18)';
        setCanvas(c);
      })
      .catch((e) => vivo && setError((e as Error).message));
    return () => { vivo = false; };
  }, [v, url, base]);

  useEffect(() => {
    caja.current?.replaceChildren(...(canvas ? [canvas] : []));
  }, [canvas]);

  function descargar() {
    canvas?.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = v.archivo; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, 'image/png');
  }

  return (
    <main class="w-full max-w-4xl p-4 lg:my-8 lg:rounded-2xl lg:bg-white/75 lg:p-6 lg:shadow-lg lg:backdrop-blur-sm">
      <img src={`${base.replace(/\/$/, '')}/logos/borgwarner-negro.png`} alt="BorgWarner" width="1902" height="161" class="mb-3 h-5 w-auto" />
      <h1 class="text-xl font-bold">Imagen del código QR</h1>
      <p class="mb-3 text-sm text-slate-600">
        Elige el formato, descarga la imagen y úsala en el tótem o la pantalla (no requiere internet). El QR abre <span class="font-mono">{url}</span>
      </p>

      <div class="mb-4 flex flex-wrap items-center gap-2" role="tablist">
        {VERSIONES.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === v.id} onClick={() => setV(x)}
            class={`rounded-lg px-4 py-2 text-left ${x.id === v.id ? 'bg-brand-600 text-brand-300' : 'bg-white ring-1 ring-slate-300'}`}>
            <span class="block font-semibold">{x.nombre}</span>
            <span class="block text-xs opacity-75">{x.detalle}</span>
          </button>
        ))}
        <button onClick={descargar} disabled={!canvas} class="ml-auto rounded-lg bg-brand-300 px-5 py-3 font-bold text-brand-600 disabled:opacity-50">
          ⬇ Descargar PNG
        </button>
      </div>

      {error && <p role="alert" class="rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>}
      {!canvas && !error && <p class="text-slate-500">Generando imagen…</p>}
      <div ref={caja} class="flex justify-center" />
    </main>
  );
}
