/**
 * Extrae el porcentaje de descuento de un texto de badge libre (ej. "-30%", "30% OFF").
 * Devuelve null si no hay un número válido entre 1 y 100.
 */
export function parseDiscountPercentage(badge?: string | null): number | null {
  if (!badge) return null;
  const match = badge.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const pct = parseFloat(match[1]);
  return pct > 0 && pct <= 100 ? pct : null;
}

/**
 * Calcula el precio con descuento a partir de un precio base y un badge (ej. "-30%").
 * Devuelve null si el badge no contiene un porcentaje válido.
 */
export function computeDiscountPrice(price: number, badge?: string | null): number | null {
  const pct = parseDiscountPercentage(badge);
  if (pct === null) return null;
  return Math.round(price * (1 - pct / 100) * 100) / 100;
}
