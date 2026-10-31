import { useState, type FormEvent } from 'react';
import { Pencil, Plus, X } from 'lucide-react';

const MINIMO = 3;
const MAXIMO = 10;

interface Props {
  deseos: string[];
  admin: boolean;
  onGuardar: (deseos: string[]) => Promise<void>;
}

export default function Deseos({ deseos, admin, onGuardar }: Props) {
  const [editando, setEditando] = useState(false);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">🎁 Gustos y deseos</h2>
        {admin && !editando && (
          <button onClick={() => setEditando(true)} className="btn btn-neutro">
            {deseos.length ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {deseos.length ? 'Editar' : 'Agregar'}
          </button>
        )}
      </div>

      {editando ? (
        <FormDeseos
          inicial={deseos}
          onCancelar={() => setEditando(false)}
          onGuardar={async (nuevos) => {
            await onGuardar(nuevos);
            setEditando(false);
          }}
        />
      ) : deseos.length ? (
        <ul className="space-y-1 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {deseos.map((d, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-red-700">•</span>
              {d}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
          Aún no hay gustos registrados. Se necesitan al menos {MINIMO} para que quien le toque tenga ideas.
        </p>
      )}
    </section>
  );
}

function FormDeseos({ inicial, onGuardar, onCancelar }: {
  inicial: string[];
  onGuardar: (deseos: string[]) => Promise<void>;
  onCancelar: () => void;
}) {
  // Siempre mostramos al menos el mínimo de casillas
  const [deseos, setDeseos] = useState(() => [...inicial, ...Array(Math.max(0, MINIMO - inicial.length)).fill('')]);
  const [error, setError] = useState<string | null>(null);
  const llenos = deseos.filter((d) => d.trim()).length;

  const cambiar = (i: number, valor: string) => setDeseos(deseos.map((d, j) => (j === i ? valor : d)));
  const quitar = (i: number) => setDeseos(deseos.filter((_, j) => j !== i));

  async function submit(e: FormEvent) {
    e.preventDefault();
    await onGuardar(deseos).catch((err) => setError(err.message));
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">
        Cosas que le gustaría recibir o simplemente sus gustos (colores, comida, hobbies…). Mínimo {MINIMO}.
      </p>
      {deseos.map((d, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={d}
            onChange={(e) => cambiar(i, e.target.value)}
            placeholder={['Ej. Le gusta el café', 'Ej. Color favorito: verde', 'Ej. Un libro de misterio'][i] ?? ''}
            maxLength={200}
            autoFocus={i === 0}
            className="flex-1 rounded border border-slate-300 px-2 py-1.5"
          />
          {deseos.length > MINIMO && (
            <button type="button" onClick={() => quitar(i)} title="Quitar" aria-label="Quitar" className="btn btn-neutro px-2 text-slate-500">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      {deseos.length < MAXIMO && (
        <button type="button" onClick={() => setDeseos([...deseos, ''])} className="btn btn-secundario btn-sm">
          <Plus className="h-3.5 w-3.5" /> Agregar otro
        </button>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        <span className={`mr-auto text-xs ${llenos < MINIMO ? 'text-amber-700' : 'text-green-700'}`}>
          {llenos} de {MINIMO} mínimo
        </span>
        <button type="button" onClick={onCancelar} className="btn btn-neutro">Cancelar</button>
        <button
          disabled={llenos < MINIMO}
          className="btn btn-primario"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
