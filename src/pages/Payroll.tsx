import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Grid,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Divider,
  Chip,
  Paper,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CloseIcon from "@mui/icons-material/Close";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import StarIcon from "@mui/icons-material/Star";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HistoryIcon from "@mui/icons-material/History";
import PaymentsIcon from "@mui/icons-material/Payments";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import { ColumnDef } from "@tanstack/react-table";
import { apiFetch } from "../services/api";
import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { DataTable } from "../components/DataTable";
import { StatusChip } from "../components/StatusChip";

const ALL_DAYS = [
  { key: "MONDAY", label: "Lun" },
  { key: "TUESDAY", label: "Mar" },
  { key: "WEDNESDAY", label: "Mié" },
  { key: "THURSDAY", label: "Jue" },
  { key: "FRIDAY", label: "Vie" },
  { key: "SATURDAY", label: "Sáb" },
  { key: "SUNDAY", label: "Dom" },
];

/**
 * Formatea una fecha de manera entendible para el usuario,
 * extrayendo día de semana, día, mes y año sin desfases de zona horaria.
 */
function formatCalendarDate(rawDate: any) {
  if (!rawDate) return { full: "-", short: "-", dmy: "-", dayName: "", dayNum: "", monthName: "", year: "", isSunday: false };
  const str = String(rawDate).slice(0, 10);
  const [yStr, mStr, dStr] = str.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!y || !m || !d) return { full: str, short: str, dmy: str, dayName: "", dayNum: str, monthName: "", year: "", isSunday: false };

  const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const fullDaysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const fullMonths = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // Usar componentes locales para evitar desfases de conversión UTC
  const dt = new Date(y, m - 1, d);
  const dayIndex = dt.getDay();
  const dayName = daysOfWeek[dayIndex];
  const fullDayName = fullDaysOfWeek[dayIndex];
  const monthName = months[m - 1];
  const fullMonthName = fullMonths[m - 1];
  const dayNum = String(d).padStart(2, "0");

  return {
    full: `${dayName}, ${dayNum} ${monthName} ${y}`,
    short: `${dayName}, ${dayNum} ${monthName}`,
    readableFull: `${fullDayName}, ${dayNum} de ${fullMonthName} de ${y}`,
    dmy: `${dayNum}/${monthName}/${y}`,
    dayName,
    fullDayName,
    dayNum,
    monthName,
    fullMonthName,
    year: String(y),
    isSunday: dayIndex === 0,
  };
}

function formatDateDMY(rawDate: any): string {
  if (!rawDate) return "-";
  const str = String(rawDate).slice(0, 10);
  const [yStr, mStr, dStr] = str.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!y || !m || !d) return str;
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const monthName = months[m - 1] || mStr;
  return `${String(d).padStart(2, "0")}/${monthName}/${y}`;
}

