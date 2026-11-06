import type { Store } from './types';
import { hayFirebase } from './firebase';

let instancia: Promise<Store> | null = null;

/** Devuelve el store de Firestore si hay config; si no, el modo demo (localStorage). */
export function getStore(): Promise<Store> {
  instancia ??= hayFirebase
    ? import('./firestoreStore').then((m) => m.crearFirestoreStore())
    : import('./localStore').then((m) => m.crearLocalStore());
  return instancia;
}
