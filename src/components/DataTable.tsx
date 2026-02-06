"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  pageIndex?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  total?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount = 1,
  pageIndex = 1,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  total = 0,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showMax = 5;

    if (pageCount <= showMax) {
      for (let i = 1; i <= pageCount; i++) pages.push(i);
    } else {
      pages.push(1);
      if (pageIndex > 3) pages.push("...");

      const start = Math.max(2, pageIndex - 1);
      const end = Math.min(pageCount - 1, pageIndex + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (pageIndex < pageCount - 2) pages.push("...");
      if (!pages.includes(pageCount)) pages.push(pageCount);
    }
    return pages;
  };

  const from = total === 0 ? 0 : (pageIndex - 1) * pageSize + 1;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="rounded-xl border border-border/50 bg-background overflow-hidden shadow-sm flex flex-col min-h-0 flex-1">
        <div className="overflow-auto custom-scrollbar flex-1" style={{ maxHeight: "calc(100vh - 300px)" }}>
          <Table className="w-full table-auto border-separate border-spacing-0">
            <colgroup>
              {table.getFlatHeaders().map((header) => {
                const isActions = header.column.id === "actions";
                return (
                  <col 
                    key={header.id} 
                    style={{ 
                      width: isActions ? "150px" : "auto",
                      minWidth: isActions ? "150px" : "auto" 
                    }} 
                  />
                );
              })}
            </colgroup>
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="h-11 px-4 font-semibold text-muted-foreground whitespace-nowrap text-left bg-muted/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-30">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/30 transition-colors border-border/40">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id} 
                        className="py-3 px-4 whitespace-nowrap border-b border-border/40"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-muted-foreground">
                    Ma'lumotlar topilmadi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border/40 bg-muted/5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Ko'rsatilmoqda {from} dan</span>
            {onPageSizeChange && (
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  onPageSizeChange(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px] bg-transparent border-border/50 focus:ring-0">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 30].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <span>gacha, Yozuvlar soni: {total}.</span>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.(pageIndex - 1)}
              disabled={pageIndex <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-1">
              {getPageNumbers().map((p, i) =>
                typeof p === "number" ? (
                  <Button
                    key={i}
                    variant={p === pageIndex ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 text-xs font-medium rounded-lg transition-all",
                      p === pageIndex 
                        ? "bg-primary text-primary-foreground shadow-sm pointer-events-none" 
                        : "border border-border/50 hover:bg-muted text-muted-foreground",
                    )}
                    onClick={() => onPageChange?.(p)}
                  >
                    {p}
                  </Button>
                ) : (
                  <div
                    key={i}
                    className="flex h-8 w-8 items-center justify-center"
                  >
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </div>
                ),
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-border/50 hover:bg-muted"
              onClick={() => onPageChange?.(pageIndex + 1)}
              disabled={pageIndex >= pageCount}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
