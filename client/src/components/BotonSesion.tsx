import { useState, type FormEvent } from 'react';
import { LogIn, LogOut, X } from 'lucide-react';
import CampoPassword from './CampoPassword';
import { useSesion } from '../sesion';

export default function BotonSesion() {
  const { admin, entrar, salir } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await entrar(password);
      setPassword('');
      setAbierto(false);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (admin) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="rounded bg-white/20 px-2 py-0.5">Admin</span>
        <button onClick={salir} className="btn btn-claro">
          <LogOut className="h-4 w-4" /> Salir
        </button>
      </div>
    );
  }

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="btn btn-claro">
        <LogIn className="h-4 w-4" /> Entrar como admin
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 text-sm">
      {error && <span className="text-red-100">{error}</span>}
      <CampoPassword value={password} onChange={setPassword} autoFocus autoComplete="current-password" className="w-44" />
      <button className="btn bg-white text-red-700 hover:bg-red-50">Entrar</button>
      <button type="button" onClick={() => setAbierto(false)} title="Cancelar" aria-label="Cancelar" className="btn btn-claro px-2">
        <X className="h-4 w-4" />
      </button>
    </form>
  );
}
