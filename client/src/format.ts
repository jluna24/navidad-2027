const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export const formatMonto = (centavos: number) => moneda.format(centavos / 100);

// Las fechas se guardan a medianoche UTC; las mostramos en UTC para no correr un día
export const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });

export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function semanasRestantes(fechaLimite: string) {
  const ms = new Date(fechaLimite).getTime() - new Date(hoyISO()).getTime();
  return Math.max(0, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)));
}

export function sugeridoPorSemana(faltanteCentavos: number, fechaLimite: string) {
  if (faltanteCentavos <= 0) return 0;
  const semanas = semanasRestantes(fechaLimite);
  return semanas > 0 ? Math.ceil(faltanteCentavos / semanas) : faltanteCentavos;
}
