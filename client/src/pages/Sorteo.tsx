import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Check, Eye, FerrisWheel, Shuffle, Trash2 } from 'lucide-react';
import { api, type Sorteo as SorteoData } from '../api';
import { useSesion } from '../sesion';
import { useConfirmar } from '../confirmar';
import ReiniciarGiro from '../components/ReiniciarGiro';

export default function Sorteo() {
  const { admin, verificando } = useSesion();
  const navigate = useNavigate();
  const confirmar = useConfirmar();
  const [sorteo, setSorteo] = useState<SorteoData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const cargar = () =>
    api.sorteo().then((s) => {
      setSorteo(s);
      setError(null);
    }).catch((e) => setError(e.message));

  useEffect(() => {
    if (admin) cargar();
  }, [admin]);

  if (verificando) return <p>Cargando…</p>;
  if (!admin) return <Navigate to="/" replace />;
  if (!sorteo) return <p>{error ?? 'Cargando…'}</p>;

  const girados = sorteo.participantes.filter((p) => p.giradoEn).length;
  const sinDeseos = sorteo.participantes.filter((p) => p.deseos < sorteo.minimoDeseos);
  const sinFamilia = sorteo.participantes.filter((p) => !p.familia);

  async function hacerSorteo() {
    if (sorteo!.hecho && !(await confirmar({
      emoji: '🔄',
      titulo: '¿Rehacer el sorteo?',
      mensaje: (
        <>
          Cambian <b>todas</b> las asignaciones, incluso de quienes ya giraron. Todos tendrán que volver a girar su
          ruleta.
        </>
      ),
      textoConfirmar: 'Rehacer sorteo',
      peligro: true,
    }))) return;
    setTrabajando(true);
    await api.hacerSorteo().catch((e) => setError(e.message));
    setTrabajando(false);
    await cargar();
  }

  async function cancelarSorteo() {
    if (!(await confirmar({
      emoji: '🗑️',
      titulo: '¿Borrar el sorteo?',
      mensaje: 'Se pierden todas las asignaciones y el registro de quién ya giró.',
      textoConfirmar: 'Borrar sorteo',
      peligro: true,
    }))) return;
    await api.borrarSorteo().catch((e) => setError(e.message));
    await cargar();
  }

  async function volverAVer(nombre: string, codigo: string) {
    if (await confirmar({
      emoji: '🤫',
      titulo: `¿Solo ${nombre} está viendo la pantalla?`,
      mensaje: `Se mostrará a quién le tocó a ${nombre} en el intercambio.`,
      textoConfirmar: 'Sí, mostrar',
    })) {
      navigate(`/ruleta/${codigo}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">🎁 Sorteo de intercambio</h1>
          <p className="text-sm text-slate-500">
            {sorteo.hecho
              ? `${girados} de ${sorteo.participantes.length} ya giraron su ruleta`
              : 'Nadie se toca a sí mismo ni a alguien de su misma familia.'}
          </p>
        </div>
        <div className="flex gap-2">
          {sorteo.hecho && (
            <button onClick={cancelarSorteo} className="btn btn-peligro">
              <Trash2 className="h-4 w-4" /> Borrar sorteo
            </button>
          )}
          <button
            onClick={hacerSorteo}
            disabled={trabajando || sinFamilia.length > 0}
            title={sinFamilia.length ? 'Primero captura la familia de todos' : undefined}
            className="btn btn-primario"
          >
            <Shuffle className="h-4 w-4" /> {sorteo.hecho ? 'Rehacer sorteo' : 'Hacer sorteo'}
          </button>
        </div>
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {sorteo.hecho && !sorteo.completo && (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
          ⚠ Se agregó o borró a alguien después del sorteo, así que hay personas sin asignación o sin quién les regale.
          Rehaz el sorteo para incluir a todos.
        </p>
      )}

      {sinFamilia.length > 0 && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-800">
          Falta capturar la familia de <b>{sinFamilia.map((p) => p.nombre).join(', ')}</b>. Sin ella no se puede
          sortear, porque podría tocarle alguien de su propia familia.
        </p>
      )}

      {sorteo.hecho && sorteo.familiasEnConflicto && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-800">
          ⚠ El sorteo actual se hizo sin familias completas (o se cambiaron después), así que alguien pudo quedar con
          un familiar. Captura todas las familias y presiona <b>Rehacer sorteo</b>.
        </p>
      )}

      {sinDeseos.length > 0 && (
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
          A {sinDeseos.length === 1 ? '1 persona' : `${sinDeseos.length} personas`} le faltan gustos o deseos
          (mínimo {sorteo.minimoDeseos}). Puedes sortear de todos modos y completarlos después: quien gire verá la lista actualizada.
        </p>
      )}

      {sorteo.hecho && girados < sorteo.participantes.length && (
        <p className="text-sm text-slate-500">
          Pasa a cada persona a la computadora y presiona <b>🎡 Girar</b> junto a su nombre.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">Participante</th>
              <th className="px-4 py-2">Familia</th>
              <th className="px-4 py-2">Gustos</th>
              {sorteo.hecho && <th className="px-4 py-2">Ruleta</th>}
            </tr>
          </thead>
          <tbody>
            {sorteo.participantes.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{p.nombre}</td>
                <td className="px-4 py-3">
                  {p.familia ? (
                    <span className="text-slate-500">{p.familia}</span>
                  ) : (
                    <Link to={`/usuarios/${p.id}`} className="text-red-700 hover:underline">Falta · capturar</Link>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/usuarios/${p.id}`}
                    className={p.deseos >= sorteo.minimoDeseos ? 'text-green-700' : 'text-amber-700 hover:underline'}
                  >
                    {p.deseos >= sorteo.minimoDeseos ? `✓ ${p.deseos}` : `${p.deseos} de ${sorteo.minimoDeseos} · completar`}
                  </Link>
                </td>
                {sorteo.hecho && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    {!p.codigo ? (
                      <span className="text-amber-700">Sin asignación</span>
                    ) : p.giradoEn ? (
                      <span className="inline-flex items-center gap-3">
                        <span className="inline-flex cursor-default items-center gap-1.5 rounded border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
                          <Check className="h-4 w-4" /> Ya giró
                        </span>
                        <button
                          onClick={() => volverAVer(p.nombre, p.codigo!)}
                          className="btn btn-secundario"
                        >
                          <Eye className="h-4 w-4" /> Volver a ver
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => navigate(`/ruleta/${p.codigo}`)}
                        className="btn btn-primario"
                      >
                        <FerrisWheel className="h-4 w-4" /> Girar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {sorteo.participantes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Agrega participantes en la lista antes de hacer el sorteo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {sorteo.hecho && (
        <ReiniciarGiro
          girados={sorteo.participantes.filter((p) => p.giradoEn)}
          onReiniciado={cargar}
        />
      )}
    </div>
  );
}
