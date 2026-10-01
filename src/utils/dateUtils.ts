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

/**
 * Calcula las fechas de inicio y fin del ciclo activo para un trabajador según su fecha de ingreso (hire_date).
 * Ejemplo: Si ingresó el día 5 de agosto, su ciclo en septiembre va del 5 de septiembre al 4 de octubre (30 días).
 */
export function getCycleDatesForHireDate(
  hireDateStr: string,
  refDate: Date = new Date()
): { startDate: string; endDate: string; anchorDay: number } {
  const parts = String(hireDateStr).slice(0, 10).split("-").map(Number);
  const hD = parts[2] || 1;
  const nowY = refDate.getFullYear();
  const nowM = refDate.getMonth() + 1;
  const nowD = refDate.getDate();

  let startYear = nowY;
  let startMonth = nowM;
  if (nowD < hD) {
    startMonth -= 1;
    if (startMonth === 0) {
      startMonth = 12;
      startYear -= 1;
    }
  }

  // Duración del mes en que inició el ciclo
  const daysInStartMonth = new Date(startYear, startMonth, 0).getDate();
  const actualStartDay = Math.min(hD, daysInStartMonth);

  const startObj = new Date(startYear, startMonth - 1, actualStartDay);
  const endObj = new Date(startYear, startMonth - 1, actualStartDay + daysInStartMonth - 1);

  return {
    startDate: getLocalTodayStr(startObj),
    endDate: getLocalTodayStr(endObj),
    anchorDay: actualStartDay,
  };
}

/**
 * Formatea una fecha YYYY-MM-DD a DD/Mes/AAAA (ej. 08/Sep/2026 o 05/Ago/2026)
 */
export function formatAttendanceDate(rawDate: any): string {
  if (!rawDate) return "-";
  const str = String(rawDate).slice(0, 10);
  const [yStr, mStr, dStr] = str.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!y || !m || !d) return str;

  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const monthName = months[m - 1] || mStr;
  const dayStr = String(d).padStart(2, "0");

  return `${dayStr}/${monthName}/${y}`;
}
