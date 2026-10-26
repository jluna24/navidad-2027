import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, type Aportacion, type Config, type Tipo, type UsuarioDetalle, type UsuarioInput } from '../api';
import BarraProgreso from '../components/BarraProgreso';
import FormAportacion from '../components/FormAportacion';
import Deseos from '../components/Deseos';
import ResultadoSorteo from '../components/ResultadoSorteo';
import CampoFamilia from '../components/CampoFamilia';
import { formatFecha, formatMonto, sugeridoPorSemana } from '../format';
import { useSesion } from '../sesion';
import { useConfirmar } from '../confirmar';

const etiquetas: Record<Tipo, string> = { intercambio: 'Intercambio', ahorro: 'Ahorro propio' };

export default function Detalle() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const { admin } = useSesion();
  const confirmar = useConfirmar();
  const [config, setConfig] = useState<Config | null>(null);
  const [usuario, setUsuario] = useState<UsuarioDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  // null: sin formulario, 'nueva': agregando, Aportacion: editando esa
  const [editando, setEditando] = useState<'nueva' | Aportacion | null>(null);
  const [editandoDatos, setEditandoDatos] = useState(false);

  const cargar = () => api.usuario(id).then(setUsuario).catch((e) => setError(e.message));

  useEffect(() => {
    api.config().then(setConfig).catch((e) => setError(e.message));
    cargar();
  }, [id]);

  if (!config || !usuario) return <p>{error ?? 'Cargando…'}</p>;

  async function borrarUsuario() {
    if (!(await confirmar({
      emoji: '🗑️',
      titulo: `¿Borrar a ${usuario!.nombre}?`,
      mensaje: 'Se borran también todas sus aportaciones y sus gustos. Si ya hubo sorteo, habrá que rehacerlo.',
      textoConfirmar: 'Borrar',
      peligro: true,
    }))) return;
    await api.borrarUsuario(id);
    navigate('/');
  }

  async function borrarAportacion(a: Aportacion) {
    if (!(await confirmar({
      emoji: '🗑️',
      titulo: '¿Borrar esta aportación?',
      mensaje: (
        <>
          {formatMonto(a.montoCentavos)} de {etiquetas[a.tipo].toLowerCase()} del {formatFecha(a.fecha)}.
        </>
      ),
      textoConfirmar: 'Borrar',
      peligro: true,
    }))) return;
    await api.borrarAportacion(a.id).catch((e) => setError(e.message));
    await cargar();
  }

  const { metas, fechaLimite } = config;

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-slate-500 hover:underline">
        ← Volver a la lista
      </Link>

      {admin && editandoDatos ? (
        <FormDatos
          inicial={usuario}
          onCancelar={() => setEditandoDatos(false)}
          onGuardar={async (data) => {
            await api.editarUsuario(id, data);
            setEditandoDatos(false);
            await cargar();
          }}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">{usuario.nombre}</h1>
            {usuario.familia ? (
              <p className="text-sm text-slate-500">Familia {usuario.familia}</p>
            ) : (
              admin && <p className="text-sm text-amber-700">⚠ Falta su familia: presiona Editar para capturarla</p>
            )}
          </div>
          {admin && (
            <div className="flex gap-2 text-sm">
              <button onClick={() => setEditandoDatos(true)} className="rounded px-3 py-1.5 hover:bg-slate-200">Editar</button>
              <button onClick={borrarUsuario} className="rounded px-3 py-1.5 text-red-700 hover:bg-red-50">Borrar</button>
            </div>
          )}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        {(['intercambio', 'ahorro'] as const).map((tipo) => {
          const faltante = metas[tipo] - usuario.totales[tipo];
          return (
            <div key={tipo} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 font-semibold">{etiquetas[tipo]}</p>
              <BarraProgreso actual={usuario.totales[tipo]} meta={metas[tipo]}
                color={tipo === 'intercambio' ? 'red' : 'green'} />
              {faltante > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Faltan {formatMonto(faltante)} · sugerido {formatMonto(sugeridoPorSemana(faltante, fechaLimite))}/semana
                </p>
              )}
              {tipo === 'intercambio' && admin && <ResultadoSorteo usuarioId={id} />}
            </div>
          );
        })}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Deseos
        deseos={usuario.deseos}
        admin={admin}
        onGuardar={async (deseos) => {
          await api.guardarDeseos(id, deseos);
          await cargar();
        }}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Aportaciones</h2>
          {admin && editando === null && (
            <button onClick={() => setEditando('nueva')}
              className="rounded bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800">
              + Registrar aportación
            </button>
          )}
        </div>

        {admin && editando !== null && (
          <FormAportacion
            key={editando === 'nueva' ? 'nueva' : editando.id}
            inicial={editando === 'nueva' ? undefined : editando}
            onCancelar={() => setEditando(null)}
            onGuardar={async (data) => {
              if (editando === 'nueva') await api.crearAportacion(id, data);
              else await api.editarAportacion(editando.id, data);
              setEditando(null);
              await cargar();
            }}
          />
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2 text-right">Monto</th>
                <th className="px-4 py-2">Nota</th>
                {admin && <th className="px-4 py-2" />}
              </tr>
            </thead>
            <tbody>
              {usuario.aportaciones.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{formatFecha(a.fecha)}</td>
                  <td className="px-4 py-2">{etiquetas[a.tipo]}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatMonto(a.montoCentavos)}</td>
                  <td className="px-4 py-2 text-slate-500">{a.nota}</td>
                  {admin && (
                    <td className="space-x-1 px-4 py-2 text-right whitespace-nowrap">
                      <button onClick={() => setEditando(a)} className="rounded px-2 py-1 hover:bg-slate-100">Editar</button>
                      <button onClick={() => borrarAportacion(a)} className="rounded px-2 py-1 text-red-700 hover:bg-red-50">Borrar</button>
                    </td>
                  )}
                </tr>
              ))}
              {usuario.aportaciones.length === 0 && (
                <tr>
                  <td colSpan={admin ? 5 : 4} className="px-4 py-8 text-center text-slate-500">Sin aportaciones todavía.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FormDatos({ inicial, onGuardar, onCancelar }: {
  inicial: UsuarioDetalle;
  onGuardar: (data: UsuarioInput) => Promise<void>;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(inicial.nombre);
  const [familia, setFamilia] = useState(inicial.familia ?? '');
  const [existentes, setExistentes] = useState<(string | null)[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.usuarios().then((us) => setExistentes(us.map((u) => u.familia))).catch(() => {});
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    await onGuardar({ nombre, familia }).catch((err) => setError(err.message));
  }

  return (
    <form
      onSubmit={submit}
      className="grid items-end gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[2fr_1fr_auto]"
    >
      <label className="block text-sm">
        Nombre
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" />
      </label>
      <label className="block text-sm">
        Familia (apellido)
        <CampoFamilia value={familia} onChange={setFamilia} existentes={existentes} className="mt-1" inputClassName="px-2 py-1.5" />
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={onCancelar} className="rounded px-3 py-1.5 text-sm hover:bg-slate-100">Cancelar</button>
        <button className="rounded bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800">Guardar</button>
      </div>
      {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
    </form>
  );
}
