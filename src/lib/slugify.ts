/**
 * Convierte un título en un slug apto para URLs.
 *
 * Reglas aplicadas:
 * - Normaliza acentos (á→a, é→e, í→i, ó→o, ú→u, ü→u).
 * - Convierte la ñ en n (la normalización NFD la separa en n + tilde).
 * - Reemplaza espacios por guiones.
 * - Elimina símbolos (por ejemplo: ¡ ! ¿ ? : . , ( ) & # …).
 * - Minúsculas y guiones consecutivos colapsados.
 */
export function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes y convierte ñ → n
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // elimina símbolos y caracteres especiales
    .replace(/\s+/g, '-') // espacios → guiones
    .replace(/-+/g, '-') // guiones repetidos → uno solo
    .replace(/^-+|-+$/g, ''); // quita guiones al inicio y al final
}
