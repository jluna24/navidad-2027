import { randomBytes, randomInt } from 'node:crypto';

interface Persona {
  id: number;
  nombre: string;
  familia: string | null;
}

export class SorteoError extends Error {}

// "Pérez " y "perez" cuentan como la misma familia
export const claveFamilia = (familia: string | null) =>
  familia?.trim() ? familia.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase() : null;

function barajar<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Ordena a las personas en un solo círculo (cada una le regala a la siguiente y la última
 * a la primera) sin que dos personas consecutivas sean de la misma familia.
 */
export function sortear(personas: Persona[]): Persona[] {
  const n = personas.length;
  if (n < 2) throw new SorteoError('Se necesitan al menos 2 participantes');

  // Sin familia no podemos garantizar que no le toque un familiar
  const sinFamilia = personas.filter((p) => !claveFamilia(p.familia));
  if (sinFamilia.length) {
    throw new SorteoError(`Falta capturar la familia de: ${sinFamilia.map((p) => p.nombre).join(', ')}`);
  }
  const fam = new Map(personas.map((p) => [p.id, claveFamilia(p.familia)!]));

  // Cada miembro de una familia necesita regalarle a alguien de fuera,
  // así que ninguna familia puede tener más de la mitad de los participantes
  const tamanos = new Map<string, number>();
  for (const f of fam.values()) tamanos.set(f, (tamanos.get(f) ?? 0) + 1);
  for (const [f, t] of tamanos) {
    if (t * 2 > n) {
      const ejemplo = personas.find((p) => fam.get(p.id) === f)!;
      throw new SorteoError(
        `La familia "${ejemplo.familia}" tiene ${t} de ${n} participantes; ` +
          'ninguna familia puede tener más de la mitad para que el sorteo sea posible',
      );
    }
  }

  for (let intento = 0; intento < 50; intento++) {
    const resultado = buscarCirculo(barajar([...personas]), fam);
    if (resultado) return resultado;
  }
  throw new SorteoError('No se encontró una combinación válida, intenta de nuevo');
}

function buscarCirculo(personas: Persona[], fam: Map<number, string>): Persona[] | null {
  const restantes = new Map<string, number>();
  for (const f of fam.values()) restantes.set(f, (restantes.get(f) ?? 0) + 1);

  const camino = [personas[0]];
  const usados = new Set([personas[0].id]);
  restantes.set(fam.get(personas[0].id)!, restantes.get(fam.get(personas[0].id)!)! - 1);
  let pasos = 0;

  const avanzar = (): boolean => {
    if (++pasos > 20_000) return false;
    const actual = camino[camino.length - 1];
    if (camino.length === personas.length) return fam.get(actual.id) !== fam.get(personas[0].id);

    // Primero las familias con más gente pendiente, para no quedarnos al final
    // con varios de la misma familia que ya no se puedan separar
    const candidatos = personas
      .filter((p) => !usados.has(p.id) && fam.get(p.id) !== fam.get(actual.id))
      .sort((a, b) => restantes.get(fam.get(b.id)!)! - restantes.get(fam.get(a.id)!)!);

    for (const p of candidatos) {
      const f = fam.get(p.id)!;
      camino.push(p);
      usados.add(p.id);
      restantes.set(f, restantes.get(f)! - 1);
      if (avanzar()) return true;
      camino.pop();
      usados.delete(p.id);
      restantes.set(f, restantes.get(f)! + 1);
    }
    return false;
  };

  return avanzar() ? camino : null;
}

// Sin 0/O ni 1/l/I para que se puedan dictar sin confusión
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789';
export const generarCodigo = () =>
  Array.from(randomBytes(10), (b) => ALFABETO[b % ALFABETO.length]).join('');
