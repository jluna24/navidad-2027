import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type Ruleta as RuletaData } from '../api';
import { useSesion } from '../sesion';

const DURACION_GIRO_MS = 5000;
const COLORES = ['#b91c1c', '#15803d'];

export default function Ruleta() {
  const codigo = useParams().codigo!;
  const navigate = useNavigate();
  const { admin } = useSesion();
  const [ruleta, setRuleta] = useState<RuletaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rotacion, setRotacion] = useState(0);
  const [girando, setGirando] = useState(false);
  const [resultado, setResultado] = useState<{ recibe: string; deseos: string[] } | null>(null);

  useEffect(() => {
    api.ruleta(codigo).then((r) => {
      setRuleta(r);
      if (r.recibe) setResultado({ recibe: r.recibe, deseos: r.deseos });
    }).catch((e) => setError(e.message));
  }, [codigo]);

  // replace: que el botón "atrás" del navegador no regrese al resultado para la siguiente persona
  const listo = () => navigate(admin ? '/sorteo' : '/', { replace: true });

  if (error) return <Mensaje emoji="😕" titulo="No se pudo abrir tu ruleta" texto={error} />;
  if (!ruleta) return <p>Cargando…</p>;

  async function girar() {
    setGirando(true);
    try {
      // El resultado ya está decidido en el servidor; la ruleta solo cae en un regalo cualquiera
      const res = await api.girar(codigo);
      const grados = 360 / ruleta!.regalos;
      const regalo = Math.floor(Math.random() * ruleta!.regalos);
      // Varias vueltas completas y luego el centro de ese regalo bajo la flecha
      setRotacion(360 * 6 + (360 - (regalo + 0.5) * grados));
      setTimeout(() => {
        setResultado(res);
        setGirando(false);
      }, DURACION_GIRO_MS + 300);
    } catch (e) {
      setGirando(false);
      setError((e as Error).message);
    }
  }

  const revelado = resultado && !girando;

  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">¡Hola, {ruleta.nombre}! 🎅</h1>
        <p className="text-slate-500">
          {revelado ? 'Este es tu intercambio' : 'Gira la ruleta para descubrir a quién le regalas'}
        </p>
      </div>

      {revelado ? (
        <>
          <div className="animate-[aparecer_0.6s_ease-out] rounded-2xl border-4 border-red-700 bg-white p-8 shadow-lg">
            <p className="text-6xl">🎁</p>
            <p className="mt-4 text-sm tracking-wide text-slate-500 uppercase">Te tocó</p>
            <p className="text-4xl font-bold text-red-700">{resultado.recibe}</p>

            <div className="mt-6 border-t border-slate-200 pt-4 text-left">
              <p className="mb-2 text-sm font-semibold text-slate-600">Sus gustos y deseos:</p>
              {resultado.deseos.length ? (
                <ul className="space-y-1">
                  {resultado.deseos.map((d, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-red-700">•</span>
                      {d}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Todavía no los ha compartido; pregúntale al organizador más adelante.</p>
              )}
            </div>

            <p className="mt-6 text-sm text-slate-500">🤫 Es secreto, ¡no le digas a nadie!</p>
          </div>
          <button
            onClick={listo}
            className="rounded-full bg-slate-800 px-10 py-3 text-lg font-bold text-white shadow-md hover:bg-slate-900"
          >
            Listo, ocultar
          </button>
        </>
      ) : (
        <>
          <Rueda regalos={ruleta.regalos} rotacion={rotacion} />
          <button
            onClick={girar}
            disabled={girando}
            className="rounded-full bg-red-700 px-10 py-3 text-lg font-bold text-white shadow-md hover:bg-red-800 disabled:opacity-60"
          >
            {girando ? 'Girando…' : '¡Girar!'}
          </button>
        </>
      )}
    </div>
  );
}

function Rueda({ regalos, rotacion }: { regalos: number; rotacion: number }) {
  const grados = 360 / regalos;
  const punto = (angulo: number, r = 1) => {
    // 0° = arriba, sentido horario
    const rad = ((angulo - 90) * Math.PI) / 180;
    return [r * Math.cos(rad), r * Math.sin(rad)];
  };

  return (
    <div className="relative mx-auto aspect-square w-full max-w-80">
      {/* Flecha fija arriba */}
      <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 text-4xl drop-shadow">🔻</div>
      <svg
        viewBox="-1.05 -1.05 2.1 2.1"
        className="h-full w-full drop-shadow-lg"
        style={{
          transform: `rotate(${rotacion}deg)`,
          transition: `transform ${DURACION_GIRO_MS}ms cubic-bezier(0.15, 0.6, 0.1, 1)`,
        }}
      >
        {Array.from({ length: regalos }, (_, i) => {
          const [x0, y0] = punto(i * grados);
          const [x1, y1] = punto((i + 1) * grados);
          const [tx, ty] = punto((i + 0.5) * grados, 0.65);
          // Con un número impar de regalos el último sería del mismo color que el primero
          const color = regalos % 2 === 1 && i === regalos - 1 ? '#ca8a04' : COLORES[i % 2];
          return (
            <g key={i}>
              <path d={`M0,0 L${x0},${y0} A1,1 0 0 1 ${x1},${y1} Z`} fill={color} stroke="#fff" strokeWidth="0.02" />
              <text x={tx} y={ty} fontSize="0.22" textAnchor="middle" dominantBaseline="central">🎁</text>
            </g>
          );
        })}
        <circle r="0.14" fill="#fff" stroke="#b91c1c" strokeWidth="0.03" />
        <text fontSize="0.14" textAnchor="middle" dominantBaseline="central">🎄</text>
      </svg>
    </div>
  );
}

function Mensaje({ emoji, titulo, texto }: { emoji: string; titulo: string; texto: string }) {
  return (
    <div className="mx-auto max-w-md space-y-2 py-12 text-center">
      <p className="text-5xl">{emoji}</p>
      <h1 className="text-xl font-bold">{titulo}</h1>
      <p className="text-slate-500">{texto}</p>
    </div>
  );
}
