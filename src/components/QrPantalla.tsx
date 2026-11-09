import { useEffect, useRef, useState } from 'preact/hooks';
import QRCode from 'qrcode';

export default function QrPantalla({ base }: { base: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const u = `${location.origin}${base.replace(/\/$/, '')}/registro/`;
    setUrl(u);
    if (canvas.current) QRCode.toCanvas(canvas.current, u, { width: 640, margin: 2, errorCorrectionLevel: 'M' });
  }, [base]);

  return (
    <main class="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-6 bg-white p-6 text-center">
      <img src={`${base.replace(/\/$/, '')}/logos/borgwarner-negro.png`} alt="BorgWarner" width="1902" height="161" class="h-8 w-auto md:h-12" />
      <h1 class="text-4xl font-extrabold md:text-6xl">Escanea para registrarte</h1>
      <canvas ref={canvas} class="h-auto w-full max-w-[min(80vh,640px)]" />
      <p class="break-all font-mono text-xl md:text-3xl">{url}</p>
    </main>
  );
}
