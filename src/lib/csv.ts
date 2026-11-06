import type { Registro } from './types';

function celda(v: string | number): string {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // evita inyección de fórmulas en Excel
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function registrosACsv(rs: Registro[]): string {
  const filas = [['Numero sorteo', 'Codigo', 'Nombre', 'No. empleado', 'Telefono', 'Transporte', 'Registrado']];
  for (const r of rs) {
    filas.push([
      String(r.numero), r.codigo, r.nombre, r.empleado, r.telefono,
      r.transporte ? 'Si' : 'No', new Date(r.creado).toLocaleString('es-MX'),
    ]);
  }
  return '﻿' + filas.map((f) => f.map(celda).join(',')).join('\r\n');
}
