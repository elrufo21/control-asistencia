/**
 * Utilidades de fecha con soporte de zona horaria Perú (America/Lima).
 * Previene el bug en el cual new Date().toISOString() adelanta la fecha al día siguiente
 * a partir de las 7:00 PM (UTC-5).
 */

export function getLocalTodayStr(d: Date = new Date(), timeZone = "America/Lima"): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
}

/**
 * Retorna el primer día del mes en formato YYYY-MM-DD
 */
export function getFirstDayOfMonthStr(year: number, month1Indexed: number): string {
  const m = String(month1Indexed).padStart(2, "0");
  return `${year}-${m}-01`;
}

/**
 * Retorna el último día del mes en formato YYYY-MM-DD
 */
export function getLastDayOfMonthStr(year: number, month1Indexed: number): string {
  const m = String(month1Indexed).padStart(2, "0");
  const lastDay = new Date(year, month1Indexed, 0).getDate();
  const d = String(lastDay).padStart(2, "0");
  return `${year}-${m}-${d}`;
}
