import { Fragment, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { api, type Config, type Totales, type UsuarioResumen } from '../api';
import BarraProgreso from '../components/BarraProgreso';
import Tarjeta from '../components/Tarjeta';
import { formatMonto } from '../format';
import { useSesion } from '../sesion';

interface Familia {
  clave: string;
  nombre: string;
  integrantes: UsuarioResumen[];
  totales: Totales;
  faltante: number;
}

// Misma regla que el sorteo: "Ochoa" y "ochoa " son la misma familia
const claveFamilia = (familia: string | null) =>
  familia?.trim() ? familia.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase() : '';

const comparar = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' });

// Lo que le falta a cada quien; lo que alguien da de más no cubre a otro
const faltante = (u: UsuarioResumen, metas: Totales) =>
  Math.max(0, metas.intercambio - u.totales.intercambio) + Math.max(0, metas.ahorro - u.totales.ahorro);

function agrupar(usuarios: UsuarioResumen[], metas: Totales): Familia[] {
  const familias = new Map<string, Familia>();
  for (const u of usuarios) {
    const clave = claveFamilia(u.familia);
    let f = familias.get(clave);
    if (!f) {
      f = { clave, nombre: u.familia?.trim() || 'Sin familia', integrantes: [], totales: { intercambio: 0, ahorro: 0 }, faltante: 0 };
      familias.set(clave, f);
    }
    f.integrantes.push(u);
    f.totales.intercambio += u.totales.intercambio;
    f.totales.ahorro += u.totales.ahorro;
    f.faltante += faltante(u, metas);
  }
  for (const f of familias.values()) f.integrantes.sort((a, b) => comparar(a.nombre, b.nombre));
  // "Sin familia" va al final
  return [...familias.values()].sort((a, b) => (!a.clave ? 1 : !b.clave ? -1 : comparar(a.nombre, b.nombre)));
}

export default function Resumen() {
  const { admin, verificando } = useSesion();
  const [config, setConfig] = useState<Config | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioResumen[]>([]);
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!admin) return;
    Promise.all([api.config(), api.usuarios()])
      .then(([c, u]) => {
        setConfig(c);
        setUsuarios(u);
      })
      .catch((e) => setError(e.message));
  }, [admin]);

  if (verificando) return <p>Cargando…</p>;
  if (!admin) return <Navigate to="/" replace />;
  if (!config) return <p>{error ?? 'Cargando…'}</p>;

  const { metas } = config;
  const familias = agrupar(usuarios, metas);
  const n = usuarios.length;
  const intercambio = familias.reduce((s, f) => s + f.totales.intercambio, 0);
  const ahorro = familias.reduce((s, f) => s + f.totales.ahorro, 0);
  const porCobrar = familias.reduce((s, f) => s + f.faltante, 0);
  const metaIntercambio = metas.intercambio * n;
  const metaAhorro = metas.ahorro * n;
  const pct = (actual: number, meta: number) => (meta ? Math.round((actual / meta) * 100) : 0);

  function alternar(clave: string) {
    const nuevas = new Set(abiertas);
    if (nuevas.has(clave)) nuevas.delete(clave);
    else nuevas.add(clave);
    setAbiertas(nuevas);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resumen de cuentas</h1>
        <p className="text-sm text-slate-500">
          {n} participantes en {familias.length} {familias.length === 1 ? 'familia' : 'familias'}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta titulo="Total recaudado" valor={formatMonto(intercambio + ahorro)}
          detalle={`${pct(intercambio + ahorro, metaIntercambio + metaAhorro)}% de ${formatMonto(metaIntercambio + metaAhorro)}`} />
        <Tarjeta titulo="Intercambio" valor={formatMonto(intercambio)}
          detalle={`${pct(intercambio, metaIntercambio)}% de ${formatMonto(metaIntercambio)}`} />
        <Tarjeta titulo="Ahorro" valor={formatMonto(ahorro)}
          detalle={`${pct(ahorro, metaAhorro)}% de ${formatMonto(metaAhorro)}`} />
        <Tarjeta titulo="Por cobrar" valor={formatMonto(porCobrar)}
          detalle="Lo que falta para que todos cumplan" />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Por familia</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-4 py-2">Familia</th>
                <th className="px-4 py-2">Intercambio</th>
                <th className="px-4 py-2">Ahorro</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-right">Por cobrar</th>
              </tr>
            </thead>
            <tbody>
              {familias.map((f) => {
                const abierta = abiertas.has(f.clave);
                const integrantes = f.integrantes.length;
                return (
                  <Fragment key={f.clave}>
                    <tr className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => alternar(f.clave)}
                          aria-expanded={abierta}
                          className="inline-flex cursor-pointer items-center gap-1 text-left font-medium"
                        >
                          {abierta ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          {f.nombre}
                        </button>
                        <p className="pl-5 text-xs text-slate-500">
                          {integrantes} {integrantes === 1 ? 'integrante' : 'integrantes'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <BarraProgreso actual={f.totales.intercambio} meta={metas.intercambio * integrantes} color="red" />
                      </td>
                      <td className="px-4 py-3">
                        <BarraProgreso actual={f.totales.ahorro} meta={metas.ahorro * integrantes} color="green" />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatMonto(f.totales.intercambio + f.totales.ahorro)}
                      </td>
                      <td className={`px-4 py-3 text-right ${f.faltante ? 'text-amber-700' : 'text-green-700'}`}>
                        {f.faltante ? formatMonto(f.faltante) : '✓ Al corriente'}
                      </td>
                    </tr>
                    {abierta &&
                      f.integrantes.map((u) => {
                        const falta = faltante(u, metas);
                        return (
                          <tr key={u.id} className="bg-slate-50 text-slate-600">
                            <td className="py-2 pr-4 pl-10">
                              <Link to={`/usuarios/${u.id}`} className="text-red-700 hover:underline">
                                {u.nombre}
                              </Link>
                            </td>
                            <td className="px-4 py-2">{formatMonto(u.totales.intercambio)}</td>
                            <td className="px-4 py-2">{formatMonto(u.totales.ahorro)}</td>
                            <td className="px-4 py-2 text-right">{formatMonto(u.totales.intercambio + u.totales.ahorro)}</td>
                            <td className={`px-4 py-2 text-right ${falta ? 'text-amber-700' : 'text-green-700'}`}>
                              {falta ? formatMonto(falta) : '✓'}
                            </td>
                          </tr>
                        );
                      })}
                  </Fragment>
                );
              })}
              {familias.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Aún no hay participantes.
                  </td>
                </tr>
              )}
            </tbody>
            {familias.length > 0 && (
              <tfoot className="border-t-2 border-slate-200 bg-slate-100 font-semibold">
                <tr>
                  <td className="px-4 py-3">Total general</td>
                  <td className="px-4 py-3">{formatMonto(intercambio)}</td>
                  <td className="px-4 py-3">{formatMonto(ahorro)}</td>
                  <td className="px-4 py-3 text-right">{formatMonto(intercambio + ahorro)}</td>
                  <td className="px-4 py-3 text-right text-amber-700">{porCobrar ? formatMonto(porCobrar) : '—'}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
