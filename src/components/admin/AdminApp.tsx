import { useEffect, useState } from 'preact/hooks';
import { getStore } from '../../lib/store';
import type { Store } from '../../lib/types';
import Panel from './Panel';
import Sorteo from './Sorteo';

interface Props { vista: 'panel' | 'sorteo'; base: string }

export default function AdminApp({ vista, base }: Props) {
  const [store, setStore] = useState<Store | null>(null);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let off = () => {};
    getStore().then((s) => { setStore(s); off = s.onAuth(setAdmin); });
    return () => off();
  }, []);

  if (!store || admin === null) return <p class="p-6 text-center text-slate-500">Cargando…</p>;

  if (!admin) {
    return (
      <form class="mx-auto mt-16 max-w-sm space-y-3 rounded-2xl bg-white p-6 shadow" onSubmit={async (e) => {
        e.preventDefault(); setError('');
        try { await store.login(email, pass); } catch (x) { setError((x as Error).message || 'No se pudo iniciar sesión.'); }
      }}>
        <h1 class="text-xl font-bold">Acceso administrador</h1>
        {store.modo === 'demo' && <p class="rounded bg-amber-100 px-3 py-2 text-sm text-amber-800">Modo demo: usa cualquier correo y la contraseña <b>demo</b>.</p>}
        <input class="w-full rounded border px-3 py-2" type="email" placeholder="Correo" required value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} />
        <input class="w-full rounded border px-3 py-2" type="password" placeholder="Contraseña" required value={pass} onInput={(e) => setPass((e.target as HTMLInputElement).value)} />
        {error && <p role="alert" class="text-sm text-red-600">{error}</p>}
        <button class="w-full rounded bg-brand-600 py-2 font-semibold text-white">Entrar</button>
        {admin === false && email === '' && <p class="text-xs text-slate-500">Solo cuentas registradas como administrador pueden ver los datos.</p>}
      </form>
    );
  }

  const link = (v: string, t: string, activo: boolean) => (
    <a href={`${base.replace(/\/$/, '')}/admin${v}`} class={`rounded px-3 py-1.5 ${activo ? 'bg-brand-600 text-white' : 'bg-white ring-1 ring-slate-300'}`}>{t}</a>
  );

  return (
    <div class="mx-auto max-w-6xl p-4">
      <nav class="mb-4 flex flex-wrap items-center gap-2">
        <a href={`${base.replace(/\/$/, '')}/`} class="rounded bg-white px-3 py-1.5 ring-1 ring-slate-300">← Menú</a>
        {link('/', 'Registros', vista === 'panel')}
        {link('/sorteo/', 'Sorteo', vista === 'sorteo')}
        {store.modo === 'demo' && <span class="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">MODO DEMO</span>}
        <button class="ml-auto rounded px-3 py-1.5 ring-1 ring-slate-300" onClick={() => store.logout()}>Salir</button>
      </nav>
      {vista === 'panel' ? <Panel store={store} /> : <Sorteo store={store} />}
    </div>
  );
}
