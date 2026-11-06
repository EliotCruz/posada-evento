import { useEffect, useState } from 'preact/hooks';
import { getStore } from '../lib/store';
import { limpiar, validar, type Errores, type FormRaw } from '../lib/validacion';
import { RegistroError, type Registro } from '../lib/types';

const K = 'posada:mi-registro';
const vacio: FormRaw = { nombre: '', telefono: '', empleado: '', transporte: null };

const MENSAJES: Record<string, string> = {
  duplicado: 'Este número de empleado ya está registrado. Si ya te registraste, revisa tu pantalla anterior o pide ayuda al organizador.',
  'sin-numeros': 'Ya no hay números de sorteo disponibles. Avisa al organizador.',
  red: 'No pudimos guardar tu registro. Revisa tu conexión e inténtalo de nuevo.',
  invalido: 'Revisa los datos del formulario.',
};

export default function RegistroForm() {
  const [f, setF] = useState<FormRaw>(vacio);
  const [err, setErr] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState<Registro | null>(null);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    try { const g = localStorage.getItem(K); if (g) setListo(JSON.parse(g)); } catch {}
    getStore().then((s) => setDemo(s.modo === 'demo'));
  }, []);

  async function enviar(e: Event) {
    e.preventDefault();
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
        <div class="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-emerald-200">
          <p class="text-5xl">🎉</p>
          <h1 class="mt-2 text-2xl font-bold text-emerald-700">¡Registro exitoso!</h1>
          <p class="mt-1 text-slate-600">{listo.nombre}</p>
          <p class="mt-5 text-sm uppercase tracking-wide text-slate-500">Tu número de sorteo</p>
          <p class="text-7xl font-extrabold text-emerald-600">{listo.numero}</p>
          <p class="mt-4 text-sm uppercase tracking-wide text-slate-500">Código de verificación</p>
          <p class="font-mono text-3xl font-bold tracking-widest">{listo.codigo}</p>
          <p class="mt-5 text-sm text-slate-500">Guarda o toma captura de esta pantalla. Si ganas, te pediremos tu código.</p>
        </div>
      </section>
    );
  }

  const campo = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200';
  return (
    <form class="mx-auto max-w-md space-y-4 p-5" onSubmit={enviar} noValidate>
      {demo && <p class="rounded bg-amber-100 px-3 py-2 text-sm text-amber-800">Modo demo: los datos solo se guardan en este navegador.</p>}
      <header class="text-center">
        <p class="text-4xl">🎄</p>
        <h1 class="text-2xl font-bold">Registro Posada</h1>
        <p class="text-slate-600">Regístrate para participar en el sorteo.</p>
      </header>

      <label class="block">
        <span class="font-medium">Nombre completo</span>
        <input class={campo} autocomplete="name" value={f.nombre} onInput={(e) => setF({ ...f, nombre: (e.target as HTMLInputElement).value })} />
        {err.nombre && <span class="text-sm text-red-600">{err.nombre}</span>}
      </label>

      <label class="block">
        <span class="font-medium">Teléfono (10 dígitos)</span>
        <input class={campo} type="tel" inputMode="numeric" autocomplete="tel" value={f.telefono} onInput={(e) => setF({ ...f, telefono: (e.target as HTMLInputElement).value })} />
        {err.telefono && <span class="text-sm text-red-600">{err.telefono}</span>}
      </label>

      <label class="block">
        <span class="font-medium">Número de empleado</span>
        <input class={campo} inputMode="text" autocapitalize="characters" value={f.empleado} onInput={(e) => setF({ ...f, empleado: (e.target as HTMLInputElement).value })} />
        {err.empleado && <span class="text-sm text-red-600">{err.empleado}</span>}
      </label>

      <fieldset>
        <legend class="font-medium">¿Necesitas transporte?</legend>
        <div class="mt-1 grid grid-cols-2 gap-3">
          {[true, false].map((v) => (
            <label key={String(v)} class={`cursor-pointer rounded-lg border px-3 py-3 text-center ${f.transporte === v ? 'border-emerald-600 bg-emerald-50 font-semibold' : 'border-slate-300 bg-white'}`}>
              <input type="radio" name="transporte" class="sr-only" checked={f.transporte === v} onChange={() => setF({ ...f, transporte: v })} />
              {v ? 'Sí' : 'No'}
            </label>
          ))}
        </div>
        {err.transporte && <span class="text-sm text-red-600">{err.transporte}</span>}
      </fieldset>

      {error && <p role="alert" class="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button disabled={enviando} class="w-full rounded-lg bg-emerald-600 py-3 text-lg font-semibold text-white disabled:opacity-60">
        {enviando ? 'Guardando…' : 'Guardar'}
      </button>
      <p class="text-xs text-slate-500">
        Aviso de privacidad: tus datos se usan solo para el sorteo y la logística de transporte de este evento y se eliminarán al terminar.
      </p>
    </form>
  );
}
