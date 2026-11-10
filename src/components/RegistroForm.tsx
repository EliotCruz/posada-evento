import { useEffect, useRef, useState } from 'preact/hooks';
import { getStore } from '../lib/store';
import { limpiar, normalizarEmpleado, validar, type Errores, type FormRaw } from '../lib/validacion';
import { RegistroError, type Registro } from '../lib/types';

const K = 'posada:mi-registro';
const vacio: FormRaw = { nombre: '', telefono: '', empleado: '', transporte: null };

const MENSAJES: Record<string, string> = {
  duplicado: 'Este número de empleado ya está registrado. Si ya te registraste, revisa tu pantalla anterior o pide ayuda al organizador.',
  'sin-numeros': 'Ya no hay números de sorteo disponibles. Avisa al organizador.',
  red: 'No pudimos guardar tu registro. Revisa tu conexión e inténtalo de nuevo.',
  invalido: 'Revisa los datos del formulario.',
};

type Busqueda = { estado: 'idle' | 'buscando' | 'ok' | 'no' | 'red'; nombre?: string };

export default function RegistroForm() {
  const [f, setF] = useState<FormRaw>(vacio);
  const [err, setErr] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState<Registro | null>(null);
  const [demo, setDemo] = useState(false);
  const [busq, setBusq] = useState<Busqueda>({ estado: 'idle' });
  const ultima = useRef('');

  useEffect(() => {
    try { const g = localStorage.getItem(K); if (g) setListo(JSON.parse(g)); } catch {}
    getStore().then((s) => setDemo(s.modo === 'demo'));
  }, []);

  /** Consulta el padrón cada vez que cambia el número de empleado. */
  async function cambiaEmpleado(valor: string) {
    const emp = normalizarEmpleado(valor);
    setF((p) => ({ ...p, empleado: valor, nombre: '' }));
    ultima.current = emp;
    if (!/^[A-Z0-9-]{3,20}$/.test(emp)) { setBusq({ estado: 'idle' }); return; }
    setBusq({ estado: 'buscando' });
    try {
      const nombre = await (await getStore()).buscarEmpleado(emp);
      if (ultima.current !== emp) return; // llegó tarde: el usuario ya escribió otro
      if (nombre) { setBusq({ estado: 'ok', nombre }); setF((p) => ({ ...p, nombre })); }
      else setBusq({ estado: 'no' });
    } catch {
      if (ultima.current === emp) setBusq({ estado: 'red' });
    }
  }

  async function enviar(e: Event) {
    e.preventDefault();
    if (busq.estado !== 'ok') { setErr({ empleado: 'Escribe un número de empleado de la lista de invitados.' }); return; }
    const v = validar(f);
    setErr(v);
    if (Object.keys(v).length) return;
    setEnviando(true); setError('');
    try {
      const r = await (await getStore()).registrar(limpiar(f));
      try { localStorage.setItem(K, JSON.stringify(r)); } catch {}
      setListo(r);
    } catch (x) {
      setError(MENSAJES[x instanceof RegistroError ? x.codigo : 'red']);
    } finally { setEnviando(false); }
  }

  if (listo) {
    return (
      <section class="mx-auto max-w-md p-5 text-center" aria-live="polite">
        <img src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/logos/borgwarner-negro.png`} alt="BorgWarner" width="1902" height="161" class="mx-auto mb-4 h-5 w-auto" />
        <div class="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
          <div class="bg-brand-600 px-6 py-4">
            <p class="text-sm font-semibold uppercase tracking-widest text-brand-300">Registro exitoso</p>
          </div>
          <div class="p-6">
            <p class="text-lg font-semibold">{listo.nombre}</p>
            <p class="mt-5 text-sm uppercase tracking-wide text-slate-500">Tu número de sorteo</p>
            <p class="mx-auto mt-1 inline-block rounded-xl bg-brand-600 px-8 py-2 text-7xl font-extrabold text-brand-300">{listo.numero}</p>
            <p class="mt-5 text-sm uppercase tracking-wide text-slate-500">Código de verificación</p>
            <p class="font-mono text-3xl font-bold tracking-widest">{listo.codigo}</p>
            <p class="mt-5 text-sm text-slate-500">Guarda o toma captura de esta pantalla. Si ganas, te pediremos tu código.</p>
          </div>
        </div>
      </section>
    );
  }

  const campo = 'mt-1 w-full rounded-lg border border-[#d9c49a] bg-white px-3 py-3 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-300';
  return (
    <form class="mx-auto max-w-md space-y-4 p-5" onSubmit={enviar} noValidate>
      {demo && <p class="rounded bg-amber-100 px-3 py-2 text-sm text-amber-800">Modo demo: los datos solo se guardan en este navegador.</p>}
      <header class="text-center">
        <img src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/logos/borgwarner-negro.png`} alt="BorgWarner" width="1902" height="161" class="mx-auto mb-3 h-5 w-auto" />
        <h1 class="text-2xl font-bold">¡Regístrate para la gran rifa!</h1>
        <p class="text-slate-600">Posada 2026</p>
      </header>

      <label class="block">
        <span class="font-medium">Número de empleado</span>
        <input class={campo} inputMode="numeric" autocapitalize="characters" autocomplete="off" value={f.empleado} onInput={(e) => cambiaEmpleado((e.target as HTMLInputElement).value)} />
        <span class="mt-1 block min-h-5 text-sm" aria-live="polite">
          {busq.estado === 'buscando' && <span class="text-slate-500">Buscando…</span>}
          {busq.estado === 'ok' && <span class="font-semibold text-brand-500">✓ {busq.nombre}</span>}
          {busq.estado === 'no' && <span class="text-red-600">No encontramos ese número en la lista de invitados. Revísalo o pide ayuda al organizador.</span>}
          {busq.estado === 'red' && <span class="text-red-600">No pudimos consultar la lista. Revisa tu conexión.</span>}
          {err.empleado && busq.estado !== 'no' && <span class="text-red-600">{err.empleado}</span>}
        </span>
      </label>

      <label class="block">
        <span class="font-medium">Teléfono (10 dígitos)</span>
        <input class={campo} type="tel" inputMode="numeric" autocomplete="tel" value={f.telefono} onInput={(e) => setF({ ...f, telefono: (e.target as HTMLInputElement).value })} />
        {err.telefono && <span class="text-sm text-red-600">{err.telefono}</span>}
      </label>

      <fieldset>
        <legend class="font-medium">¿Necesitas transporte?</legend>
        <div class="mt-1 grid grid-cols-2 gap-3">
          {[true, false].map((v) => (
            <label key={String(v)} class={`cursor-pointer rounded-lg border px-3 py-3 text-center ${f.transporte === v ? 'border-brand-600 bg-brand-600 font-semibold text-brand-300' : 'border-slate-300 bg-white'}`}>
              <input type="radio" name="transporte" class="sr-only" checked={f.transporte === v} onChange={() => setF({ ...f, transporte: v })} />
              {v ? 'Sí' : 'No'}
            </label>
          ))}
        </div>
        {err.transporte && <span class="text-sm text-red-600">{err.transporte}</span>}
      </fieldset>

      {error && <p role="alert" class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button disabled={enviando || busq.estado !== 'ok'} class="w-full rounded-lg bg-brand-600 py-3 text-lg font-semibold text-brand-300 disabled:opacity-50">
        {enviando ? 'Guardando…' : 'Registrarme'}
      </button>
      <p class="text-xs text-slate-500">
        Aviso de privacidad: tus datos se usan solo para el sorteo y la logística de transporte de este evento y se eliminarán al terminar.
      </p>
    </form>
  );
}
