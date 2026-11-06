export interface Registro {
  empleado: string;      // ID del documento (número de empleado normalizado)
  nombre: string;
  telefono: string;      // 10 dígitos
  transporte: boolean;
  numero: number;        // número de sorteo
  codigo: string;        // código de verificación
  creado: number;        // epoch ms
}

export interface Ganador {
  numero: number;
  nombre: string;
  empleado: string;
  codigo: string;
  fecha: number;
}

export type RegistroInput = Pick<Registro, 'nombre' | 'telefono' | 'empleado' | 'transporte'>;

export type CodigoError = 'duplicado' | 'sin-numeros' | 'invalido' | 'red';
export class RegistroError extends Error {
  constructor(public codigo: CodigoError, mensaje?: string) {
    super(mensaje ?? codigo);
  }
}

export type Unsub = () => void;

export interface Store {
  modo: 'demo' | 'firebase';
  registrar(input: RegistroInput): Promise<Registro>;
  suscribirRegistros(cb: (r: Registro[]) => void): Unsub;
  suscribirGanadores(cb: (g: Ganador[]) => void): Unsub;
  totalNumeros(): Promise<number>;
  eliminarRegistro(r: Registro): Promise<void>;
  marcarGanador(r: Registro): Promise<void>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  onAuth(cb: (admin: boolean) => void): Unsub;
}
