import type { ColumnDef } from "@tanstack/react-table";
import type { Stall } from "../../../types/api-responses";
import { MoreHorizontal, Edit, Trash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStalls } from "../hooks/useStalls";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ActionCellProps {
  stall: Stall;
  onEdit: (stall: Stall) => void;
}

const ActionCell = ({ stall, onEdit }: ActionCellProps) => {
  const { deleteStall } = useStalls();
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteStall.mutateAsync(stall.id);
      setIsOpen(false);
      setMenuOpen(false);
    } catch (error) {
      console.error("Error deleting stall:", error);
    }
  };

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuLabel>Amallar</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              onEdit(stall);
              setMenuOpen(false);
            }}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
            Tahrirlash
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                O'chirish
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Haqiqatan ham o'chirmoqchimisiz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu amalni ortga qaytarib bo'lmaydi. Bu rastaga tegishli barcha ma'lumotlar tizimdan o'chiriladi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteStall.isPending}
                >
                  {deleteStall.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      O'chirilmoqda...
                    </>
                  ) : (
                    "Ha, o'chirish"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const columns = (onEdit: (stall: Stall) => void): ColumnDef<Stall>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.getValue("id")}</span>,
  },
  {
    accessorKey: "stallNumber",
    header: "Rasta raqami",
    cell: ({ row }) => <div className="font-medium">{row.getValue("stallNumber")}</div>,
  },
  {
    accessorKey: "Section.name",
    header: "Bo'lim",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.Section?.name || "—"}
      </div>
    ),
  },
  {
    accessorKey: "SaleType.name",
    header: "Sotuv turi",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.SaleType?.name || "—"}
      </div>
    ),
  },
  {
    accessorKey: "area",
    header: "Yuza (kv.m)",
    cell: ({ row }) => `${row.getValue("area")} m²`,
  },
  {
    accessorKey: "dailyFee",
    header: "Kunlik to'lov",
    cell: ({ row }) => {
      const saleTypeTax = row.original.SaleType?.tax || 0;
      const area = row.original.area || 0;
      const total = area * saleTypeTax;
      return (
        <div className="font-medium">
          {new Intl.NumberFormat("uz-UZ").format(total)} UZS
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Holati",
    cell: ({ row }) => {
      const stall = row.original;
      const isTaken = stall.isOccupied || stall.reserved;
      return (
        <div className="flex items-center gap-2">
          {isTaken ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[11px] font-bold uppercase transition-all border border-red-200/50">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Band
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[11px] font-bold uppercase transition-all border border-emerald-200/50">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Bo'sh
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    size: 150,
    cell: ({ row }) => <ActionCell stall={row.original} onEdit={onEdit} />,
  },
];
