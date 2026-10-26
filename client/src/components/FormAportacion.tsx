import { useState, type FormEvent } from 'react';
import type { Aportacion, AportacionInput, Tipo } from '../api';
import { hoyISO } from '../format';

interface Props {
  inicial?: Aportacion;
  onGuardar: (data: AportacionInput) => Promise<void>;
  onCancelar: () => void;
}

export default function FormAportacion({ inicial, onGuardar, onCancelar }: Props) {
  const [monto, setMonto] = useState(inicial ? String(inicial.montoCentavos / 100) : '');
  const [fecha, setFecha] = useState(inicial ? inicial.fecha.slice(0, 10) : hoyISO());
  const [tipo, setTipo] = useState<Tipo>(inicial?.tipo ?? 'intercambio');
  const [nota, setNota] = useState(inicial?.nota ?? '');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await onGuardar({ monto: Number(monto), fecha, tipo, nota });
    } catch (err) {
      setError((err as Error).message);
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          Monto
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            autoFocus
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
          />
        </label>
        <label className="block text-sm">
          Fecha
          <input
            type="date"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
          />
        </label>
        <label className="block text-sm">
          Tipo
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as Tipo)}
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
          >
            <option value="intercambio">Intercambio</option>
            <option value="ahorro">Ahorro propio</option>
          </select>
        </label>
      </div>
      <label className="block text-sm">
        Nota (opcional)
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancelar} className="rounded px-3 py-1.5 text-sm hover:bg-slate-100">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando}
          className="rounded bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
