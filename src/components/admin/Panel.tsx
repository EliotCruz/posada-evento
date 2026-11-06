import { useEffect, useMemo, useState } from 'preact/hooks';
import type { Registro, Store } from '../../lib/types';
import { registrosACsv } from '../../lib/csv';

type Orden = 'numero' | 'nombre' | 'creado';

export default function Panel({ store }: { store: Store }) {
  const [regs, setRegs] = useState<Registro[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [soloTransporte, setSoloTransporte] = useState(false);
  const [orden, setOrden] = useState<Orden>('creado');

  useEffect(() => {
    store.totalNumeros().then(setTotal).catch(() => {});
    return store.suscribirRegistros(setRegs);
  }, [store]);

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    return regs
      .filter((r) => (!soloTransporte || r.transporte) &&
        (!t || [r.nombre, r.empleado, r.telefono, String(r.numero)].some((c) => c.toLowerCase().includes(t))))
      .sort((a, b) => orden === 'nombre' ? a.nombre.localeCompare(b.nombre, 'es')
        : orden === 'numero' ? a.numero - b.numero : b.creado - a.creado);
  }, [regs, q, soloTransporte, orden]);

  function descargar() {
    const blob = new Blob([registrosACsv(visibles)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `registros-posada-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function borrar(r: Registro) {
    if (confirm(`¿Eliminar el registro de ${r.nombre}? El número ${r.numero} quedará libre.`)) await store.eliminarRegistro(r);
  }

  const conTransporte = regs.filter((r) => r.transporte).length;
  const tarjeta = (t: string, v: string | number) => (
    <div class="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p class="text-sm text-slate-500">{t}</p><p class="text-3xl font-bold">{v}</p>
    </div>
  );

  return (
    <section class="space-y-4">
      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tarjeta('Registrados', regs.length)}
        {tarjeta('Piden transporte', conTransporte)}
        {tarjeta('Sin transporte', regs.length - conTransporte)}
        {tarjeta('Números disponibles', Math.max(total - regs.length, 0))}
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <input class="min-w-48 flex-1 rounded border px-3 py-2" placeholder="Buscar nombre, empleado, teléfono o número" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
        <label class="flex items-center gap-1"><input type="checkbox" checked={soloTransporte} onChange={(e) => setSoloTransporte((e.target as HTMLInputElement).checked)} /> Solo transporte</label>
        <select class="rounded border px-2 py-2" value={orden} onChange={(e) => setOrden((e.target as HTMLSelectElement).value as Orden)}>
          <option value="creado">Más recientes</option>
          <option value="numero">Por número</option>
          <option value="nombre">Por nombre</option>
        </select>
        <button class="rounded bg-slate-800 px-3 py-2 text-white" onClick={descargar} disabled={!visibles.length}>Exportar CSV</button>
      </div>

      <div class="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-100 text-slate-600">
            <tr>{['Núm.', 'Código', 'Nombre', 'Empleado', 'Teléfono', 'Transporte', 'Hora', ''].map((h) => <th class="px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {visibles.map((r) => (
              <tr key={r.empleado} class="border-t">
                <td class="px-3 py-2 font-bold">{r.numero}</td>
                <td class="px-3 py-2 font-mono">{r.codigo}</td>
                <td class="px-3 py-2">{r.nombre}</td>
                <td class="px-3 py-2">{r.empleado}</td>
                <td class="px-3 py-2">{r.telefono}</td>
                <td class="px-3 py-2">{r.transporte ? 'Sí' : 'No'}</td>
                <td class="px-3 py-2 whitespace-nowrap">{new Date(r.creado).toLocaleTimeString('es-MX')}</td>
                <td class="px-3 py-2"><button class="text-red-600 hover:underline" onClick={() => borrar(r)}>Eliminar</button></td>
              </tr>
            ))}
            {!visibles.length && <tr><td colSpan={8} class="px-3 py-8 text-center text-slate-500">Sin registros.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
