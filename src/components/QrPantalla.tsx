import { useEffect, useRef, useState } from 'preact/hooks';
import QRCode from 'qrcode';
import { Arbol, Guirnalda, Regalos } from './Decoracion';

export default function QrPantalla({ base }: { base: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState('');
  const b = base.replace(/\/$/, '');

  useEffect(() => {
    const u = `${location.origin}${b}/registro/`;
    setUrl(u);
    const c = canvas.current;
    if (c) {
      QRCode.toCanvas(c, u, { width: 800, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0b1215', light: '#ffffff' } })
        .then(() => { c.style.width = ''; c.style.height = ''; }); // la librería fija px inline; el tamaño lo da CSS
    }
  }, [b]);

  return (
    <main class="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#fbf7ef] text-center text-[#0b1215]">
      <Guirnalda class="pointer-events-none absolute inset-x-0 top-0 h-[16vh] min-h-24 w-full" />

      <div class="relative z-10 mt-[15vh] flex w-full max-w-3xl flex-1 flex-col items-center gap-[2.2vh] px-6 pb-2">
        <img src={`${b}/logos/borgwarner-negro.png`} alt="BorgWarner" width="1902" height="161" class="h-[3.4vh] min-h-5 w-auto max-w-[80%]" />

        <p class="text-[clamp(1.25rem,3.4vh,2.25rem)] leading-snug">
          ¡Escanea el QR con tu celular<br />para completar <b>tu registro</b><br />para la gran rifa!
        </p>

        <div class="rounded-md bg-gradient-to-br from-[#f3d98b] via-[#c9962f] to-[#f3d98b] p-[6px] shadow-xl">
          <div class="bg-white p-[1.6vh]">
            <canvas ref={canvas} class="block aspect-square h-auto w-[min(31vh,70vw)] lg:w-[min(44vh,78vw)]" />
          </div>
        </div>

        <p class="break-all font-mono text-[clamp(1rem,2.2vh,1.5rem)] text-slate-600">{url}</p>

        {/* Pantallas angostas/verticales: árbol centrado abajo */}
        <div class="mt-auto flex flex-col items-center lg:hidden">
          <Arbol class="h-[14vh] w-auto" />
          <Regalos class="-mt-[1.6vh] h-[5.5vh] w-auto" />
        </div>
      </div>

      {/* Pantallas anchas (proyector): un árbol a cada lado */}
      <div class="pointer-events-none absolute bottom-0 left-[4vw] hidden flex-col items-center lg:flex">
        <Arbol class="h-[52vh] w-auto" />
        <Regalos class="-mt-[4.5vh] h-[14vh] w-auto" />
      </div>
      <div class="pointer-events-none absolute bottom-0 right-[4vw] hidden flex-col items-center lg:flex">
        <Arbol class="h-[52vh] w-auto" />
        <Regalos class="-mt-[4.5vh] h-[14vh] w-auto scale-x-[-1]" />
      </div>
    </main>
  );
}
