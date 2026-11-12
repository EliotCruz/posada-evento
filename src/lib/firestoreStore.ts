import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, runTransaction, collection, getCountFromServer,
  onSnapshot, query, orderBy, serverTimestamp, type Timestamp,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { firebaseConfig } from './firebase';
import { generarCodigo } from './pool';
import { RegistroError, type Ganador, type Registro, type Store } from './types';

const MAX_INTENTOS = 8; // la transacción del contador se reintenta cuando varias personas se registran a la vez
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

const aMs = (t: unknown) => (t && typeof (t as Timestamp).toMillis === 'function' ? (t as Timestamp).toMillis() : Date.now());

export function crearFirestoreStore(): Store {
  const app = initializeApp(firebaseConfig as Record<string, string>);
  const db = getFirestore(app);
  const auth = getAuth(app);

  return {
    modo: 'firebase',

    async buscarEmpleado(empleado) {
      try {
        const s = await getDoc(doc(db, 'padron', empleado));
        return s.exists() ? (s.data().nombre as string) : null;
      } catch (e) {
        if ((e as { code?: string }).code === 'permission-denied') return null;
        throw new RegistroError('red');
      }
    },

    /** Número de sorteo consecutivo (1, 2, 3…): se toma del contador y se crea el registro en la misma transacción. */
    async registrar(input) {
      for (let intento = 1; ; intento++) {
        try {
          return await runTransaction(db, async (tx) => {
            const cref = doc(db, 'meta', 'contador');
            const n = ((await tx.get(cref)).data()?.ultimo ?? 0) + 1;
            const registro = { ...input, numero: n, codigo: generarCodigo() };
            tx.set(cref, { ultimo: n });
            tx.set(doc(db, 'registros', input.empleado), { ...registro, creado: serverTimestamp() });
            return { ...registro, creado: Date.now() } as Registro;
          });
        } catch (e) {
          const code = (e as { code?: string }).code;
          // Las reglas solo niegan la creación si el empleado ya está registrado (o el dato no es válido).
          if (code === 'permission-denied') throw new RegistroError('duplicado');
          // Contención en el contador (muchos registros simultáneos): reintentar con una pausa aleatoria.
          if ((code === 'aborted' || code === 'failed-precondition' || code === 'unavailable') && intento < MAX_INTENTOS) {
            await espera(80 + Math.random() * 320 * intento);
            continue;
          }
          throw new RegistroError('red');
        }
      }
    },

    suscribirRegistros(cb) {
      return onSnapshot(query(collection(db, 'registros'), orderBy('creado', 'desc')), (s) =>
        cb(s.docs.map((d) => ({ ...(d.data() as Registro), empleado: d.id, creado: aMs(d.data().creado) }))),
      );
    },
    suscribirGanadores(cb) {
      return onSnapshot(query(collection(db, 'ganadores'), orderBy('fecha', 'desc')), (s) =>
        cb(s.docs.map((d) => ({ ...(d.data() as Ganador), fecha: aMs(d.data().fecha) }))),
      );
    },
    totalNumeros: async () => (await getCountFromServer(collection(db, 'padron'))).data().count,

    async eliminarRegistro(r) {
      await deleteDoc(doc(db, 'registros', r.empleado)); // el número queda sin usar: la numeración no se reutiliza
    },
    async marcarGanador(r) {
      await setDoc(doc(db, 'ganadores', String(r.numero)), {
        numero: r.numero, nombre: r.nombre, empleado: r.empleado, codigo: r.codigo, fecha: serverTimestamp(),
      });
    },

    async login(email, password) { await signInWithEmailAndPassword(auth, email, password); },
    logout: () => signOut(auth),
    onAuth(cb) {
      return onAuthStateChanged(auth, async (u) => {
        if (!u) return cb(false);
        try { cb((await getDoc(doc(db, 'admins', u.uid))).exists()); } catch { cb(false); }
      });
    },
  };
}
