import type { RegistroInput } from './types';

export interface FormRaw {
  nombre: string;
  telefono: string;
  empleado: string;
  transporte: boolean | null;
}
export type Errores = Partial<Record<keyof FormRaw, string>>;

export const soloDigitos = (s: string) => s.replace(/\D/g, '');
export const normalizarEmpleado = (s: string) => s.trim().toUpperCase();

export function validar(f: FormRaw): Errores {
  const e: Errores = {};
  const palabras = f.nombre.trim().split(/\s+/).filter((p) => p.length >= 2);
  if (palabras.length < 2 || f.nombre.trim().length > 100) e.nombre = 'Escribe tu nombre completo (nombre y apellido).';
  if (soloDigitos(f.telefono).length !== 10) e.telefono = 'El teléfono debe tener 10 dígitos.';
  if (!/^[A-Z0-9-]{1,20}$/.test(normalizarEmpleado(f.empleado))) e.empleado = 'Número de empleado inválido (letras, números o guion).';
  if (f.transporte === null) e.transporte = 'Indica si necesitas transporte.';
  return e;
}

export function limpiar(f: FormRaw): RegistroInput {
  return {
    nombre: f.nombre.trim().replace(/\s+/g, ' '),
    telefono: soloDigitos(f.telefono),
    empleado: normalizarEmpleado(f.empleado),
    transporte: f.transporte === true,
  };
}
