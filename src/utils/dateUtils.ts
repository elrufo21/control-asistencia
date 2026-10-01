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

export interface EmployeeLaborCycle {
  id: string;
  label: string;
  shortLabel: string;
  startDate: string;
  endDate30Days: string;
  endDateSameDay: string;
  isCurrent: boolean;
  anchorDay: number;
  monthName: string;
  year: number;
}

/**
 * Calcula las fechas de inicio y fin del ciclo activo para un trabajador según su fecha de ingreso (hire_date).
 * Ejemplo: Si ingresó el día 5 de agosto, su ciclo en septiembre va del 5 de septiembre al 4 de octubre (30 días).
 */
export function getCycleDatesForHireDate(
  hireDateStr: string,
  refDate: Date = new Date(),
  inclusiveCutoffDay: boolean = false
): { startDate: string; endDate: string; anchorDay: number } {
  const cycles = generateEmployeeLaborCycles(hireDateStr, refDate, 1);
  if (cycles.length > 0) {
    const cur = cycles[0];
    return {
      startDate: cur.startDate,
      endDate: inclusiveCutoffDay ? cur.endDateSameDay : cur.endDate30Days,
      anchorDay: cur.anchorDay,
    };
  }

  // Fallback seguro
  const todayStr = getLocalTodayStr(refDate);
  return { startDate: todayStr, endDate: todayStr, anchorDay: 1 };
}

/**
 * Genera una lista de ciclos laborales ordenados cronológicamente desde el actual hacia atrás.
 * Para un empleado con fecha de ingreso (ej: 09 de septiembre):
 * Ciclo actual: 09/Sep/2026 al 08/Oct/2026 (o 09/Oct)
 * Ciclo anterior: 09/Ago/2026 al 08/Sep/2026 (o 09/Sep)
 */
export function generateEmployeeLaborCycles(
  hireDateStr: string | null | undefined,
  refDate: Date = new Date(),
  count: number = 6
): EmployeeLaborCycle[] {
  if (!hireDateStr) return [];

  const parts = String(hireDateStr).slice(0, 10).split("-").map(Number);
  const hireYear = parts[0] || refDate.getFullYear();
  const hireMonth = parts[1] || refDate.getMonth() + 1;
  const anchorDay = parts[2] || 1;

  const nowY = refDate.getFullYear();
  const nowM = refDate.getMonth() + 1;
  const nowD = refDate.getDate();

  // Determinar en qué año y mes inició el ciclo actual
  let currentStartYear = nowY;
  let currentStartMonth = nowM;
  if (nowD < anchorDay) {
    currentStartMonth -= 1;
    if (currentStartMonth === 0) {
      currentStartMonth = 12;
      currentStartYear -= 1;
    }
  }

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const monthShort = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];

  const results: EmployeeLaborCycle[] = [];

  for (let i = 0; i < count; i++) {
    // Retroceder i meses desde el ciclo actual
    let m = currentStartMonth - i;
    let y = currentStartStartMonthToYear(currentStartYear, m);
    m = normalizeMonth(m);

    // No generar ciclos anteriores a la fecha de ingreso (con margen de 1 mes)
    const hireDateNumber = hireYear * 100 + hireMonth;
    const cycleDateNumber = y * 100 + m;
    if (cycleDateNumber < hireDateNumber - 1 && i > 0) {
      break;
    }

    const maxDaysInStartMonth = new Date(y, m, 0).getDate();
    const actualStartDay = Math.min(anchorDay, maxDaysInStartMonth);
    const startStr = `${y}-${String(m).padStart(2, "0")}-${String(actualStartDay).padStart(2, "0")}`;

    // Mes siguiente (corte del ciclo)
    let nextM = m + 1;
    let nextY = y;
    if (nextM > 12) {
      nextM = 1;
      nextY = y + 1;
    }
    const maxDaysInNextMonth = new Date(nextY, nextM, 0).getDate();
    const actualSameDayInNextMonth = Math.min(anchorDay, maxDaysInNextMonth);
    const sameDayStr = `${nextY}-${String(nextM).padStart(2, "0")}-${String(actualSameDayInNextMonth).padStart(2, "0")}`;

    // Día anterior al mismo día del mes siguiente (ciclo de 30 días exactos)
    const nextDateObj = new Date(nextY, nextM - 1, actualSameDayInNextMonth);
    nextDateObj.setDate(nextDateObj.getDate() - 1);
    const end30DaysStr = getLocalTodayStr(nextDateObj);

    const isCurrent = i === 0;
    const startDisplay = `${String(actualStartDay).padStart(2, "0")}/${monthShort[m - 1]}/${y}`;
    const end30Display = formatAttendanceDate(end30DaysStr);
    const endSameDayDisplay = formatAttendanceDate(sameDayStr);

    const label = isCurrent
      ? `Ciclo Actual: ${startDisplay} al ${end30Display} (En curso)`
      : i === 1
      ? `Ciclo Anterior: ${startDisplay} al ${end30Display} (Cerrado)`
      : `Ciclo: ${startDisplay} al ${end30Display}`;

    results.push({
      id: `cycle-${i}`,
      label,
      shortLabel: `${startDisplay} - ${end30Display}`,
      startDate: startStr,
      endDate30Days: end30DaysStr,
      endDateSameDay: sameDayStr,
      isCurrent,
      anchorDay,
      monthName: monthNames[m - 1],
      year: y,
    });
  }

  return results;
}

function currentStartStartMonthToYear(startYear: number, monthVal: number): number {
  let y = startYear;
  let m = monthVal;
  while (m <= 0) {
    m += 12;
    y -= 1;
  }
  return y;
}

function normalizeMonth(monthVal: number): number {
  let m = monthVal;
  while (m <= 0) {
    m += 12;
  }
  while (m > 12) {
    m -= 12;
  }
  return m;
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
