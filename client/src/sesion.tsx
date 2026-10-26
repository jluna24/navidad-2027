import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, token } from './api';

interface Sesion {
  admin: boolean;
  entrar: (password: string) => Promise<void>;
  salir: () => void;
}

const SesionContext = createContext<Sesion>({ admin: false, entrar: async () => {}, salir: () => {} });

export function SesionProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState(false);

  // Confirmamos con el servidor que el token guardado siga siendo válido
  useEffect(() => {
    if (!token.get()) return;
    api.sesion().then(({ admin }) => {
      setAdmin(admin);
      if (!admin) token.set(null);
    }).catch(() => {});
  }, []);

  async function entrar(password: string) {
    const res = await api.login(password);
    token.set(res.token);
    setAdmin(true);
  }

  function salir() {
    token.set(null);
    setAdmin(false);
  }

  return <SesionContext.Provider value={{ admin, entrar, salir }}>{children}</SesionContext.Provider>;
}

export const useSesion = () => useContext(SesionContext);
