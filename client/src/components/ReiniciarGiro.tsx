import { useState, type FormEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import { api } from '../api';
import CampoPassword from './CampoPassword';
import { useConfirmar } from '../confirmar';

interface Props {
  girados: { id: number; nombre: string }[];
  onReiniciado: () => void;
}

// Escondido en "Opciones avanzadas" y protegido con la contraseña de admin
export default function ReiniciarGiro({ girados, onReiniciado }: Props) {
  const confirmar = useConfirmar();
  const [usuarioId, setUsuarioId] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const todos = usuarioId === 'todos';
    const nombre = girados.find((g) => String(g.id) === usuarioId)?.nombre;
    if (!(await confirmar({
      emoji: '🎡',
      titulo: todos ? `¿Reiniciar el giro de ${girados.length} personas?` : `¿Reiniciar el giro de ${nombre}?`,
      mensaje: todos
        ? 'Todos los que ya giraron podrán volver a girar. Les seguirá tocando la misma persona.'
        : `${nombre} podrá volver a girar. Le seguirá tocando la misma persona.`,
      textoConfirmar: 'Reiniciar giro',
      peligro: true,
    }))) return;
    try {
      const { reiniciados } = await api.reiniciarGiro(todos ? 'todos' : Number(usuarioId), password);
      setMensaje({ ok: true, texto: `Listo: ${reiniciados === 1 ? '1 persona puede' : `${reiniciados} personas pueden`} volver a girar.` });
      setUsuarioId('');
      setPassword('');
      onReiniciado();
    } catch (err) {
      setMensaje({ ok: false, texto: (err as Error).message });
    }
  }

  return (
    <details className="rounded-lg border border-slate-200 bg-white text-sm shadow-sm">
      <summary className="cursor-pointer px-4 py-3 text-slate-500 select-none">⚙ Opciones avanzadas</summary>
      <form onSubmit={submit} className="space-y-3 border-t border-slate-100 p-4">
        <div>
          <p className="font-semibold">Reiniciar giro</p>
          <p className="text-slate-500">
            Borra el registro de que alguien ya giró para que pueda girar de nuevo, por ejemplo después de una prueba.
            Le sigue tocando la misma persona; para cambiar las parejas usa "Rehacer sorteo".
          </p>
        </div>
        {girados.length === 0 ? (
          <p className="text-slate-500">Nadie ha girado todavía.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <select
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
              required
              className="rounded border border-slate-300 px-2 py-1.5"
            >
              <option value="" disabled>Elige a quién…</option>
              {girados.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              {girados.length > 1 && <option value="todos">Todos los que ya giraron ({girados.length})</option>}
            </select>
            <CampoPassword value={password} onChange={setPassword} placeholder="Contraseña de admin" autoComplete="off" className="w-52" />
            <button className="btn btn-secundario">
              <RotateCcw className="h-4 w-4" /> Reiniciar giro
            </button>
          </div>
        )}
        {mensaje && <p className={mensaje.ok ? 'text-green-700' : 'text-red-600'}>{mensaje.texto}</p>}
      </form>
    </details>
  );
}
