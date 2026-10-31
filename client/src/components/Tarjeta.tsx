export default function Tarjeta({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="text-2xl font-bold">{valor}</p>
      <p className="text-xs text-slate-500">{detalle}</p>
    </div>
  );
}
