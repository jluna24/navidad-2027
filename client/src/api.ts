export type Tipo = 'intercambio' | 'ahorro';
export type Totales = Record<Tipo, number>;

export interface Config {
  metas: Totales;
  fechaLimite: string;
}

export interface UsuarioResumen {
  id: number;
  nombre: string;
  familia: string | null;
  totales: Totales;
  ultimaAportacion: string | null;
}

export interface Aportacion {
  id: number;
  montoCentavos: number;
  fecha: string;
  tipo: Tipo;
  nota: string | null;
}

export interface UsuarioDetalle {
  id: number;
  nombre: string;
  familia: string | null;
  totales: Totales;
  aportaciones: Aportacion[];
  deseos: string[];
}

export interface UsuarioInput {
  nombre: string;
  familia: string;
}

export interface Sorteo {
  hecho: boolean;
  completo: boolean;
  familiasEnConflicto: boolean;
  fecha: string | null;
  participantes: {
    id: number;
    nombre: string;
    familia: string | null;
    codigo: string | null;
    giradoEn: string | null;
    deseos: number;
  }[];
  minimoDeseos: number;
}

export interface Ruleta {
  nombre: string;
  girado: boolean;
  recibe: string | null;
  deseos: string[];
  regalos: number;
}

export interface Intercambio {
  giradoEn: string | null;
  recibe: { id: number; nombre: string };
}

export interface AportacionInput {
  monto: number;
  fecha: string;
  tipo: Tipo;
  nota?: string;
}

const TOKEN_KEY = 'navidad-token';

export const token = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (valor: string | null) => {
    try {
      if (valor) localStorage.setItem(TOKEN_KEY, valor);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const t = token.get();
  const res = await fetch(`/api${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Error ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const api = {
  login: (password: string) => request<{ token: string }>('/login', json('POST', { password })),
  sesion: () => request<{ admin: boolean }>('/sesion'),
  config: () => request<Config>('/config'),
  usuarios: () => request<UsuarioResumen[]>('/usuarios'),
  usuario: (id: number) => request<UsuarioDetalle>(`/usuarios/${id}`),
  crearUsuario: (data: UsuarioInput) => request('/usuarios', json('POST', data)),
  editarUsuario: (id: number, data: UsuarioInput) => request(`/usuarios/${id}`, json('PUT', data)),
  intercambio: (id: number) => request<Intercambio | null>(`/usuarios/${id}/intercambio`),
  guardarDeseos: (id: number, deseos: string[]) => request(`/usuarios/${id}/deseos`, json('PUT', { deseos })),
  borrarUsuario: (id: number) => request(`/usuarios/${id}`, { method: 'DELETE' }),
  crearAportacion: (usuarioId: number, data: AportacionInput) =>
    request(`/usuarios/${usuarioId}/aportaciones`, json('POST', data)),
  editarAportacion: (id: number, data: AportacionInput) => request(`/aportaciones/${id}`, json('PUT', data)),
  borrarAportacion: (id: number) => request(`/aportaciones/${id}`, { method: 'DELETE' }),
  sorteo: () => request<Sorteo>('/sorteo'),
  hacerSorteo: () => request('/sorteo', { method: 'POST' }),
  reiniciarGiro: (usuarioId: number | 'todos', password: string) =>
    request<{ reiniciados: number }>('/sorteo/reiniciar-giro', json('POST', { usuarioId, password })),
  borrarSorteo: () => request('/sorteo', { method: 'DELETE' }),
  ruleta: (codigo: string) => request<Ruleta>(`/ruleta/${codigo}`),
  girar: (codigo: string) => request<{ recibe: string; deseos: string[] }>(`/ruleta/${codigo}/girar`, { method: 'POST' }),
};
