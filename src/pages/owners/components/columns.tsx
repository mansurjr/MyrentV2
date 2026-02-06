import type { ColumnDef } from "@tanstack/react-table"
import type { Owner } from "../../../types/api-responses"
import { MoreHorizontal, Edit, Trash, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useOwners } from "../hooks/useOwners"
import { useState } from "react"
import { useSidebarStore } from "@/store/useSidebarStore"
import { OwnerForm } from "./OwnerForm"

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
} from "@/components/ui/alert-dialog"

export const columns: ColumnDef<Owner>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.getValue("id")}</span>,
  },
  {
    accessorKey: "fullName",
    header: "F.I.O",
    minSize: 400,
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("fullName")}
      </div>
    ),
  },
  {
    id: "storeNumbers",
    header: "Do'kon raqami",
    cell: ({ row }) => {
      const contracts = row.original.contracts || [];
      const activeStoreNumbers = contracts
        .filter(c => c.isActive && c.store)
        .map(c => c.store?.storeNumber)
        .filter(Boolean);
      
      if (activeStoreNumbers.length === 0) return "—";
      return (
        <div className="flex flex-wrap gap-2">
          {activeStoreNumbers.map((num, i) => (
            <Badge 
              key={i} 
              variant="outline" 
              className="bg-primary/10 text-primary border-primary/20 text-sm font-bold py-1 px-3 shadow-sm"
            >
              {num}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "phoneNumber",
    header: "Telefon",
    cell: ({ row }) => row.getValue("phoneNumber") || "—",
  },
  {
    accessorKey: "tin",
    header: "STIR (TIN)",
  },
  {
    accessorKey: "address",
    header: "Manzil",
    cell: ({ row }) => {
      const address = row.getValue("address") as string;
      return (
        <div className="text-muted-foreground">
          {address || "—"}
        </div>
      );
    },
  },

  {
    id: "actions",
    size: 150,
    cell: ({ row }) => {
      const owner = row.original
      const { deleteOwner } = useOwners();
      const { openSidebar, closeSidebar } = useSidebarStore();
      const [isOpen, setIsOpen] = useState(false);
      const [menuOpen, setMenuOpen] = useState(false);

      const handleEdit = () => {
        openSidebar({
          title: "Egani tahrirlash",
          content: (
            <OwnerForm
              owner={owner}
              onSuccess={() => {
                closeSidebar();
                setMenuOpen(false);
              }}
              onCancel={closeSidebar}
            />
          ),
        });
      };

      const handleDelete = async () => {
        try {
          await deleteOwner.mutateAsync(owner.id);
          setIsOpen(false);
          setMenuOpen(false);
        } catch (error) {
          console.error("Error deleting owner:", error);
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
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
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
                    <AlertDialogTitle>
                      Haqiqatan ham o'chirmoqchimisiz?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu amalni ortga qaytarib bo'lmaydi. Bu egaga tegishli
                      barcha ma'lumotlar tizimdan o'chiriladi.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleteOwner.isPending}
                    >
                      {deleteOwner.isPending ? (
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
    },
  },
]
