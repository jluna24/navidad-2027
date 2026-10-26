import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Intercambio } from '../api';
import { formatFecha } from '../format';

// Solo se monta para el admin; el nombre queda oculto hasta que se pida verlo
export default function ResultadoSorteo({ usuarioId }: { usuarioId: number }) {
  const [intercambio, setIntercambio] = useState<Intercambio | null | undefined>(undefined);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    api.intercambio(usuarioId).then(setIntercambio).catch(() => setIntercambio(null));
  }, [usuarioId]);

  if (intercambio === undefined) return null;

  return (
    <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
      {!intercambio ? (
        <p className="text-slate-500">🎁 Aún no está en el sorteo.</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p>
              🎁 Le regala a{' '}
              {visible ? (
                <Link to={`/usuarios/${intercambio.recibe.id}`} className="font-semibold text-red-700 hover:underline">
                  {intercambio.recibe.nombre}
                </Link>
              ) : (
                <span className="rounded bg-slate-200 px-2 tracking-widest text-slate-400 select-none">••••••</span>
              )}
            </p>
            <button onClick={() => setVisible(!visible)} className="rounded px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100">
              {visible ? 'Ocultar' : '👁 Mostrar'}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {intercambio.giradoEn ? `Giró su ruleta el ${formatFecha(intercambio.giradoEn)}` : 'Aún no gira su ruleta'}
          </p>
        </>
      )}
    </div>
  );
}
