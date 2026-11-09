import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, getDoc, getDocs, setDoc, runTransaction, writeBatch, collection,
  query, where, limit, onSnapshot, orderBy, serverTimestamp, type Timestamp,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { firebaseConfig } from './firebase';
import { elegirAleatorio, generarCodigo } from './pool';
import { RegistroError, type Ganador, type Registro, type Store } from './types';

class NumeroOcupado extends Error {}
const MAX_INTENTOS_ALEATORIOS = 12;

const aMs = (t: unknown) => (t && typeof (t as Timestamp).toMillis === 'function' ? (t as Timestamp).toMillis() : Date.now());

export function crearFirestoreStore(): Store {
  const app = initializeApp(firebaseConfig as Record<string, string>);
  const db = getFirestore(app);
  const auth = getAuth(app);

  async function leerPool(): Promise<number[]> {
    const s = await getDoc(doc(db, 'meta', 'pool'));
    return (s.data()?.numeros as number[] | undefined) ?? [];
  }

  /** Reserva `n` y crea el registro de forma atómica. Lanza NumeroOcupado si ya estaba tomado. */
  function intentar(n: number, input: Parameters<Store['registrar']>[0]): Promise<Registro> {
    const registro = { ...input, numero: n, codigo: generarCodigo() };
    return runTransaction(db, async (tx) => {
      const nref = doc(db, 'numeros', String(n));
      const s = await tx.get(nref);
      if (s.exists() && s.data().tomado) throw new NumeroOcupado();
      tx.set(nref, { tomado: true });
      tx.set(doc(db, 'registros', input.empleado), { ...registro, creado: serverTimestamp() });
      return { ...registro, creado: Date.now() };
    });
  }

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

    async registrar(input) {
      let candidatos: number[];
      try { candidatos = await leerPool(); } catch { throw new RegistroError('red'); }
      if (!candidatos.length) throw new RegistroError('sin-numeros');

      const descartados = new Set<number>();
      const probar = async (n: number) => {
        try { return await intentar(n, input); }
        catch (e) {
          if (e instanceof NumeroOcupado) { descartados.add(n); return null; }
          const code = (e as { code?: string }).code;
          // Las reglas solo niegan la creación si el empleado ya existe (u otro dato inválido).
          if (code === 'permission-denied') throw new RegistroError('duplicado');
          throw new RegistroError('red');
        }
      };

      // 1) Intentos al azar sobre el pool completo (muy pocas lecturas mientras haya muchos libres).
      for (let i = 0; i < MAX_INTENTOS_ALEATORIOS; i++) {
        const libres = candidatos.filter((n) => !descartados.has(n));
        if (!libres.length) break;
        const r = await probar(elegirAleatorio(libres));
        if (r) return r;
      }
      // 2) Cuando quedan pocos: consultar cuáles siguen libres.
      for (let ronda = 0; ronda < 5; ronda++) {
        const snap = await getDocs(query(collection(db, 'numeros'), where('tomado', '==', false), limit(25)));
        const libres = snap.docs.map((d) => Number(d.id)).filter((n) => !descartados.has(n));
        if (!libres.length) break;
        const r = await probar(elegirAleatorio(libres));
        if (r) return r;
      }
      throw new RegistroError('sin-numeros');
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
    totalNumeros: async () => (await leerPool()).length,

    async eliminarRegistro(r) {
      const b = writeBatch(db);
      b.delete(doc(db, 'registros', r.empleado));
      b.set(doc(db, 'numeros', String(r.numero)), { tomado: false });
      await b.commit();
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
