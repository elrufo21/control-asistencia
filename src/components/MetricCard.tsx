import React from "react";
import { Card, CardContent, Typography, Box, Avatar } from "@mui/material";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color = "#1e40af",
  subtitle,
}) => {
  return (
    <Card sx={{ height: "100%", display: "flex", alignItems: "center" }}>
      <CardContent sx={{ width: "100%", display: "flex", alignItems: "center", gap: 2, p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Avatar
          sx={{
            bgcolor: `${color}15`,
            color: color,
            width: 52,
            height: 52,
            borderRadius: 3,
          }}
        >
          {icon}
        </Avatar>
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "text.primary", mt: 0.2 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
