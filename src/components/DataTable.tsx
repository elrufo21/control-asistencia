import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  InputAdornment,
  Box,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchColumn?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Buscar...",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #e2e8f0", width: "100%" }}>
      {/* Search Header */}
      <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#ffffff" }}>
        <TextField
          size="small"
          placeholder={searchPlaceholder}
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          sx={{ width: { xs: "100%", sm: 320 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Mobile cards avoid forcing users to scroll a wide table. */}
      <Box sx={{ display: { xs: "block", md: "none" }, bgcolor: "#f8fafc", p: 1 }}>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <Box key={row.id} sx={{ bgcolor: "#fff", border: "1px solid #e2e8f0", borderRadius: 2, p: 1.5, mb: 1 }}>
              {row.getVisibleCells().map((cell) => (
                <Box key={cell.id} sx={{ display: "grid", gridTemplateColumns: "minmax(88px, 0.8fr) minmax(0, 1.2fr)", gap: 1, py: 0.75, alignItems: "start" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase" }}>
                    {(() => {
                      const header = table.getFlatHeaders().find((item) => item.column.id === cell.column.id);
                      return header ? flexRender(header.column.columnDef.header, header.getContext()) : cell.column.id;
                    })()}
                  </Typography>
                  <Box sx={{ minWidth: 0, "& .MuiButton-root": { maxWidth: "100%" }, "& > .MuiBox-root": { flexWrap: "wrap" } }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Box>
                </Box>
              ))}
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 5 }}>
            No se encontraron registros.
          </Typography>
        )}
      </Box>

      {/* Full table remains the most efficient view on wider screens. */}
      <TableContainer sx={{ display: { xs: "none", md: "block" }, width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      color: "text.secondary",
                      textTransform: "uppercase",
                      py: 1.5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} sx={{ py: 1.5, whiteSpace: "nowrap" }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ textAlign: "center", py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron registros.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, page) => table.setPageIndex(page)}
        onRowsPerPageChange={(e) => table.setPageSize(Number(e.target.value))}
        labelRowsPerPage="Filas por página:"
        sx={{
          ".MuiTablePagination-toolbar": {
            px: { xs: 1, sm: 2 },
            flexWrap: { xs: "wrap", sm: "nowrap" },
            justifyContent: { xs: "center", sm: "flex-end" },
          },
        }}
      />
    </Paper>
  );
}
