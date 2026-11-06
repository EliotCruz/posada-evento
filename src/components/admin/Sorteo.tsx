import { useEffect, useState } from 'preact/hooks';
import type { Ganador, Registro, Store } from '../../lib/types';

export default function Sorteo({ store }: { store: Store }) {
  const [regs, setRegs] = useState<Registro[]>([]);
  const [gans, setGans] = useState<Ganador[]>([]);
  const [num, setNum] = useState('');
  const [actual, setActual] = useState<Registro | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const a = store.suscribirRegistros(setRegs);
    const b = store.suscribirGanadores(setGans);
    return () => { a(); b(); };
  }, [store]);

  async function buscar(e: Event) {
    e.preventDefault();
    const n = Number(num);
    const r = regs.find((x) => x.numero === n);
    if (!r) { setActual(null); setMsg(`El número ${num} no tiene un registro (nadie lo ha tomado).`); return; }
    setMsg(gans.some((g) => g.numero === n) ? 'Ese número ya había ganado antes.' : '');
    setActual(r);
    await store.marcarGanador(r);
    setNum('');
  }

  return (
    <section class="space-y-6">
      <form class="flex gap-2" onSubmit={buscar}>
        <input class="w-full max-w-xs rounded border px-4 py-3 text-2xl" inputMode="numeric" placeholder="Número ganador" value={num} onInput={(e) => setNum((e.target as HTMLInputElement).value)} autofocus />
        <button class="rounded bg-emerald-600 px-5 py-3 text-lg font-semibold text-white">Mostrar</button>
        <button type="button" class="rounded px-3 py-3 ring-1 ring-slate-300" onClick={() => document.documentElement.requestFullscreen?.()}>Pantalla completa</button>
      </form>
      {msg && <p role="alert" class="rounded bg-amber-100 px-3 py-2 text-amber-800">{msg}</p>}

      {actual && (
        <div class="rounded-3xl bg-white p-10 text-center shadow-xl ring-2 ring-emerald-300">
          <p class="text-2xl text-slate-500">Número ganador</p>
          <p class="text-9xl font-extrabold text-emerald-600">{actual.numero}</p>
          <p class="mt-4 text-5xl font-bold">{actual.nombre}</p>
          <p class="mt-6 text-xl uppercase tracking-wide text-slate-500">Código de verificación</p>
          <p class="font-mono text-6xl font-bold tracking-widest">{actual.codigo}</p>
        </div>
      )}

      <div>
        <h2 class="mb-2 text-lg font-semibold">Ganadores anteriores</h2>
        <ul class="divide-y rounded-xl bg-white ring-1 ring-slate-200">
          {gans.map((g) => (
            <li key={g.numero} class="flex justify-between px-4 py-2"><span><b>{g.numero}</b> · {g.nombre}</span><span class="font-mono">{g.codigo}</span></li>
          ))}
          {!gans.length && <li class="px-4 py-3 text-slate-500">Aún no hay ganadores.</li>}
        </ul>
      </div>
    </section>
  );
}
