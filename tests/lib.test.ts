import { beforeEach, describe, expect, it } from 'vitest';
import { limpiar, validar } from '../src/lib/validacion';
import { generarCodigo } from '../src/lib/pool';
import { registrosACsv } from '../src/lib/csv';
import { crearLocalStore } from '../src/lib/localStore';

const ok = { nombre: 'Ana López', telefono: '(477) 123-4567', empleado: ' a-123 ', transporte: true };

describe('validacion', () => {
  it('acepta datos correctos y los normaliza', () => {
    expect(validar(ok)).toEqual({});
    expect(limpiar(ok)).toEqual({ nombre: 'Ana López', telefono: '4771234567', empleado: 'A-123', transporte: true });
  });
  it('rechaza datos inválidos', () => {
    const e = validar({ nombre: 'Ana', telefono: '123', empleado: '', transporte: null });
    expect(Object.keys(e).sort()).toEqual(['empleado', 'nombre', 'telefono', 'transporte']);
  });
});

describe('pool', () => {
  it('genera códigos con formato XXX-XXX', () => {
    for (let i = 0; i < 50; i++) expect(generarCodigo()).toMatch(/^[A-Z2-9]{3}-[A-Z2-9]{3}$/);
  });
});

describe('csv', () => {
  it('escapa comas, comillas y fórmulas', () => {
    const csv = registrosACsv([{ empleado: '1', nombre: '=SUMA(1)', telefono: '4771234567', transporte: false, numero: 7, codigo: 'AAA-BBB', creado: 0 }]);
    expect(csv).toContain("'=SUMA(1)");
    expect(csv.startsWith('﻿')).toBe(true);
  });
});

describe('localStore (modo demo)', () => {
  beforeEach(() => {
    const mem = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    };
  });

  it('asigna números consecutivos desde 1 y bloquea empleados duplicados', async () => {
    const s = crearLocalStore();
    const base = { nombre: 'Ana López', telefono: '4771234567', transporte: false };
    const a = await s.registrar({ ...base, empleado: 'E1' });
    const b = await s.registrar({ ...base, empleado: 'E2' });
    expect([a.numero, b.numero]).toEqual([1, 2]);
    await expect(s.registrar({ ...base, empleado: 'E1' })).rejects.toMatchObject({ codigo: 'duplicado' });
    const c = await s.registrar({ ...base, empleado: 'E3' }); // el duplicado rechazado no consume número
    expect(c.numero).toBe(3);
  });

  it('al eliminar un registro la numeración no se reutiliza', async () => {
    const s = crearLocalStore();
    const base = { nombre: 'Ana López', telefono: '4771234567', transporte: true };
    const a = await s.registrar({ ...base, empleado: 'E1' });
    await s.eliminarRegistro(a);
    await expect(s.registrar({ ...base, empleado: 'E2' })).resolves.toMatchObject({ numero: 2 });
  });

  it('500 registros seguidos no repiten número y son 1…500', async () => {
    const s = crearLocalStore();
    const rs = [];
    for (let i = 0; i < 500; i++) rs.push(await s.registrar({ nombre: 'Ana López', telefono: '4771234567', transporte: false, empleado: `E${i}` }));
    expect(rs.map((r) => r.numero)).toEqual(Array.from({ length: 500 }, (_, i) => i + 1));
  });
});
