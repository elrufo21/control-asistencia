import React from "react";
import { Box, Typography } from "@mui/material";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <Box
      sx={{
        mb: { xs: 2.5, sm: 3 },
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "stretch", sm: "center" },
        gap: 2,
      }}
    >
      <Box>
        <Typography
          variant="h5"
          component="h1"
          sx={{
            fontWeight: 800,
            color: "text.primary",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Box sx={{ width: { xs: "100%", sm: "auto" }, "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } } }}>
          {action}
        </Box>
      )}
    </Box>
  );
};
