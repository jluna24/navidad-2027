import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
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
        <Link to="/sorteo" className="rounded px-2 py-1 hover:bg-white/10">🎁 Sorteo</Link>
        <span className="rounded bg-white/20 px-2 py-0.5">Admin</span>
        <button onClick={salir} className="rounded px-2 py-1 hover:bg-white/10">Salir</button>
      </div>
    );
  }

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className="rounded px-2 py-1 text-sm hover:bg-white/10">
        Entrar como admin
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 text-sm">
      {error && <span className="text-red-100">{error}</span>}
      <CampoPassword value={password} onChange={setPassword} autoFocus autoComplete="current-password" className="w-44" />
      <button className="rounded bg-white px-2 py-1 font-medium text-red-700">Entrar</button>
      <button type="button" onClick={() => setAbierto(false)} className="rounded px-2 py-1 hover:bg-white/10">✕</button>
    </form>
  );
}
