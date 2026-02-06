import type { ColumnDef } from "@tanstack/react-table";
import type { SaleType } from "../../../types/api-responses";
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
import { useSaleTypes } from "../hooks/useSaleTypes";
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
  saleType: SaleType;
  onEdit: (saleType: SaleType) => void;
}

const ActionCell = ({ saleType, onEdit }: ActionCellProps) => {
  const { deleteSaleType } = useSaleTypes();
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteSaleType.mutateAsync(saleType.id);
      setIsOpen(false);
      setMenuOpen(false);
    } catch (error) {
      console.error("Error deleting sale type:", error);
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
              onEdit(saleType);
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
                  Bu amalni ortga qaytarib bo'lmaydi. Bu sotuv turiga tegishli barcha ma'lumotlar tizimdan o'chiriladi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteSaleType.isPending}
                >
                  {deleteSaleType.isPending ? (
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

export const columns = (onEdit: (saleType: SaleType) => void): ColumnDef<SaleType>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.getValue("id")}</span>,
  },
  {
    accessorKey: "name",
    header: "Nomlanishi",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "tax",
    header: "Kunlik to'lov",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("tax"));
      return (
        <div className="font-medium">
          {new Intl.NumberFormat("uz-UZ").format(amount)} UZS
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Tavsif",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.getValue("description") || "—"}
      </div>
    ),
  },
  {
    id: "actions",
    size: 150,
    cell: ({ row }) => <ActionCell saleType={row.original} onEdit={onEdit} />,
  },
];