export const Payroll: React.FC = () => {
  const [mainTab, setMainTab] = useState(0);

  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayGroupModal, setShowPayGroupModal] = useState(false);
  const [showPayIndividualModal, setShowPayIndividualModal] = useState(false);
  const [showAddAdvanceModal, setShowAddAdvanceModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [receiptTab, setReceiptTab] = useState(0);

  // Histórico de pagos State
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Adelantos State
  const [advancesList, setAdvancesList] = useState<any[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [advEmployeeId, setAdvEmployeeId] = useState<string>("");
  const [advAmount, setAdvAmount] = useState<string>("");
  const [advReason, setAdvReason] = useState<string>("");
  const [advStatus, setAdvStatus] = useState<string>("APPROVED");
  const [advanceFilterStatus, setAdvanceFilterStatus] = useState<string>("ALL");
  const [creatingAdvance, setCreatingAdvance] = useState(false);

  // Period Form State
  const [periodName, setPeriodName] = useState("Agosto 2026");
  const [startDate, setStartDate] = useState("2026-08-01");
  const [endDate, setEndDate] = useState("2026-08-31");

  // Payment Form State (Grupal)
  const [payMethod, setPayMethod] = useState("TRANSFER");
  const [payRefCode, setPayRefCode] = useState("TRF-BCP-98214");
  const [payNotes, setPayNotes] = useState("Pago de planilla mensual regular");
  const [payDate, setPayDate] = useState("2026-08-31");
  const [paying, setPaying] = useState(false);

  // Edit / Individual Pay Form State
  const [editBase, setEditBase] = useState<number>(0);
  const [editCustomBonus, setEditCustomBonus] = useState<number>(0);
  const [editCustomDeduct, setEditCustomDeduct] = useState<number>(0);
  const [editLateDeduct, setEditLateDeduct] = useState<number>(0);
  const [editAdvDeduct, setEditAdvDeduct] = useState<number>(0);
  const [editTotalPay, setEditTotalPay] = useState<number>(0);
  const [editMethod, setEditMethod] = useState<string>("TRANSFER");
  const [editRefCode, setEditRefCode] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [savingIndividual, setSavingIndividual] = useState(false);

  // Ciclos Individuales de Empleados State
  const [employeeCycles, setEmployeeCycles] = useState<any[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [cycleRefDate, setCycleRefDate] = useState<string>(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    loadPeriods();
    loadPaymentHistory();
    loadAdvances();
    loadEmployees();
    loadEmployeeCycles();
  }, []);

  useEffect(() => {
    if (selectedPeriodId) {
      loadPeriodSummary(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  async function loadPeriods() {
    try {
      const data = await apiFetch("/payroll/periods");
      setPeriods(data || []);
      if (data.length && !selectedPeriodId) {
        setSelectedPeriodId(String(data[0].id));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadPeriodSummary(id: string) {
    setLoading(true);
    try {
      const data = await apiFetch(`/payroll/periods/${id}/summary`);
      setSummaryData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadPaymentHistory() {
    setLoadingHistory(true);
    try {
      const data = await apiFetch("/payroll/history");
      setPaymentHistory(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function loadAdvances() {
    try {
      const data = await apiFetch("/payroll/advances");
      setAdvancesList(data || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadEmployees() {
    try {
      const data = await apiFetch("/employees?status=ACTIVE");
      setEmployeesList(data.items || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadEmployeeCycles(refDate?: string) {
    setLoadingCycles(true);
    try {
      const dateParam = refDate || cycleRefDate;
      const data = await apiFetch(`/payroll/cycles?reference_date=${dateParam}`);
      setEmployeeCycles(data.cycles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCycles(false);
    }
  }

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiFetch("/payroll/periods", {
        method: "POST",
        body: JSON.stringify({ name: periodName, start_date: startDate, end_date: endDate }),
      });
      setShowCreateModal(false);
      await loadPeriods();
      setSelectedPeriodId(String(created.id));
    } catch (err: any) {
      alert(err.message || "Error al crear período");
    }
  };

  const handleCreateAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advEmployeeId || !advAmount) return;
    setCreatingAdvance(true);
    try {
      await apiFetch("/payroll/advances", {
        method: "POST",
        body: JSON.stringify({
          employee_id: Number(advEmployeeId),
          amount: Number(advAmount),
          reason: advReason || "Adelanto registrado desde el panel de administración",
          status: advStatus,
          requested_from: "WEB",
        }),
      });
      setShowAddAdvanceModal(false);
      setAdvAmount("");
      setAdvReason("");
      setAdvStatus("APPROVED");
      await loadAdvances();
      if (selectedPeriodId) await loadPeriodSummary(selectedPeriodId);
      alert("¡Adelanto de sueldo registrado exitosamente!");
    } catch (err: any) {
      alert(err.message || "Error al registrar adelanto");
    } finally {
      setCreatingAdvance(false);
    }
  };

  const handleUpdateAdvanceStatus = async (id: number, status: "APPROVED" | "REJECTED" | "PENDING") => {
    const actionLabel = status === "APPROVED" ? "Aprobar y Confirmar" : status === "REJECTED" ? "Rechazar" : "Revertir a Pendiente";
    if (!window.confirm(`¿Estás seguro de que deseas ${actionLabel} este adelanto de sueldo?`)) {
      return;
    }
    try {
      await apiFetch(`/payroll/advances/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadAdvances();
      if (selectedPeriodId) await loadPeriodSummary(selectedPeriodId);
    } catch (err: any) {
      alert(err.message || "Error al actualizar estado del adelanto");
    }
  };

  const handleDeleteAdvance = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este adelanto? Esta acción no se puede deshacer.")) {
      return;
    }
    try {
      await apiFetch(`/payroll/advances/${id}`, {
        method: "DELETE",
      });
      await loadAdvances();
      if (selectedPeriodId) await loadPeriodSummary(selectedPeriodId);
    } catch (err: any) {
      alert(err.message || "Error al eliminar adelanto");
    }
  };

  const handleCalculate = async () => {
    if (!selectedPeriodId) return;
    setLoading(true);
    try {
      await apiFetch(`/payroll/periods/${selectedPeriodId}/calculate`, { method: "POST" });
      await loadPeriodSummary(selectedPeriodId);
    } catch (err: any) {
      alert(err.message || "Error al calcular planilla");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessGroupPayment = async () => {
    if (!selectedPeriodId) return;
    setPaying(true);
    try {
      await apiFetch(`/payroll/periods/${selectedPeriodId}/pay`, {
        method: "POST",
        body: JSON.stringify({
          payment_method: payMethod,
          reference_code: payRefCode,
          notes: payNotes,
          payment_date: payDate,
        }),
      });
      setShowPayGroupModal(false);
      await loadPeriods();
      await loadPeriodSummary(selectedPeriodId);
      await loadPaymentHistory();
      await loadAdvances();
      alert("¡Pago de planilla registrado exitosamente y guardado en el histórico!");
    } catch (err: any) {
      alert(err.message || "Error al procesar el pago de planilla");
    } finally {
      setPaying(false);
    }
  };

  const openPayIndividualModal = (entry: any) => {
    setSelectedEntry(entry);
    setEditBase(Number(entry.base_amount));
    setEditCustomBonus(Number(entry.custom_bonus || 0));
    setEditCustomDeduct(Number(entry.custom_deduction || 0));
    setEditLateDeduct(Number(entry.lateness_deduction || 0));
    setEditAdvDeduct(Number(entry.advance_deduction || 0));
    setEditTotalPay(Number(entry.total_pay));
    setEditMethod(entry.payment_method || "TRANSFER");
    setEditRefCode(entry.reference_code || "TRF-BCP-" + Math.floor(10000 + Math.random() * 90000));
    setEditNotes(entry.notes || "");
    setShowPayIndividualModal(true);
  };

  // Recalcular el total a pagar cuando se cambian los campos manuales
  const handleBonusOrDeductChange = (newBonus: number, newDeduct: number) => {
    if (!selectedEntry) return;
    setEditCustomBonus(newBonus);
    setEditCustomDeduct(newDeduct);
    const day7 = Number(selectedEntry.day_7_amount || 0);
    const ot = Number(selectedEntry.overtime_bonus || 0);
    const newTotal = Math.max(0, editBase + day7 + ot + newBonus - editLateDeduct - editAdvDeduct - newDeduct);
    setEditTotalPay(newTotal);
  };

  const handleConfirmPayIndividual = async () => {
    if (!selectedEntry) return;
    setSavingIndividual(true);
    try {
      await apiFetch(`/payroll/entries/${selectedEntry.id}`, {
        method: "PUT",
        body: JSON.stringify({
          base_amount: editBase,
          custom_bonus: editCustomBonus,
          custom_deduction: editCustomDeduct,
          lateness_deduction: editLateDeduct,
          advance_deduction: editAdvDeduct,
          total_pay: editTotalPay,
          payment_method: editMethod,
          reference_code: editRefCode,
          notes: editNotes,
        }),
      });

      await apiFetch(`/payroll/entries/${selectedEntry.id}/pay`, {
        method: "POST",
        body: JSON.stringify({
          payment_method: editMethod,
          reference_code: editRefCode,
          notes: editNotes,
          payment_date: payDate,
        }),
      });

      setShowPayIndividualModal(false);
      await loadPeriodSummary(selectedPeriodId);
      await loadPaymentHistory();
      await loadAdvances();
      alert(`¡Pago de S/ ${editTotalPay.toFixed(2)} registrado exitosamente para ${selectedEntry.full_name}!`);
    } catch (err: any) {
      alert(err.message || "Error al registrar el pago individual");
    } finally {
      setSavingIndividual(false);
    }
  };

  const openReceipt = (entry: any) => {
    setSelectedEntry(entry);
    setReceiptTab(0);
    setShowReceiptModal(true);
  };

  const exportCSV = () => {
    if (!summaryData?.entries?.length) return;
    const headers = [
      "Código", "Trabajador", "Tipo Contrato", "Días Pres", "Días Tard",
      "Días Falt", "Días Just", "Horas Trab", "Min Tardanza", "Desc. Tardanza (S/)",
      "Min Extras", "Bonif. Extras (S/)", "Días Día 7", "Monto Día 7 (S/)", "Adelantos (S/)", "TOTAL NETO (S/)"
    ];
    const rows = summaryData.entries.map((e: any) => [
      e.employee_code, e.full_name, e.contract_type_snapshot,
      e.present_days, e.late_days, e.absent_days, e.justified_days,
      `${Math.floor(e.total_worked_minutes / 60)}h`, e.total_late_minutes, e.lateness_deduction,
      e.total_overtime_minutes, e.overtime_bonus, e.day_7_paid_days, e.day_7_amount, e.advance_deduction, e.total_pay
    ]);

    const csvContent = "data:text/csv;charset=utf-8-sig," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Planilla_${summaryData.period.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // TanStack Table columns - Planilla
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "employee_code",
      header: "Código",
      cell: (info) => (
        <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: "primary.main" }}>
          {String(info.getValue())}
        </Typography>
      ),
    },
    {
      accessorKey: "full_name",
      header: "Trabajador",
      cell: (info) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{String(info.getValue())}</Typography>
          {info.row.original.payment_method && (
            <Chip
              label={info.row.original.payment_method === "TRANSFER" ? "Transf. BCP/BBVA" : info.row.original.payment_method === "CASH" ? "Efectivo" : "Cheque"}
              size="small"
              sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, bgcolor: "#f1f5f9" }}
            />
          )}
        </Box>
      ),
    },
    {
      accessorKey: "advance_deduction",
      header: "Adelantos (S/)",
      cell: (info) => {
        const val = Number(info.getValue() || 0);
        return val > 0 ? (
          <Typography variant="body2" sx={{ fontWeight: 800, color: "secondary.main" }}>
            -S/ {val.toFixed(2)}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">S/ 0.00</Typography>
        );
      },
    },
    {
      accessorKey: "lateness_deduction",
      header: "Tardanza (Desc.)",
      cell: (info) => {
        const val = Number(info.getValue());
        const r = info.row.original;
        return val > 0 ? (
          <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
            {r.total_late_minutes}m (-S/ {val.toFixed(2)})
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">0 min</Typography>
        );
      },
    },
    {
      accessorKey: "overtime_bonus",
      header: "Extras (Bonif.)",
      cell: (info) => {
        const val = Number(info.getValue());
        const r = info.row.original;
        return val > 0 ? (
          <Typography variant="body2" sx={{ fontWeight: 700, color: "warning.main" }}>
            {r.total_overtime_minutes}m (+S/ {val.toFixed(2)})
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">0 min</Typography>
        );
      },
    },
    {
      accessorKey: "day_7_amount",
      header: "Descansos (S/)",
      cell: (info) => {
        const val = Number(info.getValue());
        const r = info.row.original;
        return val > 0 ? (
          <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
            +S/ {val.toFixed(2)} ({Number(r.day_7_paid_days)}d)
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">S/ 0.00</Typography>
        );
      },
    },
    {
      accessorKey: "total_pay",
      header: "TOTAL A PAGAR",
      cell: (info) => (
        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "success.main" }}>
          S/ {Number(info.getValue()).toFixed(2)}
        </Typography>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: (info) => {
        const r = info.row.original;
        const isPaid = r.status === "PAID";

        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ReceiptLongIcon />}
              onClick={() => openReceipt(r)}
            >
              Boleta
            </Button>
            {!isPaid ? (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => openPayIndividualModal(r)}
                sx={{ fontWeight: 800 }}
              >
                Pagar / Editar
              </Button>
            ) : (
              <Chip label="PAGADO" size="small" color="success" sx={{ fontWeight: 800 }} />
            )}
          </Box>
        );
      },
    },
  ];

  // TanStack Table columns - Histórico de Pagos
  const historyColumns: ColumnDef<any>[] = [
    {
      accessorKey: "payment_date",
      header: "Fecha de Pago",
      cell: (info) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {formatDateDMY(info.getValue())}
        </Typography>
      ),
    },
    {
      accessorKey: "period_name",
      header: "Período",
      cell: (info) => <Chip label={String(info.getValue())} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />,
    },
    {
      accessorKey: "full_name",
      header: "Trabajador",
      cell: (info) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{String(info.getValue())}</Typography>
          <Typography variant="caption" color="text.secondary">{info.row.original.employee_code}</Typography>
        </Box>
      ),
    },
    {
      accessorKey: "payment_method",
      header: "Método",
      cell: (info) => <Chip label={String(info.getValue())} size="small" sx={{ fontWeight: 700 }} />,
    },
    {
      accessorKey: "net_amount",
      header: "Total Pagado",
      cell: (info) => (
        <Typography variant="body2" sx={{ fontWeight: 800, color: "success.main" }}>
          S/ {Number(info.getValue()).toFixed(2)}
        </Typography>
      ),
    },
    {
      accessorKey: "reference_code",
      header: "Cód. Operación / Voucher",
      cell: (info) => (
        <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 700, color: "#64748b" }}>
          {String(info.getValue() || "N/A")}
        </Typography>
      ),
    },
    {
      id: "status_chip",
      header: "Estado",
      cell: () => <Chip label="PAGADO" size="small" color="success" sx={{ fontWeight: 800 }} />,
    },
  ];

  const pendingAdvancesCount = useMemo(() => {
    return advancesList.filter((a) => a.status === "PENDING").length;
  }, [advancesList]);

  const filteredAdvances = useMemo(() => {
    if (advanceFilterStatus === "ALL") return advancesList;
    return advancesList.filter((a) => a.status === advanceFilterStatus);
  }, [advancesList, advanceFilterStatus]);

  // TanStack Table columns - Adelantos de Sueldo
  const advancesColumns: ColumnDef<any>[] = [
    {
      accessorKey: "created_at",
      header: "Fecha Solicitud",
      cell: (info) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {formatDateDMY(info.getValue())}
        </Typography>
      ),
    },
    {
      accessorKey: "full_name",
      header: "Trabajador",
      cell: (info) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{String(info.getValue())}</Typography>
          <Typography variant="caption" color="text.secondary">{info.row.original.employee_code}</Typography>
        </Box>
      ),
    },
    {
      accessorKey: "amount",
      header: "Monto Adelantado",
      cell: (info) => (
        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "secondary.main" }}>
          S/ {Number(info.getValue()).toFixed(2)}
        </Typography>
      ),
    },
    {
      accessorKey: "requested_from",
      header: "Origen",
      cell: (info) => (
        <Chip
          label={info.getValue() === "KIOSK" ? "📸 Kiosco Facial" : "💻 Web Admin"}
          size="small"
          color={info.getValue() === "KIOSK" ? "primary" : "default"}
          sx={{ fontWeight: 700 }}
        />
      ),
    },
    {
      accessorKey: "reason",
      header: "Motivo / Sustento",
      cell: (info) => (
        <Typography variant="body2" color="text.secondary">
          {String(info.getValue() || "Sin motivo especificado")}
        </Typography>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: (info) => {
        const val = String(info.getValue());
        if (val === "PENDING") {
          return <Chip label="🟡 PENDIENTE DE CONFIRMACIÓN" color="warning" size="small" sx={{ fontWeight: 800 }} />;
        }
        if (val === "APPROVED") {
          return <Chip label="🟢 CONFIRMADO (POR DESCONTAR)" color="info" size="small" sx={{ fontWeight: 800 }} />;
        }
        if (val === "PAID") {
          return <Chip label="✔️ DESCONTADO EN PLANILLA" color="success" size="small" sx={{ fontWeight: 800 }} />;
        }
        if (val === "REJECTED") {
          return <Chip label="🔴 RECHAZADO" color="error" size="small" sx={{ fontWeight: 800 }} />;
        }
        return <Chip label={val} size="small" sx={{ fontWeight: 800 }} />;
      },
    },
    {
      id: "actions",
      header: "Gestión Administrador",
      cell: (info) => {
        const r = info.row.original;
        if (r.status === "PENDING") {
          return (
            <Box sx={{ display: "flex", gap: 0.8, alignItems: "center" }}>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleUpdateAdvanceStatus(r.id, "APPROVED")}
                sx={{ fontWeight: 800, textTransform: "none", fontSize: "0.75rem", py: 0.4, px: 1.2 }}
              >
                Confirmar
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => handleUpdateAdvanceStatus(r.id, "REJECTED")}
                sx={{ fontWeight: 800, textTransform: "none", fontSize: "0.75rem", py: 0.4, px: 1 }}
              >
                Rechazar
              </Button>
              <IconButton
                size="small"
                color="error"
                title="Eliminar adelanto"
                onClick={() => handleDeleteAdvance(r.id)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        }
        if (r.status === "APPROVED") {
          return (
            <Box sx={{ display: "flex", gap: 0.8, alignItems: "center" }}>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                onClick={() => handleUpdateAdvanceStatus(r.id, "REJECTED")}
                sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.72rem", py: 0.3, px: 1 }}
              >
                Rechazar
              </Button>
              <IconButton
                size="small"
                color="error"
                title="Eliminar adelanto"
                onClick={() => handleDeleteAdvance(r.id)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        }
        if (r.status === "REJECTED") {
          return (
            <Box sx={{ display: "flex", gap: 0.8, alignItems: "center" }}>
              <Button
                variant="outlined"
                color="success"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleUpdateAdvanceStatus(r.id, "APPROVED")}
                sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.72rem", py: 0.3, px: 1 }}
              >
                Re-Aprobar
              </Button>
              <IconButton
                size="small"
                color="error"
                title="Eliminar adelanto"
                onClick={() => handleDeleteAdvance(r.id)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        }
        return (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
            Liquidado en planilla #{r.period_id || ""}
          </Typography>
        );
      },
    },
  ];

  // TanStack Table columns - Ciclos Mensuales y Descansos
  const cycleColumns: ColumnDef<any>[] = [
    {
      accessorKey: "employee_code",
      header: "Código",
      cell: (info) => (
        <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700, color: "primary.main" }}>
          {String(info.getValue())}
        </Typography>
      ),
    },
    {
      accessorKey: "full_name",
      header: "Trabajador",
      cell: (info) => {
        const r = info.row.original;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {r.first_name} {r.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ingreso: {r.hire_date ? formatDateDMY(r.hire_date) : "No registrada"}
            </Typography>
          </Box>
        );
      },
    },
    {
      id: "cycle_range",
      header: "Ciclo Mensual Activo",
      cell: (info) => {
        const c = info.row.original.cycle;
        if (!c) return <Typography variant="caption" color="text.secondary">—</Typography>;
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
              {formatDateDMY(c.startDate)} al {formatDateDMY(c.endDate)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {c.daysInCycle} días de mes (Ancla: día {c.anchorDay})
            </Typography>
          </Box>
        );
      },
    },
    {
      accessorKey: "worked_days",
      header: "Días Asistidos",
      cell: (info) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {Number(info.getValue())} días
        </Typography>
      ),
    },
    {
      id: "day_off_stats",
      header: "Descansos Usados / Restantes",
      cell: (info) => {
        const r = info.row.original;
        const used = Number(r.used_days_off || 0);
        const rem = Number(r.remaining_days_off || 0);
        const maxD = Number(r.max_days_off || 4);
        const isExceeded = used > maxD;
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: isExceeded ? "error.main" : "primary.main" }}>
                {used} / {maxD} días
              </Typography>
              {isExceeded && (
                <Chip label="⚠️ Exceso" color="error" size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 800 }} />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {rem > 0 ? `Restan: ${rem} días por gozar` : "Saldo mensual completado"}
            </Typography>
          </Box>
        );
      },
    },
    {
      accessorKey: "allow_half_day_off",
      header: "Medio Día",
      cell: (info) => (
        <Chip
          size="small"
          label={info.getValue() ? "0.5d Habilitado" : "Solo 1.0d"}
          color={info.getValue() ? "info" : "default"}
          variant={info.getValue() ? "filled" : "outlined"}
          sx={{ height: 22, fontSize: "0.68rem", fontWeight: 700 }}
        />
      ),
    },
    {
      accessorKey: "pending_advances",
      header: "Adelantos Pendientes",
      cell: (info) => {
        const val = Number(info.getValue() || 0);
        return val > 0 ? (
          <Typography variant="body2" sx={{ fontWeight: 700, color: "secondary.main" }}>
            -S/ {val.toFixed(2)}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">S/ 0.00</Typography>
        );
      },
    },
    {
      accessorKey: "projected_pay",
      header: "Pago Proyectado Ciclo",
      cell: (info) => (
        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "success.main" }}>
          S/ {Number(info.getValue() || 0).toFixed(2)}
        </Typography>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Planilla, Liquidación y Registro de Pagos"
        subtitle="Cálculo automático de haberes, gestión de adelantos de sueldo y archivo histórico de comprobantes."
        action={
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setShowCreateModal(true)}>
              Nuevo Período
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PriceCheckIcon />}
              onClick={() => setShowAddAdvanceModal(true)}
            >
              Registrar Adelanto
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleCalculate}
              disabled={loading || !selectedPeriodId}
            >
              Calcular Planilla
            </Button>
            {summaryData?.period?.status !== "CLOSED" ? (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => setShowPayGroupModal(true)}
                disabled={!summaryData?.entries?.length}
                sx={{ fontWeight: 800 }}
              >
                PAGAR TODOS LOS PENDIENTES
              </Button>
            ) : (
              <Chip label="PLANILLA PAGADA Y CERRADA" color="success" sx={{ height: 36, fontWeight: 900, px: 1 }} />
            )}
            <Button
              variant="contained"
              color="secondary"
              startIcon={<DownloadIcon />}
              onClick={exportCSV}
              disabled={!summaryData?.entries?.length}
            >
              Exportar CSV
            </Button>
          </Box>
        }
      />

      {/* Tabs Principales */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={mainTab} onChange={(_, val) => setMainTab(val)}>
          <Tab label="1. Cálculo y Liquidación Actual" icon={<PaymentsIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
          <Tab label="2. Histórico de Pagos de Salario" icon={<HistoryIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <span>3. 💸 Adelantos ({advancesList.length})</span>
                {pendingAdvancesCount > 0 && (
                  <Chip
                    label={`${pendingAdvancesCount} por confirmar`}
                    color="warning"
                    size="small"
                    sx={{ height: 20, fontSize: "0.7rem", fontWeight: 800 }}
                  />
                )}
              </Box>
            }
            icon={<PriceCheckIcon />}
            iconPosition="start"
            sx={{ fontWeight: 700 }}
          />
          <Tab label={`4. 🔄 Ciclos y Descansos (${employeeCycles.length})`} icon={<CalendarMonthIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      {mainTab === 0 ? (
        <Box>
          {/* Period Selector */}
          <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
            <FormControl size="small" sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { sm: 280 } }}>
              <InputLabel>Período de Planilla</InputLabel>
              <Select
                value={selectedPeriodId}
                label="Período de Planilla"
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                sx={{ fontWeight: 700 }}
              >
                {periods.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} ({formatDateDMY(p.start_date)} al {formatDateDMY(p.end_date)}) {p.status === "CLOSED" ? " · [PAGADA]" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Metric Cards Grid */}
          {summaryData && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Total Planilla Neto"
                  value={`S/ ${Number(summaryData.totals.total_payroll).toFixed(2)}`}
                  icon={<AttachMoneyIcon />}
                  color="#059669"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Total Descansos Pagados"
                  value={`S/ ${Number(summaryData.totals.total_day_7).toFixed(2)}`}
                  icon={<CardGiftcardIcon />}
                  color="#1e40af"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Total Horas Extras"
                  value={`S/ ${Number(summaryData.totals.total_overtime).toFixed(2)}`}
                  icon={<StarIcon />}
                  color="#d97706"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Total Desc. Tardanzas"
                  value={`S/ ${Number(summaryData.totals.total_late_deductions).toFixed(2)}`}
                  icon={<MoneyOffIcon />}
                  color="#dc2626"
                />
              </Grid>
            </Grid>
          )}

          {/* TanStack DataTable */}
          <DataTable columns={columns} data={summaryData?.entries || []} searchPlaceholder="Filtrar por trabajador o código..." />
        </Box>
      ) : mainTab === 1 ? (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            📜 Archivo Histórico de Pagos Mensuales Realizados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Registro auditado de todas las liquidaciones y pagos de sueldo procesados por el sistema.
          </Typography>
          <DataTable columns={historyColumns} data={paymentHistory} searchPlaceholder="Buscar en historial por trabajador..." />
        </Box>
      ) : mainTab === 2 ? (
        <Box>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                💸 Registro y Control de Adelantos de Sueldo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Historial de adelantos solicitados por los trabajadores desde el Kiosco Biométrico o autorizados por Administración.
              </Typography>
            </Box>
            <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => setShowAddAdvanceModal(true)} sx={{ alignSelf: { sm: "center" } }}>
              Nuevo Adelanto
            </Button>
          </Box>

          {/* Quick Filters */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            <Chip
              label={`Todos (${advancesList.length})`}
              clickable
              color={advanceFilterStatus === "ALL" ? "primary" : "default"}
              variant={advanceFilterStatus === "ALL" ? "filled" : "outlined"}
              onClick={() => setAdvanceFilterStatus("ALL")}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label={`🟡 Por Confirmar (${advancesList.filter((a) => a.status === "PENDING").length})`}
              clickable
              color={advanceFilterStatus === "PENDING" ? "warning" : "default"}
              variant={advanceFilterStatus === "PENDING" ? "filled" : "outlined"}
              onClick={() => setAdvanceFilterStatus("PENDING")}
              sx={{ fontWeight: 800 }}
            />
            <Chip
              label={`🟢 Confirmados (${advancesList.filter((a) => a.status === "APPROVED").length})`}
              clickable
              color={advanceFilterStatus === "APPROVED" ? "info" : "default"}
              variant={advanceFilterStatus === "APPROVED" ? "filled" : "outlined"}
              onClick={() => setAdvanceFilterStatus("APPROVED")}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label={`✔️ Descontados (${advancesList.filter((a) => a.status === "PAID").length})`}
              clickable
              color={advanceFilterStatus === "PAID" ? "success" : "default"}
              variant={advanceFilterStatus === "PAID" ? "filled" : "outlined"}
              onClick={() => setAdvanceFilterStatus("PAID")}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label={`🔴 Rechazados (${advancesList.filter((a) => a.status === "REJECTED").length})`}
              clickable
              color={advanceFilterStatus === "REJECTED" ? "error" : "default"}
              variant={advanceFilterStatus === "REJECTED" ? "filled" : "outlined"}
              onClick={() => setAdvanceFilterStatus("REJECTED")}
              sx={{ fontWeight: 700 }}
            />
          </Box>

          <DataTable columns={advancesColumns} data={filteredAdvances} searchPlaceholder="Buscar adelantos por trabajador..." />
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, mb: 2.5 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                🔄 Ciclos Mensuales y Descansos Rotativos por Empleado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monitoreo individual según fecha de ingreso de cada trabajador y su saldo de 4 descansos al mes.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              <TextField
                size="small"
                label="Fecha de Referencia"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={cycleRefDate}
                onChange={(e) => {
                  setCycleRefDate(e.target.value);
                  loadEmployeeCycles(e.target.value);
                }}
              />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => loadEmployeeCycles()}
                disabled={loadingCycles}
              >
                Actualizar
              </Button>
            </Box>
          </Box>
          <DataTable columns={cycleColumns} data={employeeCycles} searchPlaceholder="Buscar por código o trabajador..." />
        </Box>
      )}

      {/* Registrar Adelanto Modal */}
      <Dialog open={showAddAdvanceModal} onClose={() => setShowAddAdvanceModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, color: "secondary.main" }}>
          💸 Registrar Adelanto de Sueldo
          <IconButton onClick={() => setShowAddAdvanceModal(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleCreateAdvance}>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <FormControl fullWidth required>
              <InputLabel>Seleccione Trabajador</InputLabel>
              <Select value={advEmployeeId} label="Seleccione Trabajador" onChange={(e) => setAdvEmployeeId(e.target.value)}>
                {employeesList.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.employee_code} · {emp.first_name} {emp.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Monto del Adelanto (S/)"
              type="number"
              fullWidth
              required
              placeholder="ej. 150.00"
              value={advAmount}
              onChange={(e) => setAdvAmount(e.target.value)}
            />

            <TextField
              label="Motivo / Sustento"
              fullWidth
              multiline
              rows={2}
              placeholder="ej. Adelanto quincenal de gastos personales"
              value={advReason}
              onChange={(e) => setAdvReason(e.target.value)}
            />

            <FormControl fullWidth>
              <InputLabel>Estado Inicial de la Solicitud</InputLabel>
              <Select
                value={advStatus}
                label="Estado Inicial de la Solicitud"
                onChange={(e) => setAdvStatus(e.target.value)}
              >
                <MenuItem value="APPROVED">🟢 Confirmado / Aprobado (Listo para descontar en planilla)</MenuItem>
                <MenuItem value="PENDING">🟡 Pendiente de Confirmación (Guardar para revisión posterior)</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setShowAddAdvanceModal(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="secondary" disabled={creatingAdvance} sx={{ px: 3, fontWeight: 800 }}>
              {creatingAdvance ? "Guardando..." : "🟢 GUARDAR ADELANTO"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Pay & Edit Individual Modal (Con Desglose Descriptivo Completo) */}
      {showPayIndividualModal && selectedEntry && (
        <Dialog open={showPayIndividualModal} onClose={() => setShowPayIndividualModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, color: "success.main" }}>
            🟢 Procesar Pago & Liquidación: {selectedEntry.full_name}
            <IconButton onClick={() => setShowPayIndividualModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Tarjeta de Desglose Descriptivo de Haberes y Descuentos */}
            <Box sx={{ bgcolor: "#f8fafc", p: 2, borderRadius: 2, border: "1px solid #e2e8f0" }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", display: "block", mb: 1 }}>
                📋 Desglose Descriptivo de la Liquidación:
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Jornales base ({selectedEntry.present_days + selectedEntry.late_days + selectedEntry.justified_days} días a S/ {Number(selectedEntry.daily_rate_snapshot).toFixed(2)}/día)
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>+ S/ {editBase.toFixed(2)}</Typography>
                </Box>

                {Number(selectedEntry.day_7_amount) > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="primary.main">
                      + Descansos Mensuales Remunerados ({Number(selectedEntry.day_7_paid_days)}d)
                    </Typography>
                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>
                      + S/ {Number(selectedEntry.day_7_amount).toFixed(2)}
                    </Typography>
                  </Box>
                )}

                {Number(selectedEntry.overtime_bonus) > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="warning.main">
                      + Horas Extras ({selectedEntry.total_overtime_minutes} min)
                    </Typography>
                    <Typography variant="body2" color="warning.main" sx={{ fontWeight: 700 }}>
                      + S/ {Number(selectedEntry.overtime_bonus).toFixed(2)}
                    </Typography>
                  </Box>
                )}

                {editCustomBonus > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="success.main">
                      + Bono Adicional Manual
                    </Typography>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                      + S/ {editCustomBonus.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                {editLateDeduct > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="error.main">
                      - Descuento Tardanzas ({selectedEntry.total_late_minutes} min)
                    </Typography>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>
                      - S/ {editLateDeduct.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                {editAdvDeduct > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="secondary.main" sx={{ fontWeight: 700 }}>
                      💸 Descuento Adelantos de Sueldo
                    </Typography>
                    <Typography variant="body2" color="secondary.main" sx={{ fontWeight: 800 }}>
                      - S/ {editAdvDeduct.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                {editCustomDeduct > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="error.main">
                      - Descuento Adicional Manual
                    </Typography>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>
                      - S/ {editCustomDeduct.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 0.5 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#166534" }}>
                    = NETO CALCULADO A PAGAR
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#166534" }}>
                    S/ {editTotalPay.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha de Pago"
                  type="date"
                  fullWidth
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Método de Pago</InputLabel>
                  <Select value={editMethod} label="Método de Pago" onChange={(e) => setEditMethod(e.target.value)}>
                    <MenuItem value="TRANSFER">Transferencia (BCP / BBVA / Yape)</MenuItem>
                    <MenuItem value="CASH">Efectivo en Ventanilla</MenuItem>
                    <MenuItem value="CHECK">Cheque de Gerencia</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Número de Operación / Código de Voucher"
                  fullWidth
                  placeholder="ej. TRF-BCP-98214"
                  value={editRefCode}
                  onChange={(e) => setEditRefCode(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 0.5 }}>
              <Chip label="Ajustes Manuales Opcionales" size="small" />
            </Divider>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Bono Adicional Manual (S/)"
                  type="number"
                  fullWidth
                  value={editCustomBonus}
                  onChange={(e) => handleBonusOrDeductChange(Number(e.target.value), editCustomDeduct)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Descuento Adicional Manual (S/)"
                  type="number"
                  fullWidth
                  value={editCustomDeduct}
                  onChange={(e) => handleBonusOrDeductChange(editCustomBonus, Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="MONTO FINAL A PAGAR (S/)"
                  type="number"
                  fullWidth
                  value={editTotalPay}
                  onChange={(e) => setEditTotalPay(Number(e.target.value))}
                  InputProps={{ sx: { fontWeight: 900, color: "success.main", fontSize: "1.2rem" } }}
                />
              </Grid>
            </Grid>

            <TextField
              label="Notas / Observaciones del Pago"
              fullWidth
              multiline
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setShowPayIndividualModal(false)} color="inherit">
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayIndividual} variant="contained" color="success" disabled={savingIndividual} sx={{ px: 3, fontWeight: 800 }}>
              {savingIndividual ? "Registrando Pago..." : `🟢 CONFIRMAR Y PAGAR S/ ${editTotalPay.toFixed(2)}`}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Process Group Payment Modal */}
      <Dialog open={showPayGroupModal} onClose={() => setShowPayGroupModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, color: "success.main" }}>
          🟢 Procesar Pago Grupal de Todos los Pendientes
          <IconButton onClick={() => setShowPayGroupModal(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Alert severity="info" sx={{ fontWeight: 600 }}>
            Se registrará el pago para los trabajadores pendientes del período <b>{summaryData?.period?.name}</b> por un total de:
            <Typography variant="h5" sx={{ fontWeight: 900, color: "success.main", mt: 1 }}>
              S/ {Number(summaryData?.totals?.total_payroll || 0).toFixed(2)}
            </Typography>
          </Alert>

          <TextField
            label="Fecha del Pago"
            type="date"
            fullWidth
            required
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth>
            <InputLabel>Método de Pago por Defecto</InputLabel>
            <Select value={payMethod} label="Método de Pago por Defecto" onChange={(e) => setPayMethod(e.target.value)}>
              <MenuItem value="TRANSFER">Transferencia Bancaria (BCP / BBVA / Interbank)</MenuItem>
              <MenuItem value="CASH">Efectivo en Ventanilla</MenuItem>
              <MenuItem value="CHECK">Cheque de Gerencia</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Número de Operación / Código de Voucher por Defecto"
            fullWidth
            placeholder="ej. TRF-BCP-98214"
            value={payRefCode}
            onChange={(e) => setPayRefCode(e.target.value)}
          />

          <TextField
            label="Notas / Observaciones del Pago"
            fullWidth
            multiline
            rows={2}
            value={payNotes}
            onChange={(e) => setPayNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setShowPayGroupModal(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleProcessGroupPayment} variant="contained" color="success" disabled={paying} sx={{ px: 3, fontWeight: 800 }}>
            {paying ? "Procesando Pago..." : "🟢 CONFIRMAR Y PAGAR TODOS"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Period Modal */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800 }}>
          Crear Período de Planilla
          <IconButton onClick={() => setShowCreateModal(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleCreatePeriod}>
          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Nombre del Período"
              fullWidth
              required
              placeholder="ej. Agosto 2026"
              value={periodName}
              onChange={(e) => setPeriodName(e.target.value)}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha Inicio"
                  type="date"
                  fullWidth
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha Fin"
                  type="date"
                  fullWidth
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setShowCreateModal(false)} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" sx={{ px: 3 }}>
              Crear Período
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Detailed Receipt & Schedule Modal */}
      {showReceiptModal && selectedEntry && (
        <Dialog open={showReceiptModal} onClose={() => setShowReceiptModal(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800 }}>
            Boleta de Liquidación & Detalle de Asistencia
            <IconButton onClick={() => setShowReceiptModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <Box sx={{ px: 3, pt: 1, borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={receiptTab} onChange={(_, val) => setReceiptTab(val)}>
              <Tab label="1. Boleta de Pago" sx={{ fontWeight: 700 }} />
              <Tab label="2. Horario y Días Laborales" sx={{ fontWeight: 700 }} />
              <Tab label="3. Calendario Diario del Período" sx={{ fontWeight: 700 }} />
            </Tabs>
          </Box>

          <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5, minHeight: 380 }}>
            {/* Header info */}
            <Box sx={{ bgcolor: "#f8fafc", p: 2, borderRadius: 2, border: "1px solid #e2e8f0" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {selectedEntry.full_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Código: {selectedEntry.employee_code} · Puesto: {selectedEntry.position || "Operativo"} · Contrato: {selectedEntry.contract_type_snapshot === "CONTRACT" ? "Por Contrata (4 Descansos/Mes)" : "Por Días"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tarifa Diaria Base: S/ {Number(selectedEntry.daily_rate_snapshot).toFixed(2)} · H.E. S/ {Number(selectedEntry.ot_rate_snapshot || 8).toFixed(2)}/hora
              </Typography>
            </Box>

            {/* TAB 0: Boleta */}
            {receiptTab === 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", textTransform: "uppercase", display: "block", mb: 1 }}>
                    1. Haberes e Ingresos
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: "#eff6ff", borderRadius: 2, border: "1px solid #bfdbfe", display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2">Jornales trabajados ({selectedEntry.present_days + selectedEntry.late_days + selectedEntry.justified_days} días)</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>S/ {Number(selectedEntry.base_amount).toFixed(2)}</Typography>
                    </Box>

                    {Number(selectedEntry.day_7_amount) > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>
                          + Descansos Mensuales Remunerados ({Number(selectedEntry.day_7_paid_days)} días de 4)
                        </Typography>
                        <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>
                          + S/ {Number(selectedEntry.day_7_amount).toFixed(2)}
                        </Typography>
                      </Box>
                    )}

                    {Number(selectedEntry.overtime_bonus) > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="warning.main" sx={{ fontWeight: 700 }}>
                          + Horas Extras ({selectedEntry.total_overtime_minutes} minutos)
                        </Typography>
                        <Typography variant="body2" color="warning.main" sx={{ fontWeight: 700 }}>
                          + S/ {Number(selectedEntry.overtime_bonus).toFixed(2)}
                        </Typography>
                      </Box>
                    )}

                    {Number(selectedEntry.custom_bonus) > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                          + Bono Adicional Manual
                        </Typography>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                          + S/ {Number(selectedEntry.custom_bonus).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "error.main", textTransform: "uppercase", display: "block", mb: 1 }}>
                    2. Descuentos y Retenciones
                  </Typography>
                  <Box sx={{ p: 2, bgcolor: "#fef2f2", borderRadius: 2, border: "1px solid #fecaca", display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2">Descuento por Tardanza ({selectedEntry.total_late_minutes} min)</Typography>
                      <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>
                        - S/ {Number(selectedEntry.lateness_deduction).toFixed(2)}
                      </Typography>
                    </Box>

                    {Number(selectedEntry.advance_deduction) > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "secondary.main" }}>
                          💸 Descuento por Adelantos de Sueldo
                        </Typography>
                        <Typography variant="body2" color="secondary.main" sx={{ fontWeight: 800 }}>
                          - S/ {Number(selectedEntry.advance_deduction).toFixed(2)}
                        </Typography>
                      </Box>
                    )}

                    {Number(selectedEntry.custom_deduction) > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2">Descuento Adicional Manual</Typography>
                        <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>
                          - S/ {Number(selectedEntry.custom_deduction).toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, bgcolor: "#f0fdf4", borderRadius: 2, border: "2px solid #22c55e" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#15803d" }}>
                    NETO A COBRAR
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: "#15803d" }}>
                    S/ {Number(selectedEntry.total_pay).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* TAB 1: Horario & Régimen */}
            {receiptTab === 1 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fafc" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1e293b", mb: 0.5 }}>
                    Plantilla de Horario Asignada:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: "primary.main" }}>
                    {selectedEntry.schedule_name || "Turno General / Por Defecto"}
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1e293b", mb: 1 }}>
                    Régimen y Modalidad de Descansos
                  </Typography>
                  {selectedEntry.contract_type_snapshot === "CONTRACT" ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <Chip
                        label="Horario Rotativo (4 Descansos Mensuales Remunerados)"
                        color="primary"
                        sx={{ fontWeight: 700, width: "fit-content" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        El personal goza de una cuota de hasta 4.0 días de descanso remunerados por ciclo mensual, distribuidos de forma rotativa según la programación operativa y registrados mediante el kiosco o panel web.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <Chip
                        label="Por Día Laborado"
                        sx={{ fontWeight: 700, width: "fit-content" }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Liquidación calculada estrictamente en base a las asistencias y horas efectivas registradas en el período.
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>
            )}

            {/* TAB 2: Calendario Diario del Período */}
            {receiptTab === 2 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Asistencias Diarias Registradas ({selectedEntry.daily_records?.length || 0} días evaluados)
                </Typography>

                <Grid container spacing={1.5}>
                  {selectedEntry.daily_records?.map((d: any) => {
                    const dt = formatCalendarDate(d.operational_date);
                    return (
                      <Grid item xs={6} sm={4} md={3} key={d.operational_date}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            bgcolor: dt.isSunday ? "#f8fafc" : "#ffffff",
                            borderRadius: 2,
                            borderColor: dt.isSunday ? "#cbd5e1" : "#e2e8f0",
                            transition: "all 0.15s ease",
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.8,
                            "&:hover": {
                              borderColor: "primary.main",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            },
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 800,
                                color: dt.isSunday ? "primary.main" : "#0f172a",
                                fontSize: "0.85rem",
                              }}
                            >
                              {dt.dayName}, {dt.dayNum} {dt.monthName}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#94a3b8", fontWeight: 700, fontSize: "0.72rem" }}
                            >
                              {dt.year}
                            </Typography>
                          </Box>

                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
                            <StatusChip status={d.status} />
                            {d.day_off_type && (
                              <Chip
                                label={
                                  d.day_off_type === "MORNING"
                                    ? "Mañana"
                                    : d.day_off_type === "AFTERNOON"
                                    ? "Tarde"
                                    : "Día Completo"
                                }
                                size="small"
                                variant="outlined"
                                color="info"
                                sx={{ height: 22, fontSize: "0.68rem", fontWeight: 700 }}
                              />
                            )}
                          </Box>

                          {d.late_minutes > 0 && d.status !== "JUSTIFIED" && (
                            <Typography
                              variant="caption"
                              color="error.main"
                              sx={{ display: "block", fontWeight: 700, fontSize: "0.75rem" }}
                            >
                              ⚠️ {d.late_minutes}m tardanza
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setShowReceiptModal(false)} variant="contained">
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};
