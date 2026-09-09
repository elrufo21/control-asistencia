import React from "react";
import { Chip } from "@mui/material";

interface StatusChipProps {
  status: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const getChipProps = (s: string) => {
    switch (s) {
      case "PRESENT":
        return { label: "Presente", color: "success" as const };
      case "LATE":
        return { label: "Tardanza", color: "warning" as const };
      case "ABSENT":
        return { label: "Falta", color: "error" as const };
      case "JUSTIFIED":
        return { label: "Justificado", color: "info" as const };
      case "DAY_OFF_EXCHANGE":
        return { label: "Canje por Descanso", color: "secondary" as const };
      case "DAY_OFF":
        return { label: "Descanso (1.0d)", color: "info" as const };
      case "HALF_DAY_OFF":
        return { label: "Medio Descanso (0.5d)", color: "secondary" as const };
      case "CONTRACT":
        return { label: "Por Contrata (4 Descansos/Mes)", color: "primary" as const };
      case "PER_DAY":
        return { label: "Por Días Laborados", color: "secondary" as const };
      case "OPEN":
        return { label: "Abierta (Sin salida)", color: "warning" as const };
      case "COMPLETED":
        return { label: "Completada", color: "success" as const };
      default:
        return { label: s, color: "default" as const };
    }
  };

  const props = getChipProps(status);
  return <Chip label={props.label} color={props.color} size="small" sx={{ fontWeight: 700, fontSize: "0.72rem" }} />;
};
