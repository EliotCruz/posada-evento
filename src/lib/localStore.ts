// MODO DEMO: guarda todo en localStorage del navegador (sin Firebase).
// Sirve para probar el flujo; los datos NO se comparten entre dispositivos.
import pool from '../data/numeros-prueba.json';
import { elegirAleatorio, generarCodigo } from './pool';
import { RegistroError, type Ganador, type Registro, type Store } from './types';

const K_REG = 'posada:registros';
const K_GAN = 'posada:ganadores';
const K_AUTH = 'posada:admin';

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

export function crearLocalStore(numeros: number[] = pool as number[]): Store {
  return {
    modo: 'demo',
    async registrar(input) {
      const regs = leer<Registro>(K_REG);
      if (regs.some((r) => r.empleado === input.empleado)) throw new RegistroError('duplicado');
      const usados = new Set(regs.map((r) => r.numero));
      const libres = numeros.filter((n) => !usados.has(n));
      if (!libres.length) throw new RegistroError('sin-numeros');
      const r: Registro = { ...input, numero: elegirAleatorio(libres), codigo: generarCodigo(), creado: Date.now() };
      escribir(K_REG, [...regs, r]);
      return r;
    },
    suscribirRegistros: (cb) => suscribir<Registro>(K_REG, cb),
    suscribirGanadores: (cb) => suscribir<Ganador>(K_GAN, cb),
    totalNumeros: async () => numeros.length,
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
