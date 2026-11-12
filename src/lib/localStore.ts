// MODO DEMO: guarda todo en localStorage del navegador (sin Firebase).
// Sirve para probar el flujo; los datos NO se comparten entre dispositivos.
import { generarCodigo } from './pool';
import { RegistroError, type Ganador, type Registro, type Store } from './types';

const K_REG = 'posada:registros';
const K_GAN = 'posada:ganadores';
const K_AUTH = 'posada:admin';
const K_CNT = 'posada:contador';

function leer<T>(k: string): T[] {
  try { return JSON.parse(localStorage.getItem(k) ?? '[]'); } catch { return []; }
}
const escribir = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

function suscribir<T>(k: string, cb: (v: T[]) => void) {
  const emitir = () => cb(leer<T>(k));
  emitir();
  const id = setInterval(emitir, 1000); // refleja otras pestañas
  return () => clearInterval(id);
}

export function crearLocalStore(total = 500): Store {
  return {
    modo: 'demo',
    async buscarEmpleado(empleado) { return /^[A-Z0-9-]{1,20}$/.test(empleado) ? `Colaborador ${empleado}` : null; },
    async registrar(input) {
      const regs = leer<Registro>(K_REG);
      if (regs.some((r) => r.empleado === input.empleado)) throw new RegistroError('duplicado');
      const n = Number(localStorage.getItem(K_CNT) ?? 0) + 1; // consecutivo: 1, 2, 3…
      localStorage.setItem(K_CNT, String(n));
      const r: Registro = { ...input, numero: n, codigo: generarCodigo(), creado: Date.now() };
      escribir(K_REG, [...regs, r]);
      return r;
    },
    suscribirRegistros: (cb) => suscribir<Registro>(K_REG, cb),
    suscribirGanadores: (cb) => suscribir<Ganador>(K_GAN, cb),
    totalNumeros: async () => total,
    async eliminarRegistro(r) {
      escribir(K_REG, leer<Registro>(K_REG).filter((x) => x.empleado !== r.empleado));
    },
    async marcarGanador(r) {
      const gs = leer<Ganador>(K_GAN).filter((g) => g.numero !== r.numero);
      escribir(K_GAN, [...gs, { numero: r.numero, nombre: r.nombre, empleado: r.empleado, codigo: r.codigo, fecha: Date.now() }]);
    },
    async login(_email, password) {
      if (password !== 'demo') throw new Error('En modo demo la contraseña es "demo".');
      localStorage.setItem(K_AUTH, '1');
    },
    async logout() { localStorage.removeItem(K_AUTH); },
    onAuth(cb) { cb(localStorage.getItem(K_AUTH) === '1'); return () => {}; },
  };
}
