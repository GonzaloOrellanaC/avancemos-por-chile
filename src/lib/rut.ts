/**
 * Utilidades para el RUT chileno (Rol Único Tributario).
 *
 * Algoritmo estándar de dígito verificador:
 * - El cuerpo (dígitos) se multiplica de derecha a izquierda por 2,3,4,5,6,7
 *   (reiniciando en 2 tras el 7).
 * - Se suman los productos y se calcula el resto de dividir por 11.
 * - DV = 11 - resto. Si es 11 → 0, si es 10 → K, si no → el número.
 */

/** Normaliza un RUT a "dígitos + DV" sin separadores (ej: 12345678K). */
export function normalizeRut(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  // Conserva solo dígitos y la letra K (mayúscula); elimina puntos, guiones y espacios.
  return raw.replace(/[^0-9kK]/g, '').toUpperCase();
}

/** Formatea un RUT normalizado a formato chileno (ej: 12.345.678-9). */
export function formatRut(raw: unknown): string {
  const normalized = normalizeRut(raw);
  if (normalized.length < 2) return normalized;

  const body = normalized.slice(0, -1);
  const dv = normalized.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
}

/** Valida el formato y el dígito verificador de un RUT. */
export function isValidRut(raw: unknown): boolean {
  const rut = normalizeRut(raw);
  if (rut.length < 2) return false;

  const body = rut.slice(0, -1);
  const dv = rut.slice(-1);
  if (!/^[0-9]+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += parseInt(body.charAt(i), 10) * multiplier;
    multiplier = multiplier < 7 ? multiplier + 1 : 2;
  }

  const remainder = sum % 11;
  const checkDigit = 11 - remainder;

  let expected: string;
  if (checkDigit === 11) {
    expected = '0';
  } else if (checkDigit === 10) {
    expected = 'K';
  } else {
    expected = String(checkDigit);
  }

  return expected === dv;
}
