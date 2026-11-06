// Carga el pool de números de sorteo a Firestore.
// Uso:  GOOGLE_APPLICATION_CREDENTIALS=serviceAccount.json node scripts/seed-numeros.mjs [archivo.json]
// El archivo es un arreglo de enteros, p. ej. [1,2,3,...]. Por defecto usa src/data/numeros-prueba.json.
// NO versiones el archivo real ni la cuenta de servicio (ver .gitignore: data-real/, serviceAccount*.json).
import { readFileSync } from 'node:fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const archivo = process.argv[2] ?? 'src/data/numeros-prueba.json';
const numeros = JSON.parse(readFileSync(archivo, 'utf8'));
if (!Array.isArray(numeros) || !numeros.every(Number.isInteger) || new Set(numeros).size !== numeros.length) {
  throw new Error('El archivo debe ser un arreglo de enteros sin repetidos.');
}

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

await db.doc('meta/pool').set({ numeros });
for (let i = 0; i < numeros.length; i += 400) {
  const batch = db.batch();
  for (const n of numeros.slice(i, i + 400)) batch.set(db.doc(`numeros/${n}`), { tomado: false });
  await batch.commit();
}
console.log(`Pool cargado: ${numeros.length} números desde ${archivo}`);
