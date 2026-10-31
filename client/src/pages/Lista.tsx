import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api, type Config, type UsuarioResumen } from '../api';
import BarraProgreso from '../components/BarraProgreso';
import CampoFamilia from '../components/CampoFamilia';
import Tarjeta from '../components/Tarjeta';
import { formatFecha, formatMonto, semanasRestantes } from '../format';
import { useSesion } from '../sesion';

// Ignora acentos y mayúsculas para que "angel" encuentre a "Ángel"
const normalizar = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const comparar = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' });

export default function Lista() {
  const { admin } = useSesion();
  const [config, setConfig] = useState<Config | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [nombre, setNombre] = useState('');
  const [familia, setFamilia] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<'asc' | 'desc'>('asc');
  const [error, setError] = useState<string | null>(null);

  const cargar = () => api.usuarios().then(setUsuarios).catch((e) => setError(e.message));

  useEffect(() => {
    api.config().then(setConfig).catch((e) => setError(e.message));
    cargar();
  }, []);

  async function agregar(e: FormEvent) {
    e.preventDefault();
    try {
      await api.crearUsuario({ nombre, familia });
      setNombre('');
      setFamilia('');
      await cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!config) return <p>{error ?? 'Cargando…'}</p>;

  const { metas } = config;
  const totalIntercambio = usuarios.reduce((s, u) => s + u.totales.intercambio, 0);
  const totalAhorro = usuarios.reduce((s, u) => s + u.totales.ahorro, 0);
  const cumplieronIntercambio = usuarios.filter((u) => u.totales.intercambio >= metas.intercambio).length;
  const cumplieronAhorro = usuarios.filter((u) => u.totales.ahorro >= metas.ahorro).length;

  const texto = normalizar(busqueda.trim());
  const visibles = usuarios
    .filter((u) => normalizar(`${u.nombre} ${u.familia ?? ''}`).includes(texto))
    .sort((a, b) => (orden === 'asc' ? comparar(a.nombre, b.nombre) : comparar(b.nombre, a.nombre)));

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <Tarjeta titulo="Intercambio recaudado" valor={formatMonto(totalIntercambio)}
          detalle={`${cumplieronIntercambio} de ${usuarios.length} cumplieron`} />
        <Tarjeta titulo="Ahorro recaudado" valor={formatMonto(totalAhorro)}
          detalle={`${cumplieronAhorro} de ${usuarios.length} cumplieron`} />
        <Tarjeta titulo="Semanas restantes" valor={String(semanasRestantes(config.fechaLimite))}
          detalle={`Hasta el ${formatFecha(config.fechaLimite)}`} />
      </section>

      {admin && (
        <form onSubmit={agregar} className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del participante"
            required
            className="rounded border border-slate-300 bg-white px-3 py-2"
          />
          <CampoFamilia
            value={familia}
            onChange={setFamilia}
            existentes={usuarios.map((u) => u.familia)}
            inputClassName="px-3 py-2"
          />
          <button className="btn btn-primario px-4 py-2 text-base">
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar por nombre o familia"
          className="flex-1 rounded border border-slate-300 bg-white px-3 py-2"
        />
        <select
          value={orden}
          onChange={(e) => setOrden(e.target.value as 'asc' | 'desc')}
          className="rounded border border-slate-300 bg-white px-3 py-2"
        >
          <option value="asc">Nombre A → Z</option>
          <option value="desc">Nombre Z → A</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">
                <button
                  onClick={() => setOrden(orden === 'asc' ? 'desc' : 'asc')}
                  className="font-semibold hover:text-slate-900"
                  title="Cambiar orden"
                >
                  Nombre {orden === 'asc' ? '▲' : '▼'}
                </button>
              </th>
              <th className="px-4 py-2">Intercambio</th>
              <th className="px-4 py-2">Ahorro propio</th>
              <th className="px-4 py-2">Última aportación</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  <Link to={`/usuarios/${u.id}`} className="text-red-700 hover:underline">
                    {u.nombre}
                  </Link>
                  {u.familia ? (
                    <p className="text-xs font-normal text-slate-500">Familia {u.familia}</p>
                  ) : (
                    admin && <p className="text-xs font-normal text-amber-700">⚠ Falta su familia</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <BarraProgreso actual={u.totales.intercambio} meta={metas.intercambio} color="red" />
                </td>
                <td className="px-4 py-3">
                  <BarraProgreso actual={u.totales.ahorro} meta={metas.ahorro} color="green" />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {u.ultimaAportacion ? formatFecha(u.ultimaAportacion) : '—'}
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  {usuarios.length > 0
                    ? `Nadie coincide con "${busqueda.trim()}".`
                    : admin
                      ? 'Aún no hay participantes. Agrega el primero arriba.'
                      : 'Aún no hay participantes.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
