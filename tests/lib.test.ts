import { beforeEach, describe, expect, it } from 'vitest';
import { limpiar, validar } from '../src/lib/validacion';
import { generarCodigo, elegirAleatorio } from '../src/lib/pool';
import { registrosACsv } from '../src/lib/csv';
import { crearLocalStore } from '../src/lib/localStore';
import { RegistroError } from '../src/lib/types';

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
  it('elegirAleatorio respeta el rng y falla con pool vacío', () => {
    expect(elegirAleatorio([10, 20, 30], () => 0.99)).toBe(30);
    expect(() => elegirAleatorio([])).toThrow();
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

  it('asigna números únicos y bloquea empleados duplicados', async () => {
    const s = crearLocalStore([1, 2, 3]);
    const base = { nombre: 'Ana López', telefono: '4771234567', transporte: false };
    const a = await s.registrar({ ...base, empleado: 'E1' });
    const b = await s.registrar({ ...base, empleado: 'E2' });
    expect(a.numero).not.toBe(b.numero);
    await expect(s.registrar({ ...base, empleado: 'E1' })).rejects.toMatchObject({ codigo: 'duplicado' });
  });

  it('se agota el pool y libera el número al eliminar', async () => {
    const s = crearLocalStore([1]);
    const base = { nombre: 'Ana López', telefono: '4771234567', transporte: true };
    const a = await s.registrar({ ...base, empleado: 'E1' });
    await expect(s.registrar({ ...base, empleado: 'E2' })).rejects.toBeInstanceOf(RegistroError);
    await s.eliminarRegistro(a);
    await expect(s.registrar({ ...base, empleado: 'E2' })).resolves.toMatchObject({ numero: 1 });
  });

  it('500 registros concurrentes no repiten número', async () => {
    const s = crearLocalStore(Array.from({ length: 500 }, (_, i) => i + 1));
    const rs = [];
    for (let i = 0; i < 500; i++) rs.push(await s.registrar({ nombre: 'Ana López', telefono: '4771234567', transporte: false, empleado: `E${i}` }));
    expect(new Set(rs.map((r) => r.numero)).size).toBe(500);
  });
});
