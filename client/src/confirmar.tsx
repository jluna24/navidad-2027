import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

interface Opciones {
  titulo: string;
  mensaje?: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  emoji?: string;
  // Acciones destructivas: botón rojo y el foco empieza en "Cancelar"
  peligro?: boolean;
}

type Confirmar = (opciones: Opciones) => Promise<boolean>;

const ConfirmarContext = createContext<Confirmar>(async () => false);

export function ConfirmarProvider({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState<(Opciones & { responder: (ok: boolean) => void }) | null>(null);

  const confirmar: Confirmar = (opciones) =>
    new Promise((resolve) => {
      setAbierto({
        ...opciones,
        responder: (ok) => {
          setAbierto(null);
          resolve(ok);
        },
      });
    });

  return (
    <ConfirmarContext.Provider value={confirmar}>
      {children}
      {abierto && <Modal {...abierto} />}
    </ConfirmarContext.Provider>
  );
}

export const useConfirmar = () => useContext(ConfirmarContext);

function Modal({
  titulo,
  mensaje,
  textoConfirmar = 'Aceptar',
  textoCancelar = 'Cancelar',
  emoji,
  peligro,
  responder,
}: Opciones & { responder: (ok: boolean) => void }) {
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const confirmarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    (peligro ? cancelarRef : confirmarRef).current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') responder(false);
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={() => responder(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-titulo"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm animate-[aparecer_0.2s_ease-out] overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className={`h-1.5 ${peligro ? 'bg-red-700' : 'bg-green-700'}`} />
        <div className="space-y-2 p-5">
          <div className="flex items-start gap-3">
            {emoji && <span className="text-3xl leading-none">{emoji}</span>}
            <h2 id="confirmar-titulo" className="text-lg font-bold text-slate-800">{titulo}</h2>
          </div>
          {mensaje && <div className="text-sm text-slate-600">{mensaje}</div>}
        </div>
        <div className="flex justify-end gap-2 bg-slate-50 px-5 py-3">
          <button
            ref={cancelarRef}
            onClick={() => responder(false)}
            className="btn btn-neutro px-4 py-2"
          >
            {textoCancelar}
          </button>
          <button
            ref={confirmarRef}
            onClick={() => responder(true)}
            className={`btn px-4 py-2 text-white ${peligro ? 'btn-primario' : 'bg-green-700 hover:bg-green-800'}`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
